import { execFormat } from '@/lib/onlyoffice'

export interface CommandItem {
  id: string
  label: string
  description?: string
  shortcut?: string
  category: string
  action: () => void
  keywords?: string[]
}

export function buildCommands(callbacks: {
  save: () => void
  saveAs: () => void
  print: () => void
  find: () => void
  toggleDarkMode: () => void
  toggleOutline: () => void
  toggleComments: () => void
  newDocument: () => void
  setZoom: (zoom: number) => void
}): CommandItem[] {
  return [
    // Formatting
    {
      id: 'format-bold',
      label: 'Bold',
      description: 'Toggle bold formatting',
      shortcut: '⌘B',
      category: 'Format',
      action: () => execFormat('bold'),
      keywords: ['bold', 'strong', 'format'],
    },
    {
      id: 'format-italic',
      label: 'Italic',
      description: 'Toggle italic formatting',
      shortcut: '⌘I',
      category: 'Format',
      action: () => execFormat('italic'),
      keywords: ['italic', 'em', 'format'],
    },
    {
      id: 'format-underline',
      label: 'Underline',
      description: 'Toggle underline',
      shortcut: '⌘U',
      category: 'Format',
      action: () => execFormat('underline'),
      keywords: ['underline', 'format'],
    },
    {
      id: 'format-strikethrough',
      label: 'Strikethrough',
      description: 'Toggle strikethrough',
      category: 'Format',
      action: () => execFormat('strikeThrough'),
      keywords: ['strikethrough', 'strike', 'format'],
    },
    {
      id: 'format-clear',
      label: 'Clear Formatting',
      description: 'Remove all formatting',
      category: 'Format',
      action: () => execFormat('removeFormat'),
      keywords: ['clear', 'reset', 'format'],
    },

    // Alignment
    {
      id: 'align-left',
      label: 'Align Left',
      shortcut: '⌘L',
      category: 'Format',
      action: () => execFormat('justifyLeft'),
      keywords: ['align', 'left'],
    },
    {
      id: 'align-center',
      label: 'Center',
      shortcut: '⌘E',
      category: 'Format',
      action: () => execFormat('justifyCenter'),
      keywords: ['align', 'center'],
    },
    {
      id: 'align-right',
      label: 'Align Right',
      shortcut: '⌘R',
      category: 'Format',
      action: () => execFormat('justifyRight'),
      keywords: ['align', 'right'],
    },
    {
      id: 'align-justify',
      label: 'Justify',
      shortcut: '⌘J',
      category: 'Format',
      action: () => execFormat('justifyFull'),
      keywords: ['align', 'justify', 'full'],
    },

    // Styles
    {
      id: 'style-normal',
      label: 'Normal Text',
      description: 'Apply Normal paragraph style',
      shortcut: '⌥0',
      category: 'Styles',
      action: () => document.execCommand('formatBlock', false, 'p'),
      keywords: ['normal', 'paragraph', 'style'],
    },
    {
      id: 'style-h1',
      label: 'Heading 1',
      description: 'Apply Heading 1 style',
      shortcut: '⌥1',
      category: 'Styles',
      action: () => document.execCommand('formatBlock', false, 'h1'),
      keywords: ['heading', 'h1', 'title'],
    },
    {
      id: 'style-h2',
      label: 'Heading 2',
      description: 'Apply Heading 2 style',
      shortcut: '⌥2',
      category: 'Styles',
      action: () => document.execCommand('formatBlock', false, 'h2'),
      keywords: ['heading', 'h2', 'subtitle'],
    },
    {
      id: 'style-h3',
      label: 'Heading 3',
      description: 'Apply Heading 3 style',
      shortcut: '⌥3',
      category: 'Styles',
      action: () => document.execCommand('formatBlock', false, 'h3'),
      keywords: ['heading', 'h3'],
    },

    // Lists
    {
      id: 'insert-bullets',
      label: 'Bullet List',
      description: 'Insert unordered list',
      category: 'Insert',
      action: () => execFormat('insertUnorderedList'),
      keywords: ['bullet', 'list', 'unordered'],
    },
    {
      id: 'insert-numbering',
      label: 'Numbered List',
      description: 'Insert ordered list',
      category: 'Insert',
      action: () => execFormat('insertOrderedList'),
      keywords: ['number', 'list', 'ordered'],
    },

    // File
    {
      id: 'file-save',
      label: 'Save',
      description: 'Save the current document',
      shortcut: '⌘S',
      category: 'File',
      action: callbacks.save,
      keywords: ['save', 'file'],
    },
    {
      id: 'file-save-as',
      label: 'Save As',
      description: 'Save document with a new name',
      shortcut: '⌘⇧S',
      category: 'File',
      action: callbacks.saveAs,
      keywords: ['save', 'as', 'download'],
    },
    {
      id: 'file-print',
      label: 'Print',
      description: 'Print the document',
      shortcut: '⌘P',
      category: 'File',
      action: callbacks.print,
      keywords: ['print', 'file'],
    },
    {
      id: 'file-export-pdf',
      label: 'Export as PDF',
      description: 'Download document as PDF',
      category: 'File',
      action: () => window.editor?.downloadAs('pdf'),
      keywords: ['export', 'pdf', 'download'],
    },
    {
      id: 'file-new',
      label: 'New Document',
      description: 'Create a new document',
      category: 'File',
      action: callbacks.newDocument,
      keywords: ['new', 'create', 'document'],
    },

    // Navigation
    {
      id: 'nav-find',
      label: 'Find',
      description: 'Open find panel',
      shortcut: '⌘F',
      category: 'Navigation',
      action: callbacks.find,
      keywords: ['find', 'search'],
    },
    {
      id: 'nav-outline',
      label: 'Toggle Outline',
      description: 'Show/hide document outline',
      category: 'Navigation',
      action: callbacks.toggleOutline,
      keywords: ['outline', 'navigation', 'sidebar'],
    },
    {
      id: 'nav-comments',
      label: 'Toggle Comments',
      description: 'Show/hide comments panel',
      category: 'Navigation',
      action: callbacks.toggleComments,
      keywords: ['comments', 'review', 'sidebar'],
    },

    // View
    {
      id: 'view-dark-mode',
      label: 'Toggle Dark Mode',
      description: 'Switch between light and dark theme',
      category: 'View',
      action: callbacks.toggleDarkMode,
      keywords: ['dark', 'light', 'theme', 'mode'],
    },
    {
      id: 'view-zoom-75',
      label: 'Zoom 75%',
      category: 'View',
      action: () => callbacks.setZoom(75),
      keywords: ['zoom', '75'],
    },
    {
      id: 'view-zoom-100',
      label: 'Zoom 100%',
      category: 'View',
      action: () => callbacks.setZoom(100),
      keywords: ['zoom', '100', 'default'],
    },
    {
      id: 'view-zoom-125',
      label: 'Zoom 125%',
      category: 'View',
      action: () => callbacks.setZoom(125),
      keywords: ['zoom', '125'],
    },
    {
      id: 'view-zoom-150',
      label: 'Zoom 150%',
      category: 'View',
      action: () => callbacks.setZoom(150),
      keywords: ['zoom', '150'],
    },
  ]
}
