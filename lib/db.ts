import {
  collection, doc, addDoc, updateDoc, deleteDoc,
  getDocs, getDoc, setDoc, query, where,
} from 'firebase/firestore'
import { db } from './firebase'
import type { Transacao, Meta, Config, InvestimentoPosition, Aporte } from '../types'

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
  // Remove campos undefined para não poluir o Firestore
  const payload: Record<string, unknown> = { criadoEm: Date.now() }
  for (const [k, v] of Object.entries(t)) {
    if (v !== undefined) payload[k] = v
  }
  await addDoc(collection(db, 'usuarios', uid, 'transacoes'), payload)
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

export async function updateGrupoTransacoes(
  uid: string,
  grupoId: string,
  campos: Partial<Pick<import('../types').Transacao, 'valor' | 'categoria' | 'descricao' | 'tipo' | 'subtipo'>>
) {
  const snap = await getDocs(collection(db, 'usuarios', uid, 'transacoes'))
  const doGrupo = snap.docs.filter(d => d.data().grupoId === grupoId)
  await Promise.all(
    doGrupo.map(d => updateDoc(doc(db, 'usuarios', uid, 'transacoes', d.id), campos as Record<string, unknown>))
  )
}

// ── INVESTIMENTOS ─────────────────────────────────────────────────────────────


export async function getPositions(uid: string): Promise<InvestimentoPosition[]> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'positions'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as InvestimentoPosition))
      .sort((a, b) => b.criadoEm - a.criadoEm)
  } catch (e) { console.error('getPositions:', e); return [] }
}

export async function addPosition(uid: string, p: Omit<InvestimentoPosition, 'id' | 'criadoEm'>) {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'positions'), { ...p, criadoEm: Date.now() })
  return ref.id
}

export async function updatePosition(uid: string, id: string, p: Partial<InvestimentoPosition>) {
  await updateDoc(doc(db, 'usuarios', uid, 'positions', id), p as Record<string, unknown>)
}

export async function deletePosition(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'positions', id))
}

export async function getAportes(uid: string, positionId: string): Promise<Aporte[]> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'positions', positionId, 'aportes'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Aporte))
      .sort((a, b) => a.data.localeCompare(b.data))
  } catch (e) { console.error('getAportes:', e); return [] }
}

export async function addAporte(uid: string, positionId: string, a: Omit<Aporte, 'id' | 'criadoEm' | 'positionId'>) {
  await addDoc(collection(db, 'usuarios', uid, 'positions', positionId, 'aportes'), {
    ...a, positionId, criadoEm: Date.now(),
  })
}

export async function deleteAporte(uid: string, positionId: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'positions', positionId, 'aportes', id))
}

// ── SINCRONIZAÇÃO INVESTIMENTOS → DASHBOARD ───────────────────────────────────

/**
 * Exclui transações do dashboard que correspondem a um aporte de investimento.
 * Critério: tipo=Investido + mesma categoria + mesma data + mesmo valor
 */
export async function deleteTransacoesDoAporte(
  uid: string,
  categoria: string,
  subtipo: string,
  data: string,
  valor: number
): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'transacoes'))
    const matches = snap.docs.filter(d => {
      const t = d.data()
      return (
        t.tipo      === 'Investido' &&
        t.categoria === categoria   &&
        t.subtipo   === subtipo     &&
        t.data      === data        &&
        Math.abs(t.valor - valor) < 0.01  // tolerância float
      )
    })
    await Promise.all(matches.map(d => deleteDoc(d.ref)))
    return matches.length
  } catch (e) {
    console.error('deleteTransacoesDoAporte:', e)
    return 0
  }
}

/**
 * Exclui todas as transações do dashboard vinculadas a uma position inteira.
 * Critério: tipo=Investido + mesma categoria + mesmo subtipo
 */
export async function deleteTransacoesDaPosition(
  uid: string,
  categoria: string,
  subtipo: string
): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'transacoes'))
    const matches = snap.docs.filter(d => {
      const t = d.data()
      return (
        t.tipo      === 'Investido' &&
        t.categoria === categoria   &&
        t.subtipo   === subtipo
      )
    })
    await Promise.all(matches.map(d => deleteDoc(d.ref)))
    return matches.length
  } catch (e) {
    console.error('deleteTransacoesDaPosition:', e)
    return 0
  }
}

// ── BANCOS DO USUÁRIO ─────────────────────────────────────────────────────────

import type { Banco } from '../types'

export async function getBancos(uid: string): Promise<Banco[]> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'bancos'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Banco))
      .sort((a, b) => a.nome.localeCompare(b.nome))
  } catch (e) { console.error('getBancos:', e); return [] }
}

export async function addBanco(uid: string, b: Omit<Banco, 'id' | 'criadoEm'>) {
  const ref = await addDoc(collection(db, 'usuarios', uid, 'bancos'), { ...b, criadoEm: Date.now() })
  return ref.id
}

export async function deleteBanco(uid: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'bancos', id))
}

// ── RESGATES ──────────────────────────────────────────────────────────────────

import type { Resgate } from '../types'

export async function getResgates(uid: string, positionId: string): Promise<Resgate[]> {
  try {
    const snap = await getDocs(collection(db, 'usuarios', uid, 'positions', positionId, 'resgates'))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Resgate))
      .sort((a, b) => a.data.localeCompare(b.data))
  } catch (e) { console.error('getResgates:', e); return [] }
}

export async function addResgate(uid: string, positionId: string, r: Omit<Resgate, 'id' | 'criadoEm' | 'positionId'>) {
  await addDoc(collection(db, 'usuarios', uid, 'positions', positionId, 'resgates'), {
    ...r, positionId, criadoEm: Date.now(),
  })
}

export async function deleteResgate(uid: string, positionId: string, id: string) {
  await deleteDoc(doc(db, 'usuarios', uid, 'positions', positionId, 'resgates', id))
}
