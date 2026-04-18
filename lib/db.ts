import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, query, orderBy, where,
  serverTimestamp, Timestamp,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transacao, Meta, Config } from '../types'

// ── TRANSAÇÕES ────────────────────────────────────────────────────────────────

export async function getTransacoes(uid: string): Promise<Transacao[]> {
  const q = query(
    collection(db, 'usuarios', uid, 'transacoes'),
    orderBy('data', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao))
}

export async function addTransacao(uid: string, t: Omit<Transacao, 'id' | 'criadoEm'>) {
  await addDoc(collection(db, 'usuarios', uid, 'transacoes'), {
    ...t,
    criadoEm: Date.now(),
  })
}

export async function updateTransacao(uid: string, id: string, t: Partial<Transacao>) {
  await updateDoc(doc(db, 'usuarios', uid, 'transacoes', id), t as Record<string, unknown>)
}

export async function deleteTransacao(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'transacoes', id))
}

// ── METAS ─────────────────────────────────────────────────────────────────────

export async function getMetas(uid: string): Promise<Meta[]> {
  const snap = await getDocs(collection(db, 'usuarios', uid, 'metas'))
  return snap.docs.map(d => ({ id: d.id, ...d.data() } as Meta))
}

export async function saveMeta(uid: string, meta: Omit<Meta, 'id'>) {
  // Upsert por categoria+mes
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
}

export async function deleteMeta(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'metas', id))
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

export async function getConfig(uid: string): Promise<Config> {
  const snap = await getDoc(doc(db, 'usuarios', uid, 'config', 'geral'))
  if (snap.exists()) return snap.data() as Config
  return { ajusteSaldo: 0, modoSaldo: 'mes' }
}

export async function saveConfig(uid: string, config: Partial<Config>) {
  await setDoc(doc(db, 'usuarios', uid, 'config', 'geral'), config, { merge: true })
}
