import type { Article } from '../types/blog'

export function formatDate(value: string | null | undefined) {
  if (!value) return '未发布'
  return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value))
}

export function getReadMinutes(article: Article) {
  const source = article.content || article.summary || ''
  return Math.max(1, Math.round(source.length / 220))
}

export function renderMarkdown(source: string) {
  const escaped = source
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')

  const blocks = escaped.split(/\n{2,}/).map((part) => part.trim()).filter(Boolean)
  return blocks
    .map((block) => {
      if (block.startsWith('### ')) return `<h3>${block.slice(4)}</h3>`
      if (block.startsWith('## ')) return `<h2>${block.slice(3)}</h2>`
      if (block.startsWith('# ')) return `<h1>${block.slice(2)}</h1>`
      if (block.startsWith('```') && block.endsWith('```')) {
        return `<pre><code>${block.replace(/^```[\w-]*\n?/, '').replace(/\n?```$/, '')}</code></pre>`
      }
      return `<p>${block.replace(/\n/g, '<br />').replace(/`([^`]+)`/g, '<code>$1</code>')}</p>`
    })
    .join('')
}
