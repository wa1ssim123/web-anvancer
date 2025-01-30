import './globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <header>
          <nav>
            <ul>
              <li><a href="/">Accueil</a></li>

              <li><a href="/evenement1">Événement 1</a></li>
              <li><a href="/evenement2">Événement 2</a></li>
              <li><a href="/about">À propos</a></li>

              <li><a href="/evenement1">Évènement 1</a></li>
              <li><a href="/evenement2">Évènement 2</a></li>

            </ul>
          </nav>
        </header>
        <main>{children}</main>

        
        <footer>
          <p>© 2025 Équipe Nationale du Maroc. Tous droits réservés.</p>
        </footer>

      </body>
    </html>
  )
}
