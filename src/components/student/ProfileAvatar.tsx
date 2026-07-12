import { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { Camera, Loader2, Upload } from 'lucide-react'
import pb from '@/lib/pocketbase/client'
import { useAuth } from '@/hooks/use-auth'
import { useToast } from '@/hooks/use-toast'
import { User } from '@/types'

interface ProfileAvatarProps {
  user: User
  size?: 'sm' | 'md' | 'lg'
  editable?: boolean
}

export function ProfileAvatar({ user, size = 'md', editable = false }: ProfileAvatarProps) {
  const { updateProfile } = useAuth()
  const { toast } = useToast()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const sizeClasses = { sm: 'w-10 h-10', md: 'w-20 h-20', lg: 'w-28 h-28' }
  const avatarUrl = user.avatar ? pb.files.getUrl(user, user.avatar) : null

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0]
    if (!selected) return
    if (!selected.type.startsWith('image/')) {
      toast({ title: 'Selecione um arquivo de imagem.', variant: 'destructive' })
      return
    }
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  const handleUpload = async () => {
    if (!file) return
    setLoading(true)
    const formData = new FormData()
    formData.append('avatar', file)
    const { error } = await updateProfile(formData)
    setLoading(false)
    if (error) {
      toast({ title: 'Erro ao atualizar foto', variant: 'destructive' })
    } else {
      toast({ title: 'Foto atualizada com sucesso!' })
      setOpen(false)
      setPreview(null)
      setFile(null)
    }
  }

  const handleOpenChange = (v: boolean) => {
    setOpen(v)
    if (!v) {
      setPreview(null)
      setFile(null)
    }
  }

  return (
    <>
      <div className="relative group">
        <Avatar className={`${sizeClasses[size]} border-2 border-white/20`}>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={user.name} /> : null}
          <AvatarFallback className="bg-primary/10 text-primary font-bold text-2xl">
            {user.name?.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        {editable && (
          <button
            onClick={() => setOpen(true)}
            className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-lg hover:bg-primary/90 transition-colors border-2 border-white"
          >
            <Camera className="w-4 h-4" />
          </button>
        )}
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Editar Foto de Perfil</DialogTitle>
            <DialogDescription>Escolha uma nova imagem para o seu perfil.</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Avatar className="w-32 h-32 border-2 border-slate-200">
              {preview ? <AvatarImage src={preview} alt="Preview" /> : null}
              <AvatarFallback className="bg-slate-100 text-slate-400">
                <Camera className="w-8 h-8" />
              </AvatarFallback>
            </Avatar>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={() => inputRef.current?.click()} className="w-full">
              <Upload className="w-4 h-4 mr-2" /> Selecionar Imagem
            </Button>
            <Button onClick={handleUpload} disabled={!file || loading} className="w-full">
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
              Salvar Foto
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
