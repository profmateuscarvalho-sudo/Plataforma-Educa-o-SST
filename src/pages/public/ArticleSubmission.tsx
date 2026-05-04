import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { useToast } from '@/hooks/use-toast'
import { submitArticle } from '@/services/magazine_management'
import { Check } from 'lucide-react'

export default function ArticleSubmission() {
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { toast } = useToast()
  const { register, handleSubmit } = useForm()

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

      await submitArticle(authorForm, articleForm)
      setSubmitted(true)
      toast({ title: 'Sucesso', description: 'Artigo submetido com sucesso!' })
    } catch (err) {
      toast({ title: 'Erro', description: 'Falha ao enviar artigo.', variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  if (submitted)
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] p-8 text-center space-y-6">
        <div className="p-6 bg-green-50 text-green-600 rounded-full">
          <Check className="w-16 h-16" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800">Obrigado pela sua submissão!</h2>
        <p className="text-lg text-slate-600 max-w-lg">
          Seu artigo foi enviado com sucesso e está sob análise da nossa equipe editorial.
          Entraremos em contato em breve pelo email informado.
        </p>
      </div>
    )

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-8">
      <Card className="shadow-lg">
        <CardHeader className="bg-slate-50 border-b">
          <CardTitle className="text-3xl text-center font-serif text-secondary py-4">
            Submissão de Artigo para Revista
          </CardTitle>
          <div className="bg-white p-4 rounded-md text-sm mt-4 border border-slate-200 text-slate-600 shadow-sm">
            <strong className="text-primary font-semibold block mb-1">
              Normas de Conformidade:
            </strong>
            Seu artigo deve ter entre 2000 a 5000 palavras, estar formatado segundo as normas da
            ABNT e focado em SST. O envio do documento original é obrigatório.
          </div>
        </CardHeader>
        <CardContent className="p-6 md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-10">
            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2 text-slate-800 flex items-center">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  1
                </span>
                Dados do Autor
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Nome Completo*</Label>
                  <Input {...register('authorName', { required: true })} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Email*</Label>
                  <Input
                    type="email"
                    {...register('email', { required: true })}
                    className="bg-slate-50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Telefone</Label>
                  <Input {...register('phone')} className="bg-slate-50" />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Fotos do Autor (Máx 3)</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    {...register('authorPhotos')}
                    className="bg-slate-50 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Minibiografia</Label>
                <Textarea {...register('bio')} rows={4} className="bg-slate-50" />
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2 text-slate-800 flex items-center">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  2
                </span>
                Arquivo do Artigo
              </h3>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Título do Artigo*</Label>
                  <Input
                    {...register('title', { required: true })}
                    className="bg-slate-50 text-lg py-6"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">
                    Arquivo (.doc, .docx ou .pdf)*
                  </Label>
                  <Input
                    type="file"
                    accept=".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.pdf,application/pdf"
                    {...register('articleFile', { required: true })}
                    className="bg-slate-50 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold"
                  />
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Envie uma versão única em Word ou PDF para revisão e diagramação.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Imagens e Gráficos Anexos</Label>
                  <Input
                    type="file"
                    multiple
                    accept="image/*"
                    {...register('articlePhotos')}
                    className="bg-slate-50 file:bg-primary/10 file:text-primary file:border-0 file:rounded-md file:px-4 file:py-1 file:mr-4 file:font-semibold"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <h3 className="text-xl font-semibold border-b pb-2 text-slate-800 flex items-center">
                <span className="bg-primary/10 text-primary w-8 h-8 rounded-full flex items-center justify-center mr-3 text-sm">
                  3
                </span>
                Autorizações
              </h3>
              <div className="space-y-6 bg-slate-50 p-6 rounded-xl border border-slate-200">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox id="img-auth" {...register('imageAuthSigned')} className="w-5 h-5" />
                    <Label htmlFor="img-auth" className="text-base cursor-pointer">
                      Autorizo o uso da minha imagem na revista
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                    <Input
                      placeholder="Nome Completo Assinatura"
                      {...register('imageAuthName')}
                      className="bg-white"
                    />
                    <Input type="date" {...register('imageAuthDate')} className="bg-white" />
                  </div>
                </div>
                <div className="h-px bg-slate-200" />
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      id="art-auth"
                      {...register('articleAuthSigned')}
                      className="w-5 h-5"
                    />
                    <Label htmlFor="art-auth" className="text-base cursor-pointer">
                      Autorizo a publicação deste artigo de minha autoria
                    </Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-8">
                    <Input
                      placeholder="Nome Completo Assinatura"
                      {...register('articleAuthName')}
                      className="bg-white"
                    />
                    <Input type="date" {...register('articleAuthDate')} className="bg-white" />
                  </div>
                </div>
              </div>
            </div>

            <Button type="submit" size="lg" className="w-full text-lg h-14" disabled={loading}>
              {loading ? 'Enviando Submissão...' : 'Enviar Submissão do Artigo'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
