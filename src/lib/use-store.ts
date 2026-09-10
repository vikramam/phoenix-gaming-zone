import { useSyncExternalStore } from 'react'
import { getAuth, getData, subscribe } from './store'

export function useAppData() {
  return useSyncExternalStore(subscribe, getData, getData)
}

export function useAuthUser() {
  return useSyncExternalStore(subscribe, getAuth, getAuth)
}
