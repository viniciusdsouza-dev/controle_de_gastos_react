import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, query, orderBy, where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transacao, Meta, Config } from '../types'

// ── TRANSAÇÕES ────────────────────────────────────────────────────────────────

export async function getTransacoes(uid: string): Promise<Transacao[]> {
  try {
    const q = query(
      collection(db, 'usuarios', uid, 'transacoes'),
      orderBy('data', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao))
  } catch (e) {
    console.error('getTransacoes error:', e)
    return []
  }
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
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'metas'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Meta))
  } catch (e) {
    console.error('getMetas error:', e)
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
  } catch (e) {
    console.error('saveMeta error:', e)
  }
}

export async function deleteMeta(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'metas', id))
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

export async function getConfig(uid: string): Promise<Config> {
  try {
    const snap = await getDoc(doc(db, 'usuarios', uid, 'config', 'geral'))
    if (snap.exists()) return snap.data() as Config
  } catch (e) {
    console.error('getConfig error:', e)
  }
  return { ajusteSaldo: 0, modoSaldo: 'mes' }
}

export async function saveConfig(uid: string, config: Partial<Config>) {
  try {
    await setDoc(doc(db, 'usuarios', uid, 'config', 'geral'), config, { merge: true })
  } catch (e) {
    console.error('saveConfig error:', e)
  }
}
