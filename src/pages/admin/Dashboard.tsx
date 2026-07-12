import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BookOpen, Users, DollarSign, FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLeads } from '@/services/leads'
import { getCourses } from '@/services/courses'
import { getStudents } from '@/services/users'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ leads: 0, courses: 0, students: 0, activeSubscribers: 0 })

  useEffect(() => {
    Promise.all([getLeads(), getCourses(), getStudents()]).then(
      ([leadsRes, coursesRes, studentsRes]) => {
        const now = new Date()
        const active = studentsRes.filter(
          (s) => s.contract_end_date && new Date(s.contract_end_date) > now,
        ).length
        setStats({
          leads: leadsRes.length,
          courses: coursesRes.length,
          students: studentsRes.length,
          activeSubscribers: active,
        })
      },
    )
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Visão Geral</h2>
        <p className="text-slate-500">Métricas da plataforma de educação SST.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          {
            label: 'Total de Alunos',
            val: stats.students.toString(),
            icon: Users,
            color: 'text-blue-500',
          },
          {
            label: 'Cursos Ativos',
            val: stats.courses.toString(),
            icon: BookOpen,
            color: 'text-primary',
          },
          {
            label: 'Assinantes Ativos',
            val: stats.activeSubscribers.toString(),
            icon: FileText,
            color: 'text-green-600',
          },
          {
            label: 'Leads Capturados',
            val: stats.leads.toString(),
            icon: DollarSign,
            color: 'text-accent',
          },
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
    </div>
  )
}
