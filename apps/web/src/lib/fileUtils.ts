import { generateDocumentKey } from '@/lib/onlyoffice'

// Strip trailing slash so env vars like VITE_APP_URL=http://host/ don't produce
// double-slash URLs (e.g. http://host//sample.docx).
const APP_URL = (import.meta.env.VITE_APP_URL ?? 'http://localhost:5173').replace(/\/$/, '')

export const SAMPLE_DOC_URL = `${APP_URL}/sample.docx`
export const CALLBACK_URL = `${APP_URL}/api/docs/callback`

export interface DocumentMeta {
  id: string
  title: string
  url: string
  key: string
  lastModified: Date
  size?: number
}

export function createDocumentMeta(
  title: string,
  url: string,
  key: string
): DocumentMeta {
  return {
    id: crypto.randomUUID(),
    title,
    url,
    key,
    lastModified: new Date(),
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export const RECENT_DOCUMENTS: DocumentMeta[] = [
  {
    id: '1',
    title: 'Sample Document',
    url: SAMPLE_DOC_URL,
    // Use a unique key per session so OO Document Server doesn't serve
    // stale cached content from a previous session. A static key like
    // 'sample-doc-v1' causes the server to return cached content even
    // after sample.docx is regenerated.
    key: generateDocumentKey(),
    lastModified: new Date(),
    size: 24576,
  },
]
