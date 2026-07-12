import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CategoryCardProps {
  title: string
  description: string
  icon: LucideIcon
  imageUrl: string
  count: number
  gradient: string
  onClick: () => void
}

export function CategoryCard({
  title,
  description,
  icon: Icon,
  imageUrl,
  count,
  gradient,
  onClick,
}: CategoryCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'group relative overflow-hidden rounded-2xl text-left transition-all duration-300',
        'hover:shadow-2xl hover:-translate-y-1 cursor-pointer',
        'min-h-[200px] flex flex-col justify-end p-6',
      )}
    >
      <div className={cn('absolute inset-0 bg-gradient-to-br', gradient)} />
      <img
        src={imageUrl}
        alt=""
        className="absolute inset-0 w-full h-full object-cover opacity-30 group-hover:opacity-40 group-hover:scale-105 transition-all duration-500"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full">
            {count} {count === 1 ? 'item' : 'itens'}
          </span>
        </div>
        <h3 className="text-xl font-serif font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-white/70 line-clamp-2">{description}</p>
      </div>
    </button>
  )
}
