import pb from '@/lib/pocketbase/client'
import { Banner } from '@/types'

export const getBanners = () => pb.collection('banners').getFullList<Banner>({ sort: '-created' })

export const getActiveBanners = () =>
  pb.collection('banners').getFullList<Banner>({ filter: 'active=true', sort: '-created' })

export const getBannersByLocation = (location: string) =>
  pb.collection('banners').getFullList<Banner>({
    filter: `active=true && location="${location}"`,
    sort: '-created',
  })

export const createBanner = (data: FormData) => pb.collection('banners').create<Banner>(data)

export const updateBanner = (id: string, data: FormData) =>
  pb.collection('banners').update<Banner>(id, data)

export const deleteBanner = (id: string) => pb.collection('banners').delete(id)
