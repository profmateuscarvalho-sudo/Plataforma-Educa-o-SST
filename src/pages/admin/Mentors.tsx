import { MentorManager } from '@/components/admin/MentorManager'

export default function AdminMentors() {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Mentores</h2>
        <p className="text-muted-foreground mt-1">Gerencie perfis de mentores e instrutores.</p>
      </div>
      <MentorManager />
    </div>
  )
}
