# 연결 지도 (mylink)

공연팀이 생각과 키워드를 던지고, 잇고, 쌓아 두는 지도예요. 수업 과제(마이링크)로 시작한 공동창작 도구이고, 기획은 [PRD.md](./PRD.md)에 있어요.

## 지금 되는 것 (1단계)

- 키워드나 생각을 던지면 지도에 조각으로 붙어요. 같은 키워드는 누가 던져도 한 자리로 모여요.
- 생각 안에 `[[키워드]]`를 쓰면 그 키워드와 저절로 이어져요.
- 두 조각을 이으면 이은 사람의 색으로 선이 남아요.
- 조각 찾기, 전체 보기, 아무도 잇지 않은 외딴 조각 보기
- 구글 로그인과 초대 코드로 팀 멤버만 보기 (Firebase를 연결해야 켜져요)
- 로그인 없이 써 보는 체험 지도 `/demo`

## 내 컴퓨터에서 실행하기

[Node.js](https://nodejs.org) LTS가 있어야 해요.

- 쉬운 방법: Finder에서 `개발서버 실행.command`를 더블클릭해요. 처음에는 필요한 파일을 내려받느라 1~2분 걸리고, 서버가 켜지면 브라우저가 저절로 열려요.
- 터미널로: 이 폴더에서 `npm install`(처음 한 번만) 다음 `npm run dev`. 브라우저에서 http://localhost:3000 을 열어요.

끄려면 서버가 돌고 있는 터미널 창에서 Control+C를 눌러요.

| 주소 | 내용 |
| --- | --- |
| `/` | 소개 |
| `/map` | 팀 지도 (Firebase 연결 전에는 체험 모드로 열려요) |
| `/demo` | 체험 지도. 이 브라우저에만 저장돼요 |

## Firebase 연결하기 (팀 모드)

콘솔에서 누르는 일은 직접 하고, 코드는 이미 들어가 있어요.

1. https://console.firebase.google.com 에서 프로젝트를 만들어요. 애널리틱스는 꺼도 돼요.
2. 프로젝트 설정(톱니바퀴) → 내 앱 → 웹 앱(`</>`) 추가 → 나오는 설정값을 복사해요.
3. 이 폴더의 `.env.example`을 복사해서 `.env.local`을 만들고, 설정값을 이름에 맞춰 채워요.
4. Authentication → 시작하기 → 로그인 방법 → Google 사용 설정 → 저장
5. Firestore Database → 데이터베이스 만들기 → 위치 `asia-northeast3`(서울). 시작 모드는 아무거나 골라도 돼요. 바로 다음 단계에서 규칙을 바꿔요.
6. Firestore → 규칙 탭에 `firestore.rules` 내용을 통째로 붙여 넣고 게시해요.
7. 초대 코드 만들기 (Firestore → 데이터 탭)
   - 컬렉션 시작: `spaces` → 문서 ID `main` → 필드 `name`(문자열, 예: 우리 팀)
   - 방금 만든 `main` 문서 안에서 컬렉션 시작: `secrets` → 문서 ID `join` → 필드 `code`(문자열, 팀에 알려 줄 코드)
8. `npm run dev`를 다시 켜고 `/map` → Google로 로그인 → 초대 코드를 적으면 팀 지도가 열려요.

초대 코드를 바꾸면 그 뒤로 들어오는 사람만 새 코드를 써요. 이미 들어온 멤버는 그대로예요.

## 배포하기 (Vercel)

1. GitHub `mylink` 저장소(Public)에 올려요.
2. https://vercel.com → Add New → Project → `mylink` Import → Deploy
3. 팀 모드를 쓰려면: Vercel 프로젝트 → Settings → Environment Variables에 `.env.local`과 같은 값을 넣고 Redeploy
4. Firebase → Authentication → 설정 → 승인된 도메인에 `○○.vercel.app` 주소를 추가해요.

Firebase 값이 없으면 배포된 사이트도 체험 모드로 돌아가요. 과제 제출용 주소는 그 상태로도 열려요.

## 막힐 때

| 증상 | 해결 |
| --- | --- |
| 배포 주소에서 로그인 창이 바로 닫힘 (`auth/unauthorized-domain`) | Authentication → 승인된 도메인에 배포 주소 추가 |
| "권한이 없어요" | `firestore.rules`를 게시했는지, 초대 코드 문서 경로가 `spaces/main/secrets/join`인지 확인 |
| 카카오톡에서 연 링크로 로그인이 안 됨 | 구글이 앱 안 브라우저 로그인을 막아요. 화면의 [기본 브라우저로 열기]를 눌러요 |
| 로컬에선 되는데 배포 주소에선 체험 모드 | Vercel 환경 변수를 넣고 Redeploy |

## 폴더 구조

```text
src/
  app/                    주소별 화면 (/, /map, /demo), manifest, 아이콘
  components/map/         지도 화면: 그래프, 던지기, 조각 패널, 찾기, 범례, 로그인 관문
  components/landing/     첫 화면 그림
  lib/store/              데이터 출입구: 체험(demo-store) / 팀(firebase-store)
  lib/keyword.ts          키워드 합치기 규칙, [[키워드]] 찾기
  lib/graph.ts            지도 계산 (연결 수, 외딴 조각, 사람별 색)
firestore.rules           Firestore 보안 규칙
PRD.md                    기획 문서
CLAUDE.md                 Claude Code 작업 규칙
```

## 사용한 도구

Next.js 16 · React 19 · Tailwind CSS 4 · Firebase(Auth, Firestore) · react-force-graph-2d · Vercel · Claude
