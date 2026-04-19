import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, query, orderBy, where,
  enableIndexedDbPersistence,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transacao, Meta, Config } from '../types'

// ── CACHE LOCAL ───────────────────────────────────────────────────────────────
// Habilita cache offline do Firestore (persiste entre sessões)
if (typeof window !== 'undefined') {
  enableIndexedDbPersistence(db).catch(() => {})
}

const CACHE_TTL = 30_000 // 30s em ms
const _cache: Record<string, { data: unknown; ts: number }> = {}

function cacheGet<T>(key: string): T | null {
  const hit = _cache[key]
  if (hit && Date.now() - hit.ts < CACHE_TTL) return hit.data as T
  return null
}
function cacheSet(key: string, data: unknown) {
  _cache[key] = { data, ts: Date.now() }
}
function cacheInvalidate(prefix: string) {
  Object.keys(_cache).filter(k => k.startsWith(prefix)).forEach(k => delete _cache[k])
}

// ── TRANSAÇÕES ────────────────────────────────────────────────────────────────

export async function getTransacoes(uid: string): Promise<Transacao[]> {
  const key = `transacoes:${uid}`
  const cached = cacheGet<Transacao[]>(key)
  if (cached) return cached

  try {
    const q = query(
      collection(db, 'usuarios', uid, 'transacoes'),
      orderBy('data', 'desc')
    )
    const snap = await getDocs(q)
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao))
    cacheSet(key, data)
    return data
  } catch (e) {
    console.error('getTransacoes:', e)
    return []
  }
}

export async function addTransacao(uid: string, t: Omit<Transacao, 'id' | 'criadoEm'>) {
  await addDoc(collection(db, 'usuarios', uid, 'transacoes'), {
    ...t, criadoEm: Date.now(),
  })
  cacheInvalidate(`transacoes:${uid}`)
}

export async function updateTransacao(uid: string, id: string, t: Partial<Transacao>) {
  await updateDoc(doc(db, 'usuarios', uid, 'transacoes', id), t as Record<string, unknown>)
  cacheInvalidate(`transacoes:${uid}`)
}

export async function deleteTransacao(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'transacoes', id))
  cacheInvalidate(`transacoes:${uid}`)
}

// ── METAS ─────────────────────────────────────────────────────────────────────

export async function getMetas(uid: string): Promise<Meta[]> {
  const key = `metas:${uid}`
  const cached = cacheGet<Meta[]>(key)
  if (cached) return cached

  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'metas'))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Meta))
    cacheSet(key, data)
    return data
  } catch (e) {
    console.error('getMetas:', e)
    return []
  }
}

export async function saveMeta(uid: string, meta: Omit<Meta, 'id'>) {
  try {
    const q = query(
      collection(db, 'usuarios', uid, 'metas'),
      where('categoria', '==', meta.categoria),
      where('mes', '==', meta.mes)
    )
    const snap = await getDocs(q)
    if (!snap.empty) {
      await updateDoc(snap.docs[0].ref, { limite: meta.limite })
    } else {
      await addDoc(collection(db, 'usuarios', uid, 'metas'), meta)
    }
    cacheInvalidate(`metas:${uid}`)
  } catch (e) {
    console.error('saveMeta:', e)
  }
}

export async function deleteMeta(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'metas', id))
  cacheInvalidate(`metas:${uid}`)
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

export async function getConfig(uid: string): Promise<Config> {
  const key = `config:${uid}`
  const cached = cacheGet<Config>(key)
  if (cached) return cached

  try {
    const snap = await getDoc(doc(db, 'usuarios', uid, 'config', 'geral'))
    if (snap.exists()) {
      const data = snap.data() as Config
      cacheSet(key, data)
      return data
    }
  } catch (e) {
    console.error('getConfig:', e)
  }
  return { ajusteSaldo: 0, modoSaldo: 'mes' }
}

export async function saveConfig(uid: string, config: Partial<Config>) {
  try {
    await setDoc(doc(db, 'usuarios', uid, 'config', 'geral'), config, { merge: true })
    cacheInvalidate(`config:${uid}`)
  } catch (e) {
    console.error('saveConfig:', e)
  }
}
