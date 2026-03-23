import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { useToast } from '@/hooks/use-toast'
import { cn } from '@/lib/utils'

const formSchema = z.object({
  name: z.string().min(2, 'Nome muito curto.'),
  email: z.string().email('E-mail inválido.'),
  phone: z.string().min(10, 'Telefone inválido.'),
})

export function LeadForm({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: '', email: '', phone: '' },
  })

  function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true)
    setTimeout(() => {
      setIsSubmitting(false)
      toast({ title: 'Contato solicitado!', description: 'Um consultor falará com você em breve.' })
      form.reset()
    }, 1000)
  }

  const isDark = variant === 'dark'

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className={cn(isDark && 'text-slate-300 text-xs')}>Nome</FormLabel>
              <FormControl>
                <Input
                  placeholder="Seu nome"
                  {...field}
                  className={cn(
                    isDark &&
                      'bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-9',
                  )}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className={cn(isDark && 'text-slate-300 text-xs')}>E-mail</FormLabel>
              <FormControl>
                <Input
                  placeholder="seu@email.com"
                  {...field}
                  className={cn(
                    isDark &&
                      'bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-9',
                  )}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-1">
              <FormLabel className={cn(isDark && 'text-slate-300 text-xs')}>Telefone</FormLabel>
              <FormControl>
                <Input
                  placeholder="(00) 00000-0000"
                  {...field}
                  className={cn(
                    isDark &&
                      'bg-white/10 border-white/20 text-white placeholder:text-slate-500 h-9',
                  )}
                />
              </FormControl>
              <FormMessage className="text-xs" />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className={cn(
            'w-full mt-2',
            isDark && 'bg-accent text-accent-foreground hover:bg-accent/90 h-9',
          )}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Enviando...' : 'Solicitar Contato'}
        </Button>
      </form>
    </Form>
  )
}
