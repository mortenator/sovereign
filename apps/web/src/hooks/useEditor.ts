import { useRef, useCallback } from 'react'
import { useEditorStore } from '@/store/editorStore'
import { useDocumentStore } from '@/store/documentStore'
import { execFormat } from '@/lib/onlyoffice'

export function useEditor() {
  const editorRef = useRef<OOEditor | null>(null)
  const { setEditorReady, setEditorError, setFormatState } = useEditorStore()
  const { setWordCount, setPageInfo, setDirty } = useDocumentStore()

  const handleDocumentReady = useCallback(() => {
    setEditorReady(true)
    window.editor = editorRef.current ?? undefined
  }, [setEditorReady])

  const handleDocumentStateChange = useCallback(
    (event: { data: boolean }) => {
      setDirty(event.data)
    },
    [setDirty]
  )

  const handleError = useCallback(
    (event: { data: { errorCode: number; errorDescription: string } }) => {
      setEditorError(`Error ${event.data.errorCode}: ${event.data.errorDescription}`)
    },
    [setEditorError]
  )

  const setEditorInstance = useCallback((editor: OOEditor) => {
    editorRef.current = editor
    window.editor = editor
  }, [])

  // Formatting commands via execCommand (works when iframe is focused)
  const formatBold = useCallback(() => execFormat('bold'), [])
  const formatItalic = useCallback(() => execFormat('italic'), [])
  const formatUnderline = useCallback(() => execFormat('underline'), [])
  const formatStrikethrough = useCallback(() => execFormat('strikeThrough'), [])
  const formatAlignLeft = useCallback(() => execFormat('justifyLeft'), [])
  const formatAlignCenter = useCallback(() => execFormat('justifyCenter'), [])
  const formatAlignRight = useCallback(() => execFormat('justifyRight'), [])
  const formatAlignJustify = useCallback(() => execFormat('justifyFull'), [])
  const formatIndent = useCallback(() => execFormat('indent'), [])
  const formatOutdent = useCallback(() => execFormat('outdent'), [])
  const formatBullets = useCallback(() => execFormat('insertUnorderedList'), [])
  const formatNumbering = useCallback(() => execFormat('insertOrderedList'), [])

  const formatFontFamily = useCallback((family: string) => {
    execFormat('fontName', family)
    setFormatState({ fontFamily: family })
  }, [setFormatState])

  const formatFontSize = useCallback((size: number) => {
    execFormat('fontSize', String(size))
    setFormatState({ fontSize: size })
  }, [setFormatState])

  // Editor-level actions
  const requestSave = useCallback(() => {
    editorRef.current?.requestSave()
  }, [])

  const print = useCallback(() => {
    editorRef.current?.print()
  }, [])

  const downloadAs = useCallback((format: string) => {
    editorRef.current?.downloadAs(format)
  }, [])

  // Simulate word count update (OO events would drive this in prod)
  const updateWordCount = useCallback(
    (count: number) => {
      setWordCount(count)
    },
    [setWordCount]
  )

  const updatePageInfo = useCallback(
    (current: number, total: number) => {
      setPageInfo(current, total)
    },
    [setPageInfo]
  )

  return {
    editorRef,
    setEditorInstance,
    handleDocumentReady,
    handleDocumentStateChange,
    handleError,
    updateWordCount,
    updatePageInfo,
    formatBold,
    formatItalic,
    formatUnderline,
    formatStrikethrough,
    formatAlignLeft,
    formatAlignCenter,
    formatAlignRight,
    formatAlignJustify,
    formatIndent,
    formatOutdent,
    formatBullets,
    formatNumbering,
    formatFontFamily,
    formatFontSize,
    requestSave,
    print,
    downloadAs,
  }
}
