import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, PlayCircle, Award, Share2 } from 'lucide-react'
import { CheckoutModal } from '@/components/CheckoutModal'
import { LeadForm } from '@/components/LeadForm'
import { getCourse } from '@/services/courses'
import { Course } from '@/types'
import pb from '@/lib/pocketbase/client'
import { setMetaTags } from '@/lib/utils'
import { PUBLIC_URL, getSharePreviewUrl } from '@/lib/constants'
import { useToast } from '@/hooks/use-toast'

export default function CourseDetails() {
  const { id } = useParams()
  const [course, setCourse] = useState<Course | null>(null)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (id) getCourse(id).then(setCourse).catch(console.error)
  }, [id])

  const shareUrl = getSharePreviewUrl('cursos', id || '')

  useEffect(() => {
    if (course) {
      const imgUrl = course.thumbnail
        ? `${PUBLIC_URL}/api/files/${course.collectionId}/${course.id}/${course.thumbnail}`
        : 'https://img.usecurling.com/p/1200/630?q=education%20course&color=green'
      setMetaTags({
        title: `${course.title} | Educação SST`,
        description: course.description || 'Curso de Segurança e Saúde no Trabalho.',
        image: imgUrl,
        url: `${PUBLIC_URL}/cursos/${id}`,
      })
    }
  }, [course, id])

  if (!course) return <div className="p-20 text-center text-2xl">Carregando...</div>

  const imgUrl = course.thumbnail
    ? pb.files.getUrl(course, course.thumbnail)
    : 'https://img.usecurling.com/p/800/400?q=education&color=green'

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      <section className="bg-secondary text-white py-20">
        <div className="container px-4">
          <div className="max-w-4xl space-y-6">
            <Badge className="bg-primary text-white hover:bg-primary">{course.category}</Badge>
            <h1 className="text-4xl md:text-6xl font-serif font-bold leading-tight">
              {course.title}
            </h1>
            <p className="text-xl text-slate-300">{course.description}</p>
            <div className="flex flex-wrap gap-6 pt-4 text-sm font-medium">
              <div className="flex items-center gap-2">
                <Award className="text-accent w-5 h-5" /> Certificado de Conclusão
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container px-4 mt-12">
        <div className="flex flex-col lg:flex-row gap-12 items-start">
          <div className="flex-1 space-y-12">
            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-secondary mb-6">
                Conteúdo Programático
              </h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                      1
                    </div>
                    <span className="font-medium text-slate-800">
                      Acesso completo às aulas em vídeo
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <PlayCircle className="w-4 h-4" /> Plataforma Panda
                  </div>
                </div>
              </div>
            </section>
          </div>

          <div className="w-full lg:w-96 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <img
                src={imgUrl}
                alt={course.title}
                className="w-full aspect-video object-cover rounded-xl mb-6"
              />
              <div className="text-center mb-6">
                <p className="text-sm text-slate-500 font-medium mb-1">Investimento</p>
                <p className="text-4xl font-bold text-primary">
                  {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                    course.price,
                  )}
                </p>
              </div>
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold mb-4 shadow-lg shadow-primary/20"
                onClick={() => setIsCheckoutOpen(true)}
              >
                Comprar Curso
              </Button>
              <p className="text-xs text-center text-slate-500">
                Acesso imediato após confirmação do pagamento. Garantia de 7 dias.
              </p>
              <Button
                variant="outline"
                size="sm"
                className="w-full mt-2"
                onClick={() => {
                  navigator.clipboard.writeText(shareUrl)
                  toast({
                    title: 'Link copiado!',
                    description: 'Compartilhe o curso com seus colegas.',
                  })
                }}
              >
                <Share2 className="w-4 h-4 mr-2" /> Compartilhar
              </Button>
            </div>
            <div className="bg-secondary p-6 rounded-2xl text-white">
              <h3 className="font-serif font-bold text-xl mb-2 text-accent">Dúvidas?</h3>
              <p className="text-sm text-slate-300 mb-4">
                Fale com um consultor para entender se este curso é o ideal para você.
              </p>
              <LeadForm variant="dark" />
            </div>
          </div>
        </div>
      </div>
      <CheckoutModal
        isOpen={isCheckoutOpen}
        setIsOpen={setIsCheckoutOpen}
        itemTitle={course.title}
        price={course.price}
      />
    </div>
  )
}
