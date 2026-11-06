import type { Metadata } from 'next'
import MapLoader from '@/components/map/map-loader'

export const metadata: Metadata = {
  title: '체험 지도',
  description: '로그인 없이 써 보는 연결 지도. 이 브라우저에만 저장돼요.',
}

export default function DemoMapPage() {
  return <MapLoader demo />
}
