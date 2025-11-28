import * as React from "react"

const MOBILE_BREAKPOINT = 768

export function useIsMobile() {
  // Começar com null para indicar "não determinado ainda"
  const [isMobile, setIsMobile] = React.useState<boolean | null>(null)

  React.useEffect(() => {
    // Só atualiza após o componente estar montado no cliente
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Define o valor inicial
    checkMobile()
    
    // Escuta mudanças de tamanho
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    mql.addEventListener("change", checkMobile)
    
    return () => mql.removeEventListener("change", checkMobile)
  }, [])

  // Retorna false se ainda não determinado (evita flicker)
  // Isso garante que no primeiro render sempre retorna false (desktop layout)
  // e só muda para true após o useEffect rodar no cliente
  return isMobile ?? false
}
