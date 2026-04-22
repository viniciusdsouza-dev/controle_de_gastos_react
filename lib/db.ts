import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, query, where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transacao, Meta, Config } from '../types'

// ── TRANSAÇÕES ────────────────────────────────────────────────────────────────

export async function getTransacoes(uid: string): Promise<Transacao[]> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'transacoes'))
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transacao))
    // Ordenar no cliente para evitar necessidade de índice composto
    return data.sort((a, b) => b.data.localeCompare(a.data))
  } catch (e) {
    console.error('getTransacoes:', e)
    return []
  }
}

export async function addTransacao(uid: string, t: Omit<Transacao, 'id' | 'criadoEm'>) {
  await addDoc(collection(db, 'usuarios', uid, 'transacoes'), {
    ...t, criadoEm: Date.now(),
  })
}

export async function updateTransacao(uid: string, id: string, t: Partial<Transacao>) {
  await updateDoc(
    doc(db, 'usuarios', uid, 'transacoes', id),
    t as Record<string, unknown>
  )
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
  } catch (e) {
    console.error('saveMeta:', e)
  }
}

export async function deleteMeta(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'metas', id))
}

// ── CONFIG ────────────────────────────────────────────────────────────────────

export async function getConfig(uid: string): Promise<Config> {
  try {
    const snap = await getDoc(doc(db, 'usuarios', uid, 'config', 'geral'))
    if (snap.exists()) {
      const raw = snap.data()
      return {
        ajusteSaldo: isNaN(Number(raw.ajusteSaldo)) ? 0 : Number(raw.ajusteSaldo),
        modoSaldo: raw.modoSaldo || 'mes',
      }
    }
  } catch (e) {
    console.error('getConfig:', e)
  }
  return { ajusteSaldo: 0, modoSaldo: 'mes' }
}

export async function saveConfig(uid: string, config: Partial<Config>) {
  try {
    const sanitized = {
      ...config,
      ...(config.ajusteSaldo !== undefined
        ? { ajusteSaldo: isNaN(Number(config.ajusteSaldo)) ? 0 : Number(config.ajusteSaldo) }
        : {}),
    }
    await setDoc(
      doc(db, 'usuarios', uid, 'config', 'geral'),
      sanitized,
      { merge: true }
    )
  } catch (e) {
    console.error('saveConfig:', e)
  }
}
