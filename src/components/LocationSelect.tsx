import { useState, useRef, useEffect, useMemo } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { useLocationData } from '@/hooks/use-location-data'
import { Check, ChevronsUpDown, AlertCircle, X, Search } from 'lucide-react'

interface LocationSelectProps {
  state: string
  city: string
  onStateChange: (v: string) => void
  onCityChange: (v: string) => void
  required?: boolean
  compact?: boolean
  stateId?: string
  cityId?: string
}

export function LocationSelect({
  state,
  city,
  onStateChange,
  onCityChange,
  required,
  compact,
  stateId = 'register-state',
  cityId = 'register-city',
}: LocationSelectProps) {
  const { states, cities, loadingStates, loadingCities, errorCities } = useLocationData(state)
  const height = compact ? 'h-10' : 'h-11'

  // Combobox popover open/close & search query
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [highlightedIndex, setHighlightedIndex] = useState(0)

  // Fallback para campo de texto livre se a lista falhar ou usuário optar por digitar livremente
  const [manualFallback, setManualFallback] = useState(false)

  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputSearchRef = useRef<HTMLInputElement>(null)
  const triggerButtonRef = useRef<HTMLButtonElement>(null)

  // Ativa fallback se houver erro ao carregar cidades
  useEffect(() => {
    if (errorCities && state) {
      setManualFallback(true)
    }
  }, [errorCities, state])

  // Fecha o dropdown se clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Foco no campo de busca ao abrir dropdown
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('')
      setHighlightedIndex(0)
      setTimeout(() => {
        inputSearchRef.current?.focus()
      }, 50)
    }
  }, [isOpen])

  // Normalização para busca sem acentos e minúscula
  const normalizeText = (text: string) =>
    text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim()

  // Cidades filtradas
  const filteredCities = useMemo(() => {
    if (!cities || cities.length === 0) return []
    if (!searchQuery.trim()) return cities

    const queryNorm = normalizeText(searchQuery)
    return cities.filter((c) => normalizeText(c.nome).includes(queryNorm))
  }, [cities, searchQuery])

  // Manter índice selecionado visível
  useEffect(() => {
    if (highlightedIndex >= filteredCities.length) {
      setHighlightedIndex(0)
    }
  }, [filteredCities.length, highlightedIndex])

  const handleSelectCity = (cityName: string) => {
    onCityChange(cityName)
    setIsOpen(false)
    setSearchQuery('')
    triggerButtonRef.current?.focus()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
      triggerButtonRef.current?.focus()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev + 1 < filteredCities.length ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : filteredCities.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (filteredCities.length > 0 && filteredCities[highlightedIndex]) {
        handleSelectCity(filteredCities[highlightedIndex].nome)
      }
    }
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Seleção do Estado */}
      <div className="space-y-1.5">
        <Label
          htmlFor={stateId}
          className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
        >
          Estado {required && '*'}
        </Label>
        <Select
          value={state}
          onValueChange={(v) => {
            onStateChange(v)
            onCityChange('')
            setManualFallback(false)
            setIsOpen(false)
          }}
        >
          <SelectTrigger
            id={stateId}
            aria-label="Selecionar estado"
            className={cn(
              height,
              'bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]',
            )}
          >
            <SelectValue placeholder={loadingStates ? 'Carregando...' : 'Selecione'} />
          </SelectTrigger>
          <SelectContent className="max-h-60 rounded-xl border-[#E4DED1] bg-white">
            {states.map((s) => (
              <SelectItem key={s.id} value={s.sigla} className="cursor-pointer">
                {s.nome} ({s.sigla})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Seleção ou Campo da Cidade */}
      <div className="space-y-1.5 relative" ref={dropdownRef}>
        <div className="flex items-center justify-between">
          <Label
            htmlFor={cityId}
            className="text-xs font-bold uppercase tracking-wider text-[#1C1B18]"
          >
            Cidade {required && '*'}
          </Label>
          {state && !manualFallback && cities.length > 0 && (
            <button
              type="button"
              onClick={() => setManualFallback(true)}
              className="text-[11px] text-[#5F5A4F] hover:text-[#1C1B18] underline font-normal focus:outline-none"
            >
              Digitar cidade
            </button>
          )}
          {state && manualFallback && cities.length > 0 && !errorCities && (
            <button
              type="button"
              onClick={() => setManualFallback(false)}
              className="text-[11px] text-[#5F5A4F] hover:text-[#1C1B18] underline font-normal focus:outline-none"
            >
              Voltar para lista
            </button>
          )}
        </div>

        {/* Fallback de texto livre caso haja erro ou ativação manual */}
        {manualFallback || (!loadingCities && cities.length === 0 && Boolean(state)) ? (
          <div className="space-y-1.5">
            {errorCities && (
              <div
                role="alert"
                className="flex items-start gap-1.5 p-2 bg-[#FAF4ED] border border-[#E8D9C5] rounded-lg text-xs text-[#8A4A24]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[#B4472E]" />
                <div className="flex-1">
                  <p className="font-semibold">Não conseguimos carregar as cidades.</p>
                  <p className="text-[11px] text-[#7F7869]">
                    Digite o nome da sua cidade no campo abaixo.
                  </p>
                </div>
              </div>
            )}
            <Input
              id={cityId}
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              placeholder="Digite o nome da sua cidade"
              required={required}
              className={cn(
                height,
                'bg-[#FAF8F3] border-[#E4DED1] rounded-xl text-[#1C1B18] focus:border-[#1C1B18]',
              )}
            />
          </div>
        ) : (
          /* Combobox com busca interativa */
          <div className="relative">
            {/* Input oculto padrão para suporte a autofill do navegador e validação HTML5 */}
            <input
              type="text"
              name="city"
              autoComplete="address-level2"
              value={city}
              onChange={(e) => onCityChange(e.target.value)}
              tabIndex={-1}
              aria-hidden="true"
              className="sr-only"
              required={required}
            />

            <button
              id={cityId}
              ref={triggerButtonRef}
              type="button"
              disabled={!state || loadingCities}
              onClick={() => setIsOpen((prev) => !prev)}
              onKeyDown={handleKeyDown}
              aria-haspopup="listbox"
              aria-expanded={isOpen}
              aria-label="Selecionar cidade"
              className={cn(
                height,
                'w-full flex items-center justify-between px-3 text-sm rounded-xl border transition-colors text-left',
                'bg-[#FAF8F3] border-[#E4DED1] text-[#1C1B18] focus:border-[#1C1B18] focus:ring-1 focus:ring-[#1C1B18]',
                (!state || loadingCities) && 'opacity-60 cursor-not-allowed',
                !city && 'text-[#5F5A4F]',
              )}
            >
              <span className="truncate">
                {!state
                  ? 'Selecione o estado primeiro'
                  : loadingCities
                    ? 'Carregando cidades...'
                    : city || 'Buscar e selecionar cidade...'}
              </span>
              <div className="flex items-center gap-1 shrink-0 ml-1">
                {city && (
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      onCityChange('')
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.stopPropagation()
                        onCityChange('')
                      }
                    }}
                    title="Limpar seleção"
                    className="p-1 hover:bg-[#E4DED1]/50 rounded-full text-[#5F5A4F] hover:text-[#1C1B18]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </span>
                )}
                <ChevronsUpDown className="w-4 h-4 opacity-50" />
              </div>
            </button>

            {/* Dropdown com Campo de Busca e Lista Filtrada */}
            {isOpen && (
              <div
                className="absolute z-50 left-0 right-0 mt-1.5 w-full bg-white rounded-xl border border-[#E4DED1] shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95"
                onKeyDown={handleKeyDown}
              >
                {/* Campo de Busca */}
                <div className="p-2 border-b border-[#E4DED1] bg-[#FAF8F3] flex items-center gap-2">
                  <Search className="w-4 h-4 text-[#5F5A4F] shrink-0 ml-1" />
                  <input
                    ref={inputSearchRef}
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value)
                      setHighlightedIndex(0)
                    }}
                    placeholder="Digite as primeiras letras..."
                    className="w-full bg-transparent text-sm text-[#1C1B18] placeholder:text-[#5F5A4F] outline-none"
                    autoComplete="off"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="p-0.5 text-[#5F5A4F] hover:text-[#1C1B18]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Lista de Cidades */}
                <ul
                  role="listbox"
                  className="max-h-60 overflow-y-auto p-1.5 space-y-0.5 divide-y divide-[#FAF8F3]"
                  tabIndex={-1}
                >
                  {filteredCities.length === 0 ? (
                    <li className="py-4 px-3 text-center text-xs text-[#5F5A4F]">
                      <p>Nenhuma cidade encontrada para &ldquo;{searchQuery}&rdquo;.</p>
                      <Button
                        type="button"
                        variant="link"
                        size="sm"
                        onClick={() => {
                          setManualFallback(true)
                          setIsOpen(false)
                          if (searchQuery.trim()) {
                            onCityChange(searchQuery.trim())
                          }
                        }}
                        className="text-xs text-[#1C1B18] font-bold p-0 mt-1 h-auto"
                      >
                        Digitar &ldquo;{searchQuery || 'minha cidade'}&rdquo; manualmente
                      </Button>
                    </li>
                  ) : (
                    filteredCities.map((c, index) => {
                      const isSelected = city === c.nome
                      const isHighlighted = index === highlightedIndex

                      return (
                        <li
                          key={c.id || c.nome}
                          role="option"
                          aria-selected={isSelected}
                          onMouseEnter={() => setHighlightedIndex(index)}
                          onClick={() => handleSelectCity(c.nome)}
                          className={cn(
                            'flex items-center justify-between px-3 py-2 text-sm rounded-lg cursor-pointer transition-colors',
                            isHighlighted
                              ? 'bg-[#FAF8F3] text-[#1C1B18] font-medium'
                              : 'text-[#1C1B18]',
                            isSelected && 'bg-[#FAF8F3] font-bold',
                          )}
                        >
                          <span className="truncate">{c.nome}</span>
                          {isSelected && <Check className="w-4 h-4 text-[#FDBE2D] shrink-0 ml-2" />}
                        </li>
                      )
                    })
                  )}
                </ul>

                {/* Rodapé com contagem e dica para celular */}
                <div className="p-2 border-t border-[#E4DED1] bg-[#FAF8F3]/60 flex items-center justify-between text-[11px] text-[#7F7869] px-3">
                  <span>
                    {filteredCities.length} {filteredCities.length === 1 ? 'cidade' : 'cidades'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setManualFallback(true)
                      setIsOpen(false)
                    }}
                    className="underline hover:text-[#1C1B18]"
                  >
                    Não encontrou? Digitar
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
