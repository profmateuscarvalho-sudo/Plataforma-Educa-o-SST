import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, DollarSign, TrendingUp } from 'lucide-react'

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Visão Geral</h2>
        <p className="text-slate-500">Métricas da plataforma de educação SST.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Alunos', val: '1,248', icon: Users, color: 'text-blue-500' },
          { label: 'Cursos Ativos', val: '12', icon: BookOpen, color: 'text-primary' },
          { label: 'Receita Mensal', val: 'R$ 45.2K', icon: DollarSign, color: 'text-green-600' },
          { label: 'Leads Capturados', val: '342', icon: TrendingUp, color: 'text-accent' },
        ].map((s, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">{s.label}</CardTitle>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-secondary">{s.val}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Últimos Leads (Falar com Consultor)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { n: 'João Silva', e: 'joao@industria.com', t: '(11) 98888-7777', d: 'Há 2 horas' },
              { n: 'Maria Santos', e: 'maria@seguranca.br', t: '(21) 99999-0000', d: 'Há 5 horas' },
            ].map((l, i) => (
              <div
                key={i}
                className="flex justify-between items-center p-4 bg-slate-50 rounded-lg border"
              >
                <div>
                  <p className="font-bold text-secondary">{l.n}</p>
                  <p className="text-sm text-slate-500">
                    {l.e} • {l.t}
                  </p>
                </div>
                <span className="text-xs text-slate-400 font-medium bg-white px-2 py-1 rounded border">
                  {l.d}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
