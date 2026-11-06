'use client'

import dynamic from 'next/dynamic'
import { FullscreenMessage } from './gates'

// 지도는 브라우저(canvas, localStorage, Firebase)에서만 돈다
const MapScreen = dynamic(() => import('./map-screen'), {
  ssr: false,
  loading: () => <FullscreenMessage title="지도" body="지도를 펼치는 중이에요." />,
})

export default function MapLoader({ demo = false }: { demo?: boolean }) {
  return <MapScreen demo={demo} />
}
