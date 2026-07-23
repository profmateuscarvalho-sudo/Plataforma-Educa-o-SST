import type { Lead } from '@/types'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function exportLeadsToExcel(leads: Lead[]): void {
  const headers = ['Nome', 'E-mail', 'Telefone', 'Mensagem', 'Data de Criação']

  const headerStyle =
    'background-color:#1e3a5f;color:#ffffff;font-weight:bold;border:1px solid #1e3a5f;text-align:left;padding:6px;font-family:Calibri,Arial,sans-serif;font-size:11pt;'

  const dataCellStyle =
    'border:1px solid #d0d0d0;padding:6px;font-family:Calibri,Arial,sans-serif;font-size:10pt;text-align:left;mso-number-format:"\\@";'
  const altRowStyle =
    'background-color:#e8eef5;border:1px solid #d0d0d0;padding:6px;font-family:Calibri,Arial,sans-serif;font-size:10pt;text-align:left;mso-number-format:"\\@";'

  const headerRow = `<tr>${headers
    .map((h) => `<td style="${headerStyle}">${escapeHtml(h)}</td>`)
    .join('')}</tr>`

  const dataRows = leads
    .map((l, index) => {
      const createdAt = l.created ? new Date(l.created).toLocaleString('pt-BR') : ''
      const cells = [l.name || '', l.email || '', l.phone || '', l.message || '', createdAt]
      const rowStyle = index % 2 === 1 ? altRowStyle : dataCellStyle
      return `<tr>${cells
        .map((c) => `<td style="${rowStyle}">${escapeHtml(c)}</td>`)
        .join('')}</tr>`
    })
    .join('')

  const colWidths = headers.map((_, i) => {
    const maxLen = Math.max(
      headers[i].length,
      ...leads.map((l) => {
        const vals = [l.name || '', l.email || '', l.phone || '', l.message || '']
        const dateStr = l.created ? new Date(l.created).toLocaleString('pt-BR') : ''
        vals.push(dateStr)
        return (vals[i] || '').length
      }),
    )
    return Math.min(Math.max(maxLen * 8 + 20, 80), 600)
  })

  const colgroup = `<colgroup>${colWidths.map((w) => `<col width="${w}">`).join('')}</colgroup>`

  const table = `<table border="1" cellspacing="0" cellpadding="0" style="border-collapse:collapse;">${colgroup}${headerRow}${dataRows}</table>`

  const html = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"><!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Leads</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions><x:AutoFilter x:Range="R1C1:R1C5" xmlns="urn:schemas-microsoft-com:office:excel"></x:AutoFilter></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]--></head><body>${table}</body></html>`

  const blob = new Blob(['\uFEFF' + html], { type: 'application/vnd.ms-excel;charset=utf-8;' })

  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const filename = `leads_export_${dateStr}.xls`

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
