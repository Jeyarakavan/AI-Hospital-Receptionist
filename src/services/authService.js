import { auth, googleProvider } from '../firebaseConfig'
import { signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut as fbSignOut, onAuthStateChanged } from 'firebase/auth'

export function signInWithGoogle(){
  if (!auth) throw new Error('Firebase not configured')
  return signInWithPopup(auth, googleProvider)
}

export function signInWithEmail(email, password){
  if (!auth) throw new Error('Firebase not configured')
  return signInWithEmailAndPassword(auth, email, password)
}

export function registerWithEmail(email, password){
  if (!auth) throw new Error('Firebase not configured')
  return createUserWithEmailAndPassword(auth, email, password)
}

export function signOut(){
  if (!auth) throw new Error('Firebase not configured')
  return fbSignOut(auth)
}

export function onAuthChanged(cb){
  if (!auth) return ()=> {} // no-op if Firebase not configured
  return onAuthStateChanged(auth, cb)
}