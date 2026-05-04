import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { validateToken, submitArticle } from '@/services/magazine_management'
export default function ArticleSubmission() {
  const { token } = useParams()
  const [isValid, setIsValid] = useState<boolean | null>(null)
  const [tokenId, setTokenId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()

  const { register, handleSubmit } = useForm()

  useEffect(() => {
    if (token) {
      validateToken(token, 'article').then((res) => {
        setIsValid(!!res)
        if (res) setTokenId(res.id)
      })
    }
  }, [token])

  const onSubmit = async (data: any) => {
    setLoading(true)
    try {
      const authorForm = new FormData()
      authorForm.append('name', data.authorName)
      authorForm.append('email', data.email)
      authorForm.append('phone', data.phone || '')
      authorForm.append('bio', data.bio || '')
      authorForm.append('status', 'pending')
      if (data.authorPhotos?.length) {
        for (let i = 0; i < Math.min(data.authorPhotos.length, 3); i++) {
          authorForm.append('photos', data.authorPhotos[i])
        }
      }

      const articleForm = new FormData()
      articleForm.append('title', data.title)
      articleForm.append('compliance_norms', 'true')
      articleForm.append('status', 'submitted')

      if (data.articleFile?.[0]) {
        const file = data.articleFile[0]
        const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')
        if (isPdf) {
          articleForm.append('article_pdf_file', file)
        } else {
          articleForm.append('article_word_file', file)
        }
      }

      if (data.articlePhotos?.length) {
        for (let i = 0; i < data.articlePhotos.length; i++) {
          articleForm.append('article_photos', data.articlePhotos[i])
        }
      }

      const imageAuth = {
        signed: !!data.imageAuthSigned,
        name: data.imageAuthName,
        date: data.imageAuthDate,
      }
      const articleAuth = {
        signed: !!data.articleAuthSigned,
        name: data.articleAuthName,
        date: data.articleAuthDate,
      }
      articleForm.append('image_authorization', JSON.stringify(imageAuth))
      articleForm.append('article_authorization', JSON.stringify(articleAuth))

      await submitArticle(authorForm, articleForm, tokenId)
      setSubmitted(true)
      toast({ title: 'Sucesso', description: 'Artigo submetido com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao enviar artigo.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (isValid === null)
    return (
      <div className="p-8 text-center text-slate-600 font-medium">
        Validando link de submissão...
      </div>
    )
  if (!isValid)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6">
        <div className="p-4 bg-red-50 text-red-600 rounded-full">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-slate-800">Link inválido ou expirado</h2>
          <p className="text-slate-600 max-w-md mx-auto">
            O token de submissão que você tentou acessar não é mais válido, já foi utilizado ou
            expirou.
          </p>
        </div>
        <Button asChild size="lg" className="mt-4">
          <a href="/submeter-artigo">Solicitar Novo Link</a>
        </Button>
      </div>
    )
  if (submitted)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6">
        <div className="p-4 bg-green-50 text-green-600 rounded-full">
          <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-slate-800">Obrigado pela sua submissão!</h2>
        <p className="text-slate-600">
          Seu artigo foi enviado com sucesso e está sob análise da nossa equipe editorial.
        </p>
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Submissão de Artigo para Revista</CardTitle>
          <div className="bg-muted p-4 rounded-md text-sm mt-4">
            <strong>Normas de Conformidade:</strong> Seu artigo deve ter entre 2000 a 5000 palavras,
            estar formatado segundo as normas da ABNT e focado em SST. O envio do documento original
            é obrigatório.
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Autor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome Completo*</Label>
                  <Input {...register('authorName', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Email*</Label>
                  <Input type="email" {...register('email', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input {...register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label>Fotos do Autor (Máx 3)</Label>
                  <Input type="file" multiple accept="image/*" {...register('authorPhotos')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Minibiografia</Label>
                <Textarea {...register('bio')} rows={3} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Arquivo do Artigo</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Título do Artigo*</Label>
                  <Input {...register('title', { required: true })} />
                </div>
                <div className="space-y-2">
                  <Label>Arquivo (.doc, .docx ou .pdf)*</Label>
                  <Input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                    {...register('articleFile', { required: true })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Envie uma versão única em Word ou PDF para revisão e diagramação.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Imagens e Gráficos Anexos</Label>
                  <Input type="file" multiple accept="image/*" {...register('articlePhotos')} />
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold border-b pb-2">Autorizações</h3>
              <div className="space-y-3 bg-muted/50 p-4 rounded border">
                <div className="flex items-center space-x-2">
                  <Checkbox id="img-auth" {...register('imageAuthSigned')} />
                  <Label htmlFor="img-auth">Autorizo o uso da minha imagem na revista</Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nome Completo Assinatura" {...register('imageAuthName')} />
                  <Input type="date" {...register('imageAuthDate')} />
                </div>
              </div>
              <div className="space-y-3 bg-muted/50 p-4 rounded border">
                <div className="flex items-center space-x-2">
                  <Checkbox id="art-auth" {...register('articleAuthSigned')} />
                  <Label htmlFor="art-auth">
                    Autorizo a publicação deste artigo de minha autoria
                  </Label>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Nome Completo Assinatura" {...register('articleAuthName')} />
                  <Input type="date" {...register('articleAuthDate')} />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Submissão'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
