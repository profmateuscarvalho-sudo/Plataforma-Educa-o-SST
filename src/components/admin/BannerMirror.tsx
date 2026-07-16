import { useState } from 'react'
import { Monitor, Smartphone, Plus, ImageOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Banner } from '@/types'
import pb from '@/lib/pocketbase/client'

interface BannerMirrorProps {
  banners: Banner[]
  onSlotClick: (location: string) => void
}

const SLOT_LABELS: Record<string, string> = {
  'Home - Topo': 'Topo da Home',
  'Home - Meio': 'Meio da Home',
  'Lateral dos Artigos': 'Lateral dos Artigos',
  Rodapé: 'Rodapé',
}

function BannerSlot({
  banner,
  location,
  onClick,
  className,
}: {
  banner?: Banner
  location: string
  onClick: () => void
  className?: string
}) {
  const hasImage = banner?.image && banner.active

  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative flex flex-col items-center justify-center overflow-hidden rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-all hover:border-primary hover:bg-primary/5',
        className,
      )}
    >
      <span className="absolute left-2 top-2 z-10 rounded bg-slate-800/80 px-2 py-0.5 text-[10px] font-medium text-white">
        {SLOT_LABELS[location] || location}
      </span>
      {hasImage ? (
        <>
          <img
            src={pb.files.getUrl(banner!, banner!.image)}
            alt={banner!.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
          <span className="absolute inset-x-0 bottom-0 bg-slate-800/70 px-2 py-1 text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">
            {banner!.title} — Clique para editar
          </span>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 py-4 text-slate-400">
          {banner && !banner.active ? (
            <>
              <ImageOff className="h-5 w-5" />
              <span className="text-[10px]">Banner inativo</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5" />
              <span className="text-[10px]">Slot Vazio — Clique para adicionar</span>
            </>
          )}
        </div>
      )}
    </button>
  )
}

export function BannerMirror({ banners, onSlotClick }: BannerMirrorProps) {
  const [view, setView] = useState<'desktop' | 'mobile'>('desktop')

  const getBanner = (location: string) => banners.find((b) => b.location === location)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-secondary">Visualização em Espelho</h3>
          <p className="text-sm text-muted-foreground">
            Pré-visualize os banners em suas posições. Clique em qualquer slot para criar ou editar.
          </p>
        </div>
        <div className="flex items-center gap-1 rounded-lg border bg-white p-1">
          <Button
            variant={cn(view === 'desktop' ? 'default' : 'ghost')}
            size="sm"
            onClick={() => setView('desktop')}
          >
            <Monitor className="mr-1.5 h-4 w-4" /> Desktop
          </Button>
          <Button
            variant={cn(view === 'mobile' ? 'default' : 'ghost')}
            size="sm"
            onClick={() => setView('mobile')}
          >
            <Smartphone className="mr-1.5 h-4 w-4" /> Mobile
          </Button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-4 shadow-sm">
        {view === 'desktop' ? (
          <div className="mx-auto max-w-4xl space-y-3">
            {/* Browser chrome */}
            <div className="flex items-center gap-1.5 rounded-t-lg bg-slate-100 px-3 py-2">
              <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
              <span className="ml-2 flex-1 rounded bg-white px-2 py-0.5 text-[10px] text-slate-400">
                www.educacaosst.com.br
              </span>
            </div>

            {/* Page content */}
            <div className="space-y-3 rounded-b-lg bg-slate-50 p-3">
              {/* Header mock */}
              <div className="flex items-center justify-between rounded bg-slate-200 px-3 py-2">
                <div className="h-3 w-24 rounded bg-slate-300" />
                <div className="flex gap-2">
                  <div className="h-2 w-10 rounded bg-slate-300" />
                  <div className="h-2 w-10 rounded bg-slate-300" />
                  <div className="h-2 w-10 rounded bg-slate-300" />
                </div>
              </div>

              {/* Home - Topo */}
              <BannerSlot
                banner={getBanner('Home - Topo')}
                location="Home - Topo"
                onClick={() => onSlotClick('Home - Topo')}
                className="h-24 w-full"
              />

              {/* Hero / content mock */}
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <div className="h-20 rounded bg-slate-200" />
                  <div className="h-3 w-3/4 rounded bg-slate-200" />
                  <div className="h-3 w-1/2 rounded bg-slate-200" />

                  {/* Home - Meio */}
                  <BannerSlot
                    banner={getBanner('Home - Meio')}
                    location="Home - Meio"
                    onClick={() => onSlotClick('Home - Meio')}
                    className="h-20 w-full"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="h-16 rounded bg-slate-200" />
                    <div className="h-16 rounded bg-slate-200" />
                  </div>
                </div>

                {/* Sidebar with Lateral dos Artigos */}
                <div className="space-y-2">
                  <div className="rounded bg-slate-200 p-2">
                    <div className="mb-1 h-2 w-16 rounded bg-slate-300" />
                    <div className="space-y-1">
                      <div className="h-2 w-full rounded bg-slate-300" />
                      <div className="h-2 w-4/5 rounded bg-slate-300" />
                      <div className="h-2 w-3/4 rounded bg-slate-300" />
                    </div>
                  </div>
                  <BannerSlot
                    banner={getBanner('Lateral dos Artigos')}
                    location="Lateral dos Artigos"
                    onClick={() => onSlotClick('Lateral dos Artigos')}
                    className="h-40 w-full"
                  />
                  <div className="h-24 rounded bg-slate-200" />
                </div>
              </div>

              {/* Rodapé */}
              <BannerSlot
                banner={getBanner('Rodapé')}
                location="Rodapé"
                onClick={() => onSlotClick('Rodapé')}
                className="h-20 w-full"
              />

              {/* Footer mock */}
              <div className="flex items-center justify-between rounded bg-slate-800 px-3 py-3">
                <div className="h-2 w-20 rounded bg-slate-600" />
                <div className="h-2 w-16 rounded bg-slate-600" />
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-[320px] space-y-3">
            {/* Mobile chrome */}
            <div className="flex items-center justify-between rounded-t-2xl bg-slate-100 px-3 py-1.5">
              <div className="h-2 w-12 rounded bg-slate-300" />
              <div className="h-2 w-8 rounded bg-slate-300" />
            </div>

            <div className="space-y-3 rounded-b-2xl border-x border-b bg-slate-50 p-2">
              {/* Header mock */}
              <div className="flex items-center justify-between rounded bg-slate-200 px-2 py-1.5">
                <div className="h-2.5 w-16 rounded bg-slate-300" />
                <div className="flex gap-1.5">
                  <div className="h-2.5 w-2.5 rounded bg-slate-300" />
                  <div className="h-2.5 w-2.5 rounded bg-slate-300" />
                </div>
              </div>

              {/* Home - Topo */}
              <BannerSlot
                banner={getBanner('Home - Topo')}
                location="Home - Topo"
                onClick={() => onSlotClick('Home - Topo')}
                className="h-16 w-full"
              />

              {/* Content mock */}
              <div className="space-y-2">
                <div className="h-24 rounded bg-slate-200" />
                <div className="h-2.5 w-4/5 rounded bg-slate-200" />
                <div className="h-2.5 w-3/5 rounded bg-slate-200" />

                {/* Home - Meio */}
                <BannerSlot
                  banner={getBanner('Home - Meio')}
                  location="Home - Meio"
                  onClick={() => onSlotClick('Home - Meio')}
                  className="h-16 w-full"
                />

                <div className="h-16 rounded bg-slate-200" />

                {/* Lateral dos Artigos (stacked in mobile) */}
                <BannerSlot
                  banner={getBanner('Lateral dos Artigos')}
                  location="Lateral dos Artigos"
                  onClick={() => onSlotClick('Lateral dos Artigos')}
                  className="h-24 w-full"
                />

                <div className="h-16 rounded bg-slate-200" />
              </div>

              {/* Rodapé */}
              <BannerSlot
                banner={getBanner('Rodapé')}
                location="Rodapé"
                onClick={() => onSlotClick('Rodapé')}
                className="h-16 w-full"
              />

              {/* Footer mock */}
              <div className="flex items-center justify-center rounded bg-slate-800 py-2">
                <div className="h-2 w-16 rounded bg-slate-600" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
