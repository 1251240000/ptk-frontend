'use client'

import { Check, Copy } from 'lucide-react'
import { useState } from 'react'

export function CopyCode({ code, label, copiedLabel }: { code: string; label: string; copiedLabel: string }) {
  const [copied, setCopied] = useState(false)

  async function copy() {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  return (
    <button type="button" className="docs-code-copy" onClick={() => void copy()} aria-label={copied ? copiedLabel : label} title={copied ? copiedLabel : label}>
      {copied ? <Check size={15} /> : <Copy size={15} />}
      <span>{copied ? copiedLabel : label}</span>
    </button>
  )
}
