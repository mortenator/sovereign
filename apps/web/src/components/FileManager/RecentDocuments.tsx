import { RECENT_DOCUMENTS, formatDate, formatFileSize } from '@/lib/fileUtils'
import { useDocumentStore } from '@/store/documentStore'
import { FileText, Clock } from 'lucide-react'

export function RecentDocuments() {
  const { setDocument } = useDocumentStore()

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 px-1 mb-1">
        <Clock className="h-3 w-3" />
        Recent Documents
      </div>
      {RECENT_DOCUMENTS.length === 0 ? (
        <p className="text-xs text-gray-400 dark:text-gray-500 py-2 px-1">
          No recent documents
        </p>
      ) : (
        RECENT_DOCUMENTS.map((doc) => (
          <button
            key={doc.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-left w-full"
            onClick={() => setDocument(doc)}
            aria-label={`Open ${doc.title}`}
          >
            <FileText className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                {doc.title}
              </p>
              <p className="text-[10px] text-gray-400 dark:text-gray-500">
                {formatDate(doc.lastModified)}
                {doc.size ? ` · ${formatFileSize(doc.size)}` : ''}
              </p>
            </div>
          </button>
        ))
      )}
    </div>
  )
}
