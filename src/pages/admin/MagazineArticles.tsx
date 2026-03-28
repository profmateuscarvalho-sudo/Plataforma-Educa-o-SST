import { useEffect, useState, useRef } from 'react'
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
import { Eye, Link as LinkIcon, Printer, Save, Copy } from 'lucide-react'
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

export default function AdminMagazineArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMagazine, setFilterMagazine] = useState<string>('all')

  const [printMode, setPrintMode] = useState(false)
  const [generatedLink, setGeneratedLink] = useState('')
  const { toast } = useToast()

  const contentRef = useRef<HTMLTextAreaElement>(null)
  const [complianceNorms, setComplianceNorms] = useState(false)
  const [imgAuth, setImgAuth] = useState(false)
  const [artAuth, setArtAuth] = useState(false)

  useEffect(() => {
    load()
    getMagazines()
      .then(setMagazines)
      .catch(() => {})
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
      toast({ title: 'Sucesso', description: 'Status atualizado.' })
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
        content: contentRef.current?.value || selectedArticle.content,
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
  }

  const filteredArticles = articles.filter((a) => {
    if (filterStatus !== 'all' && a.status !== filterStatus) return false
    if (filterMagazine !== 'all' && a.magazine !== filterMagazine) return false
    return true
  })

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'draft':
        return 'bg-slate-200 text-slate-800'
      case 'submitted':
        return 'bg-blue-100 text-blue-800'
      case 'approved':
        return 'bg-green-100 text-green-800'
      case 'rejected':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-slate-100 text-slate-800'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-serif font-bold text-secondary">Artigos da Revista</h1>
          <p className="text-muted-foreground mt-1">Gerencie submissões de artigos.</p>
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
              <TableHead>Data de Envio</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium max-w-[200px] truncate">
                  {article.title}
                </TableCell>
                <TableCell>{article.expand?.author?.name || 'Desconhecido'}</TableCell>
                <TableCell>{new Date(article.created).toLocaleDateString()}</TableCell>
                <TableCell>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(article.status)}`}
                  >
                    {article.status.toUpperCase()}
                  </span>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => openEditor(article)}>
                    <Eye className="w-4 h-4 mr-1" /> Ver/Editar
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
          if (!open) {
            setSelectedArticle(null)
            setPrintMode(false)
          }
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          {selectedArticle && (
            <div
              id={printMode ? 'print-area' : undefined}
              className={printMode ? 'p-8 bg-white text-black font-serif' : ''}
            >
              <DialogHeader className={printMode ? 'hidden' : 'mb-4'}>
                <DialogTitle className="flex justify-between items-center text-xl">
                  <span>{selectedArticle.title}</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setPrintMode(true)
                        setTimeout(() => window.print(), 200)
                        setTimeout(() => setPrintMode(false), 2000)
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" /> PDF / Imprimir
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                      onClick={() => handleStatusChange(selectedArticle.id, 'approved')}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleStatusChange(selectedArticle.id, 'rejected')}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-6">
                <div className="bg-slate-50 p-4 rounded-md print:bg-transparent print:p-0">
                  <p>
                    <strong>Autor:</strong> {selectedArticle.expand?.author?.name}
                  </p>
                  <p>
                    <strong>E-mail:</strong> {selectedArticle.expand?.author?.email}
                  </p>
                  <p>
                    <strong>Data de Envio:</strong>{' '}
                    {new Date(selectedArticle.created).toLocaleDateString()}
                  </p>
                </div>

                {!printMode && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-md">
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
                      <Label>Conteúdo do Artigo (HTML/Texto Rico)</Label>
                      <Textarea
                        ref={contentRef}
                        defaultValue={selectedArticle.content}
                        className="min-h-[300px] font-mono"
                      />
                      <p className="text-xs text-muted-foreground">
                        Você pode editar o conteúdo HTML diretamente aqui.
                      </p>
                    </div>

                    {selectedArticle.article_photos && (
                      <div className="space-y-2">
                        <Label>Fotos em Anexo</Label>
                        <div className="flex flex-wrap gap-2">
                          <a
                            href={pb.files.getUrl(selectedArticle, selectedArticle.article_photos)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={pb.files.getUrl(
                                selectedArticle,
                                selectedArticle.article_photos,
                                { thumb: '100x100' },
                              )}
                              className="w-24 h-24 object-cover border rounded"
                            />
                          </a>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex justify-end">
                      <Button onClick={handleSave}>
                        <Save className="w-4 h-4 mr-2" /> Salvar Alterações
                      </Button>
                    </div>
                  </div>
                )}

                {printMode && (
                  <div className="mt-8">
                    <div
                      className="prose max-w-none prose-slate"
                      dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 2cm;
          }
        }
      `}</style>
    </div>
  )
}
