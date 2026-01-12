import { useRef, useEffect, useCallback, useState } from 'react'
import type { Monaco, OnMount } from '@monaco-editor/react'
import type * as MonacoEditor from 'monaco-editor'
import {
  createLatexCompletionProvider,
  createBibtexCompletionProvider,
  parseLabelsFromContent,
  parseCitationsFromBibtex,
  clearLabels,
  clearCitations,
} from './completion-provider'
import type { LatexCompletionConfig } from './types'

export interface LatexEditorProps {
  /** Initial value of the editor */
  value?: string
  /** Callback when content changes */
  onChange?: (value: string | undefined) => void
  /** Editor height */
  height?: string | number
  /** Editor theme: 'vs-dark', 'light', or custom theme name */
  theme?: string
  /** Language: 'latex' or 'bibtex' */
  language?: 'latex' | 'bibtex'
  /** IntelliSense configuration */
  completionConfig?: Partial<LatexCompletionConfig>
  /** BibTeX content for citation completions */
  bibtexContent?: string
  /** Additional CSS class */
  className?: string
  /** Read-only mode */
  readOnly?: boolean
  /** Monaco editor options */
  options?: MonacoEditor.editor.IStandaloneEditorConstructionOptions
}

// Store for disposal
let latexCompletionDisposable: MonacoEditor.IDisposable | null = null
let bibtexCompletionDisposable: MonacoEditor.IDisposable | null = null

/**
 * Register LaTeX language with Monaco if not already registered
 */
function registerLatexLanguage(monaco: Monaco) {
  // Check if latex language is already registered
  const languages = monaco.languages.getLanguages()
  const hasLatex = languages.some((lang: { id: string }) => lang.id === 'latex')

  if (!hasLatex) {
    // Register the latex language
    monaco.languages.register({ id: 'latex', extensions: ['.tex', '.ltx', '.sty', '.cls'] })

    // Set language configuration for LaTeX
    monaco.languages.setLanguageConfiguration('latex', {
      comments: {
        lineComment: '%',
      },
      brackets: [
        ['{', '}'],
        ['[', ']'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '$', close: '$' },
        { open: '`', close: "'" },
        { open: '"', close: '"' },
      ],
      surroundingPairs: [
        { open: '{', close: '}' },
        { open: '[', close: ']' },
        { open: '(', close: ')' },
        { open: '$', close: '$' },
        { open: '`', close: "'" },
      ],
      folding: {
        markers: {
          start: /\\begin\{/,
          end: /\\end\{/,
        },
      },
    })

    // Set up syntax highlighting for LaTeX
    monaco.languages.setMonarchTokensProvider('latex', {
      defaultToken: '',
      tokenPostfix: '.latex',

      keywords: [
        'begin', 'end', 'documentclass', 'usepackage', 'newcommand', 'renewcommand',
        'section', 'subsection', 'subsubsection', 'chapter', 'part',
        'title', 'author', 'date', 'maketitle',
        'textbf', 'textit', 'emph', 'underline',
        'cite', 'ref', 'label', 'caption',
        'includegraphics', 'input', 'include',
      ],

      brackets: [
        { open: '{', close: '}', token: 'delimiter.curly' },
        { open: '[', close: ']', token: 'delimiter.bracket' },
        { open: '(', close: ')', token: 'delimiter.parenthesis' },
      ],

      tokenizer: {
        root: [
          // Comments
          [/%.*$/, 'comment'],

          // Math mode
          [/\$\$/, { token: 'string.math', next: '@mathDisplay' }],
          [/\$/, { token: 'string.math', next: '@mathInline' }],
          [/\\\[/, { token: 'string.math', next: '@mathDisplay' }],
          [/\\\(/, { token: 'string.math', next: '@mathInline' }],

          // Commands
          [/\\[a-zA-Z@]+\*?/, {
            cases: {
              '@keywords': 'keyword',
              '@default': 'tag',
            }
          }],

          // Special characters
          [/\\[{}$%&_#~^]/, 'string.escape'],

          // Environments
          [/\\begin\{([^}]+)\}/, 'keyword'],
          [/\\end\{([^}]+)\}/, 'keyword'],

          // Brackets
          [/[{}[\]()]/, '@brackets'],

          // Numbers
          [/\d+/, 'number'],
        ],

        mathInline: [
          [/[^$\\]+/, 'string.math'],
          [/\\\$/, 'string.math'],
          [/\\[a-zA-Z]+/, 'string.math.command'],
          [/\$/, { token: 'string.math', next: '@pop' }],
        ],

        mathDisplay: [
          [/[^$\\]+/, 'string.math'],
          [/\\\$/, 'string.math'],
          [/\\[a-zA-Z]+/, 'string.math.command'],
          [/\$\$/, { token: 'string.math', next: '@pop' }],
          [/\\\]/, { token: 'string.math', next: '@pop' }],
        ],
      },
    })
  }

  // Check if bibtex language is already registered
  const hasBibtex = languages.some((lang: { id: string }) => lang.id === 'bibtex')

  if (!hasBibtex) {
    // Register the bibtex language
    monaco.languages.register({ id: 'bibtex', extensions: ['.bib'] })

    // Set language configuration for BibTeX
    monaco.languages.setLanguageConfiguration('bibtex', {
      comments: {
        lineComment: '%',
      },
      brackets: [
        ['{', '}'],
        ['(', ')'],
      ],
      autoClosingPairs: [
        { open: '{', close: '}' },
        { open: '(', close: ')' },
        { open: '"', close: '"' },
      ],
    })

    // Set up syntax highlighting for BibTeX
    monaco.languages.setMonarchTokensProvider('bibtex', {
      defaultToken: '',
      tokenPostfix: '.bibtex',

      entryTypes: [
        'article', 'book', 'booklet', 'conference', 'inbook', 'incollection',
        'inproceedings', 'manual', 'mastersthesis', 'misc', 'phdthesis',
        'proceedings', 'techreport', 'unpublished', 'online',
      ],

      tokenizer: {
        root: [
          // Comments
          [/%.*$/, 'comment'],

          // Entry types
          [/@[a-zA-Z]+/, {
            cases: {
              '@entryTypes': 'keyword',
              '@default': 'tag',
            }
          }],

          // Keys and fields
          [/[a-zA-Z_][a-zA-Z0-9_]*\s*=/, 'variable'],

          // Strings
          [/"[^"]*"/, 'string'],
          [/\{[^{}]*\}/, 'string'],

          // Brackets
          [/[{}()]/, '@brackets'],

          // Numbers
          [/\d+/, 'number'],
        ],
      },
    })
  }
}

/**
 * Register completion providers
 */
function registerCompletionProviders(
  monaco: Monaco,
  completionConfig?: Partial<LatexCompletionConfig>
) {
  // Dispose existing providers
  if (latexCompletionDisposable) {
    latexCompletionDisposable.dispose()
    latexCompletionDisposable = null
  }
  if (bibtexCompletionDisposable) {
    bibtexCompletionDisposable.dispose()
    bibtexCompletionDisposable = null
  }

  // Register LaTeX completion provider
  latexCompletionDisposable = monaco.languages.registerCompletionItemProvider(
    'latex',
    createLatexCompletionProvider(monaco, completionConfig)
  )

  // Register BibTeX completion provider
  bibtexCompletionDisposable = monaco.languages.registerCompletionItemProvider(
    'bibtex',
    createBibtexCompletionProvider(monaco)
  )
}

/**
 * LaTeX Editor component with IntelliSense support
 */
export function LatexEditor({
  value = '',
  onChange,
  height = '400px',
  theme = 'vs-dark',
  language = 'latex',
  completionConfig,
  bibtexContent,
  className,
  readOnly = false,
  options,
}: LatexEditorProps) {
  const editorRef = useRef<MonacoEditor.editor.IStandaloneCodeEditor | null>(null)
  const monacoRef = useRef<Monaco | null>(null)
  const [Editor, setEditor] = useState<typeof import('@monaco-editor/react').default | null>(null)

  // Dynamically import Editor only on client side
  useEffect(() => {
    import('@monaco-editor/react').then((mod) => {
      setEditor(() => mod.default)
    })
  }, [])

  // Handle editor mount
  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor
    monacoRef.current = monaco

    // Register language and completion providers
    registerLatexLanguage(monaco)
    registerCompletionProviders(monaco, completionConfig)

    // Parse initial content for labels
    if (language === 'latex' && value) {
      parseLabelsFromContent(value)
    }

    // Parse bibtex content for citations
    if (bibtexContent) {
      parseCitationsFromBibtex(bibtexContent)
    }
  }, [completionConfig, language, value, bibtexContent])

  // Update labels when content changes
  const handleEditorChange = useCallback((newValue: string | undefined) => {
    if (language === 'latex' && newValue) {
      // Clear and re-parse labels
      clearLabels()
      parseLabelsFromContent(newValue)
    }

    onChange?.(newValue)
  }, [language, onChange])

  // Update citations when bibtex content changes
  useEffect(() => {
    if (bibtexContent) {
      clearCitations()
      parseCitationsFromBibtex(bibtexContent)
    }
  }, [bibtexContent])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (latexCompletionDisposable) {
        latexCompletionDisposable.dispose()
        latexCompletionDisposable = null
      }
      if (bibtexCompletionDisposable) {
        bibtexCompletionDisposable.dispose()
        bibtexCompletionDisposable = null
      }
    }
  }, [])

  // Show loading state while Editor is loading
  if (!Editor) {
    const bgClass = theme === 'light' ? 'bg-white' : 'bg-[#1e1e1e]'
    return (
      <div
        style={{ height: typeof height === 'number' ? `${height}px` : height }}
        className={`flex items-center justify-center ${bgClass} ${className || ''}`}
      >
        <div className="flex flex-col items-center gap-3">
          <div className="size-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <span className="text-muted-foreground text-sm">Загрузка редактора...</span>
        </div>
      </div>
    )
  }

  return (
    <Editor
      height={height}
      defaultLanguage={language}
      language={language}
      value={value}
      theme={theme}
      onChange={handleEditorChange}
      onMount={handleEditorDidMount}
      className={className}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
        wordWrap: 'on',
        automaticLayout: true,
        scrollBeyondLastLine: false,
        readOnly,
        suggestOnTriggerCharacters: true,
        quickSuggestions: {
          other: true,
          comments: false,
          strings: true,
        },
        acceptSuggestionOnCommitCharacter: true,
        tabCompletion: 'on',
        wordBasedSuggestions: 'off',
        parameterHints: { enabled: true },
        suggest: {
          showKeywords: true,
          showSnippets: true,
          showFunctions: true,
          showModules: true,
          insertMode: 'replace',
        },
        ...options,
      }}
    />
  )
}

export default LatexEditor
