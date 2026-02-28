import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDocumentStore } from '@/store/documentStore'

interface SaveAsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type ExportFormat = 'docx' | 'pdf' | 'odt' | 'txt' | 'html'

const FORMATS: { value: ExportFormat; label: string }[] = [
  { value: 'docx', label: 'Word Document (.docx)' },
  { value: 'pdf', label: 'PDF Document (.pdf)' },
  { value: 'odt', label: 'OpenDocument Text (.odt)' },
  { value: 'txt', label: 'Plain Text (.txt)' },
  { value: 'html', label: 'Web Page (.html)' },
]

export function SaveAsDialog({ open, onOpenChange }: SaveAsDialogProps) {
  const { documentTitle, setDocumentTitle } = useDocumentStore()
  const [filename, setFilename] = useState(documentTitle)
  const [format, setFormat] = useState<ExportFormat>('docx')

  const handleSave = () => {
    // Strip path separators and OS-reserved characters to prevent invalid
    // filenames if this value is ever forwarded to a backend. Limit length to
    // 255 chars (common FS maximum). This is defensive sanitisation — the
    // field is currently client-side only (used for downloadAs and title state).
    const name = filename
      .trim()
      .replace(/[/\\<>:"|?*\x00-\x1f]/g, '')
      .slice(0, 255)
    if (name && name !== documentTitle) {
      setDocumentTitle(name)
    }
    window.editor?.downloadAs(format)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Save As</DialogTitle>
          <DialogDescription>
            Download a copy of this document.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              File name
            </label>
            <Input
              value={filename}
              onChange={(e) => setFilename(e.target.value)}
              placeholder="Document name"
              autoFocus
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Format
            </label>
            <Select value={format} onValueChange={(v) => setFormat(v as ExportFormat)}>
              <SelectTrigger className="w-full h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FORMATS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Download</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
