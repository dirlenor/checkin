import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Match',
  description: 'Match - ระบบบันทึกเวลาทำงาน',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  themeColor: '#000000',
  manifest: '/manifest.json'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="th">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="min-h-screen px-layout-x py-layout-y bg-bg-dark">{children}</body>
    </html>
  )
}
