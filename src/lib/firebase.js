import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDQEoemX_L0mH63lX9E9Vykn4_AjfEpsp4',
  authDomain: 'beefmarketvhsa.firebaseapp.com',
  projectId: 'beefmarketvhsa',
  storageBucket: 'beefmarketvhsa.firebasestorage.app',
  messagingSenderId: '275899235230',
  appId: '1:275899235230:web:39c9d321b7841b8f75b48f',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = getFirestore(app)
