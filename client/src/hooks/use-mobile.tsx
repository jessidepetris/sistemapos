import * as React from "react"

// Definimos varios breakpoints para mayor flexibilidad
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean>(false)
  
  // Solución para evitar problemas de hidratación con SSR
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia(`(max-width: ${breakpoints.md - 1}px)`)
    
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoints.md)
    }
    
    // Configuración inicial
    onChange()
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  // Retornamos false durante SSR para evitar mismatch de hidratación
  return mounted ? isMobile : false
}

// Hook adicional para consultar cualquier breakpoint
export function useBreakpoint(breakpoint: keyof typeof breakpoints) {
  const [isBelow, setIsBelow] = React.useState<boolean>(false)
  const [mounted, setMounted] = React.useState(false)
  
  React.useEffect(() => {
    setMounted(true)
    const mql = window.matchMedia(`(max-width: ${breakpoints[breakpoint] - 1}px)`)
    
    const onChange = () => {
      setIsBelow(window.innerWidth < breakpoints[breakpoint])
    }
    
    // Configuración inicial
    onChange()
    
    mql.addEventListener("change", onChange)
    return () => mql.removeEventListener("change", onChange)
  }, [breakpoint])
  
  return mounted ? isBelow : false
}
