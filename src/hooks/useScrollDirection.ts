'use client'

import { useState, useEffect } from 'react'

export function useScrollDirection() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      setScrollY(currentScrollY)
      setScrolled(currentScrollY > 20)
    }

    // 初期値を設定
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return { scrolled, scrollY }
}