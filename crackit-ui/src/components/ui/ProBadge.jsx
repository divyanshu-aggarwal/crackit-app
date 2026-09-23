import React from 'react'
import { Sparkles, Crown } from 'lucide-react'

export default function ProBadge({ size = 'sm', variant = 'gold' }) {
    const isLg = size === 'lg'

    return (
        <span
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: isLg ? 6 : 4,
                padding: isLg ? '3px 10px' : '2px 7px',
                borderRadius: 9999,
                fontSize: isLg ? 12 : 10.5,
                fontWeight: 700,
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)',
                color: '#ffffff',
                boxShadow: '0 2px 8px rgba(217, 119, 6, 0.35)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                userSelect: 'none',
                lineHeight: 1.2
            }}
        >
            <Crown size={isLg ? 13 : 11} strokeWidth={2.6} />
            <span>PRO</span>
        </span>
    )
}
