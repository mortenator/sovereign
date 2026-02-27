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
import { useDocumentStore } from '@/store/documentStore'
import { generateDocumentKey } from '@/lib/onlyoffice'

interface NewDocumentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewDocumentDialog({ open, onOpenChange }: NewDocumentDialogProps) {
  const [title, setTitle] = useState('Untitled Document')
  const { newDocument, setDocumentTitle } = useDocumentStore()

  const handleCreate = () => {
    newDocument()
    setDocumentTitle(title || 'Untitled Document')
    onOpenChange(false)
    setTitle('Untitled Document')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleCreate()
  }

  // generateDocumentKey is used on create to ensure a fresh key
  void generateDocumentKey

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>New Document</DialogTitle>
          <DialogDescription>
            Create a new blank document.
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 mt-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Document name
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Untitled Document"
            autoFocus
          />
          <div className="flex gap-2 justify-end mt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate}>Create</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
