import Header from '@/components/Header';
import Footer from '@/components/Footer';

import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        {/* <header>
          <nav>
            <ul>
              <li><a href="/">Accueil</a></li>

              <li><a href="/evenement1">Événement 1</a></li>
              <li><a href="/evenement2">Événement 2</a></li>
              <li><a href="/about">À propos</a></li>



            </ul>
          </nav>
        </header> */}
        <Header />

        <main>{children}</main>

        <Footer />
        {/* <footer>
          <p>© 2025 Équipe Nationale du Maroc.</p>
        </footer> */}

      </body>
    </html>
  )
}
