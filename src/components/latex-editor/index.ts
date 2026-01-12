export { LatexEditor, type LatexEditorProps } from './LatexEditor'
export { default } from './LatexEditor'

// Re-export types
export type {
  MacroInfo,
  EnvironmentInfo,
  BibtexEntryInfo,
  BibtexOptionalFields,
  AtSuggestion,
  SnippetInfo,
  LabelItem,
  CitationItem,
  CompletionContext,
  LatexCompletionConfig,
} from './types'

// Re-export completion provider utilities
export {
  createLatexCompletionProvider,
  createBibtexCompletionProvider,
  addLabel,
  removeLabel,
  clearLabels,
  getLabels,
  addCitation,
  removeCitation,
  clearCitations,
  getCitations,
  parseLabelsFromContent,
  parseCitationsFromBibtex,
} from './completion-provider'

// Re-export data
export { macros } from './data/macros'
export { environments, createEnvironmentSnippet } from './data/environments'
export { bibtexEntries, bibtexOptionalFields, createBibtexEntrySnippet, createBibtexFieldSnippet } from './data/bibtex'
export { atSuggestions } from './data/at-suggestions'
export { snippets } from './data/snippets'
