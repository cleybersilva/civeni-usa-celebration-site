import * as React from "react"

const MOBILE_BREAKPOINT = 768
const TABLET_BREAKPOINT = 1024

export function useIsMobile() {
  // Inicializa com o valor correto IMEDIATAMENTE no cliente
  // Isso evita o "flash" de layout desktop -> mobile
  const [isMobile, setIsMobile] = React.useState(() => {
    // No cliente, detectar imediatamente
    if (typeof window !== 'undefined') {
      return window.innerWidth < MOBILE_BREAKPOINT
    }
    // No servidor, retornar undefined para evitar hydration mismatch
    return false
  })

  React.useEffect(() => {
    // Verificar novamente após montar (garante precisão)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    
    // Verificar imediatamente
    checkMobile()

    // Escutar mudanças de tamanho
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    
    const handleChange = () => {
      checkMobile()
    }
    
    mql.addEventListener("change", handleChange)
    window.addEventListener("resize", handleChange)
    
    return () => {
      mql.removeEventListener("change", handleChange)
      window.removeEventListener("resize", handleChange)
    }
  }, [])

  return isMobile
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState(() => {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth
      return width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT
    }
    return false
  })

  React.useEffect(() => {
    const checkTablet = () => {
      const width = window.innerWidth
      setIsTablet(width >= MOBILE_BREAKPOINT && width < TABLET_BREAKPOINT)
    }
    
    checkTablet()
    
    window.addEventListener("resize", checkTablet)
    
    return () => {
      window.removeEventListener("resize", checkTablet)
    }
  }, [])

  return isTablet
}
