import { Outfit } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'] })

export const metadata = {
  title: 'hack@jit | Institutional Innovation Engine',
  description: 'High-fidelity synthesis platform for rapid deployment cycles.',
}
export default function RootLayout({ children }) {
  return (
    <html lang="en" className={outfit.className}>
      <body>{children}</body>
    </html>
  )
}