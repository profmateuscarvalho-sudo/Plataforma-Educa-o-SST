import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { validateToken, submitConnection } from '@/services/magazine_management'

export default function ProfessionalConnection() {
  const { token } = useParams()
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [tokenId, setTokenId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (token) {
      validateToken(token, 'connection').then((res) => {
        setIsValid(!!res)
        if (res) setTokenId(res.id)
      })
    }
  }, [token])

  const questions = [
    'Qual a sua maior conquista na área de SST?',
    'Como você enxerga o futuro da Segurança do Trabalho?',
    'Que conselho daria para quem está começando na área?',
    'Qual foi o maior desafio que já enfrentou em sua carreira?',
    'Deixe uma mensagem final para os leitores da revista.',
  ]

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const form = new FormData()
      form.append('professional_name', data.name)
      form.append('email', data.email)
      form.append('status', 'pending')

      const responses: Record<string, string> = {}
      questions.forEach((q, i) => {
        responses[`q${i + 1}`] = data[`q${i}`] || ''
      })
      form.append('responses', JSON.stringify(responses))

      if (data.photos?.length) {
        for (let i = 0; i < Math.min(data.photos.length, 5); i++) {
          form.append('photos', data.photos[i])
        }
      }

      await submitConnection(form, tokenId)
      setSubmitted(true)
      toast({ title: 'Sucesso', description: 'Respostas enviadas com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao enviar dados.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (isValid === null) return <div className="p-8 text-center">Validando link...</div>
  if (!isValid)
    return <div className="p-8 text-center text-red-500 font-bold">Link inválido ou expirado.</div>
  if (submitted)
    return (
      <div className="p-8 text-center text-green-600 font-bold">
        Obrigado pela sua participação!
      </div>
    )

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Conexão Profissional</CardTitle>
          <p className="text-center text-muted-foreground mt-2">
            Responda às perguntas abaixo para participar da nossa próxima edição.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome Completo*</Label>
                <Input {...register('name', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Email*</Label>
                <Input type="email" {...register('email', { required: true })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Envie suas fotos (Até 5 fotos)</Label>
              <Input type="file" multiple accept="image/*" {...register('photos')} />
            </div>

            <div className="space-y-6 pt-4 border-t">
              <h3 className="text-lg font-semibold">Entrevista</h3>
              {questions.map((q, i) => (
                <div key={i} className="space-y-2">
                  <Label className="text-base">{q}</Label>
                  <Textarea {...register(`q${i}`)} rows={3} placeholder="Sua resposta..." />
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Respostas'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
