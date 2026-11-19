export const PUBLIC_URL = 'https://www.educacaosst.com.br'

export const BACKEND_URL =
  import.meta.env.VITE_BACKEND_URL ||
  'https://educacao-sst-premium-969c2.shrd00.internal.goskip.dev'

export const getSharePreviewUrl = (type: string, id: string) =>
  `${BACKEND_URL}/backend/v1/share/${type}/${id}`

export const getOgPreviewUrl = (path: string) =>
  `${BACKEND_URL}/backend/v1/og-preview?path=${encodeURIComponent(path)}`
