import type { Metadata } from 'next'
import MapLoader from '@/components/map/map-loader'

export const metadata: Metadata = { title: '팀 지도' }

export default function TeamMapPage() {
  return <MapLoader />
}
