import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import {
  getArticles,
  updateArticleStatus,
  generateSubmissionLink,
} from '@/services/magazine_management'
import { Article } from '@/types'
import { Eye, Link as LinkIcon, Printer } from 'lucide-react'

export default function AdminMagazineArticles() {
  const [articles, setArticles] = useState<Article[]>([])
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null)
  const [printMode, setPrintMode] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    load()
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
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link Copiado!', description: url })
    } catch {
      toast({ title: 'Erro', description: 'Falha ao gerar link.', variant: 'destructive' })
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Artigos Submetidos</h1>
        <Button onClick={handleGenerateLink}>
          <LinkIcon className="w-4 h-4 mr-2" /> Gerar Link de Submissão
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Data</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {articles.map((article) => (
              <TableRow key={article.id}>
                <TableCell className="font-medium">{article.title}</TableCell>
                <TableCell>{article.expand?.author?.name || 'Desconhecido'}</TableCell>
                <TableCell>{new Date(article.created).toLocaleDateString()}</TableCell>
                <TableCell>
                  <Badge
                    variant={
                      article.status === 'approved'
                        ? 'default'
                        : article.status === 'rejected'
                          ? 'destructive'
                          : 'secondary'
                    }
                  >
                    {article.status.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="icon" onClick={() => setSelectedArticle(article)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {articles.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-4">
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
              className={printMode ? 'p-8 bg-white text-black' : ''}
            >
              <DialogHeader className={printMode ? 'hidden' : ''}>
                <DialogTitle className="flex justify-between items-center">
                  <span>Revisão de Artigo</span>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setPrintMode(true)
                        setTimeout(() => window.print(), 100)
                      }}
                    >
                      <Printer className="w-4 h-4 mr-2" /> Gerar PDF (Imprimir)
                    </Button>
                    <Button
                      variant="default"
                      onClick={() => handleStatusChange(selectedArticle.id, 'approved')}
                    >
                      Aprovar
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handleStatusChange(selectedArticle.id, 'rejected')}
                    >
                      Rejeitar
                    </Button>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="mt-6 space-y-6">
                <div>
                  <h2 className="text-2xl font-bold">{selectedArticle.title}</h2>
                  <p className="text-muted-foreground">
                    Por: {selectedArticle.expand?.author?.name} | E-mail:{' '}
                    {selectedArticle.expand?.author?.email}
                  </p>
                </div>

                <div
                  className="prose max-w-none dark:prose-invert border p-6 rounded"
                  dangerouslySetInnerHTML={{ __html: selectedArticle.content }}
                />

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-muted rounded">
                    <h3 className="font-bold mb-2">Autorização de Imagem</h3>
                    <p>Assinado: {selectedArticle.image_authorization?.signed ? 'Sim' : 'Não'}</p>
                    <p>Nome: {selectedArticle.image_authorization?.name}</p>
                    <p>Data: {selectedArticle.image_authorization?.date}</p>
                  </div>
                  <div className="p-4 bg-muted rounded">
                    <h3 className="font-bold mb-2">Autorização de Artigo</h3>
                    <p>Assinado: {selectedArticle.article_authorization?.signed ? 'Sim' : 'Não'}</p>
                    <p>Nome: {selectedArticle.article_authorization?.name}</p>
                    <p>Data: {selectedArticle.article_authorization?.date}</p>
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
