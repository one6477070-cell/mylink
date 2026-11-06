'use client'

import Link from 'next/link'
import { useState, type FormEvent, type ReactNode } from 'react'
import { Tape } from '@/components/tape'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { describeError, detectInAppBrowser, openInExternalBrowserFromKakao } from '@/lib/misc'
import type { MapStore } from '@/lib/store/types'
import type { Person } from '@/lib/types'

function GateFrame({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="floor-grid min-h-dvh">
      <div className="max-w-[28rem] px-6 pt-[18vh] lg:pl-[7vw]">
        <h1>
          <Tape className="-rotate-2 text-[2.75rem]">{title}</Tape>
        </h1>
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </main>
  )
}

export function FullscreenMessage({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <GateFrame title={title}>
      <p role="status" className="leading-relaxed text-chalk-dim">
        {body}
      </p>
      {action}
    </GateFrame>
  )
}

export function SignInGate({ store }: { store: MapStore }) {
  const [inApp] = useState(() => detectInAppBrowser(navigator.userAgent))
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const [copied, setCopied] = useState(false)

  const signIn = async () => {
    setPending(true)
    setError(null)
    try {
      await store.signIn()
    } catch (e) {
      setError(describeError(e))
    } finally {
      setPending(false)
    }
  }

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <GateFrame title="팀 지도">
      <p className="leading-relaxed text-chalk">
        팀 지도는 초대받은 멤버만 볼 수 있어요. 구글 계정으로 로그인해 주세요.
      </p>

      {inApp && (
        <div className="rounded-lg border border-floor-line bg-floor-raised p-4 text-[15px] leading-relaxed">
          <p className="text-chalk">
            {inApp === 'kakaotalk'
              ? '카카오톡 안에서 열린 화면이라 구글 로그인이 막혀 있어요.'
              : '앱 안에서 열린 화면이라 구글 로그인이 막혀 있어요.'}
          </p>
          <p className="mt-1 text-chalk-dim">
            {inApp === 'kakaotalk'
              ? '아래 버튼을 눌러 기본 브라우저에서 열어 주세요.'
              : '오른쪽 위 메뉴에서 ‘다른 브라우저로 열기’를 누르거나, 주소를 복사해 사파리나 크롬에 붙여 넣어 주세요.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {inApp === 'kakaotalk' && (
              <Button size="sm" onClick={() => openInExternalBrowserFromKakao(window.location.href)}>
                기본 브라우저로 열기
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={copyAddress}>
              {copied ? '주소를 복사했어요' : '주소 복사'}
            </Button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-3 pt-2">
        <Button size="lg" variant={inApp ? 'outline' : 'tape'} onClick={signIn} disabled={pending}>
          {pending ? '로그인 창을 여는 중' : 'Google로 로그인'}
        </Button>
        <Link href="/demo" className={buttonVariants({ variant: 'ghost', size: 'lg' })}>
          로그인 없이 체험하기
        </Link>
      </div>
      {error && (
        <p role="alert" className="text-[15px] leading-relaxed text-destructive">
          {error}
        </p>
      )}
    </GateFrame>
  )
}

export function JoinGate({ store, user, onJoined }: { store: MapStore; user: Person; onJoined: () => void }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setPending(true)
    setError(null)
    try {
      await store.join(user, code)
      onJoined()
    } catch (err) {
      const denied = typeof err === 'object' && err && 'code' in err && err.code === 'permission-denied'
      setError(denied ? '코드가 맞지 않아요. 팀에서 받은 코드를 다시 확인해 주세요.' : describeError(err))
    } finally {
      setPending(false)
    }
  }

  return (
    <GateFrame title="초대 코드">
      <p className="leading-relaxed text-chalk">
        {user.name}님, 팀에서 받은 초대 코드를 적어 주세요. 처음 한 번만 적으면 돼요.
      </p>
      <form onSubmit={submit} className="flex gap-2">
        <Input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="초대 코드"
          aria-label="초대 코드"
          autoComplete="off"
          autoFocus
        />
        <Button type="submit" disabled={pending || !code.trim()}>
          들어가기
        </Button>
      </form>
      {error && (
        <p role="alert" className="text-[15px] leading-relaxed text-destructive">
          {error}
        </p>
      )}
      <Button variant="ghost" size="sm" onClick={() => void store.signOut()}>
        다른 계정으로 로그인
      </Button>
    </GateFrame>
  )
}
