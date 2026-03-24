import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  BookOpen,
  Users,
  DollarSign,
  FileText,
  UploadCloud,
  Copy,
  Check,
  Video,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { getLeads } from '@/services/leads'
import { getCourses } from '@/services/courses'
import pb from '@/lib/pocketbase/client'
import { useToast } from '@/hooks/use-toast'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ leads: 0, courses: 0 })
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [uploadedId, setUploadedId] = useState('')
  const [copied, setCopied] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    Promise.all([getLeads(), getCourses()]).then(([leadsRes, coursesRes]) => {
      setStats({ leads: leadsRes.length, courses: coursesRes.length })
    })
  }, [])

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    setProgress(10)
    setUploadedId('')
    setCopied(false)

    // Simulate progress while the request processes
    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + 15, 90))
    }, 400)

    const fd = new FormData()
    fd.append('video', file)

    try {
      const res = await pb.send('/backend/v1/panda/upload', {
        method: 'POST',
        body: fd,
      })
      clearInterval(progressInterval)
      setProgress(100)
      setUploadedId(res.video_id)
      toast({ title: 'Vídeo enviado com sucesso para o Panda Video' })
      setFile(null)
    } catch (err: any) {
      clearInterval(progressInterval)
      setProgress(0)
      toast({
        title: 'Erro no upload',
        description: err.message || 'Falha ao comunicar com o servidor.',
        variant: 'destructive',
      })
    } finally {
      setTimeout(() => setUploading(false), 500)
    }
  }

  const copyToClipboard = () => {
    if (!uploadedId) return
    navigator.clipboard.writeText(uploadedId)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-serif font-bold text-secondary">Visão Geral</h2>
        <p className="text-slate-500">Métricas da plataforma de educação SST.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total de Alunos', val: '142', icon: Users, color: 'text-blue-500' },
          {
            label: 'Cursos Ativos',
            val: stats.courses.toString(),
            icon: BookOpen,
            color: 'text-primary',
          },
          { label: 'Revistas Publicadas', val: '12', icon: FileText, color: 'text-green-600' },
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <CardTitle className="text-xl">Upload Direto: Panda Video</CardTitle>
                <CardDescription>
                  Envie vídeos diretamente para a hospedagem sem sair da plataforma.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpload} className="space-y-4">
              <div className="space-y-2">
                <Label>Selecione o arquivo de vídeo</Label>
                <Input
                  type="file"
                  accept="video/*"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  disabled={uploading}
                  className="cursor-pointer"
                />
              </div>

              {(uploading || progress === 100) && (
                <div className="space-y-2 py-2">
                  <div className="flex justify-between text-sm font-medium text-slate-600">
                    <span>{progress === 100 ? 'Concluído' : 'Enviando...'}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              )}

              <Button type="submit" disabled={!file || uploading} className="w-full h-11">
                {uploading ? (
                  'Processando Upload...'
                ) : (
                  <>
                    <UploadCloud className="w-4 h-4 mr-2" /> Enviar Vídeo
                  </>
                )}
              </Button>
            </form>

            {uploadedId && (
              <div className="mt-6 p-4 bg-emerald-50 rounded-xl border border-emerald-100 animate-fade-in">
                <p className="text-sm font-semibold text-emerald-800 mb-2">
                  Upload Realizado com Sucesso!
                </p>
                <p className="text-xs text-emerald-600 mb-3">
                  Copie o ID abaixo e cole no campo "Panda Video ID" do seu curso, aula ou evento.
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-white px-3 py-2 rounded-lg border border-emerald-200 text-sm font-mono text-emerald-900 truncate">
                    {uploadedId}
                  </code>
                  <Button
                    size="icon"
                    variant="outline"
                    className="shrink-0 bg-white border-emerald-200 hover:bg-emerald-100 hover:text-emerald-700 text-emerald-600"
                    onClick={copyToClipboard}
                  >
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
