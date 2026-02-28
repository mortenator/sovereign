import { useEffect } from 'react'
import { useEditorStore } from '@/store/editorStore'

export function useDarkMode() {
  const { isDarkMode, toggleDarkMode, setDarkMode } = useEditorStore()

  useEffect(() => {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    setDarkMode(prefersDark)
  }, [setDarkMode])

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  return { isDarkMode, toggleDarkMode }
}
