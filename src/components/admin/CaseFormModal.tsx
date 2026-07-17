import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Loader2 } from 'lucide-react'
import { createCase } from '@/services/professional-cases'
import { useToast } from '@/hooks/use-toast'
import { useAuth } from '@/hooks/use-auth'

interface CaseFormModalProps {
  open: boolean
  setOpen: (v: boolean) => void
  onSuccess: () => void
}

export function CaseFormModal({ open, setOpen, onSuccess }: CaseFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const { toast } = useToast()
  const { user } = useAuth()

  useEffect(() => {
    if (open) {
      setTitle('')
      setContent('')
      setErrors({})
    }
  }, [open])

  const validate = () => {
    const errs: Record<string, string> = {}
    if (!title.trim()) errs.title = 'O título é obrigatório.'
    if (!content.trim()) errs.content = 'O conteúdo é obrigatório.'
    return errs
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const errs = validate()
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }

    if (!user?.id) {
      toast({ title: 'Erro: usuário não autenticado', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      await createCase({
        user: user.id,
        title: title.trim(),
        content: content.trim(),
        status: 'approved',
      })
      toast({ title: 'Caso criado e publicado com sucesso!' })
      onSuccess()
      setOpen(false)
    } catch (err) {
      toast({
        title: 'Erro ao criar o caso',
        description: 'Verifique os dados e tente novamente.',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Novo Caso Profissional</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          <div>
            <Label>Título *</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Investigação de ruído em indústria metalúrgica"
            />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>
          <div>
            <Label>Conteúdo *</Label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Descreva o caso profissional em detalhes..."
              className="h-48"
            />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content}</p>}
          </div>
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Publicar Caso
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
