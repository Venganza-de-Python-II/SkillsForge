"use client"

import type { ReactNode } from "react"

type Props = {
  items?: ReactNode[]
  speedSec?: number
}

export function Marquee({ items = [], speedSec = 18 }: Props) {
  if (items.length === 0) return null
  const doubled = [...items, ...items]
  return (
    <div className="relative overflow-hidden">
      <div
        className="flex gap-8 whitespace-nowrap will-change-transform"
        style={{ animation: `marquee ${speedSec}s linear infinite` }}
        aria-label="marquee-empresas"
      >
        {doubled.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
