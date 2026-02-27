import { useDocumentStore } from '@/store/documentStore'

export function useDocument() {
  const {
    currentDoc,
    documentKey,
    documentTitle,
    documentUrl,
    callbackUrl,
    wordCount,
    pageCount,
    currentPage,
    isDirty,
    setDocument,
    setDocumentTitle,
    setWordCount,
    setPageInfo,
    setDirty,
    newDocument,
  } = useDocumentStore()

  return {
    currentDoc,
    documentKey,
    documentTitle,
    documentUrl,
    callbackUrl,
    wordCount,
    pageCount,
    currentPage,
    isDirty,
    setDocument,
    setDocumentTitle,
    setWordCount,
    setPageInfo,
    setDirty,
    newDocument,
  }
}
