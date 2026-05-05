import { useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Progress } from '@/components/ui/progress'
import { createLead } from '@/services/leads'
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, FileText, Loader2 } from 'lucide-react'

function parseCSVLine(line: string) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }
  result.push(current.trim())
  return result
}

function parseCSV(text: string) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0)
  if (lines.length === 0) return { headers: [], rows: [] }

  const headers = parseCSVLine(lines[0])
  const rows = lines.slice(1).map((line) => {
    const values = parseCSVLine(line)
    return headers.reduce(
      (acc, header, index) => {
        acc[header] = values[index] || ''
        return acc
      },
      {} as Record<string, string>,
    )
  })

  return { headers, rows }
}

export default function AdminLeadImport() {
  const [file, setFile] = useState<File | null>(null)
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<Record<string, string>[]>([])

  const [mapping, setMapping] = useState<Record<string, string>>({
    name: 'none',
    email: 'none',
    phone: 'none',
    message: 'none',
  })

  const [importing, setImporting] = useState(false)
  const [importStats, setImportStats] = useState<{
    total: number
    success: number
    errors: string[]
  } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFile = e.target.files?.[0]
    if (!uploadedFile) return

    setFile(uploadedFile)
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const { headers: parsedHeaders, rows: parsedRows } = parseCSV(text)
      setHeaders(parsedHeaders)
      setRows(parsedRows)

      const newMapping = { name: 'none', email: 'none', phone: 'none', message: 'none' }
      parsedHeaders.forEach((h) => {
        const lower = h.toLowerCase()
        if (lower.includes('nome') || lower.includes('name')) newMapping.name = h
        if (lower.includes('email') || lower.includes('e-mail')) newMapping.email = h
        if (lower.includes('telefone') || lower.includes('phone') || lower.includes('celular'))
          newMapping.phone = h
        if (lower.includes('mensagem') || lower.includes('message')) newMapping.message = h
      })
      setMapping(newMapping)
      setImportStats(null)
    }
    reader.readAsText(uploadedFile, 'UTF-8')
  }

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

  const handleImport = async () => {
    setImporting(true)
    setImportStats({ total: rows.length, success: 0, errors: [] })

    let successCount = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const nameCol = mapping.name !== 'none' ? mapping.name : ''
      const emailCol = mapping.email !== 'none' ? mapping.email : ''
      const phoneCol = mapping.phone !== 'none' ? mapping.phone : ''
      const messageCol = mapping.message !== 'none' ? mapping.message : ''

      const name = nameCol ? row[nameCol] : ''
      const email = emailCol ? row[emailCol] : ''
      const phone = phoneCol ? row[phoneCol] : ''
      const message = messageCol ? row[messageCol] : ''

      if (!name || !email) {
        errors.push(`Linha ${i + 2}: Nome e E-mail são obrigatórios.`)
        continue
      }

      if (!isValidEmail(email)) {
        errors.push(`Linha ${i + 2}: E-mail inválido (${email}).`)
        continue
      }

      try {
        await createLead({ name, email, phone, message })
        successCount++
      } catch (err: any) {
        errors.push(`Linha ${i + 2}: Falha ao salvar no banco (${email}).`)
      }

      setImportStats({ total: rows.length, success: successCount, errors })
    }

    setImporting(false)
  }

  const isMappingValid = mapping.name !== 'none' && mapping.email !== 'none'
  const progress = importStats ? (importStats.success / importStats.total) * 100 : 0

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" asChild>
          <Link to="/admin/leads">
            <ArrowLeft className="w-4 h-4" />
          </Link>
        </Button>
        <div>
          <h2 className="text-3xl font-serif font-bold text-secondary">Importar Leads</h2>
          <p className="text-slate-500 mt-1">
            Faça upload de um arquivo CSV para adicionar contatos em lote.
          </p>
        </div>
      </div>

      {!file && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-24 text-center border-2 border-dashed border-slate-200 m-6 rounded-lg bg-slate-50">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
              <Upload className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">Selecione um arquivo CSV</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              O arquivo deve conter cabeçalhos na primeira linha. Extensão .csv suportada.
            </p>
            <Button onClick={() => fileInputRef.current?.click()}>Escolher Arquivo</Button>
            <input
              type="file"
              accept=".csv"
              className="hidden"
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
          </CardContent>
        </Card>
      )}

      {file && !importStats && !importing && (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    {file.name}
                  </CardTitle>
                  <CardDescription>
                    {rows.length} registros encontrados. Mapeie as colunas do seu arquivo para os
                    campos do sistema.
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={() => setFile(null)}>
                  Trocar Arquivo
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  { id: 'name', label: 'Nome', required: true },
                  { id: 'email', label: 'E-mail', required: true },
                  { id: 'phone', label: 'Telefone', required: false },
                  { id: 'message', label: 'Mensagem', required: false },
                ].map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label className="flex items-center gap-1">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </Label>
                    <Select
                      value={mapping[field.id]}
                      onValueChange={(val) => setMapping((prev) => ({ ...prev, [field.id]: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">-- Ignorar este campo --</SelectItem>
                        {headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pré-visualização dos Dados</CardTitle>
              <CardDescription>
                Confira como os primeiros registros serão importados.
              </CardDescription>
            </CardHeader>
            <CardContent className="overflow-x-auto p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>E-mail</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Mensagem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.slice(0, 5).map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className={mapping.name === 'none' ? 'text-slate-300' : ''}>
                        {mapping.name !== 'none' ? row[mapping.name] : '-'}
                      </TableCell>
                      <TableCell className={mapping.email === 'none' ? 'text-slate-300' : ''}>
                        {mapping.email !== 'none' ? row[mapping.email] : '-'}
                      </TableCell>
                      <TableCell className={mapping.phone === 'none' ? 'text-slate-300' : ''}>
                        {mapping.phone !== 'none' ? row[mapping.phone] : '-'}
                      </TableCell>
                      <TableCell
                        className={
                          mapping.message === 'none' ? 'text-slate-300' : 'max-w-xs truncate'
                        }
                      >
                        {mapping.message !== 'none' ? row[mapping.message] : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-slate-500 py-8">
                        Nenhum dado encontrado no arquivo.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
            <CardFooter className="bg-slate-50 py-4 border-t flex justify-end gap-3">
              <Button variant="outline" onClick={() => setFile(null)}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!isMappingValid || rows.length === 0}>
                Importar {rows.length} Leads
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}

      {(importing || importStats) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              {importing ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-5 h-5 text-green-500" />
              )}
              {importing ? 'Importando Leads...' : 'Importação Concluída'}
            </CardTitle>
            <CardDescription>
              {importStats?.success || 0} de {importStats?.total || rows.length} registros
              processados.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Progress value={progress} className="h-2" />

            {!importing && importStats && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
                    <div className="text-sm font-medium mb-1">Sucesso</div>
                    <div className="text-3xl font-bold">{importStats.success}</div>
                  </div>
                  <div className="bg-slate-50 text-slate-700 p-4 rounded-lg border border-slate-100">
                    <div className="text-sm font-medium mb-1">Erros</div>
                    <div className="text-3xl font-bold">{importStats.errors.length}</div>
                  </div>
                </div>

                {importStats.errors.length > 0 && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Alguns registros falharam</AlertTitle>
                    <AlertDescription className="mt-2 max-h-40 overflow-y-auto">
                      <ul className="list-disc pl-4 space-y-1 text-sm">
                        {importStats.errors.map((err, i) => (
                          <li key={i}>{err}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
          {!importing && (
            <CardFooter className="bg-slate-50 py-4 border-t">
              <Button asChild className="w-full">
                <Link to="/admin/leads">Voltar para Leads</Link>
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  )
}
