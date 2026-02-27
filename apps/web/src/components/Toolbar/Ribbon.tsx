import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { useEditorStore, type ActiveTab } from '@/store/editorStore'
import { HomeTab } from './HomeTab'
import { InsertTab } from './InsertTab'
import { LayoutTab } from './LayoutTab'
import { ReviewTab } from './ReviewTab'
import { ViewTab } from './ViewTab'

const TABS: { value: ActiveTab; label: string }[] = [
  { value: 'home', label: 'Home' },
  { value: 'insert', label: 'Insert' },
  { value: 'layout', label: 'Layout' },
  { value: 'review', label: 'Review' },
  { value: 'view', label: 'View' },
]

export function Ribbon() {
  const { activeRibbonTab, setActiveRibbonTab } = useEditorStore()

  return (
    <div
      className="bg-ribbon-bg dark:bg-ribbon-bg-dark border-b border-ribbon-border dark:border-ribbon-border-dark"
      role="toolbar"
      aria-label="Ribbon toolbar"
    >
      <Tabs
        value={activeRibbonTab}
        onValueChange={(val) => setActiveRibbonTab(val as ActiveTab)}
      >
        <TabsList className="bg-transparent border-b border-ribbon-border dark:border-ribbon-border-dark px-2 gap-0 h-8">
          {TABS.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className="h-8 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 dark:data-[state=active]:border-blue-400 data-[state=active]:text-blue-700 dark:data-[state=active]:text-blue-400 px-3 text-sm"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="home" className="mt-0">
          <HomeTab />
        </TabsContent>
        <TabsContent value="insert" className="mt-0">
          <InsertTab />
        </TabsContent>
        <TabsContent value="layout" className="mt-0">
          <LayoutTab />
        </TabsContent>
        <TabsContent value="review" className="mt-0">
          <ReviewTab />
        </TabsContent>
        <TabsContent value="view" className="mt-0">
          <ViewTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
