/**
 * Detecção de bandeira de cartão a partir do BIN.
 * Usada apenas para escolher o campo "method" do iPag — nunca expõe
 * dados sensíveis do cartão.
 */
export function detectCardBrand(number: string): string {
  const cleanNumber = (number || '').replace(/\D/g, '')

  // Faixas Elo co-branded iniciando em 4 (BIN de 6 dígitos confirmado)
  const elo4Prefixes = [
    '401178',
    '401179',
    '431274',
    '438935',
    '451416',
    '457393',
    '457631',
    '457632',
  ]

  // Faixas Elo iniciando em 5 ou 6
  const eloOtherPrefixes = [
    '504175',
    '5067',
    '509',
    '627780',
    '636297',
    '636368',
    '636369',
    '650',
    '6516',
    '6550',
  ]

  if (elo4Prefixes.some((prefix) => cleanNumber.startsWith(prefix))) {
    return 'elo'
  }
  if (cleanNumber.startsWith('4')) {
    return 'visa'
  }
  if (eloOtherPrefixes.some((prefix) => cleanNumber.startsWith(prefix))) {
    return 'elo'
  }
  if (cleanNumber.startsWith('6')) {
    return 'elo'
  }
  if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) {
    return 'mastercard'
  }
  if (cleanNumber.startsWith('3')) {
    return 'amex'
  }
  return 'visa'
}
