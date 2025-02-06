import Link from 'next/link';

export default function Header() {
  return (
    <header style={{ backgroundColor: '#c1272d', padding: '10px', textAlign: 'center' }}>
      <nav>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', justifyContent: 'center', gap: '20px' }}>
          <li><Link href="/">Accueil</Link></li>
          <li><Link href="/events/worldcup">Coupe du Monde</Link></li>
          <li><Link href="/events/africancup">Coupe d'Afrique</Link></li>
          <li><Link href="/events/apropos">À propos</Link></li>
        </ul>
      </nav>
    </header>
  );
}
