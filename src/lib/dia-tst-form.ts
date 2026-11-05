// Máscara e validação de WhatsApp ((00) 00000-0000) para o formulário da campanha.
export function formatarWhatsApp(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
}

export function validarWhatsApp(valorMascarado: string): boolean {
  const d = valorMascarado.replace(/\D/g, '')
  // 10 ou 11 dígitos (DDD + telefone); o hook aceita 10–13 por robustez.
  return d.length === 10 || d.length === 11
}
