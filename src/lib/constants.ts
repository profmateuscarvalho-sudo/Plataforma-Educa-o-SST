export const PUBLIC_URL = 'https://www.educacaosst.com.br'
export const BACKEND_URL = import.meta.env.VITE_POCKETBASE_URL

export const getSharePreviewUrl = (type: string, id: string) =>
  `${BACKEND_URL}/backend/v1/share/${type}/${id}`
