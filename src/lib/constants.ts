export const PUBLIC_URL = 'https://www.educacaosst.com.br'
export const BACKEND_URL = import.meta.env.VITE_POCKETBASE_URL || ''

export const getSharePreviewUrl = (type: string, id: string) =>
  `${BACKEND_URL}/backend/v1/share/${type}/${id}`

export const getOgPreviewUrl = (path: string) =>
  `${BACKEND_URL}/backend/v1/og-preview?path=${encodeURIComponent(path)}`

export const FEATURE_FLAGS = {
  anunciePage: true,
}
