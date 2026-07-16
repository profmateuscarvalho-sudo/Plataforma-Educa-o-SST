import { cn } from '@/lib/utils'
import { Check, X } from 'lucide-react'

interface PasswordRule {
  label: string
  test: (pass: string) => boolean
}

const RULES: PasswordRule[] = [
  { label: 'Mínimo de 8 caracteres', test: (p) => p.length >= 8 },
  { label: 'Pelo menos uma letra maiúscula', test: (p) => /[A-Z]/.test(p) },
  { label: 'Pelo menos um número', test: (p) => /[0-9]/.test(p) },
]

export function PasswordStrengthChecker({ password }: { password: string }) {
  const passedCount = RULES.filter((r) => r.test(password)).length
  const strengthLabel =
    passedCount === 0 ? '' : passedCount === 1 ? 'Fraca' : passedCount === 2 ? 'Média' : 'Forte'
  const strengthColor =
    passedCount <= 1 ? 'text-red-500' : passedCount === 2 ? 'text-amber-500' : 'text-emerald-500'

  return (
    <div className="mt-2 space-y-1.5">
      {strengthLabel && (
        <p className={cn('text-xs font-semibold', strengthColor)}>
          Força da senha: {strengthLabel}
        </p>
      )}
      {RULES.map((rule) => {
        const passed = rule.test(password)
        return (
          <div key={rule.label} className="flex items-center gap-2 text-xs">
            {passed ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <X className="w-3.5 h-3.5 text-slate-400" />
            )}
            <span className={cn(passed ? 'text-emerald-600' : 'text-slate-500')}>{rule.label}</span>
          </div>
        )
      })}
    </div>
  )
}
