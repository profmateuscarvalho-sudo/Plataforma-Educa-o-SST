import { useParams, Link } from 'react-router-dom'
import { COURSES } from '@/lib/data'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2, PlayCircle, Clock, Award } from 'lucide-react'
import { useState } from 'react'
import { CheckoutModal } from '@/components/CheckoutModal'
import { LeadForm } from '@/components/LeadForm'

export default function CourseDetails() {
  const { id } = useParams()
  const course = COURSES.find((c) => c.id === id)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)

  if (!course) return <div className="p-20 text-center text-2xl">Curso não encontrado.</div>

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Hero */}
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
                <Clock className="text-accent w-5 h-5" /> {course.duration} de conteúdo
              </div>
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
                O que você vai aprender
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
                    <span className="text-slate-600">
                      Conceitos avançados aplicáveis no dia a dia da indústria moderna.
                    </span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
              <h2 className="text-2xl font-serif font-bold text-secondary mb-6">
                Conteúdo Programático
              </h2>
              <div className="space-y-4">
                {course.lessons.map((lesson, idx) => (
                  <div
                    key={lesson.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-50 border border-slate-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                        {idx + 1}
                      </div>
                      <span className="font-medium text-slate-800">{lesson.title}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <PlayCircle className="w-4 h-4" /> {lesson.duration}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="w-full lg:w-96 space-y-6 lg:sticky lg:top-28">
            <div className="bg-white p-6 rounded-2xl shadow-xl border border-slate-200">
              <img
                src={course.image}
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
