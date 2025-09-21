import './globals.css'
import { Providers } from './providers'

export const metadata = {
  title: 'Sletat Tours - Поиск и бронирование туров',
  description: 'Удобный поиск туров от Sletat с актуальными ценами и предложениями',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}