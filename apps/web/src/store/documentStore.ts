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
  setWordCount: (count) => set({ wordCount: count }),
  setPageInfo: (current, total) => set({ currentPage: current, pageCount: total }),
  setDirty: (dirty) => set({ isDirty: dirty }),

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
