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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm()

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
      articleForm.append('content', data.content)
      articleForm.append('compliance_norms', 'true')
      articleForm.append('status', 'submitted')
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

  if (isValid === null) return <div className="p-8 text-center">Validando link...</div>
  if (!isValid)
    return <div className="p-8 text-center text-red-500 font-bold">Link inválido ou expirado.</div>
  if (submitted)
    return (
      <div className="p-8 text-center text-green-600 font-bold">Obrigado pela sua submissão!</div>
    )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-center">Submissão de Artigo para Revista</CardTitle>
          <div className="bg-muted p-4 rounded-md text-sm mt-4">
            <strong>Normas de Conformidade:</strong> Seu artigo deve ter entre 2000 a 5000 palavras,
            estar formatado segundo as normas da ABNT e focado em SST.
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
              <h3 className="text-lg font-semibold border-b pb-2">Dados do Artigo</h3>
              <div className="space-y-2">
                <Label>Título do Artigo*</Label>
                <Input {...register('title', { required: true })} />
              </div>
              <div className="space-y-2">
                <Label>Conteúdo do Artigo* (Suporta formatação HTML básica)</Label>
                <Textarea {...register('content', { required: true })} rows={12} />
              </div>
              <div className="space-y-2">
                <Label>Imagens do Artigo</Label>
                <Input type="file" multiple accept="image/*" {...register('articlePhotos')} />
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
