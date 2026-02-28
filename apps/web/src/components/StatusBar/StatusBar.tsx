import { useState } from 'react'
import { useDocumentStore } from '@/store/documentStore'
import { useEditorStore } from '@/store/editorStore'
import { execOOMethod } from '@/lib/onlyoffice'
import * as Slider from '@radix-ui/react-slider'
import { ZoomIn, ZoomOut } from 'lucide-react'
import { Button } from '@/components/ui/button'

const ZOOM_PRESETS = [75, 100, 125, 150, 200]

export function StatusBar() {
  const { wordCount, pageCount, currentPage, documentTitle, setDocumentTitle } =
    useDocumentStore()
  const { zoomLevel, setZoomLevel } = useEditorStore()

  const applyZoom = (zoom: number) => {
    setZoomLevel(zoom)
    execOOMethod('Zoom', null, zoom)
  }
  const [isEditingTitle, setIsEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(documentTitle)

  const handleTitleCommit = () => {
    if (titleDraft.trim()) {
      setDocumentTitle(titleDraft.trim())
    }
    setIsEditingTitle(false)
  }

  const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleTitleCommit()
    if (e.key === 'Escape') {
      setTitleDraft(documentTitle)
      setIsEditingTitle(false)
    }
  }

  return (
    <footer
      className="flex items-center justify-between px-4 py-1 bg-blue-700 dark:bg-blue-900 text-white text-xs select-none shrink-0"
      aria-label="Status bar"
      role="contentinfo"
    >
      {/* Left: word count + page */}
      <div className="flex items-center gap-4">
        <span aria-label={`${wordCount} words`}>
          {wordCount.toLocaleString()} {wordCount === 1 ? 'word' : 'words'}
        </span>
        <span className="opacity-60">|</span>
        <span aria-label={`Page ${currentPage} of ${pageCount}`}>
          Page {currentPage} of {pageCount}
        </span>
      </div>

      {/* Center: document title */}
      <div className="flex items-center">
        {isEditingTitle ? (
          <input
            autoFocus
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={handleTitleCommit}
            onKeyDown={handleTitleKeyDown}
            className="bg-blue-600 dark:bg-blue-800 text-white text-xs px-2 py-0.5 rounded outline-none border border-blue-400 w-48 text-center"
            aria-label="Edit document title"
          />
        ) : (
          <button
            className="hover:bg-blue-600 dark:hover:bg-blue-800 px-2 py-0.5 rounded transition-colors max-w-xs truncate"
            onClick={() => {
              setTitleDraft(documentTitle)
              setIsEditingTitle(true)
            }}
            title="Click to rename document"
            aria-label={`Document title: ${documentTitle}. Click to edit`}
          >
            {documentTitle}
          </button>
        )}
      </div>

      {/* Right: zoom controls */}
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => applyZoom(Math.max(25, zoomLevel - 25))}
          aria-label="Zoom out"
          className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-5 w-5"
        >
          <ZoomOut className="h-3 w-3" />
        </Button>

        <div className="flex items-center gap-1.5">
          <Slider.Root
            className="relative flex items-center w-20 h-4 touch-none select-none"
            value={[zoomLevel]}
            min={25}
            max={200}
            step={5}
            onValueChange={([val]) => applyZoom(val)}
            aria-label="Zoom level"
          >
            <Slider.Track className="bg-blue-500 dark:bg-blue-700 relative grow rounded-full h-0.5">
              <Slider.Range className="absolute bg-white rounded-full h-full" />
            </Slider.Track>
            <Slider.Thumb
              className="block w-3 h-3 bg-white rounded-full shadow focus:outline-none focus:ring-2 focus:ring-white"
              aria-label={`Zoom: ${zoomLevel}%`}
            />
          </Slider.Root>

          <span className="w-9 text-right opacity-90">{zoomLevel}%</span>
        </div>

        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => applyZoom(Math.min(200, zoomLevel + 25))}
          aria-label="Zoom in"
          className="text-white hover:bg-blue-600 dark:hover:bg-blue-800 h-5 w-5"
        >
          <ZoomIn className="h-3 w-3" />
        </Button>

        {/* Zoom presets */}
        <div className="flex items-center gap-0.5 ml-1">
          {ZOOM_PRESETS.map((z) => (
            <button
              key={z}
              onClick={() => applyZoom(z)}
              className={`text-[10px] px-1 rounded transition-colors ${
                zoomLevel === z
                  ? 'bg-blue-500 dark:bg-blue-700'
                  : 'hover:bg-blue-600 dark:hover:bg-blue-800 opacity-70'
              }`}
              aria-label={`Set zoom to ${z}%`}
              aria-pressed={zoomLevel === z}
            >
              {z}%
            </button>
          ))}
        </div>
      </div>
    </footer>
  )
}
