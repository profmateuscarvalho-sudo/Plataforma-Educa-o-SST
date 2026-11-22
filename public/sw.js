/* Educação SST — Service Worker
 *
 * Estratégia de cache:
 * 1. index.html e rotas de navegação: Network-first com fallback para cache
 *    (garante que publicação nova chegue de imediato sem cache stale de HTML).
 * 2. Assets estáticos (JS, CSS, fontes com hash Vite / imagens do site): Cache-first,
 *    com TETO de entradas (evictFIFO) para o cache não crescer sem fim.
 * 3. Materiais de leitura / mídia (capas, PDFs, imagens da API): Cache-first com revalidação
 *    em segundo plano, também com teto, para permitir leitura offline de revistas e materiais.
 *
 * Versão do cache:
 * O registro do worker usa /sw.js?v=<versão do build> (src/lib/app-version.ts,
 * derivada do package.json que a plataforma incrementa a cada publicação).
 * URL diferente ⇒ navegador baixa e reinstala o worker novo; ao ativar, apaga
 * todos os caches de versões anteriores.
 *
 * Ativação imediata:
 * self.skipWaiting() na instalação e self.clients.claim() na ativação.
 */

// Fallback quando aberto direto sem query (não deve acontecer: pwa.ts registra
// sempre com ?v=). O sufixo de milissegundos garante caches únicos por sessão.
var CACHE_VERSION = 'edu-sst-' + (self.location.search.split('v=')[1] || 'dev-' + Date.now())
var SHELL_CACHE = CACHE_VERSION + '-shell'
var ASSET_CACHE = CACHE_VERSION + '-assets'
var READING_CACHE = CACHE_VERSION + '-reading'

// Teto de entradas por cache — impede crescimento indefinido nos devices dos alunos.
var MAX_ASSET_ENTRIES = 400
var MAX_READING_ENTRIES = 200
var MAX_SHELL_ENTRIES = 60

const APP_SCREENS = ['/app', '/app/', '/app/estudar', '/app/cases', '/app/perfil', '/login']

// Instalação: pré-armazena as telas essenciais no cache do app e assume o controle imediatamente
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => cache.addAll(APP_SCREENS).catch(() => {})),
  )
  self.skipWaiting()
})

// Ativação: apaga caches de versões anteriores e assume clientes imediatamente
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(
        keys.filter((k) => k.indexOf(CACHE_VERSION) !== 0).map((k) => caches.delete(k)),
      )
      await self.clients.claim()
    })(),
  )
})

// Suporte a comando manual de skipWaiting (quando o cliente desejar forçar ativação)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// --- Teto de cache (FIFO simples): mantém no máximo `max` entradas, ---
// --- removendo as mais antigas quando estoura.                      ---
async function putWithCap(cacheName, request, response, max) {
  try {
    const cache = await caches.open(cacheName)
    await cache.put(request, response)
    const keys = await cache.keys()
    if (keys.length > max) {
      // keys() é em ordem de inserção: remove do início (mais antigos)
      const excess = keys.length - max
      for (let i = 0; i < excess; i++) {
        cache.delete(keys[i]).catch(() => {})
      }
    }
  } catch {
    /* cap é best-effort: nunca derruba a resposta */
  }
}

function isReadingAsset(url) {
  // Capas de revista, revistas abertas e PDFs/imagens da API PocketBase
  return (
    /\/api\/files\//.test(url) ||
    /\/_\/api\/files\//.test(url) ||
    /\.(png|jpe?g|webp|gif|pdf)(\?|$)/.test(url)
  )
}

function isImmutableStaticAsset(url) {
  // Arquivos estáticos gerados com hash pelo Vite (/assets/*.js, /assets/*.css)
  return /\/assets\/[^/]+\.[a-zA-Z0-9_-]+\.(js|css|woff2?|ttf|eot|svg)$/.test(url)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const sameOrigin = url.origin === self.location.origin

  // 1. Navegação (HTML da aplicação / rotas de páginas):
  // NETWORK-FIRST: busca sempre a versão mais recente na rede. Usa cache só offline.
  if (request.mode === 'navigate' && sameOrigin) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.ok) {
            putWithCap(SHELL_CACHE, request, networkResponse.clone(), MAX_SHELL_ENTRIES)
          }
          return networkResponse
        } catch {
          // Sem internet: fallback para o cache do shell ou da requisição
          const cache = await caches.open(SHELL_CACHE)
          const cached =
            (await cache.match(request, { ignoreSearch: true })) ||
            (await cache.match('/app')) ||
            (await cache.match('/'))
          if (cached) return cached
          return new Response(
            '<!doctype html><html><body style="font-family:sans-serif;padding:24px;text-align:center;"><h2>Sem conexão</h2><p>Você está offline no momento. Conecte-se à internet para carregar esta página.</p></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } },
          )
        }
      })(),
    )
    return
  }

  // Se a requisição for para o próprio index.html diretamente
  if (sameOrigin && (url.pathname === '/index.html' || url.pathname === '/')) {
    event.respondWith(
      (async () => {
        try {
          const networkResponse = await fetch(request)
          if (networkResponse && networkResponse.ok) {
            putWithCap(SHELL_CACHE, request, networkResponse.clone(), MAX_SHELL_ENTRIES)
          }
          return networkResponse
        } catch {
          const cache = await caches.open(SHELL_CACHE)
          const cached =
            (await cache.match(request, { ignoreSearch: true })) || (await cache.match('/'))
          return cached || new Response('Offline', { status: 503 })
        }
      })(),
    )
    return
  }

  // 2. Materiais de leitura (capas, PDFs, mídias de artigos): cache-first com revalidação
  if (isReadingAsset(url.toString())) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(READING_CACHE)
        const cached = await cache.match(request)
        if (cached) {
          // Revalida em segundo plano sem bloquear exibição
          fetch(request)
            .then((resp) => {
              if (resp && resp.ok)
                putWithCap(READING_CACHE, request, resp.clone(), MAX_READING_ENTRIES)
            })
            .catch(() => {})
          return cached
        }
        try {
          const resp = await fetch(request)
          if (resp && resp.ok) putWithCap(READING_CACHE, request, resp.clone(), MAX_READING_ENTRIES)
          return resp
        } catch {
          return new Response('', { status: 504 })
        }
      })(),
    )
    return
  }

  // 3. Assets imutáveis do Vite com hash (/assets/*.js, /assets/*.css):
  // Cache-first (têm hash único por build, são imutáveis e 100% seguros em cache)
  if (sameOrigin && isImmutableStaticAsset(url.pathname)) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request)
        if (cached) return cached
        try {
          const resp = await fetch(request)
          if (resp && resp.ok) putWithCap(ASSET_CACHE, request, resp.clone(), MAX_ASSET_ENTRIES)
          return resp
        } catch {
          return new Response('', { status: 504 })
        }
      })(),
    )
    return
  }

  // 4. Outros assets same-origin (ex: /icon.svg, /manifest.json, etc.):
  // Stale-while-revalidate
  if (sameOrigin) {
    event.respondWith(
      (async () => {
        const cache = await caches.open(ASSET_CACHE)
        const cached = await cache.match(request)
        const fetchPromise = fetch(request)
          .then((resp) => {
            if (resp && resp.ok) putWithCap(ASSET_CACHE, request, resp.clone(), MAX_ASSET_ENTRIES)
            return resp
          })
          .catch(() => cached)
        return cached || fetchPromise
      })(),
    )
  }
})
