import { Inter, Outfit, Roboto } from 'next/font/google'
import './globals.css'

const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' })
const roboto = Roboto({ weight: ['400', '700', '900'], subsets: ['latin'], variable: '--font-roboto' })
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'hack@jit | Institutional Innovation Engine',
  description: 'High-fidelity synthesis platform for rapid deployment cycles.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${outfit.variable} ${roboto.variable} ${inter.variable}`}>
       <body className="font-sans">{children}</body>
    </html>
  )
}