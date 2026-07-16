import { useEffect, useState } from 'react'
import { getBannersByLocation } from '@/services/banners'
import { useRealtime } from '@/hooks/use-realtime'
import { Banner } from '@/types'
import pb from '@/lib/pocketbase/client'
import { cn } from '@/lib/utils'

export function BannerDisplay({ location, className }: { location: string; className?: string }) {
  const [banners, setBanners] = useState<Banner[]>([])

  const load = async () => {
    try {
      setBanners(await getBannersByLocation(location))
    } catch {
      /* noop */
    }
  }

  useEffect(() => {
    load()
  }, [location])
  useRealtime('banners', load)

  if (banners.length === 0) return null

  return (
    <div className={cn('flex flex-col gap-4', className)}>
      {banners.map((b) => (
        <a
          key={b.id}
          href={b.destination_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block group overflow-hidden rounded-lg"
        >
          {b.image ? (
            <img
              src={pb.files.getUrl(b, b.image)}
              alt={b.title}
              className="w-full h-auto object-cover group-hover:scale-[1.02] transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-24 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
              {b.title}
            </div>
          )}
        </a>
      ))}
    </div>
  )
}
