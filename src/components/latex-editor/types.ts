import type * as monaco from 'monaco-editor'

// LaTeX macro/command type
export interface MacroInfo {
  name: string
  arg?: {
    format: string
    snippet: string
  }
  detail?: string
  doc?: string
  action?: string
}

// LaTeX environment type
export interface EnvironmentInfo {
  name: string
  arg?: {
    format: string
    snippet: string
  }
}

// BibTeX entry type
export interface BibtexEntryInfo {
  type: string
  fields: string[]
}

// BibTeX optional fields
export interface BibtexOptionalFields {
  [entryType: string]: string[]
}

// At-suggestion (shortcuts like @a -> \alpha)
export interface AtSuggestion {
  prefix: string
  body: string
  description: string
}

// Snippet type (BEQ, BIT, etc.)
export interface SnippetInfo {
  prefix: string
  body: string
  description: string
}

// Label item for references
export interface LabelItem {
  label: string
  documentation?: string
  file?: string
}

// Citation item from .bib files
export interface CitationItem {
  key: string
  fields: Map<string, string>
}

// Completion context for determining what completions to show
export interface CompletionContext {
  line: string
  position: monaco.Position
  wordRange?: monaco.Range
  triggerCharacter?: string
}

// Completion provider configuration
export interface LatexCompletionConfig {
  enableMacros: boolean
  enableEnvironments: boolean
  enableBibtex: boolean
  enableReferences: boolean
  enableAtSuggestions: boolean
  enableSnippets: boolean
}
