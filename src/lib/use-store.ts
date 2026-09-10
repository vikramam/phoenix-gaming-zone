import { useSyncExternalStore } from 'react'
import { getAuth, getAuthReady, getData, subscribe } from './store'

export function useAppData() {
  return useSyncExternalStore(subscribe, getData, getData)
}

export function useAuthUser() {
  return useSyncExternalStore(subscribe, getAuth, getAuth)
}

export function useAuthReady() {
  return useSyncExternalStore(subscribe, getAuthReady, getAuthReady)
}
