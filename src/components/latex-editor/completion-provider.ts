import type * as Monaco from 'monaco-editor'
import type { LabelItem, CitationItem, LatexCompletionConfig } from './types'
import {
  macros,
  environments,
  createEnvironmentSnippet,
  bibtexEntries,
  bibtexOptionalFields,
  createBibtexEntrySnippet,
  createBibtexFieldSnippet,
  atSuggestions,
  snippets,
} from './data'

// Store for dynamically added labels and citations
const labelStore: LabelItem[] = []
const citationStore: CitationItem[] = []

// Default configuration
const defaultConfig: LatexCompletionConfig = {
  enableMacros: true,
  enableEnvironments: true,
  enableBibtex: true,
  enableReferences: true,
  enableAtSuggestions: true,
  enableSnippets: true,
}

// Regex patterns for context detection
const patterns = {
  // After \begin{
  beginEnv: /\\begin\{([^}]*)$/,
  // After \end{
  endEnv: /\\end\{([^}]*)$/,
  // After backslash for commands
  command: /\\([a-zA-Z*]*)$/,
  // Citation commands: \cite{, \textcite{, etc.
  citation: /\\(?:[a-zA-Z]*[Cc]ite[a-zA-Z]*|textcite|parencite)\{([^}]*)$/,
  // Reference commands: \ref{, \eqref{, \autoref{, etc.
  reference: /\\(?:(?:eq|page|auto|name|c|C)?ref|hyperref\[)\{?([^}\]]*)$/,
  // After @
  atSuggestion: /@([a-zA-Z0-9]*)$/,
  // BibTeX entry type (after @)
  bibtexEntry: /^\s*@([a-zA-Z]*)$/,
  // BibTeX field (at start of line or after comma)
  bibtexField: /^\s*([a-zA-Z]*)$/,
}

/**
 * Convert VSCode-style snippet to Monaco snippet
 * VSCode uses ${1:placeholder}, Monaco uses ${1:placeholder}
 * Both are compatible, but we need to handle $0 as the final cursor position
 */
function convertSnippet(snippet: string): string {
  // Monaco uses $0 for final cursor position, same as VSCode
  return snippet
}

/**
 * Create Monaco CompletionItem from macro
 */
function macroToCompletion(
  monaco: typeof Monaco,
  macro: typeof macros[0],
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  const label = `\\${macro.name}${macro.arg?.format || ''}`
  const insertText = macro.arg?.snippet
    ? convertSnippet(macro.arg.snippet)
    : macro.name

  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label,
    kind: monaco.languages.CompletionItemKind.Function,
    insertText,
    insertTextRules: macro.arg?.snippet ? insertAsSnippetRule : undefined,
    detail: macro.detail,
    documentation: macro.doc,
    range,
    sortText: `0-${macro.name}`, // Sort commands first
  }
}

/**
 * Create Monaco CompletionItem from environment
 */
function environmentToCompletion(
  monaco: typeof Monaco,
  env: typeof environments[0],
  range: Monaco.IRange,
  forBegin: boolean = false
): Monaco.languages.CompletionItem {
  const insertText = forBegin
    ? createEnvironmentSnippet(env)
    : env.name

  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label: env.name,
    kind: monaco.languages.CompletionItemKind.Module,
    insertText: convertSnippet(insertText),
    insertTextRules: forBegin ? insertAsSnippetRule : undefined,
    detail: `\\begin{${env.name}}...\\end{${env.name}}`,
    documentation: `LaTeX environment: ${env.name}`,
    range,
    sortText: `1-${env.name}`,
  }
}

/**
 * Create Monaco CompletionItem from BibTeX entry
 */
function bibtexEntryToCompletion(
  monaco: typeof Monaco,
  entry: typeof bibtexEntries[0],
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label: `@${entry.type}`,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: convertSnippet(createBibtexEntrySnippet(entry)),
    insertTextRules: insertAsSnippetRule,
    detail: `BibTeX entry: ${entry.type}`,
    documentation: `Required fields: ${entry.fields.join(', ')}`,
    range,
    sortText: `0-${entry.type}`,
  }
}

/**
 * Create Monaco CompletionItem from BibTeX field
 */
function bibtexFieldToCompletion(
  monaco: typeof Monaco,
  field: string,
  range: Monaco.IRange,
  isOptional: boolean = false
): Monaco.languages.CompletionItem {
  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label: field,
    kind: monaco.languages.CompletionItemKind.Property,
    insertText: convertSnippet(createBibtexFieldSnippet(field)),
    insertTextRules: insertAsSnippetRule,
    detail: isOptional ? 'Optional field' : 'Required field',
    range,
    sortText: isOptional ? `1-${field}` : `0-${field}`,
  }
}

/**
 * Create Monaco CompletionItem from at-suggestion
 */
function atSuggestionToCompletion(
  monaco: typeof Monaco,
  suggestion: typeof atSuggestions[0],
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label: suggestion.prefix,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: convertSnippet(suggestion.body),
    insertTextRules: insertAsSnippetRule,
    detail: suggestion.description,
    filterText: suggestion.prefix,
    range,
    sortText: `0-${suggestion.prefix}`,
  }
}

/**
 * Create Monaco CompletionItem from snippet
 */
function snippetToCompletion(
  monaco: typeof Monaco,
  snippet: typeof snippets[0],
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  // Monaco CompletionInsertTextRule.InsertAsSnippet = 4
  const insertAsSnippetRule = monaco.languages?.CompletionInsertTextRule?.InsertAsSnippet ?? 4

  return {
    label: snippet.prefix,
    kind: monaco.languages.CompletionItemKind.Snippet,
    insertText: convertSnippet(snippet.body),
    insertTextRules: insertAsSnippetRule,
    detail: snippet.description,
    range,
    sortText: `2-${snippet.prefix}`,
  }
}

/**
 * Create Monaco CompletionItem from label
 */
function labelToCompletion(
  monaco: typeof Monaco,
  label: LabelItem,
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  return {
    label: label.label,
    kind: monaco.languages.CompletionItemKind.Reference,
    insertText: label.label,
    detail: 'Label reference',
    documentation: label.documentation,
    range,
    sortText: `0-${label.label}`,
  }
}

/**
 * Create Monaco CompletionItem from citation
 */
function citationToCompletion(
  monaco: typeof Monaco,
  citation: CitationItem,
  range: Monaco.IRange
): Monaco.languages.CompletionItem {
  const author = citation.fields.get('author') || ''
  const title = citation.fields.get('title') || ''
  const year = citation.fields.get('year') || ''

  return {
    label: citation.key,
    kind: monaco.languages.CompletionItemKind.Reference,
    insertText: citation.key,
    detail: `${author} (${year})`,
    documentation: title,
    range,
    sortText: `0-${citation.key}`,
  }
}

/**
 * Detect the current context from the line content
 */
function detectContext(
  lineContent: string,
  column: number
): {
  type: 'command' | 'beginEnv' | 'endEnv' | 'citation' | 'reference' | 'atSuggestion' | 'bibtexEntry' | 'bibtexField' | 'general'
  match: RegExpMatchArray | null
  prefix: string
} {
  const textBeforeCursor = lineContent.substring(0, column - 1)

  // Check for citation context
  const citationMatch = textBeforeCursor.match(patterns.citation)
  if (citationMatch) {
    return { type: 'citation', match: citationMatch, prefix: citationMatch[1] || '' }
  }

  // Check for reference context
  const referenceMatch = textBeforeCursor.match(patterns.reference)
  if (referenceMatch) {
    return { type: 'reference', match: referenceMatch, prefix: referenceMatch[1] || '' }
  }

  // Check for begin environment
  const beginMatch = textBeforeCursor.match(patterns.beginEnv)
  if (beginMatch) {
    return { type: 'beginEnv', match: beginMatch, prefix: beginMatch[1] || '' }
  }

  // Check for end environment
  const endMatch = textBeforeCursor.match(patterns.endEnv)
  if (endMatch) {
    return { type: 'endEnv', match: endMatch, prefix: endMatch[1] || '' }
  }

  // Check for @ suggestion
  const atMatch = textBeforeCursor.match(patterns.atSuggestion)
  if (atMatch) {
    return { type: 'atSuggestion', match: atMatch, prefix: atMatch[0] }
  }

  // Check for command
  const commandMatch = textBeforeCursor.match(patterns.command)
  if (commandMatch) {
    return { type: 'command', match: commandMatch, prefix: commandMatch[1] || '' }
  }

  // Check for BibTeX entry
  const bibtexEntryMatch = lineContent.trim().match(patterns.bibtexEntry)
  if (bibtexEntryMatch) {
    return { type: 'bibtexEntry', match: bibtexEntryMatch, prefix: bibtexEntryMatch[1] || '' }
  }

  return { type: 'general', match: null, prefix: '' }
}

/**
 * Get completion range for replacement
 */
function getCompletionRange(
  model: Monaco.editor.ITextModel,
  position: Monaco.Position,
  prefix: string,
  includeBackslash: boolean = false
): Monaco.IRange {
  const startColumn = position.column - prefix.length - (includeBackslash ? 1 : 0)
  return {
    startLineNumber: position.lineNumber,
    startColumn: Math.max(1, startColumn),
    endLineNumber: position.lineNumber,
    endColumn: position.column,
  }
}

/**
 * Create the LaTeX completion provider for Monaco
 */
export function createLatexCompletionProvider(
  monaco: typeof Monaco,
  config: Partial<LatexCompletionConfig> = {}
): Monaco.languages.CompletionItemProvider {
  const finalConfig = { ...defaultConfig, ...config }

  return {
    triggerCharacters: ['\\', '{', '@', ','],

    provideCompletionItems(
      model: Monaco.editor.ITextModel,
      position: Monaco.Position
    ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> {
      const lineContent = model.getLineContent(position.lineNumber)
      const context = detectContext(lineContent, position.column)
      const suggestions: Monaco.languages.CompletionItem[] = []

      switch (context.type) {
        case 'citation': {
          if (!finalConfig.enableReferences) break
          const range = getCompletionRange(model, position, context.prefix)
          // Add citation completions from store
          citationStore.forEach(citation => {
            if (citation.key.toLowerCase().startsWith(context.prefix.toLowerCase())) {
              suggestions.push(citationToCompletion(monaco, citation, range))
            }
          })
          break
        }

        case 'reference': {
          if (!finalConfig.enableReferences) break
          const range = getCompletionRange(model, position, context.prefix)
          // Add label completions from store
          labelStore.forEach(label => {
            if (label.label.toLowerCase().startsWith(context.prefix.toLowerCase())) {
              suggestions.push(labelToCompletion(monaco, label, range))
            }
          })
          break
        }

        case 'beginEnv':
        case 'endEnv': {
          if (!finalConfig.enableEnvironments) break
          const range = getCompletionRange(model, position, context.prefix)
          // Add environment completions
          environments.forEach(env => {
            if (env.name.toLowerCase().startsWith(context.prefix.toLowerCase())) {
              suggestions.push(environmentToCompletion(
                monaco,
                env,
                range,
                context.type === 'beginEnv'
              ))
            }
          })
          break
        }

        case 'atSuggestion': {
          if (!finalConfig.enableAtSuggestions) break
          // For @ suggestions, we need to include the @ in the range
          const range = getCompletionRange(model, position, context.prefix.length > 0 ? context.prefix : '@')
          atSuggestions.forEach(suggestion => {
            if (suggestion.prefix.startsWith(context.prefix)) {
              suggestions.push(atSuggestionToCompletion(monaco, suggestion, range))
            }
          })
          break
        }

        case 'bibtexEntry': {
          if (!finalConfig.enableBibtex) break
          const range = getCompletionRange(model, position, context.prefix, true)
          bibtexEntries.forEach(entry => {
            if (entry.type.toLowerCase().startsWith(context.prefix.toLowerCase())) {
              suggestions.push(bibtexEntryToCompletion(monaco, entry, range))
            }
          })
          break
        }

        case 'command': {
          if (!finalConfig.enableMacros) break
          const range = getCompletionRange(model, position, context.prefix)

          // Add macro completions
          macros.forEach(macro => {
            if (macro.name.toLowerCase().startsWith(context.prefix.toLowerCase())) {
              suggestions.push(macroToCompletion(monaco, macro, range))
            }
          })

          // Also add environment completions via \begin
          if ('begin'.startsWith(context.prefix.toLowerCase())) {
            environments.forEach(env => {
              const beginMacro = {
                name: `begin{${env.name}}`,
                arg: {
                  format: '',
                  snippet: createEnvironmentSnippet(env),
                },
                detail: `\\begin{${env.name}}...\\end{${env.name}}`,
              }
              suggestions.push(macroToCompletion(monaco, beginMacro, range))
            })
          }
          break
        }

        case 'general':
        default: {
          // Add snippet completions for general context
          if (finalConfig.enableSnippets) {
            const word = model.getWordAtPosition(position)
            const range = word
              ? {
                  startLineNumber: position.lineNumber,
                  startColumn: word.startColumn,
                  endLineNumber: position.lineNumber,
                  endColumn: word.endColumn,
                }
              : {
                  startLineNumber: position.lineNumber,
                  startColumn: position.column,
                  endLineNumber: position.lineNumber,
                  endColumn: position.column,
                }

            const prefix = word?.word.toLowerCase() || ''
            snippets.forEach(snippet => {
              if (snippet.prefix.toLowerCase().startsWith(prefix)) {
                suggestions.push(snippetToCompletion(monaco, snippet, range))
              }
            })
          }
          break
        }
      }

      return { suggestions }
    },
  }
}

/**
 * Create the BibTeX completion provider for Monaco
 */
export function createBibtexCompletionProvider(
  monaco: typeof Monaco
): Monaco.languages.CompletionItemProvider {
  return {
    triggerCharacters: ['@', '\n', ','],

    provideCompletionItems(
      model: Monaco.editor.ITextModel,
      position: Monaco.Position
    ): Monaco.languages.ProviderResult<Monaco.languages.CompletionList> {
      const lineContent = model.getLineContent(position.lineNumber)
      const suggestions: Monaco.languages.CompletionItem[] = []

      // Check if we're at the start of a new entry
      const entryMatch = lineContent.trim().match(/^@([a-zA-Z]*)$/)
      if (entryMatch) {
        const prefix = entryMatch[1] || ''
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: lineContent.indexOf('@') + 1,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        }

        bibtexEntries.forEach(entry => {
          if (entry.type.toLowerCase().startsWith(prefix.toLowerCase())) {
            suggestions.push(bibtexEntryToCompletion(monaco, entry, range))
          }
        })

        return { suggestions }
      }

      // Check if we're inside an entry and need field completions
      const fieldMatch = lineContent.trim().match(/^\s*([a-zA-Z]*)$/)
      if (fieldMatch && !lineContent.includes('@')) {
        const prefix = fieldMatch[1] || ''
        const range = {
          startLineNumber: position.lineNumber,
          startColumn: position.column - prefix.length,
          endLineNumber: position.lineNumber,
          endColumn: position.column,
        }

        // Find the entry type by searching backwards
        let entryType: string | null = null
        for (let i = position.lineNumber - 1; i >= 1; i--) {
          const line = model.getLineContent(i)
          const match = line.match(/@([a-zA-Z]+)\{/)
          if (match) {
            entryType = match[1].toLowerCase()
            break
          }
        }

        if (entryType) {
          // Get required fields for this entry type
          const entry = bibtexEntries.find(e => e.type === entryType)
          if (entry) {
            entry.fields.forEach(field => {
              if (field.toLowerCase().startsWith(prefix.toLowerCase())) {
                suggestions.push(bibtexFieldToCompletion(monaco, field, range, false))
              }
            })
          }

          // Get optional fields for this entry type
          const optFields = bibtexOptionalFields[entryType]
          if (optFields) {
            optFields.forEach(field => {
              if (field.toLowerCase().startsWith(prefix.toLowerCase())) {
                suggestions.push(bibtexFieldToCompletion(monaco, field, range, true))
              }
            })
          }
        }
      }

      return { suggestions }
    },
  }
}

/**
 * Add a label to the completion store
 */
export function addLabel(label: LabelItem): void {
  const existingIndex = labelStore.findIndex(l => l.label === label.label)
  if (existingIndex >= 0) {
    labelStore[existingIndex] = label
  } else {
    labelStore.push(label)
  }
}

/**
 * Remove a label from the completion store
 */
export function removeLabel(labelText: string): void {
  const index = labelStore.findIndex(l => l.label === labelText)
  if (index >= 0) {
    labelStore.splice(index, 1)
  }
}

/**
 * Clear all labels from the store
 */
export function clearLabels(): void {
  labelStore.length = 0
}

/**
 * Get all labels
 */
export function getLabels(): LabelItem[] {
  return [...labelStore]
}

/**
 * Add a citation to the completion store
 */
export function addCitation(citation: CitationItem): void {
  const existingIndex = citationStore.findIndex(c => c.key === citation.key)
  if (existingIndex >= 0) {
    citationStore[existingIndex] = citation
  } else {
    citationStore.push(citation)
  }
}

/**
 * Remove a citation from the completion store
 */
export function removeCitation(key: string): void {
  const index = citationStore.findIndex(c => c.key === key)
  if (index >= 0) {
    citationStore.splice(index, 1)
  }
}

/**
 * Clear all citations from the store
 */
export function clearCitations(): void {
  citationStore.length = 0
}

/**
 * Get all citations
 */
export function getCitations(): CitationItem[] {
  return [...citationStore]
}

/**
 * Parse labels from LaTeX content and add to store
 */
export function parseLabelsFromContent(content: string, file?: string): void {
  const labelRegex = /\\label\{([^}]+)\}/g
  let match

  while ((match = labelRegex.exec(content)) !== null) {
    const label = match[1]
    // Get surrounding context for documentation
    const startIndex = Math.max(0, match.index - 100)
    const endIndex = Math.min(content.length, match.index + match[0].length + 100)
    const context = content.substring(startIndex, endIndex)

    addLabel({
      label,
      documentation: context,
      file,
    })
  }
}

/**
 * Parse citations from BibTeX content and add to store
 */
export function parseCitationsFromBibtex(content: string): void {
  const entryRegex = /@([a-zA-Z]+)\{([^,]+),/g
  const fieldRegex = /([a-zA-Z]+)\s*=\s*[{"]([^}"]+)[}"]/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(content)) !== null) {
    const key = entryMatch[2].trim()
    const fields = new Map<string, string>()

    // Find the end of this entry
    let braceCount = 1
    let entryEnd = entryMatch.index + entryMatch[0].length
    for (let i = entryEnd; i < content.length && braceCount > 0; i++) {
      if (content[i] === '{') braceCount++
      if (content[i] === '}') braceCount--
      entryEnd = i
    }

    // Extract fields from this entry
    const entryContent = content.substring(entryMatch.index, entryEnd + 1)
    let fieldMatch

    while ((fieldMatch = fieldRegex.exec(entryContent)) !== null) {
      fields.set(fieldMatch[1].toLowerCase(), fieldMatch[2])
    }

    addCitation({ key, fields })
  }
}
