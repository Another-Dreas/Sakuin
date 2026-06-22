"use client"

import { useEffect, useRef, useCallback, useState } from "react"

interface UseInfiniteScrollOptions {
  initialCount?: number
  step?: number
}

export function useInfiniteScroll<T>(items: T[], options: UseInfiniteScrollOptions = {}) {
  const { initialCount = 20, step = 20 } = options
  const [visibleCount, setVisibleCount] = useState(initialCount)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  // Reset when the underlying list changes (e.g. filter applied)
  useEffect(() => {
    setVisibleCount(initialCount)
  }, [items, initialCount])

  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + step, items.length))
  }, [step, items.length])

  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [loadMore])

  const visibleItems = items.slice(0, visibleCount)
  const hasMore = visibleCount < items.length

  return { visibleItems, hasMore, sentinelRef }
}
