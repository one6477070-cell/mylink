'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { describeError } from '@/lib/misc'
import { getStore } from '@/lib/store'
import type { MapStore } from '@/lib/store/types'
import type { MapData, Person } from '@/lib/types'
import { FullscreenMessage, JoinGate, SignInGate } from './gates'
import MapView from './map-view'

/**
 * 지도에 들어가는 순서: 저장소 준비 → 로그인 → 멤버 확인(초대 코드) → 지도 받기.
 * 체험 모드는 로그인과 멤버 확인을 바로 통과한다.
 */
export default function MapScreen({ demo }: { demo: boolean }) {
  const [store, setStore] = useState<MapStore | null>(null)
  const [user, setUser] = useState<Person | null | undefined>(undefined)
  const [membership, setMembership] = useState<{ uid: string; ok: boolean } | null>(null)
  const [map, setMap] = useState<{ uid: string; data: MapData } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    getStore(demo ? 'demo' : 'auto').then(
      (s) => alive && setStore(s),
      (e) => alive && setError(describeError(e)),
    )
    return () => {
      alive = false
    }
  }, [demo])

  useEffect(() => {
    if (!store) return
    return store.watchUser(setUser)
  }, [store])

  useEffect(() => {
    if (!store || !user) return
    let alive = true
    store.isMember(user).then(
      (ok) => alive && setMembership({ uid: user.uid, ok }),
      (e) => alive && setError(describeError(e)),
    )
    return () => {
      alive = false
    }
  }, [store, user])

  const uid = user?.uid ?? null
  const memberKnown = uid !== null && membership?.uid === uid
  const isMember = memberKnown && membership.ok

  useEffect(() => {
    if (!store || !uid || !isMember) return
    return store.watchMap(
      (data) => setMap({ uid, data }),
      (e) => setError(describeError(e)),
    )
  }, [store, uid, isMember])

  if (error) {
    return (
      <FullscreenMessage
        title="지도"
        body={error}
        action={
          <Button variant="outline" onClick={() => window.location.reload()}>
            다시 불러오기
          </Button>
        }
      />
    )
  }
  if (!store || user === undefined) return <FullscreenMessage title="지도" body="지도를 펼치는 중이에요." />
  if (user === null) return <SignInGate store={store} />
  if (!memberKnown) return <FullscreenMessage title="지도" body="팀 멤버인지 확인하는 중이에요." />
  if (!isMember) {
    return <JoinGate store={store} user={user} onJoined={() => setMembership({ uid: user.uid, ok: true })} />
  }
  if (!map || map.uid !== user.uid) return <FullscreenMessage title="지도" body="지도를 펼치는 중이에요." />

  const notice =
    store.mode === 'demo' && !demo
      ? '아직 Firebase를 연결하지 않아서 체험 모드로 열렸어요. 이 브라우저에만 저장되고, 다른 사람은 볼 수 없어요.'
      : undefined

  return <MapView store={store} user={user} data={map.data} notice={notice} />
}
