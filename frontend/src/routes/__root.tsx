import {
  HeadContent,
  Scripts,
  createRootRoute,
  Link,
} from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'
import { FileQuestion, Home } from 'lucide-react'
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import { api } from '../../convex/_generated/api';

import appCss from '../styles.css?url'
import { ThemeProvider } from '@/components/theme-provider'
import { Button } from '@/components/ui/button'
import { LoginButton } from '@/components/login-button'

const convex = new ConvexReactClient(import.meta.env.VITE_CONVEX_URL || 'http://127.0.0.1:3210');

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'LaTeX Editor' },
    ],
    links: [{ rel: 'stylesheet', href: appCss }],
  }),

  shellComponent: RootDocument,
  notFoundComponent: NotFound,
})

function NotFound() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="inline-flex items-center justify-center size-16 rounded-full bg-muted mb-6">
          <FileQuestion className="size-8 text-muted-foreground" />
        </div>
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-muted-foreground mb-6">
          Страница не найдена. Возможно, она была перемещена или удалена.
        </p>
        <Button>
          <Link to="/">
            <Home className="size-4" />
            На главную
          </Link>
        </Button>
      </div>
    </div>
  )
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ConvexProvider client={convex}>
          <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            {/* Кнопка авторизации сверху страницы */}
            <div className="p-4 bg-muted flex justify-end">
              <LoginButton />
            </div>

            {/* Основной контент страницы */}
            <div>{children}</div>
          </ThemeProvider>
        </ConvexProvider>

        <TanStackDevtools
          config={{ position: 'bottom-right' }}
          plugins={[
            {
              name: 'Tanstack Router',
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  )
}

