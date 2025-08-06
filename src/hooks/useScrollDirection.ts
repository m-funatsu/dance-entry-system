'use client'

import { useState, useEffect, useRef } from 'react'

export function useScrollDirection() {
  const [scrolled, setScrolled] = useState(false)
  const [scrollY, setScrollY] = useState(0)
  const rafId = useRef<number | null>(null)
  const lastScrollY = useRef(0)

  useEffect(() => {
    const handleScroll = () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }

      rafId.current = requestAnimationFrame(() => {
        const currentScrollY = window.scrollY
        
        // ヒステリシスを追加してガタつきを防ぐ
        if (scrolled && currentScrollY < 10) {
          setScrolled(false)
        } else if (!scrolled && currentScrollY > 30) {
          setScrolled(true)
        }
        
        setScrollY(currentScrollY)
        lastScrollY.current = currentScrollY
      })
    }

    // 初期値を設定
    handleScroll()

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
      }
    }
  }, [scrolled])

  return { scrolled, scrollY }
}