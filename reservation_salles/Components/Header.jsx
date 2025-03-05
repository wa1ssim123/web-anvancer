import styles from './Header.module.css' // importer pour le style
import Link from 'next/link';
import Image from 'next/image';
import logo from '@/public/logo.jpg';

export default function Header() {

    return <header className={styles.header}>

        <div>
        <Image src={logo} alt="Logo" className={styles.logo}/>
        </div>
        <nav className={styles.navigation}>
            <Link href="/" className={styles.nav_link}>ACCUEIL</Link>
            <Link href="/A_propos" className={styles.nav_link}>A propos de Nous</Link>
            <Link href="/reserver" className={styles.nav_link}>Reserver une salle</Link>
            <Link href="/contact" className={styles.nav_link}>Contact</Link>
        </nav>

    </header>

}