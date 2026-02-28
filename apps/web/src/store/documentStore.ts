import { create } from 'zustand'
import { generateDocumentKey } from '@/lib/onlyoffice'
import { SAMPLE_DOC_URL, CALLBACK_URL, type DocumentMeta } from '@/lib/fileUtils'

interface DocumentState {
  currentDoc: DocumentMeta | null
  documentKey: string
  documentTitle: string
  documentUrl: string
  callbackUrl: string
  wordCount: number
  pageCount: number
  currentPage: number
  isDirty: boolean

  // Actions
  setDocument: (doc: DocumentMeta) => void
  setDocumentTitle: (title: string) => void
  setWordCount: (count: number) => void
  setPageInfo: (current: number, total: number) => void
  setDirty: (dirty: boolean) => void
  newDocument: () => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
  currentDoc: null,
  documentKey: generateDocumentKey(),
  documentTitle: 'Untitled Document',
  documentUrl: SAMPLE_DOC_URL,
  callbackUrl: CALLBACK_URL,
  wordCount: 0,
  pageCount: 1,
  currentPage: 1,
  isDirty: false,

  setDocument: (doc) =>
    set({
      currentDoc: doc,
      documentTitle: doc.title,
      documentUrl: doc.url,
      documentKey: doc.key,
    }),

  setDocumentTitle: (title) => set({ documentTitle: title }),
  setWordCount: (count) => set({ wordCount: Math.max(0, count) }),
  setPageInfo: (current, total) =>
    set({ currentPage: Math.max(1, current), pageCount: Math.max(1, total) }),
  setDirty: (dirty) => set({ isDirty: dirty }),

  // NOTE: OO Document Server has no REST endpoint to create a blank document.
  // "New Document" currently reuses sample.docx as a starting template.
  // A proper blank-doc workflow requires a server-side endpoint that copies a
  // blank DOCX template and returns a unique document URL and key. Until that
  // exists, the UI should make this limitation visible to avoid data loss
  // (e.g. warn the user that "New" opens a shared template, not a blank file).
  newDocument: () =>
    set({
      currentDoc: null,
      documentKey: generateDocumentKey(),
      documentTitle: 'Untitled Document',
      documentUrl: SAMPLE_DOC_URL,
      callbackUrl: CALLBACK_URL,
      wordCount: 0,
      pageCount: 1,
      currentPage: 1,
      isDirty: false,
    }),
}))
