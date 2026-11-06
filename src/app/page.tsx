import Link from 'next/link'
import { FloorIllustration } from '@/components/landing/floor-illustration'
import { Tape } from '@/components/tape'
import { buttonVariants } from '@/components/ui/button'

const VERBS = [
  {
    term: '던지기',
    text: '키워드나 생각을 하나씩 바닥에 붙여요. 같은 키워드는 누가 던져도 한 자리에 모여요.',
  },
  {
    term: '잇기',
    text: '두 조각을 이으면 이은 사람의 색으로 선이 남아요. 같은 키워드에서 사람마다 갈라지는 시선이 보여요.',
  },
  {
    term: '쌓기',
    text: '링크 하나로 팀 누구나 들어오고, 회의가 끝나도 지도는 그대로 남아요.',
  },
]

export default function Home() {
  return (
    <main className="floor-grid relative min-h-dvh overflow-hidden">
      <FloorIllustration className="pointer-events-none relative -ml-[2%] mt-4 block h-auto w-[112%] select-none lg:absolute lg:right-[-5vw] lg:top-[7vh] lg:m-0 lg:w-[min(60vw,980px)]" />

      <div className="relative z-10 max-w-[32rem] px-6 pb-16 lg:pl-[7vw] lg:pt-[19vh]">
        <h1 className="mt-2 lg:mt-0">
          <Tape className="lay-in -rotate-2 whitespace-nowrap text-[clamp(3.5rem,9vw,6.5rem)]">연결 지도</Tape>
        </h1>
        <p className="mt-7 text-[clamp(1.25rem,2.4vw,1.625rem)] font-medium leading-snug text-chalk">
          공연팀이 생각과 키워드를 던지고, 잇고, 쌓아 두는 지도예요.
        </p>
        <p className="mt-3 leading-relaxed text-chalk-dim">
          줄글 문서에서는 흩어지던 생각이 여기서는 나란히 놓이고, 서로 이어지고, 남아요.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <Link href="/map" className={buttonVariants({ size: 'lg' })}>
            팀 지도 열기
          </Link>
          <Link href="/demo" className={buttonVariants({ variant: 'outline', size: 'lg' })}>
            로그인 없이 체험하기
          </Link>
        </div>

        <dl className="mt-14 grid gap-5">
          {VERBS.map((v) => (
            <div key={v.term} className="grid grid-cols-[4rem_1fr] gap-4">
              <dt className="font-semibold text-chalk">{v.term}</dt>
              <dd className="leading-relaxed text-chalk-dim">{v.text}</dd>
            </div>
          ))}
        </dl>

        <p className="mt-12 text-sm text-chalk-dim">팀 지도는 초대 코드를 받은 멤버만 볼 수 있어요.</p>
      </div>
    </main>
  )
}
