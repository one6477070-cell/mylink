/**
 * Firebase 웹 앱 설정값. 값은 코드에 넣지 않고 .env.local(내 컴퓨터)과
 * Vercel 환경 변수에만 둔다. 웹 설정값은 원래 브라우저에 공개되는 값이고,
 * 실제 보호는 firestore.rules(보안 규칙)가 맡는다.
 */
export const firebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
}

/** 설정값이 없으면 사이트 전체가 체험 모드(브라우저에만 저장)로 돈다 */
export const hasFirebase = Boolean(
  firebaseOptions.apiKey && firebaseOptions.projectId && firebaseOptions.appId,
)

/** 작품(공간) id. 1단계는 main 하나, 4단계에서 작품별로 나눈다 */
export const SPACE_ID = process.env.NEXT_PUBLIC_SPACE_ID || 'main'
