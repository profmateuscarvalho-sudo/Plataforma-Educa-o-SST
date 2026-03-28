import { useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getArticles,
  updateArticleStatus,
  updateArticle,
  generateSubmissionLink,
} from '@/services/magazine_management'
import { getMagazines } from '@/services/magazines'
import { Article, Magazine } from '@/types'
import {
  Eye,
  Link as LinkIcon,
  Save,
  Copy,
  FileText,
  Download,
  CheckCircle,
  XCircle,
} from 'lucide-react'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'

export default function AdminMagazineArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMagazine, setFilterMagazine] = useState<string>('all')

  const [generatedLink, setGeneratedLink] = useState('')
  const [editorialComments, setEditorialComments] = useState('')
  const { toast } = useToast()

  const [complianceNorms, setComplianceNorms] = useState(false)
  const [imgAuth, setImgAuth] = useState(false)
  const [artAuth, setArtAuth] = useState(false)

  useEffect(() => {
    load()
    getMagazines()
      .then(setMagazines)
      .catch((err) => console.error('Error loading magazines:', err))
  }, [])

  const load = async () => {
    try {
      const data = await getArticles()
      setArticles(data)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar artigos.', variant: 'destructive' })
    }
  }

  const handleGenerateLink = async () => {
    try {
      const res = await generateSubmissionLink('article')
      const url = `${window.location.origin}/submissao-artigo/${res.token}`
      setGeneratedLink(url)
      toast({ title: 'Link Gerado!', description: 'O link expira em 7 dias.' })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    }
  }

  const copyLink = async () => {
    if (generatedLink) {
      await navigator.clipboard.writeText(generatedLink)
      toast({ title: 'Link Copiado!' })
    }
  }

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await updateArticleStatus(id, status)
      toast({ title: 'Sucesso', description: `Status atualizado para ${status}.` })
      load()
      if (selectedArticle?.id === id) setSelectedArticle({ ...selectedArticle, status } as Article)
    } catch {
      toast({ title: 'Erro', variant: 'destructive' })
    }
  }

  const handleSave = async () => {
    if (!selectedArticle) return
    try {
      const updatedData: any = {
        editorial_comments: editorialComments,
        compliance_norms: complianceNorms,
        image_authorization: {
          ...selectedArticle.image_authorization,
          signed: imgAuth,
        },
        article_authorization: {
          ...selectedArticle.article_authorization,
          signed: artAuth,
        },
      }
      await updateArticle(selectedArticle.id, updatedData)
      toast({ title: 'Artigo salvo com sucesso' })
      load()
      setSelectedArticle(null)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const openEditor = (article: Article) => {
    setSelectedArticle(article)
    setComplianceNorms(!!article.compliance_norms)
    setImgAuth(!!article.image_authorization?.signed)
    setArtAuth(!!article.article_authorization?.signed)
    setEditorialComments((article as any).editorial_comments || '')
  }

  const filteredArticles = articles.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterMagazine !== 'all' && a.magazine !== filterMagazine) return false
    return true
  })

  const getStatusBadge = (s: string) => {
    switch (s) {
      case 'draft':
        return <Badge variant="secondary">Rascunho</Badge>
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200">Submetido</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Aprovado</Badge>
      case 'rejected':
        return <Badge variant="destructive">Rejeitado</Badge>
      default:
        return <Badge variant="outline">{s}</Badge>
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Artigos da Revista</h1>
          <p className="text-muted-foreground mt-1">Gerencie e revise submissões de artigos.</p>
        </div>
        <div className="flex items-center gap-2">
          {generatedLink && (
            <div className="flex items-center gap-2 bg-slate-100 p-2 rounded border text-sm">
              <span className="truncate w-48 text-slate-600">{generatedLink}</span>
              <Button size="icon" variant="ghost" onClick={copyLink} className="h-6 w-6">
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          )}
          <Button onClick={handleGenerateLink}>
            <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link (Expira em 7 dias)
          </Button>
        </div>
      </div>

      <MagazineTabs />

      <div className="flex gap-4 mb-4">
        <div className="w-48">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="draft">Rascunho</SelectItem>
              <SelectItem value="submitted">Submetido</SelectItem>
              <SelectItem value="approved">Aprovado</SelectItem>
              <SelectItem value="rejected">Rejeitado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-64">
          <Select value={filterMagazine} onValueChange={setFilterMagazine}>
            <SelectTrigger>
              <SelectValue placeholder="Edição" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas as Edições</SelectItem>
              {magazines.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Prazo Ideal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium max-w-[250px] truncate">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-400" />
                    {article.title}
                  </div>
                </TableCell>
                <TableCell>{article.expand?.author?.name || 'Desconhecido'}</TableCell>
                <TableCell>
                  {(article as any).delivery_deadline
                    ? new Date((article as any).delivery_deadline).toLocaleDateString()
                    : new Date(article.created).toLocaleDateString()}
                </TableCell>
                <TableCell>{getStatusBadge(article.status)}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => openEditor(article)}>
                    <Eye className="w-4 h-4 mr-1" /> Revisar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filteredArticles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                  Nenhum artigo encontrado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>

      <Dialog
        open={!!selectedArticle}
        onOpenChange={(open) => {
          if (!open) setSelectedArticle(null)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <div className="p-2">
              <DialogHeader className="mb-6">
                <DialogTitle className="flex justify-between items-start text-xl pr-6">
                  <span className="leading-tight">{selectedArticle.title}</span>
                  <div className="flex gap-2 flex-shrink-0 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                      onClick={() => handleStatusChange(selectedArticle.id, 'approved')}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" /> Aprovar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                      onClick={() => handleStatusChange(selectedArticle.id, 'rejected')}
                    >
                      <XCircle className="w-4 h-4 mr-2" /> Rejeitar
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-md border text-sm grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-500 mb-1">Autor</p>
                    <p className="font-medium">{selectedArticle.expand?.author?.name}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">E-mail de Contato</p>
                    <p className="font-medium">{selectedArticle.expand?.author?.email}</p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Data de Envio</p>
                    <p className="font-medium">
                      {new Date(selectedArticle.created).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-500 mb-1">Status Atual</p>
                    <div>{getStatusBadge(selectedArticle.status)}</div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold border-b pb-2">Arquivos do Artigo</h3>
                  <div className="flex flex-wrap gap-4">
                    {(selectedArticle as any).article_word_file ? (
                      <Button variant="outline" asChild>
                        <a
                          href={pb.files.getUrl(
                            selectedArticle,
                            (selectedArticle as any).article_word_file,
                          )}
                          target="_blank"
                          download
                        >
                          <Download className="w-4 h-4 mr-2" /> Baixar Versão Word
                        </a>
                      </Button>
                    ) : (
                      <div className="text-sm text-slate-500 py-2">Sem versão Word</div>
                    )}

                    {(selectedArticle as any).article_pdf_file ? (
                      <Button variant="outline" asChild>
                        <a
                          href={pb.files.getUrl(
                            selectedArticle,
                            (selectedArticle as any).article_pdf_file,
                          )}
                          target="_blank"
                          download
                        >
                          <Download className="w-4 h-4 mr-2" /> Baixar Versão PDF
                        </a>
                      </Button>
                    ) : (
                      <div className="text-sm text-slate-500 py-2">Sem versão PDF</div>
                    )}
                  </div>
                </div>

                {selectedArticle.article_photos && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold border-b pb-2">Imagens em Anexo</h3>
                    <div className="flex flex-wrap gap-4">
                      {Array.isArray(selectedArticle.article_photos) ? (
                        selectedArticle.article_photos.map((photo: string, idx: number) => (
                          <div key={idx} className="relative group">
                            <a
                              href={pb.files.getUrl(selectedArticle, photo)}
                              target="_blank"
                              rel="noreferrer"
                            >
                              <img
                                src={pb.files.getUrl(selectedArticle, photo, { thumb: '150x150' })}
                                className="w-32 h-32 object-cover border rounded shadow-sm"
                              />
                            </a>
                          </div>
                        ))
                      ) : (
                        <div className="relative group">
                          <a
                            href={pb.files.getUrl(selectedArticle, selectedArticle.article_photos)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={pb.files.getUrl(
                                selectedArticle,
                                selectedArticle.article_photos,
                                {
                                  thumb: '150x150',
                                },
                              )}
                              className="w-32 h-32 object-cover border rounded shadow-sm"
                            />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md border">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="compliance">Normas Compliance</Label>
                      <Switch
                        id="compliance"
                        checked={complianceNorms}
                        onCheckedChange={setComplianceNorms}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="imgAuth">Autorização Imagem</Label>
                      <Switch id="imgAuth" checked={imgAuth} onCheckedChange={setImgAuth} />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label htmlFor="artAuth">Autorização Artigo</Label>
                      <Switch id="artAuth" checked={artAuth} onCheckedChange={setArtAuth} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-lg">Comentários do Comitê Editorial</Label>
                    <Textarea
                      value={editorialComments}
                      onChange={(e) => setEditorialComments(e.target.value)}
                      placeholder="Adicione observações, notas de revisão ou apontamentos para diagramação..."
                      className="min-h-[150px]"
                    />
                  </div>

                  <div className="pt-4 flex justify-end">
                    <Button onClick={handleSave}>
                      <Save className="w-4 h-4 mr-2" /> Salvar Revisão
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
