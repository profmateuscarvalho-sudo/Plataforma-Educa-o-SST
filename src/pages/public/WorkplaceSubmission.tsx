import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Camera, Send } from 'lucide-react'
import { toast } from 'sonner'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

import { createWorkplace } from '@/services/workplaces'
import { extractFieldErrors } from '@/lib/pocketbase/errors'

const formSchema = z.object({
  professional_name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  job_title: z.string().min(2, 'Cargo é obrigatório'),
  city: z.string().min(2, 'Cidade é obrigatória'),
  description: z.string().min(10, 'A descrição deve ter pelo menos 10 caracteres'),
  photos: z
    .any()
    .refine((val) => val && val.length > 0, 'Envie pelo menos uma foto')
    .refine((val) => val && val.length <= 3, 'Máximo de 3 fotos permitidas'),
})

type FormValues = z.infer<typeof formSchema>

export default function WorkplaceSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      professional_name: '',
      job_title: '',
      city: '',
      description: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true)
      const formData = new FormData()
      formData.append('professional_name', values.professional_name)
      formData.append('job_title', values.job_title)
      formData.append('city', values.city)
      formData.append('description', values.description)

      Array.from(values.photos as FileList).forEach((file) => {
        formData.append('photos', file)
      })

      await createWorkplace(formData)
      setSubmitted(true)
      toast.success('Informações enviadas com sucesso!')
    } catch (e) {
      const errors = extractFieldErrors(e)
      if (Object.keys(errors).length > 0) {
        for (const [key, msg] of Object.entries(errors)) {
          form.setError(key as any, { message: msg })
        }
      } else {
        toast.error('Erro ao enviar informações. Tente novamente mais tarde.')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  if (submitted) {
    return (
      <div className="container max-w-2xl py-20">
        <Card className="text-center py-12">
          <CardHeader>
            <div className="mx-auto w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-4">
              <Send className="w-8 h-8" />
            </div>
            <CardTitle className="text-2xl text-slate-800">Submissão Concluída!</CardTitle>
            <CardDescription className="text-lg">
              Recebemos as fotos e informações do seu local de trabalho. Agradecemos por
              compartilhar conosco!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              onClick={() => {
                setSubmitted(false)
                form.reset()
              }}
            >
              Enviar outro local
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="bg-background border-b border-border">
        <div className="container mx-auto px-4 pt-[72px] pb-[56px] text-left max-w-2xl">
          <div className="space-y-4">
            <span className="label-overline">Comunidade SST</span>
            <h1 className="title-h2-fluid font-serif font-semibold text-foreground tracking-tight">
              Meu Local de Trabalho
            </h1>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Compartilhe conosco um pouco sobre o seu dia a dia profissional, sua área de atuação e
              fotos do seu ambiente de trabalho.
            </p>
          </div>
        </div>
      </div>

      <div className="container max-w-2xl py-8">
        <Card className="shadow-sm border-border bg-card">
          <CardHeader>
            <CardTitle>Informações Profissionais</CardTitle>
            <CardDescription>
              Preencha o formulário abaixo com seus dados e até 3 fotos do local.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="professional_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Seu Nome Completo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: João da Silva" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="job_title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cargo Atual</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: Técnico em SST" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cidade/Estado</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: São Paulo - SP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição do Local de Trabalho</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Conte-nos um pouco sobre a empresa, as atividades que você realiza e as características do ambiente..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="photos"
                  render={({ field: { value, onChange, ...fieldProps } }) => (
                    <FormItem>
                      <FormLabel>Fotos do Local (Máximo de 3 fotos)</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-4">
                          <Input
                            type="file"
                            multiple
                            accept="image/*"
                            className="file:mr-4 file:py-1 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                            onChange={(e) => {
                              if (e.target.files && e.target.files.length > 3) {
                                toast.error('Selecione no máximo 3 fotos.')
                                e.target.value = ''
                                return
                              }
                              onChange(e.target.files)
                            }}
                            {...fieldProps}
                          />
                          <Camera className="w-5 h-5 text-slate-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Enviando...' : 'Enviar Informações'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
