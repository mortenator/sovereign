// Ambient global type declarations (no export/import = global scope)

interface OODocumentConfig {
  fileType: string;
  key: string;
  title: string;
  url: string;
  permissions?: {
    comment?: boolean;
    download?: boolean;
    edit?: boolean;
    print?: boolean;
    review?: boolean;
  };
}

interface OOEditorConfig {
  callbackUrl?: string;
  lang?: string;
  user?: {
    id: string;
    name: string;
  };
  customization?: {
    autosave?: boolean;
    chat?: boolean;
    comments?: boolean;
    compactHeader?: boolean;
    compactToolbar?: boolean;
    compatibleFeatures?: boolean;
    feedback?: boolean;
    forcesave?: boolean;
    help?: boolean;
    hideRightMenu?: boolean;
    hideRulers?: boolean;
    macros?: boolean;
    plugins?: boolean;
    toolbarNoTabs?: boolean;
    uiTheme?: string;
    unit?: string;
    zoom?: number;
  };
}

interface OOEditorEvents {
  onAppReady?: () => void;
  onDocumentReady?: () => void;
  onDocumentStateChange?: (event: { data: boolean }) => void;
  onError?: (event: { data: { errorCode: number; errorDescription: string } }) => void;
  onInfo?: (event: { data: { mode: string } }) => void;
  onMetaChange?: (event: { data: { favorite: boolean; title: string } }) => void;
  onWarning?: (event: { data: { warningCode: number; warningDescription: string } }) => void;
}

interface OOConfig {
  document: OODocumentConfig;
  documentType: 'word' | 'cell' | 'slide';
  editorConfig?: OOEditorConfig;
  events?: OOEditorEvents;
  height?: string;
  token?: string;
  type?: 'desktop' | 'mobile' | 'embedded';
  width?: string;
}

interface OOEditor {
  destroyEditor(): void;
  downloadAs(format: string): void;
  getConfig(): OOConfig;
  print(): void;
  requestClose(): void;
  requestSave(): void;
}

// Augment the global Window interface
interface Window {
  DocsAPI?: {
    DocEditor: new (elementId: string, config: OOConfig) => OOEditor;
  };
  editor?: OOEditor;
}
