import { getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import {
  GoogleAuthProvider,
  getAuth,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getFirestore,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  setDoc,
  writeBatch,
  type DocumentData,
  type QueryDocumentSnapshot,
} from 'firebase/firestore'
import { THOUGHT_MAX, cleanKeyword, keywordId, keywordKey, linkId, orderPair } from '../keyword'
import type { Fragment, Link, Person } from '../types'
import type { MapStore } from './types'

/*
 * Firestore 구조 (firestore.rules와 함께 바꾼다)
 *
 * spaces/{spaceId}                     작품(공간). 1단계는 main 하나
 *   secrets/join      { code }          초대 코드. 아무도 못 읽음, 콘솔에서 직접 만든다
 *   members/{uid}     { name, code, joinedAt }
 *   fragments/{id}    조각. 키워드는 id가 "k:정리된키워드"라서 같은 키워드는 한 문서로 모인다
 *   links/{id}        연결. id = "작은id__큰id__이은사람uid"
 */

const toMs = (v: unknown) =>
  v instanceof Timestamp ? v.toMillis() : typeof v === 'number' ? v : Date.now()

const UNKNOWN: Person = { uid: 'unknown', name: '알 수 없음' }

function toFragment(d: QueryDocumentSnapshot<DocumentData>): Fragment {
  const v = d.data({ serverTimestamps: 'estimate' })
  return {
    id: d.id,
    kind: v.kind === 'thought' ? 'thought' : 'keyword',
    text: String(v.text ?? ''),
    key: typeof v.key === 'string' ? v.key : null,
    createdBy: v.createdBy ?? UNKNOWN,
    createdAt: toMs(v.createdAt),
    updatedAt: toMs(v.updatedAt),
    throwers: v.throwers ?? {},
  }
}

function toLink(d: QueryDocumentSnapshot<DocumentData>): Link {
  const v = d.data({ serverTimestamps: 'estimate' })
  return {
    id: d.id,
    a: String(v.a),
    b: String(v.b),
    createdBy: v.createdBy ?? UNKNOWN,
    createdAt: toMs(v.createdAt),
  }
}

/** 팀 모드: 구글 로그인 + Firestore. 팀 자료는 초대 코드로 들어온 멤버만 본다 */
export function createFirebaseStore(options: FirebaseOptions, spaceId: string): MapStore {
  const app = getApps()[0] ?? initializeApp(options)
  const auth = getAuth(app)
  const db = getFirestore(app)

  const fragmentsCol = collection(db, 'spaces', spaceId, 'fragments')
  const linksCol = collection(db, 'spaces', spaceId, 'links')
  const memberRef = (uid: string) => doc(db, 'spaces', spaceId, 'members', uid)

  // 조각을 지울 때 내가 이은 선을 찾기 위해 마지막으로 받은 연결 목록을 들고 있는다
  let latestLinks: Link[] = []

  return {
    mode: 'team',

    watchUser(cb) {
      return onAuthStateChanged(auth, (u) =>
        cb(
          u
            ? { uid: u.uid, name: u.displayName?.trim() || u.email?.split('@')[0] || '이름 없음' }
            : null,
        ),
      )
    },
    async signIn() {
      const provider = new GoogleAuthProvider()
      provider.setCustomParameters({ prompt: 'select_account' })
      await signInWithPopup(auth, provider)
    },
    async signOut() {
      await firebaseSignOut(auth)
    },

    async isMember(user) {
      return (await getDoc(memberRef(user.uid))).exists()
    },
    async join(user, code) {
      // 코드가 맞는지는 보안 규칙이 secrets/join과 비교해서 판단한다
      await setDoc(memberRef(user.uid), {
        name: user.name,
        code: code.trim(),
        joinedAt: serverTimestamp(),
      })
    },

    watchMap(cb, onError) {
      let fragments: Fragment[] | null = null
      let links: Link[] | null = null
      const push = () => {
        if (fragments && links) cb({ fragments, links })
      }
      const stopFragments = onSnapshot(
        fragmentsCol,
        (s) => {
          fragments = s.docs.map(toFragment)
          push()
        },
        onError,
      )
      const stopLinks = onSnapshot(
        linksCol,
        (s) => {
          links = s.docs.map(toLink)
          latestLinks = links
          push()
        },
        onError,
      )
      return () => {
        stopFragments()
        stopLinks()
      }
    },

    async addKeyword(user, raw, opts) {
      const text = cleanKeyword(raw)
      const key = keywordKey(text)
      if (!key) throw new Error('키워드를 적어 주세요.')
      const id = keywordId(text)
      const ref = doc(fragmentsCol, id)
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(ref)
        if (!snap.exists()) {
          tx.set(ref, {
            kind: 'keyword',
            text,
            key,
            createdBy: user,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            throwers: { [user.uid]: user.name },
            lastThrownAt: serverTimestamp(),
          })
          return
        }
        const throwers = (snap.data().throwers ?? {}) as Record<string, string>
        if (opts?.asThrower !== false && !(user.uid in throwers)) {
          tx.update(ref, { [`throwers.${user.uid}`]: user.name, lastThrownAt: serverTimestamp() })
        }
      })
      return id
    },

    async addThought(user, raw) {
      const text = raw.trim().slice(0, THOUGHT_MAX)
      if (!text) throw new Error('생각을 적어 주세요.')
      const ref = doc(fragmentsCol)
      await setDoc(ref, {
        kind: 'thought',
        text,
        key: null,
        createdBy: user,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        throwers: { [user.uid]: user.name },
      })
      return ref.id
    },

    async connect(user, a, b) {
      if (a === b) throw new Error('같은 조각끼리는 이을 수 없어요.')
      const [x, y] = orderPair(a, b)
      await setDoc(doc(linksCol, linkId(a, b, user.uid)), {
        a: x,
        b: y,
        createdBy: user,
        createdAt: serverTimestamp(),
      })
    },

    async disconnect(user, id) {
      const link = latestLinks.find((l) => l.id === id)
      if (link && link.createdBy.uid !== user.uid) throw new Error('내가 이은 선만 끊을 수 있어요.')
      await deleteDoc(doc(linksCol, id))
    },

    async removeFragment(user, id) {
      const batch = writeBatch(db)
      batch.delete(doc(fragmentsCol, id))
      for (const l of latestLinks) {
        if ((l.a === id || l.b === id) && l.createdBy.uid === user.uid) {
          batch.delete(doc(linksCol, l.id))
        }
      }
      await batch.commit()
    },
  }
}
