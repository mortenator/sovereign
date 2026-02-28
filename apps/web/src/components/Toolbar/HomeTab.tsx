import { useEditorStore } from '@/store/editorStore'
import { execOOMethod } from '@/lib/onlyoffice'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  Clipboard,
  Scissors,
  Copy,
  Paintbrush,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  IndentIcon,
  OutdentIcon,
  Search,
  Replace,
  Type,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const FONT_FAMILIES = [
  'Arial',
  'Calibri',
  'Cambria',
  'Comic Sans MS',
  'Courier New',
  'Georgia',
  'Helvetica',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
]

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 22, 24, 28, 32, 36, 48, 72]

// Style names must match OO Document Server style names exactly.
const PARAGRAPH_STYLES = [
  { label: 'Normal', value: 'Normal' },
  { label: 'Heading 1', value: 'Heading 1' },
  { label: 'Heading 2', value: 'Heading 2' },
  { label: 'Heading 3', value: 'Heading 3' },
  { label: 'Heading 4', value: 'Heading 4' },
  { label: 'Subtitle', value: 'Subtitle' },
  { label: 'Quote', value: 'Quote' },
]

function RibbonGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col items-stretch">
      <div className="flex items-center gap-0.5 px-1 flex-wrap">{children}</div>
      <span className="text-[10px] text-gray-400 dark:text-gray-500 text-center mt-0.5 px-1">
        {label}
      </span>
    </div>
  )
}

function RibbonBtn({
  label,
  icon: Icon,
  onClick,
  active = false,
  shortcut,
}: {
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: () => void
  active?: boolean
  shortcut?: string
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'ribbon-active' : 'ribbon'}
          size="icon"
          onClick={onClick}
          aria-label={label}
          aria-pressed={active}
          className={cn(
            'h-7 w-7',
            active && 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
          )}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        {label}
        {shortcut && (
          <span className="ml-1 text-gray-400 dark:text-gray-500 text-[10px]">
            ({shortcut})
          </span>
        )}
      </TooltipContent>
    </Tooltip>
  )
}

export function HomeTab() {
  const { isBold, isItalic, isUnderline, isStrikethrough, fontFamily, fontSize, alignment, setFindOpen } =
    useEditorStore()

  // OO connector API uses PascalCase method names (not document.execCommand names).
  const fmt = (cmd: string, value?: unknown) => execOOMethod(cmd, null, value)

  const applyStyle = (styleName: string) => {
    execOOMethod('SetStyle', null, { Name: styleName })
  }

  return (
    <div className="flex items-stretch gap-px px-2 py-1 flex-wrap">
      {/* Clipboard group — browser security blocks programmatic clipboard access in iframes;
          keyboard shortcuts work directly in the editor. Buttons are disabled with hints. */}
      <RibbonGroup label="Clipboard">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ribbon"
              size="sm"
              disabled
              aria-label="Paste — use Ctrl+V"
              className="opacity-60 cursor-not-allowed"
            >
              <Clipboard className="h-3.5 w-3.5 mr-1" />
              <span className="text-xs">Paste</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Paste (Ctrl+V)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ribbon"
              size="icon"
              disabled
              aria-label="Cut — use Ctrl+X"
              className="h-7 w-7 opacity-60 cursor-not-allowed"
            >
              <Scissors className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cut (Ctrl+X)</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ribbon"
              size="icon"
              disabled
              aria-label="Copy — use Ctrl+C"
              className="h-7 w-7 opacity-60 cursor-not-allowed"
            >
              <Copy className="h-3.5 w-3.5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Copy (Ctrl+C)</TooltipContent>
        </Tooltip>
        {/* Format Painter: stub pending OO SDK support */}
        <RibbonBtn label="Format Painter" icon={Paintbrush} onClick={() => {}} />
      </RibbonGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      {/* Font group */}
      <RibbonGroup label="Font">
        <div className="flex items-center gap-1 mb-0.5">
          <Select
            value={fontFamily}
            onValueChange={(val) => {
              execOOMethod('SetFontFamily', null, { Name: val })
            }}
          >
            <SelectTrigger className="w-32 h-6 text-xs" aria-label="Font family">
              <SelectValue placeholder="Font" />
            </SelectTrigger>
            <SelectContent>
              {FONT_FAMILIES.map((f) => (
                <SelectItem key={f} value={f} style={{ fontFamily: f }}>
                  {f}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={String(fontSize)}
            onValueChange={(val) => {
              execOOMethod('SetFontSize', null, { Size: parseInt(val, 10) })
            }}
          >
            <SelectTrigger className="w-14 h-6 text-xs" aria-label="Font size">
              <SelectValue placeholder="12" />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((s) => (
                <SelectItem key={s} value={String(s)}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-0.5">
          <RibbonBtn
            label="Bold"
            icon={Bold}
            onClick={() => fmt('SetBold')}
            active={isBold}
            shortcut="Ctrl+B"
          />
          <RibbonBtn
            label="Italic"
            icon={Italic}
            onClick={() => fmt('SetItalic')}
            active={isItalic}
            shortcut="Ctrl+I"
          />
          <RibbonBtn
            label="Underline"
            icon={Underline}
            onClick={() => fmt('SetUnderline')}
            active={isUnderline}
            shortcut="Ctrl+U"
          />
          <RibbonBtn
            label="Strikethrough"
            icon={Strikethrough}
            onClick={() => fmt('SetStrikeout')}
            active={isStrikethrough}
          />
          <RibbonBtn
            label="Clear Formatting"
            icon={Type}
            onClick={() => fmt('RemoveFormat')}
          />
        </div>
      </RibbonGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      {/* Paragraph group */}
      <RibbonGroup label="Paragraph">
        <div className="flex items-center gap-0.5 mb-0.5">
          <RibbonBtn
            label="Align Left"
            icon={AlignLeft}
            onClick={() => execOOMethod('SetParagraphAlign', null, 'left')}
            active={alignment === 'left'}
            shortcut="Ctrl+L"
          />
          <RibbonBtn
            label="Center"
            icon={AlignCenter}
            onClick={() => execOOMethod('SetParagraphAlign', null, 'center')}
            active={alignment === 'center'}
            shortcut="Ctrl+E"
          />
          <RibbonBtn
            label="Align Right"
            icon={AlignRight}
            onClick={() => execOOMethod('SetParagraphAlign', null, 'right')}
            active={alignment === 'right'}
            shortcut="Ctrl+R"
          />
          <RibbonBtn
            label="Justify"
            icon={AlignJustify}
            onClick={() => execOOMethod('SetParagraphAlign', null, 'justify')}
            active={alignment === 'justify'}
            shortcut="Ctrl+J"
          />
        </div>
        <div className="flex items-center gap-0.5">
          <RibbonBtn
            label="Bullet List"
            icon={List}
            onClick={() => fmt('SetBullet')}
          />
          <RibbonBtn
            label="Numbered List"
            icon={ListOrdered}
            onClick={() => fmt('SetNum')}
          />
          <RibbonBtn
            label="Decrease Indent"
            icon={OutdentIcon}
            onClick={() => fmt('DecreaseIndent')}
          />
          <RibbonBtn
            label="Increase Indent"
            icon={IndentIcon}
            onClick={() => fmt('IncreaseIndent')}
          />
        </div>
      </RibbonGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      {/* Styles group */}
      <RibbonGroup label="Styles">
        <div className="flex flex-wrap gap-0.5 max-w-[200px]">
          {PARAGRAPH_STYLES.map((style) => (
            <button
              key={style.value}
              onClick={() => applyStyle(style.value)}
              className={cn(
                'px-2 py-0.5 text-xs rounded border border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300',
                style.value === 'Heading 1' && 'font-bold text-sm',
                style.value === 'Heading 2' && 'font-semibold',
                style.value === 'Heading 3' && 'font-medium',
              )}
              aria-label={`Apply ${style.label} style`}
            >
              {style.label}
            </button>
          ))}
        </div>
      </RibbonGroup>

      <Separator orientation="vertical" className="mx-1 h-14" />

      {/* Editing group */}
      <RibbonGroup label="Editing">
        <RibbonBtn
          label="Find"
          icon={Search}
          onClick={() => setFindOpen(true)}
          shortcut="Ctrl+F"
        />
        <RibbonBtn
          label="Find & Replace"
          icon={Replace}
          onClick={() => setFindOpen(true)}
          shortcut="Ctrl+H"
        />
      </RibbonGroup>
    </div>
  )
}
