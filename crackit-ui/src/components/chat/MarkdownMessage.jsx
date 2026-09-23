import { useState } from 'react'

function CodeBlock({ code, language }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="my-2.5 rounded-xl overflow-hidden border border-slate-700 bg-slate-900 shadow-md">
      <div className="flex items-center justify-between px-3 py-1.5 bg-slate-800/90 border-b border-slate-700/80 text-[11px] text-slate-400">
        <span className="font-mono uppercase font-bold">{language || 'code'}</span>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1 hover:text-white transition-colors cursor-pointer"
        >
          <i className={`ti ${copied ? 'ti-check text-emerald-400' : 'ti-copy'} text-xs`} />
          <span>{copied ? 'Copied' : 'Copy'}</span>
        </button>
      </div>
      <pre className="p-3 overflow-x-auto text-xs font-mono text-slate-100 leading-relaxed smart-scroll">
        <code>{code}</code>
      </pre>
    </div>
  )
}

function parseFormattedText(text) {
  if (!text) return null

  // Split text by markdown segments: code blocks (```...```)
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n?([\s\S]*?)```/g
  const elements = []
  let lastIndex = 0
  let match

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const [fullMatch, lang, code] = match
    const startIndex = match.index

    // Text preceding this code block
    if (startIndex > lastIndex) {
      elements.push(renderTextWithInline(text.substring(lastIndex, startIndex), `pre-${lastIndex}`))
    }

    elements.push(
      <CodeBlock
        key={`code-${startIndex}`}
        language={lang.trim()}
        code={code.trimEnd()}
      />
    )

    lastIndex = startIndex + fullMatch.length
  }

  // Trailing text after last code block
  if (lastIndex < text.length) {
    elements.push(renderTextWithInline(text.substring(lastIndex), `post-${lastIndex}`))
  }

  return elements
}

function renderTextWithInline(rawText, keyPrefix) {
  const lines = rawText.split('\n')

  return (
    <div key={keyPrefix} className="space-y-1.5 leading-relaxed">
      {lines.map((line, lineIdx) => {
        const trimmed = line.trim()

        // Bullet point
        if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || trimmed.startsWith('• ')) {
          const content = trimmed.substring(2)
          return (
            <div key={`${keyPrefix}-line-${lineIdx}`} className="flex items-start gap-2 pl-2">
              <span className="text-purple-500 font-bold leading-none mt-1.5">•</span>
              <span className="flex-1">{renderInlineTokens(content)}</span>
            </div>
          )
        }

        // Numbered list (e.g., "1. ")
        const numMatch = trimmed.match(/^(\d+)\.\s+(.*)/)
        if (numMatch) {
          return (
            <div key={`${keyPrefix}-line-${lineIdx}`} className="flex items-start gap-2 pl-2">
              <span className="text-purple-600 font-bold text-xs mt-0.5">{numMatch[1]}.</span>
              <span className="flex-1">{renderInlineTokens(numMatch[2])}</span>
            </div>
          )
        }

        // Empty line
        if (!trimmed) {
          return <div key={`${keyPrefix}-line-${lineIdx}`} className="h-1.5" />
        }

        // Regular line
        return (
          <p key={`${keyPrefix}-line-${lineIdx}`} className="my-0.5">
            {renderInlineTokens(line)}
          </p>
        )
      })}
    </div>
  )
}

function renderInlineTokens(text) {
  if (!text) return null

  // Tokenize for inline code `code`, bold **text**, and italic *text*
  const tokenRegex = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*)/g
  const parts = text.split(tokenRegex)

  return parts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return (
        <code
          key={i}
          className="bg-purple-100/80 text-purple-900 font-mono text-[11px] px-1.5 py-0.5 rounded-md font-semibold mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      )
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return (
        <strong key={i} className="font-extrabold text-[#1a1040]">
          {part.slice(2, -2)}
        </strong>
      )
    }

    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return (
        <em key={i} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      )
    }

    return part
  })
}

export default function MarkdownMessage({ text }) {
  if (!text) return null
  return <div className="text-[13px] text-slate-800 break-words">{parseFormattedText(text)}</div>
}
