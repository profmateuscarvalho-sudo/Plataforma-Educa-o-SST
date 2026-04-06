import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getDocProject,
  getDocProjectCosts,
  getDocProjectRecordings,
  getDocProjectTeam,
} from '@/services/doc_projects'
import { DocProject, DocProjectCost, DocProjectRecording, DocProjectTeam } from '@/types'
import { Button } from '@/components/ui/button'
import { Printer, Share2, Mail } from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'

export default function InvestorSummary() {
  const { id } = useParams()
  const [project, setProject] = useState<DocProject | null>(null)
  const [costs, setCosts] = useState<DocProjectCost[]>([])
  const [recs, setRecs] = useState<DocProjectRecording[]>([])
  const [team, setTeam] = useState<DocProjectTeam[]>([])

  useEffect(() => {
    if (!id) return
    getDocProject(id)
      .then(setProject)
      .catch(() => {})
    getDocProjectCosts(id)
      .then(setCosts)
      .catch(() => {})
    getDocProjectRecordings(id)
      .then(setRecs)
      .catch(() => {})
    getDocProjectTeam(id)
      .then(setTeam)
      .catch(() => {})
  }, [id])

  if (!project) return <div className="p-10 text-center">Carregando resumo...</div>

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Link copiado para a área de transferência')
  }

  const handleEmail = () => {
    const sub = encodeURIComponent(`Resumo do Projeto: ${project.title}`)
    const body = encodeURIComponent(
      `Confira o resumo executivo do projeto de documentário acessando o link:\n${window.location.href}`,
    )
    window.open(`mailto:?subject=${sub}&body=${body}`)
  }

  const costsByCategory = costs.reduce(
    (acc, c) => {
      acc[c.category] = (acc[c.category] || 0) + (c.estimated_value || 0)
      return acc
    },
    {} as Record<string, number>,
  )

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="print:hidden flex justify-end gap-3 mb-6">
          <Button variant="outline" onClick={handleShare}>
            <Share2 className="w-4 h-4 mr-2" /> Compartilhar Link
          </Button>
          <Button variant="outline" onClick={handleEmail}>
            <Mail className="w-4 h-4 mr-2" /> Enviar E-mail
          </Button>
          <Button onClick={() => window.print()}>
            <Printer className="w-4 h-4 mr-2" /> Gerar PDF
          </Button>
        </div>

        <div className="bg-white rounded-xl shadow-lg border p-10 print:shadow-none print:border-none">
          <header className="flex justify-between items-start border-b pb-8 mb-8">
            <div>
              <Badge className="mb-4 bg-primary text-white">Projeto Documentário</Badge>
              <h1 className="text-4xl font-serif font-bold text-secondary mb-2">{project.title}</h1>
              <p className="text-slate-500 text-lg">Público-alvo: {project.target_audience}</p>
            </div>
            <div className="text-right">
              <img src="/logo.png" alt="SST" className="w-16 h-16 object-contain ml-auto mb-2" />
              <p className="font-bold text-secondary">Educação SST</p>
            </div>
          </header>

          <div className="grid md:grid-cols-3 gap-10">
            <div className="md:col-span-2 space-y-10">
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span> Ideia Principal
                </h2>
                <p className="text-slate-700 leading-relaxed">{project.description}</p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center gap-2">
                  <span className="w-2 h-6 bg-primary rounded-full"></span> Estrutura
                </h2>
                <div className="flex gap-6 mb-6 text-sm font-medium">
                  <div className="bg-slate-50 px-4 py-2 rounded-md border">
                    Episódios: <span className="text-primary text-lg ml-1">{project.episodes}</span>
                  </div>
                  <div className="bg-slate-50 px-4 py-2 rounded-md border">
                    Duração:{' '}
                    <span className="text-primary text-lg ml-1">
                      {project.estimated_duration} min
                    </span>
                  </div>
                </div>
                <div className="prose max-w-none text-slate-700 whitespace-pre-wrap bg-slate-50 p-4 rounded-md border">
                  {project.script_structure || 'Estrutura ainda não definida.'}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              <section className="bg-slate-50 p-6 rounded-xl border">
                <h3 className="text-lg font-bold text-secondary mb-4 border-b pb-2">Objetivos</h3>
                <ul className="space-y-3">
                  {(project.objectives || []).map((o, i) => (
                    <li key={i} className="flex gap-2 text-sm text-slate-700">
                      <span className="text-primary mt-0.5">•</span> {o}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="bg-slate-50 p-6 rounded-xl border">
                <h3 className="text-lg font-bold text-secondary mb-4 border-b pb-2">
                  Orçamento Previsto
                </h3>
                <div className="space-y-3 mb-4">
                  {Object.entries(costsByCategory).map(([cat, val]) => (
                    <div key={cat} className="flex justify-between text-sm">
                      <span className="text-slate-600">{cat}</span>
                      <span className="font-medium">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL',
                        }).format(val as number)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="pt-3 border-t flex justify-between font-bold text-lg text-primary">
                  <span>Total</span>
                  <span>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                      project.total_budget || 0,
                    )}
                  </span>
                </div>
              </section>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-10 mt-10 border-t pt-10">
            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Cronograma de Produção</h2>
              <div className="space-y-3">
                {recs.length > 0 ? (
                  recs.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-4 text-sm border-l-2 border-primary pl-4 py-1"
                    >
                      <span className="font-bold text-slate-700 w-24">
                        {format(new Date(r.date), 'dd/MM/yyyy')}
                      </span>
                      <span className="text-slate-500">{r.location}</span>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Cronograma não definido.</p>
                )}
              </div>
            </section>

            <section>
              <h2 className="text-xl font-bold text-slate-800 mb-4">Equipe Técnica</h2>
              <div className="flex flex-wrap gap-2">
                {team.length > 0 ? (
                  team.map((t) => (
                    <Badge key={t.id} variant="secondary" className="px-3 py-1">
                      <span className="font-bold mr-1">{t.role}:</span> {t.name}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-slate-500">Equipe não definida.</p>
                )}
              </div>
            </section>
          </div>

          <footer className="mt-16 pt-6 border-t text-center text-sm text-slate-400">
            Resumo gerado automaticamente pela plataforma Educação SST. Este documento é
            confidencial e destinado exclusivamente a investidores e parceiros.
          </footer>
        </div>
      </div>
    </div>
  )
}
