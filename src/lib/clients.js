import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore'
import { db } from './firebase'

export function normalizePhone(raw) {
  if (!raw) return ''
  const digits = raw.replace(/\D/g, '')
  if (digits.length === 10) return digits
  if (digits.length === 11 && digits.startsWith('1')) return digits.slice(1)
  if (digits.length === 12 && digits.startsWith('52')) return digits.slice(2)
  if (digits.length === 13 && digits.startsWith('52')) return digits.slice(2)
  return ''
}

export function toE164(raw) {
  const normalized = normalizePhone(raw)
  return normalized ? `52${normalized}` : ''
}

export async function getClientByPhone(rawPhone) {
  const phone = normalizePhone(rawPhone)
  if (!phone) return null
  const ref = doc(db, 'clients', phone)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function saveClient({ name, phone, pin, clientMapsLink, address }) {
  const normalized = normalizePhone(phone)
  if (!normalized) throw new Error('Teléfono no válido')
  const ref = doc(db, 'clients', normalized)
  await setDoc(
    ref,
    {
      name: name || '',
      phone: normalized,
      pin: pin || null,
      clientMapsLink: clientMapsLink || '',
      address: address || null,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  )
  return { id: normalized }
}

export async function getClients() {
  const snap = await getDocs(collection(db, 'clients'))
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}
