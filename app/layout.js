import Header from '@/components/Header';
import Footer from '@/components/Footer';

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <Header />
        <main>{children}</main>
        <Footer />

      </body>
    </html>
  )
}
