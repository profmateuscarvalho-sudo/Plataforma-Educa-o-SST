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

export default function AdminStudents() {
  const [students, setStudents] = useState<User[]>([])

  useEffect(() => {
    getStudents().then(setStudents).catch(console.error)
  }, [])

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Alunos</h2>
        <p className="text-slate-500 mt-1">Gestão de alunos cadastrados na plataforma.</p>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>E-mail</TableHead>
                <TableHead>Data de Cadastro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium text-slate-800">
                    {s.name || 'Sem nome'}
                  </TableCell>
                  <TableCell className="text-slate-600">{s.email}</TableCell>
                  <TableCell className="text-slate-500">
                    {new Date(s.created).toLocaleDateString('pt-BR')}
                  </TableCell>
                </TableRow>
              ))}
              {students.length === 0 && (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8 text-slate-500">
                    Nenhum aluno encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
