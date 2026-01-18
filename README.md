# LaTeX Editor с компиляцией в PDF

Редактор LaTeX с IntelliSense и возможностью компиляции в PDF.

## Возможности

- ✨ Редактор LaTeX с автодополнением (IntelliSense)
- 📝 Поддержка BibTeX
- 🔄 Компиляция LaTeX в PDF
- 👁️ Просмотр PDF прямо на сайте
- 🎨 Темная и светлая темы

## Требования

Для работы компиляции LaTeX в PDF необходимо установить LaTeX дистрибутив:

### macOS
```bash
# Используя Homebrew
brew install --cask mactex

# Или базовую версию
brew install basictex
```

### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install texlive-full
# Или минимальная версия
sudo apt-get install texlive-latex-base texlive-latex-extra
```

### Windows
Скачайте и установите [MiKTeX](https://miktex.org/) или [TeX Live](https://www.tug.org/texlive/).

## Установка и запуск

```bash
# Установка зависимостей
pnpm install

# Запуск в режиме разработки
pnpm dev

# Сборка для продакшена
pnpm build

# Просмотр собранного проекта
pnpm preview
```

## API Endpoint

### POST `/api/compile`

Компилирует LaTeX код в PDF.

**Запрос:**
```json
{
  "latex": "\\documentclass{article}\\begin{document}Hello World\\end{document}"
}
```

**Ответ:**
- Успех: PDF файл (application/pdf)
- Ошибка: JSON с сообщением об ошибке

## Использование

1. Введите или отредактируйте LaTeX код в редакторе
2. Нажмите кнопку "Скомпилировать в PDF"
3. Дождитесь завершения компиляции
4. Просмотрите результат в окне предпросмотра PDF

## Технологии

- [TanStack Start](https://tanstack.com/start) - Full-stack React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI компоненты
- [Monaco Editor](https://microsoft.github.io/monaco-editor/) - Редактор кода
- [Nitro](https://nitro.unjs.io/) - Backend framework
- LaTeX - Система верстки документов
