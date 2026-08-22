/* Educação SST — Service Worker
 *
 * Caches app screens, magazine covers and opened magazines for offline reading.
 * Uses a stale-while-revalidate strategy for navigations/images and a cache-first
 * strategy for static assets.
 */

const CACHE_VERSION = 'edu-sst-v1'
const SHELL_CACHE = `${CACHE_VERSION}-shell`
const ASSET_CACHE = `${CACHE_VERSION}-assets`
const READING_CACHE = `${CACHE_VERSION}-reading`

const APP_SCREENS = ['/app', '/app/', '/app/estudar', '/app/cases', '/app/perfil', '/login']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SCREENS).catch(() => {})),
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => !k.startsWith(CACHE_VERSION)).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

function isReadingAsset(url) {
  // Magazine covers, opened magazines and PDFs/images from the backend.
  return (
    /\/api\/files\//.test(url) ||
    /\/_\/api\/files\//.test(url) ||
    /\.(png|jpe?g|webp|gif|pdf)(\?|$)/.test(url)
  )
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  // Only handle same-origin navigations + same-origin/static + backend file reads.
  const sameOrigin = url.origin === self.location.origin

  // Navigations: stale-while-revalidate for app screens.
  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(SHELL_CACHE)
        const cached = await cache.match(request, { ignoreSearch: true })
        const fetchPromise = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone())
            return resp
          })
          .catch(() => cached)
        return cached || fetchPromise
      })(),
    )
    return
  }

  // Reading assets (covers, magazines, PDFs): cache-first, then network.
  if (isReadingAsset(url.toString())) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(READING_CACHE)
        const cached = await cache.match(request)
        if (cached) {
          // Revalidate in the background.
          fetch(request)
            .then((resp) => {
              if (resp && resp.ok) cache.put(request, resp.clone())
            })
            .catch(() => {})
          return cached
        }
        try {
          const resp = await fetch(request)
          if (resp && resp.ok) cache.put(request, resp.clone())
          return resp
        } catch {
          return new Response('', { status: 504 })
        }
      })(),
    )
    return
  }

  // Same-origin static assets: stale-while-revalidate.
  if (sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) cache.put(request, resp.clone())
            return resp
          })
          .catch(() => cached)
        return cached || fetchPromise
      })(),
    )
  }
})
