import styles from './Footer.module.css' // importer pour le style
export default function Footer() {

    return <footer className={styles.footer}>

        <div className={styles.auteurs}>
            &copy; Aurelie Tenesso &  | Programmeurs Web
        </div>
        <div>
            A propos  |  Blog  |  Cookies   | Evenements  | Contacts  |  FAQ
        </div>
    </footer>
}