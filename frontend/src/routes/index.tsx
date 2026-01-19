import { useState } from 'react'
import * as React from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { LatexEditor } from '@/components/latex-editor'
import { ModeToggle } from '@/components/mode-toggle'
import { useTheme } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { FileText, BookOpen, Code, Keyboard, Link, Database, FileDown, Loader2 } from 'lucide-react'

export const Route = createFileRoute('/')({ component: App })

// Sample LaTeX content to demonstrate IntelliSense
const defaultLatexContent = `\\documentclass{article}
\\usepackage{amsmath}
\\usepackage{graphicx}

\\title{My LaTeX Document}
\\author{Author Name}
\\date{\\today}

\\begin{document}

\\maketitle

\\section{Introduction}
\\label{sec:intro}

This is an example document demonstrating LaTeX IntelliSense.

\\subsection{Math Example}
\\label{sec:math}

Here is an equation:
\\begin{equation}
  E = mc^2
  \\label{eq:einstein}
\\end{equation}

You can reference Equation~\\ref{eq:einstein} or Section~\\ref{sec:intro}.

\\section{Conclusion}

Type \\\\ to see command completions, @ for shortcuts (e.g., @a for \\alpha).

\\end{document}
`

// Sample BibTeX content for citation completions
const defaultBibtexContent = `@article{einstein1905,
  author = {Albert Einstein},
  title = {On the Electrodynamics of Moving Bodies},
  journal = {Annalen der Physik},
  year = {1905},
  volume = {17},
  pages = {891-921}
}

@book{knuth1984,
  author = {Donald E. Knuth},
  title = {The TeXbook},
  publisher = {Addison-Wesley},
  year = {1984}
}

@inproceedings{lamport1986,
  author = {Leslie Lamport},
  title = {LaTeX: A Document Preparation System},
  booktitle = {Proceedings of the Conference},
  year = {1986}
}
`

function App() {
  const [latexContent, setLatexContent] = useState(defaultLatexContent)
  const [bibtexContent, setBibtexContent] = useState(defaultBibtexContent)
  const [activeTab, setActiveTab] = useState<'latex' | 'bibtex'>('latex')
  const [isCompiling, setIsCompiling] = useState(false)
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [compileError, setCompileError] = useState<string | null>(null)
  const { theme } = useTheme()

  // Determine Monaco editor theme based on current theme
  const editorTheme = theme === 'light' ? 'light' : 'vs-dark'

  const handleCompile = async () => {
    if (activeTab !== 'latex') return

    setIsCompiling(true)
    setCompileError(null)
    setPdfUrl(null)

    try {
      const response = await fetch('/api/compile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latex: latexContent }),
      })

      if (!response.ok) {
        let errorMessage = 'Ошибка компиляции LaTeX'
        try {
          const contentType = response.headers.get('content-type')
          if (contentType?.includes('application/json')) {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } else {
            const errorText = await response.text()
            errorMessage = errorText || errorMessage
          }
        } catch {
          // If parsing fails, use default message
        }
        throw new Error(errorMessage)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setPdfUrl(url)
    } catch (error: any) {
      setCompileError(error.message || 'Произошла ошибка при компиляции')
      console.error('Compilation error:', error)
    } finally {
      setIsCompiling(false)
    }
  }

  // Clean up PDF URL when component unmounts
  React.useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl)
      }
    }
  }, [pdfUrl])

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <FileText className="size-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  LaTeX Editor
                </h1>
                <p className="text-muted-foreground text-sm">
                  Редактор с IntelliSense из LaTeX Workshop
                </p>
              </div>
            </div>
            <ModeToggle />
          </div>
        </header>

        {/* Tab buttons */}
        <div className="flex items-center gap-2 mb-4">
          <Button
            variant={activeTab === 'latex' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('latex')}
          >
            <FileText className="size-3.5" />
            LaTeX (.tex)
          </Button>
          <Button
            variant={activeTab === 'bibtex' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveTab('bibtex')}
          >
            <Database className="size-3.5" />
            BibTeX (.bib)
          </Button>
          <Separator orientation="vertical" className="h-6 mx-2" />
          <Badge variant="secondary">
            {activeTab === 'latex' ? 'Редактирование документа' : 'Редактирование библиографии'}
          </Badge>
          {activeTab === 'latex' && (
            <>
              <Separator orientation="vertical" className="h-6 mx-2" />
              <Button
                onClick={handleCompile}
                disabled={isCompiling}
                size="sm"
                className="ml-auto"
              >
                {isCompiling ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin" />
                    Компиляция...
                  </>
                ) : (
                  <>
                    <FileDown className="size-3.5" />
                    Скомпилировать в PDF
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        {/* Editor container */}
        <Card className="mb-8 overflow-hidden">
          <CardContent className="p-0">
            {activeTab === 'latex' ? (
              <LatexEditor
                value={latexContent}
                onChange={(value) => setLatexContent(value || '')}
                language="latex"
                height="480px"
                theme={editorTheme}
                bibtexContent={bibtexContent}
              />
            ) : (
              <LatexEditor
                value={bibtexContent}
                onChange={(value) => setBibtexContent(value || '')}
                language="bibtex"
                height="480px"
                theme={editorTheme}
              />
            )}
          </CardContent>
        </Card>

        {/* PDF Preview */}
        {(pdfUrl || compileError) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Результат компиляции</CardTitle>
              {compileError && (
                <CardDescription className="text-destructive">
                  {compileError}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {pdfUrl && (
                <div className="w-full border rounded-lg overflow-hidden bg-muted/50">
                  <iframe
                    src={pdfUrl}
                    className="w-full"
                    style={{ height: '600px', border: 'none' }}
                    title="PDF Preview"
                  />
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Help section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Keyboard className="size-5 text-primary" />
            Быстрые подсказки
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <HelpCard
              icon={<Code className="size-4" />}
              title="Команды LaTeX"
              description="Введите \ для просмотра доступных команд"
              examples={[
                { code: '\\section{}', desc: 'секция' },
                { code: '\\textbf{}', desc: 'жирный' },
                { code: '\\frac{}{}', desc: 'дробь' },
              ]}
            />
            <HelpCard
              icon={<BookOpen className="size-4" />}
              title="Окружения"
              description="Введите \begin{ для выбора окружения"
              examples={[
                { code: 'equation', desc: 'формула' },
                { code: 'align', desc: 'выравнивание' },
                { code: 'itemize', desc: 'список' },
              ]}
            />
            <HelpCard
              icon={<Keyboard className="size-4" />}
              title="@ Сокращения"
              description="Введите @ для быстрого ввода символов"
              examples={[
                { code: '@a', desc: '→ \\alpha (α)' },
                { code: '@/', desc: '→ \\frac{}{}' },
                { code: '@8', desc: '→ \\infty (∞)' },
              ]}
            />
            <HelpCard
              icon={<FileText className="size-4" />}
              title="Сниппеты"
              description="Введите префикс для вставки шаблона"
              examples={[
                { code: 'BEQ', desc: '→ equation' },
                { code: 'BIT', desc: '→ itemize' },
                { code: 'BFI', desc: '→ figure' },
              ]}
            />
            <HelpCard
              icon={<Link className="size-4" />}
              title="Ссылки"
              description="Автодополнение для \ref{} и \cite{}"
              examples={[
                { code: '\\ref{}', desc: 'ссылка на label' },
                { code: '\\cite{}', desc: 'цитирование' },
                { code: '\\eqref{}', desc: 'ссылка на формулу' },
              ]}
            />
            <HelpCard
              icon={<Database className="size-4" />}
              title="BibTeX"
              description="Введите @ для создания записи"
              examples={[
                { code: '@article', desc: 'статья' },
                { code: '@book', desc: 'книга' },
                { code: '@inproceedings', desc: 'конференция' },
              ]}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

function HelpCard({
  icon,
  title,
  description,
  examples,
}: {
  icon: React.ReactNode
  title: string
  description: string
  examples: { code: string; desc: string }[]
}) {
  return (
    <Card size="sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {examples.map((example, i) => (
            <div
              key={i}
              className="flex items-center justify-between gap-2 text-xs"
            >
              <code className="bg-muted px-1.5 py-0.5 rounded font-mono text-foreground">
                {example.code}
              </code>
              <span className="text-muted-foreground truncate">
                {example.desc}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
