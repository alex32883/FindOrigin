import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'FindOrigin Bot',
  description: 'Telegram bot for finding information sources',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  )
}
