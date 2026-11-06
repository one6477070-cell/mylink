@AGENTS.md

# 작업 규칙

- 작업 전에 `PRD.md`를 읽고, 7장 체크리스트에서 지금 단계를 기준으로 작업한다.
- 한 번에 기능 하나. 끝나면 `npm run lint`와 `npm run build`가 통과하는지 확인하고, PRD 체크리스트를 고친다.
- 화면 문구는 한국어 해요체. 같은 동작은 끝까지 같은 말로 부른다: 던지기 → 던졌어요, 잇기 → 이었어요, 끊기 → 끊었어요, 지우기 → 지웠어요.

# 구조

- `src/lib/store/types.ts`의 `MapStore`가 데이터의 유일한 출입구다. 화면 컴포넌트에서 Firebase를 직접 부르지 않는다.
- 기능을 더하면 `demo-store.ts`(체험, localStorage)와 `firebase-store.ts`(팀, Firestore) 둘 다 구현한다.
- Firestore 경로나 필드를 바꾸면 `firestore.rules`도 같이 바꾸고, README의 Firebase 단계도 맞는지 본다.
- 비밀 키를 코드에 넣지 않는다. Firebase 설정값은 `.env.local`과 Vercel 환경 변수(`NEXT_PUBLIC_*`)에만 둔다.
- 지도 그리기는 `src/components/map/graph-canvas.tsx`. 물리 엔진이 위치를 노드 객체에 적으므로 노드 객체를 캐시해서 다시 쓴다.
- 지도 화면은 `next/dynamic`의 `ssr: false`로 브라우저에서만 그린다 (`map-loader.tsx`).

# 디자인 메모

- 바탕: 블랙박스 극장의 검은 바닥(`#1e1e20`) + 무대 평면도 격자. 중심선은 두지 않는다 (중심 없는 지도).
- 키워드 = 흰 테이프(`#f0eee6`)에 마커 글씨(Yeon Sung). 생각 = 타자 친 쪽지(IBM Plex Sans KR), 왼쪽 띠는 쓴 사람의 색.
- 색은 '누가'를 뜻할 때만 쓴다 (`src/lib/colors.ts`의 테이프 8색). 선택은 색 대신 흰 스포트라이트와 흰 테두리.
- 외딴 조각은 점선 테이프: 아직 붙이지 않은 자리.
- 화면은 왼쪽 정렬. 가운데로 몰지 않는다.
- 시도해 본 것: Gaegu는 마커 느낌이 좋지만 '기', '빈'처럼 좁은 글자 뒤 간격이 벌어져서 Yeon Sung으로 바꿨다.

# 명령어

```bash
npm run dev     # http://localhost:3000
npm run lint
npm run build
```
