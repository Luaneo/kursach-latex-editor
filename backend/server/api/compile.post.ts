import { exec } from 'node:child_process'
import { promisify } from 'node:util'
import { writeFile, mkdir, readFile, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { randomUUID } from 'node:crypto'
import { defineEventHandler, readBody, createError, setHeader } from 'h3'

const execAsync = promisify(exec)

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event)
    const latexCode = body.latex || body.code

    if (!latexCode || typeof latexCode !== 'string') {
      throw createError({
        statusCode: 400,
        message: 'LaTeX code is required',
      })
    }

    // Create a unique temporary directory for this compilation
    const workDir = join(tmpdir(), `latex-compile-${randomUUID()}`)
    await mkdir(workDir, { recursive: true })

    try {
      // Write LaTeX code to a .tex file
      const texFile = join(workDir, 'document.tex')
      await writeFile(texFile, latexCode, 'utf-8')

      // Compile LaTeX to PDF using pdflatex
      // Run twice to resolve references
      const pdfPath = join(workDir, 'document.pdf')
      const compileCommand = `pdflatex -interaction=nonstopmode -output-directory="${workDir}" "${texFile}"`
      
      try {
        await execAsync(compileCommand, { cwd: workDir, maxBuffer: 10 * 1024 * 1024 })
        // Run again to resolve references
        await execAsync(compileCommand, { cwd: workDir, maxBuffer: 10 * 1024 * 1024 })
      } catch (error: any) {
        // Check if pdflatex command exists
        if (error.code === 'ENOENT' || error.message?.includes('pdflatex')) {
          throw createError({
            statusCode: 500,
            message: 'pdflatex не установлен. Пожалуйста, установите LaTeX (например, TeX Live или MiKTeX)',
          })
        }
        
        // pdflatex may return non-zero exit code even on success with nonstopmode
        // Check if PDF was actually created
        try {
          await readFile(pdfPath)
        } catch {
          // PDF doesn't exist, compilation failed
          const errorOutput = error.stderr || error.stdout || error.message
          throw createError({
            statusCode: 500,
            message: `Ошибка компиляции LaTeX: ${errorOutput}`,
          })
        }
      }

      // Read the generated PDF
      const pdfBuffer = await readFile(pdfPath)

      // Clean up temporary files
      await rm(workDir, { recursive: true, force: true })

      // Return PDF as binary
      setHeader(event, 'Content-Type', 'application/pdf')
      setHeader(event, 'Content-Disposition', 'inline; filename="document.pdf"')
      
      return pdfBuffer
    } catch (error: any) {
      // Clean up on error
      await rm(workDir, { recursive: true, force: true }).catch(() => {})
      throw error
    }
  } catch (error: any) {
    if (error.statusCode) {
      throw error
    }
    throw createError({
      statusCode: 500,
      statusMessage: error.message || 'Internal server error',
      message: error.message || 'Internal server error',
    })
  }
})

