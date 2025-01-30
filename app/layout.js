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
            </ul>
          </nav>
        </header>
        <main>{children}</main>
        <footer>© 2025 Lions de l'Atlas. Tous droits réservés.</footer>
      </body>
    </html>
  );
}
