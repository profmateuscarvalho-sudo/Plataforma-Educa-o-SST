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
import { getStudents, resendActivationEmail, deleteStudent } from '@/services/users'
import { User } from '@/types'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search, Users, Edit, Mail, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { UserEditDialog } from '@/components/admin/UserEditDialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { useRealtime } from '@/hooks/use-realtime'

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editOpen, setEditOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [resendingId, setResendingId] = useState<string | null>(null)
  const { toast } = useToast()

  const loadStudents = () => getStudents().then(setStudents).catch(console.error)

  useEffect(() => {
    loadStudents()
  }, [])
  useRealtime('users', () => {
    loadStudents()
  })

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

  const handleResend = async (s: User) => {
    setResendingId(s.id)
    try {
      await resendActivationEmail(s.id)
      toast({ title: 'E-mail reenviado', description: `Enviado para ${s.email}` })
    } catch {
      toast({ title: 'Erro ao reenviar e-mail', variant: 'destructive' })
    } finally {
      setResendingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await deleteStudent(deleteTarget.id)
      toast({ title: 'Aluno excluído com sucesso' })
      setDeleteTarget(null)
      loadStudents()
    } catch {
      toast({ title: 'Erro ao excluir aluno', variant: 'destructive' })
    } finally {
      setDeleting(false)
    }
  }

  const planBadge = (tier?: string) => {
    const cls =
      tier === 'ouro'
        ? 'bg-amber-100 text-amber-700 border-amber-200'
        : tier === 'prata'
          ? 'bg-blue-100 text-blue-700 border-blue-200'
          : 'bg-slate-100 text-slate-600 border-slate-200'
    return (
      <Badge variant="outline" className={cls}>
        {tier ? tier.charAt(0).toUpperCase() + tier.slice(1) : 'Free'}
      </Badge>
    )
  }

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
          <div className="overflow-x-auto">
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
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => {
                  const isActive =
                    s.contract_end_date && new Date(s.contract_end_date) >= new Date()
                  return (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium text-slate-800">
                        {s.name || 'Sem nome'}
                      </TableCell>
                      <TableCell className="text-slate-600">{s.email}</TableCell>
                      <TableCell className="text-slate-600">{s.phone || '-'}</TableCell>
                      <TableCell>
                        {s.professional_tags?.length ? (
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
                      <TableCell>{planBadge(s.plan_tier)}</TableCell>
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
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Editar"
                            onClick={() => {
                              setEditingUser(s)
                              setEditOpen(true)
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            title="Reenviar ativação"
                            disabled={resendingId === s.id}
                            onClick={() => handleResend(s)}
                          >
                            {resendingId === s.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Mail className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-red-500 hover:text-red-600"
                            title="Excluir"
                            onClick={() => setDeleteTarget(s)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-slate-500">
                      {search ? 'Nenhum aluno encontrado na busca.' : 'Nenhum aluno cadastrado.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <UserEditDialog
        user={editingUser}
        open={editOpen}
        setOpen={setEditOpen}
        onSuccess={loadStudents}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Aluno</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir <strong>{deleteTarget?.name}</strong> (
              {deleteTarget?.email})? Esta ação removerá o aluno e todos os dados associados
              (conclusões de aulas, notas, etc.) e não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              {deleting ? 'Excluindo...' : 'Excluir Aluno'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
