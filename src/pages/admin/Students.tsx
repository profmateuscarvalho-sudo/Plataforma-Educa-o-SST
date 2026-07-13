import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getStudents } from '@/services/users'
import { User } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Users, Edit } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserPlanDialog } from '@/components/admin/UserPlanDialog'

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [planDialogOpen, setPlanDialogOpen] = useState(false)

  useEffect(() => {
    getStudents().then(setStudents).catch(console.error)
  }, [])

  const filtered = students.filter((s) => {
    const q = search.toLowerCase()
    return (
      s.name?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.toLowerCase().includes(q) ||
      s.professional_profile?.toLowerCase().includes(q) ||
      JSON.stringify(s.professional_tags || [])
        .toLowerCase()
        .includes(q)
    )
  })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Alunos</h2>
          <p className="text-slate-500 mt-1">Gestão de alunos cadastrados na plataforma.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border">
          <Users className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium text-slate-600">{students.length} alunos</span>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Buscar por nome, e-mail, telefone ou perfil..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-10"
            />
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Perfis Profissionais</TableHead>
                <TableHead>Cadastro</TableHead>
                <TableHead>Validade</TableHead>
                <TableHead>Plano</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((s) => {
                const isActive = s.contract_end_date && new Date(s.contract_end_date) >= new Date()
                return (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium text-slate-800">
                      {s.name || 'Sem nome'}
                    </TableCell>
                    <TableCell className="text-slate-600">{s.email}</TableCell>
                    <TableCell className="text-slate-600">{s.phone || '-'}</TableCell>
                    <TableCell>
                      {s.professional_tags && s.professional_tags.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {s.professional_tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-slate-600 text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      ) : s.professional_profile ? (
                        <Badge variant="outline" className="text-slate-600">
                          {s.professional_profile}
                        </Badge>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {new Date(s.created).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-slate-500">
                      {s.contract_end_date
                        ? new Date(s.contract_end_date).toLocaleDateString('pt-BR')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Badge
                          variant="outline"
                          className={
                            s.plan_tier === 'ouro'
                              ? 'bg-amber-100 text-amber-700 border-amber-200'
                              : s.plan_tier === 'prata'
                                ? 'bg-blue-100 text-blue-700 border-blue-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                          }
                        >
                          {s.plan_tier
                            ? s.plan_tier.charAt(0).toUpperCase() + s.plan_tier.slice(1)
                            : 'Free'}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => {
                            setEditingUser(s)
                            setPlanDialogOpen(true)
                          }}
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={isActive ? 'default' : 'outline'}
                        className={
                          isActive
                            ? 'bg-emerald-500 hover:bg-emerald-600 border-transparent text-white'
                            : 'text-slate-500'
                        }
                      >
                        {isActive ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                )
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8 text-slate-500">
                    {search ? 'Nenhum aluno encontrado na busca.' : 'Nenhum aluno cadastrado.'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <UserPlanDialog
        user={editingUser}
        open={planDialogOpen}
        setOpen={setPlanDialogOpen}
        onSuccess={() => getStudents().then(setStudents).catch(console.error)}
      />
    </div>
  )
}
