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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  getArticles,
  updateArticleStatus,
  updateArticle,
  deleteArticle,
  generateSubmissionLink,
  getTokens,
} from '@/services/magazine_management'
import { getMagazines } from '@/services/magazines'
import { Article, Magazine } from '@/types'
import {
  Eye,
  Link as LinkIcon,
  Save,
  Copy,
  Download,
  CheckCircle,
  XCircle,
  Trash2,
} from 'lucide-react'
import { MagazineTabs } from '@/components/admin/MagazineTabs'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import pb from '@/lib/pocketbase/client'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function AdminMagazineArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [magazines, setMagazines] = useState<Magazine[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)

  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterMagazine, setFilterMagazine] = useState<string>('all')
  const [articleToDelete, setArticleToDelete] = useState<string | null>(null)

  const [linkModalOpen, setLinkModalOpen] = useState(false)
  const [recipientName, setRecipientName] = useState('')
  const [tokens, setTokens] = useState<any[]>([])
  const [editorialComments, setEditorialComments] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    load()
    getMagazines().then(setMagazines).catch(console.error)
  }, [])

  const load = async () => {
    try {
      const data = await getArticles()
      setArticles(data)
    } catch (e) {
      toast({ title: 'Erro', description: 'Falha ao carregar artigos.', variant: 'destructive' })
    }
  }

  const loadTokens = async () => {
    try {
      const data = await getTokens('article')
      setTokens(data)
    } catch (e) {
      console.error(e)
    }
  }

  const handleOpenLinks = () => {
    setLinkModalOpen(true)
    loadTokens()
  }

  const handleGenerateLink = async () => {
    if (!recipientName.trim()) {
      toast({
        title: 'Aviso',
        description: 'Informe o nome do destinatário.',
        variant: 'destructive',
      })
      return
    }
    try {
      await generateSubmissionLink('article', recipientName)
      toast({ title: 'Link Gerado!', description: 'O link expira em 30 dias.' })
      setRecipientName('')
      loadTokens()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
    }
  }

  const copyLink = async (tokenStr: string) => {
    const url = `${window.location.origin}/submissao-artigo/${tokenStr}`
    await navigator.clipboard.writeText(url)
    toast({ title: 'Link Copiado!' })
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
      await updateArticle(selectedArticle.id, { editorial_comments: editorialComments })
      toast({ title: 'Revisão salva com sucesso' })
      load()
      setSelectedArticle(null)
    } catch (e) {
      toast({ title: 'Erro ao salvar', variant: 'destructive' })
    }
  }

  const openEditor = (article: Article) => {
    setSelectedArticle(article)
    setEditorialComments((article as any).editorial_comments || '')
  }

  const handleDelete = async () => {
    if (!articleToDelete) return
    try {
      await deleteArticle(articleToDelete)
      toast({ title: 'Sucesso', description: 'Artigo excluído com sucesso.' })
      setArticleToDelete(null)
      load()
    } catch {
      toast({ title: 'Erro', description: 'Falha ao excluir o artigo.', variant: 'destructive' })
    }
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
        return <Badge className="bg-blue-100 text-blue-800">Submetido</Badge>
      case 'approved':
        return <Badge className="bg-green-100 text-green-800">Aprovado</Badge>
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
        <Button onClick={handleOpenLinks}>
          <LinkIcon className="w-4 h-4 mr-2" /> Gerenciar Links
        </Button>
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
              <TableHead>Artigo</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Prazo Ideal</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredArticles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="max-w-[250px]">
                  <div className="flex flex-col truncate">
                    <span className="font-semibold text-slate-800 truncate">{article.title}</span>
                    <span className="text-xs text-slate-500">
                      Enviado em {new Date(article.created).toLocaleDateString()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarImage
                        src={pb.files.getUrl(
                          article.expand?.author,
                          article.expand?.author?.photos,
                        )}
                      />
                      <AvatarFallback>{article.expand?.author?.name?.[0]}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">
                      {article.expand?.author?.name || 'Desconhecido'}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">
                  {(article as any).delivery_deadline
                    ? new Date((article as any).delivery_deadline).toLocaleDateString()
                    : '-'}
                </TableCell>
                <TableCell>{getStatusBadge(article.status)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => openEditor(article)}>
                      <Eye className="w-4 h-4 mr-1" /> Revisar
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={() => setArticleToDelete(article.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
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

      <Dialog open={linkModalOpen} onOpenChange={setLinkModalOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Links de Submissão de Artigo</DialogTitle>
          </DialogHeader>
          <div className="flex gap-4 items-end border-b pb-6">
            <div className="flex-1 space-y-2">
              <Label>Nome do Destinatário</Label>
              <Input
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Ex: Dr. João Silva"
              />
            </div>
            <Button onClick={handleGenerateLink}>Gerar Novo Link (30 dias)</Button>
          </div>
          <div className="space-y-4 pt-2 max-h-[400px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Destinatário</TableHead>
                  <TableHead>Link</TableHead>
                  <TableHead>Expira em</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tokens.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium text-sm">{t.recipient_name || '-'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="truncate w-32 text-xs text-slate-500">
                          {window.location.origin}/submissao-artigo/{t.token}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-6 w-6"
                          onClick={() => copyLink(t.token)}
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {new Date(t.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      {t.used ? (
                        <Badge variant="secondary">Usado</Badge>
                      ) : (
                        <Badge className="bg-green-100 text-green-800">Ativo</Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {tokens.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4 text-slate-500">
                      Nenhum link gerado.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={!!articleToDelete}
        onOpenChange={(open) => !open && setArticleToDelete(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. Isso excluirá permanentemente o artigo do sistema.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Excluir Artigo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                <div className="bg-slate-50 p-4 rounded-md border text-sm grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="col-span-2">
                    <p className="text-slate-500 mb-1">Autor</p>
                    <div className="flex items-center gap-2">
                      <Avatar className="w-6 h-6">
                        <AvatarImage
                          src={pb.files.getUrl(
                            selectedArticle.expand?.author,
                            selectedArticle.expand?.author?.photos,
                          )}
                        />
                        <AvatarFallback>{selectedArticle.expand?.author?.name?.[0]}</AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{selectedArticle.expand?.author?.name}</p>
                    </div>
                  </div>
                  <div className="col-span-2">
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
                    {(selectedArticle as any).article_word_file && (
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
                    )}
                    {(selectedArticle as any).article_pdf_file && (
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
                    )}
                    {!(
                      (selectedArticle as any).article_word_file ||
                      (selectedArticle as any).article_pdf_file
                    ) && <div className="text-sm text-slate-500 py-2">Nenhum arquivo anexado.</div>}
                  </div>
                </div>

                {selectedArticle.article_photos && (
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold border-b pb-2">Imagens em Anexo</h3>
                    <div className="flex flex-wrap gap-4">
                      {Array.isArray(selectedArticle.article_photos) ? (
                        selectedArticle.article_photos.map((photo: string, idx: number) => (
                          <a
                            key={idx}
                            href={pb.files.getUrl(selectedArticle, photo)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <img
                              src={pb.files.getUrl(selectedArticle, photo, { thumb: '150x150' })}
                              className="w-32 h-32 object-cover border rounded shadow-sm hover:opacity-80 transition"
                            />
                          </a>
                        ))
                      ) : (
                        <a
                          href={pb.files.getUrl(selectedArticle, selectedArticle.article_photos)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <img
                            src={pb.files.getUrl(selectedArticle, selectedArticle.article_photos, {
                              thumb: '150x150',
                            })}
                            className="w-32 h-32 object-cover border rounded shadow-sm hover:opacity-80 transition"
                          />
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-4 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-md border">
                    <div>
                      <Label className="text-slate-500 mb-1 block">Autorização de Imagem</Label>
                      {selectedArticle.image_authorization?.signed ? (
                        <Badge className="bg-green-100 text-green-800">
                          Assinada por {selectedArticle.image_authorization?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          Pendente
                        </Badge>
                      )}
                    </div>
                    <div>
                      <Label className="text-slate-500 mb-1 block">Autorização do Artigo</Label>
                      {selectedArticle.article_authorization?.signed ? (
                        <Badge className="bg-green-100 text-green-800">
                          Assinada por {selectedArticle.article_authorization?.name}
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-slate-500">
                          Pendente
                        </Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <Label className="text-lg text-primary font-bold">
                      Comentários do Comitê Editorial
                    </Label>
                    <Textarea
                      value={editorialComments}
                      onChange={(e) => setEditorialComments(e.target.value)}
                      placeholder="Adicione observações, notas de revisão ou apontamentos para diagramação..."
                      className="min-h-[150px] border-primary/20 focus-visible:ring-primary/30"
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
