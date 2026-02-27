export const SAMPLE_DOC_URL = '/sample.docx'
export const CALLBACK_URL = '/api/docs/callback'

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
    key: 'sample-doc-v1',
    lastModified: new Date(),
    size: 24576,
  },
]
