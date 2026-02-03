import { Inter, Poppins } from 'next/font/google'
import './globals.css'

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800', '900'], 
  subsets: ['latin'], 
  variable: '--font-poppins' 
})
const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata = {
  title: 'HACKATHON PORTAL',
  description: 'Easy Pitch Deck Creator.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${poppins.variable} ${inter.variable}`}>
       <body className="font-sans antialiased text-slate-900">{children}</body>
    </html>
  )
}// FORCE DEPLOY: Tue Feb  3 21:07:10 IST 2026
// TRIGGER DEPLOY: Tue Feb  3 21:35:37 IST 2026
