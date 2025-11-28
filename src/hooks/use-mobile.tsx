import * as React from "react"

const MOBILE_BREAKPOINT = 768

// Store para sincronização externa do estado mobile
function subscribe(callback: () => void) {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", callback)
  return () => mql.removeEventListener("change", callback)
}

function getSnapshot() {
  return window.innerWidth < MOBILE_BREAKPOINT
}

function getServerSnapshot() {
  // No servidor, assumir desktop para evitar hydration mismatch
  return false
}

export function useIsMobile() {
  // useSyncExternalStore garante consistência entre servidor e cliente
  return React.useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
