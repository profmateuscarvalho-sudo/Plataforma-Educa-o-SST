import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLocationData } from '@/hooks/use-location-data'

interface LocationSelectProps {
  state: string
  city: string
  onStateChange: (v: string) => void
  onCityChange: (v: string) => void
  required?: boolean
  compact?: boolean
}

export function LocationSelect({
  state,
  city,
  onStateChange,
  onCityChange,
  required,
  compact,
}: LocationSelectProps) {
  const { states, cities, loadingStates, loadingCities } = useLocationData(state)
  const height = compact ? 'h-10' : 'h-11'

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className="space-y-2">
        <Label>Estado {required && '*'}</Label>
        <Select
          value={state}
          onValueChange={(v) => {
            onStateChange(v)
            onCityChange('')
          }}
        >
          <SelectTrigger className={cn(height, 'bg-slate-50')}>
            <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione'} />
          </SelectTrigger>
          <SelectContent>
            {states.map((s) => (
              <SelectItem key={s.id} value={s.sigla}>
                {s.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Cidade {required && '*'}</Label>
        <Select value={city} onValueChange={onCityChange} disabled={!state}>
          <SelectTrigger className={cn(height, 'bg-slate-50')}>
            <SelectValue
              placeholder={
                !state ? 'Selecione o estado' : loadingCities ? 'Carregando...' : 'Selecione'
              }
            />
          </SelectTrigger>
          <SelectContent>
            {cities.map((c) => (
              <SelectItem key={c.id} value={c.nome}>
                {c.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}
