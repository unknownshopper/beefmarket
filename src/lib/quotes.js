import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit as queryLimit,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore'
import { db } from './firebase'

export async function saveQuote({
  clientName,
  clientPhone,
  clientPhoneE164,
  date,
  people,
  serviceType,
  serviceLabel,
  pin,
  clientMapsLink,
  address,
  distanceKm,
  transportCost,
  foodCost,
  serviceCost,
  personnelCost,
  personnelCount,
  total,
  details,
}) {
  const payload = {
    clientName: clientName || '',
    clientPhone: clientPhone || '',
    clientPhoneE164: clientPhoneE164 || '',
    date: date || '',
    people: Number(people) || 0,
    serviceType: serviceType || '',
    serviceLabel: serviceLabel || '',
    pin: pin || null,
    clientMapsLink: clientMapsLink || '',
    address: address || null,
    distanceKm: typeof distanceKm === 'number' ? distanceKm : 0,
    transportCost: typeof transportCost === 'number' ? transportCost : 0,
    foodCost: typeof foodCost === 'number' ? foodCost : 0,
    serviceCost: typeof serviceCost === 'number' ? serviceCost : 0,
    personnelCost: typeof personnelCost === 'number' ? personnelCost : 0,
    personnelCount: typeof personnelCount === 'number' ? personnelCount : 0,
    total: typeof total === 'number' ? total : 0,
    details: Array.isArray(details) ? details : [],
    status: 'pendiente',
    createdAt: new Date().toISOString(),
  }
  const docRef = await addDoc(collection(db, 'quotes'), payload)
  return { id: docRef.id, ...payload }
}

export async function getQuote(id) {
  const ref = doc(db, 'quotes', id)
  const snap = await getDoc(ref)
  if (!snap.exists()) return null
  return { id: snap.id, ...snap.data() }
}

export async function getQuotes(limit = 100) {
  const q = query(collection(db, 'quotes'), orderBy('date', 'desc'), queryLimit(limit))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getUpcomingQuotes(limit = 100) {
  const today = new Date().toISOString().split('T')[0]
  const q = query(
    collection(db, 'quotes'),
    where('date', '>=', today),
    orderBy('date', 'asc'),
    queryLimit(limit)
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function updateQuoteStatus(id, status) {
  const ref = doc(db, 'quotes', id)
  await updateDoc(ref, { status, updatedAt: new Date().toISOString() })
}
