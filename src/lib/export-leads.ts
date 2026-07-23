import type { Lead } from '@/types'

function escapeCsvValue(value: string): string {
  if (!value) return ''
  if (value.includes(',') || value.includes('"') || value.includes('\n') || value.includes('\r')) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function exportLeadsToCsv(leads: Lead[]): void {
  const headers = ['nome', 'email', 'telefone', 'mensagem', 'criado em']
  const rows = leads.map((l) => {
    const createdAt = l.created ? new Date(l.created).toLocaleString('pt-BR') : ''
    return [
      escapeCsvValue(l.name || ''),
      escapeCsvValue(l.email || ''),
      escapeCsvValue(l.phone || ''),
      escapeCsvValue(l.message || ''),
      escapeCsvValue(createdAt),
    ].join(',')
  })

  const csvContent = '\uFEFF' + headers.join(',') + '\n' + rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const filename = `leads_export_${dateStr}.csv`

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
