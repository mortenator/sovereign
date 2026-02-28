import { create } from 'zustand'

export type ActiveTab = 'home' | 'insert' | 'layout' | 'review' | 'view'
export type SidebarPanel = 'outline' | 'comments' | 'styles' | null

interface EditorState {
  // Editor status
  isEditorReady: boolean
  isEditorLoading: boolean
  editorError: string | null

  // UI state
  activeRibbonTab: ActiveTab
  sidebarPanel: SidebarPanel
  isCommandPaletteOpen: boolean
  isDarkMode: boolean
  isFindOpen: boolean
  isReplaceOpen: boolean

  // Zoom
  zoomLevel: number

  // Format state (mirrors active selection in editor)
  isBold: boolean
  isItalic: boolean
  isUnderline: boolean
  isStrikethrough: boolean
  fontFamily: string
  fontSize: number
  alignment: 'left' | 'center' | 'right' | 'justify'

  // Actions
  setEditorReady: (ready: boolean) => void
  setEditorLoading: (loading: boolean) => void
  setEditorError: (error: string | null) => void
  setActiveRibbonTab: (tab: ActiveTab) => void
  setSidebarPanel: (panel: SidebarPanel) => void
  toggleSidebarPanel: (panel: SidebarPanel) => void
  setCommandPaletteOpen: (open: boolean) => void
  toggleCommandPalette: () => void
  toggleDarkMode: () => void
  setDarkMode: (dark: boolean) => void
  setFindOpen: (open: boolean) => void
  setZoomLevel: (zoom: number) => void
  setFormatState: (state: Partial<Pick<EditorState, 'isBold' | 'isItalic' | 'isUnderline' | 'isStrikethrough' | 'fontFamily' | 'fontSize' | 'alignment'>>) => void
}

export const useEditorStore = create<EditorState>((set) => ({
  isEditorReady: false,
  isEditorLoading: false,
  editorError: null,

  activeRibbonTab: 'home',
  sidebarPanel: null,
  isCommandPaletteOpen: false,
  isDarkMode: false,
  isFindOpen: false,
  isReplaceOpen: false,

  zoomLevel: 100,

  isBold: false,
  isItalic: false,
  isUnderline: false,
  isStrikethrough: false,
  fontFamily: 'Times New Roman',
  fontSize: 12,
  alignment: 'left',

  setEditorReady: (ready) => set({ isEditorReady: ready, isEditorLoading: !ready }),
  setEditorLoading: (loading) => set({ isEditorLoading: loading }),
  setEditorError: (error) => set({ editorError: error, isEditorLoading: false }),
  setActiveRibbonTab: (tab) => set({ activeRibbonTab: tab }),
  setSidebarPanel: (panel) => set({ sidebarPanel: panel }),
  toggleSidebarPanel: (panel) =>
    set((state) => ({ sidebarPanel: state.sidebarPanel === panel ? null : panel })),
  setCommandPaletteOpen: (open) => set({ isCommandPaletteOpen: open }),
  toggleCommandPalette: () =>
    set((state) => ({ isCommandPaletteOpen: !state.isCommandPaletteOpen })),
  toggleDarkMode: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
  setDarkMode: (dark) => set({ isDarkMode: dark }),
  setFindOpen: (open) => set({ isFindOpen: open }),
  // Store-only update; callers in StatusBar also call execOOMethod('Zoom', null, zoom)
  // to apply the zoom level to the live OO editor.
  setZoomLevel: (zoom) => set({ zoomLevel: zoom }),
  setFormatState: (state) => set(state),
}))
