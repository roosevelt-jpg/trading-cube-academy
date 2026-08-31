'use client'

import { useState } from 'react'
import type { FaqItem } from '@/lib/types/database'

export function FaqSection({ items }: { items: FaqItem[] }) {
  const [openId, setOpenId] = useState(items[0]?.id ?? '')

  return (
    <div>
      {items.map((item) => (
        <div key={item.id} className={`faq-item ${openId === item.id ? 'open' : ''}`}>
          <button type="button" className="faq-q" onClick={() => setOpenId(openId === item.id ? '' : item.id)}>
            {item.question}
            <span className="faq-icon mono text-yellow">+</span>
          </button>
          <div className="faq-a">
            <div className="faq-a-inner">{item.answer}</div>
          </div>
        </div>
      ))}
    </div>
  )
}
