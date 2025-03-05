/* on le supprime import image */ // import Image from "next/image";
import styles from "./page.module.css";
import ImageContainer from "@/Components/ImageContainer";
import Link from "next/link";
import Image from "next/image";
import image_traitee1 from "@/public/image_traitee1.png";
import Logo_UniversiteLaval from "@/public/partenaires/Logo_UniversiteLaval.jpg";
import consortium from "@/public/partenaires/consortium.png";
import gouvernement from "@/public/partenaires/gouvernement.png";
import cite from "@/public/partenaires/cite.png";
import regina from "@/public/partenaires/regina.png";

export default function Accueil() {
  // on peu changer le Home en Accueil pournnotre page daccueil
  return <>
    <div className={styles.bloc}>
        <div className={styles.reservation}>
            <h1>
                La plateforme de réservation des salles par excellence
            </h1>
            <p className={styles.texte}>
                <span>Réserver facilement...</span>
                <span>Rapidement</span>
                <span>Sans Conflit</span>
                <span>Avec visibilité et transparence</span>
            </p>
            <p className={styles.slogan}>
            GDSR, Prenez du plaisir à réserver en un clic😊
            </p> 
            <Link href="/consulter">
                 <button className={styles.button}>Consulter nos salles</button>
            </Link>
        </div>
        <ImageContainer/>
    
    </div>
    <div className={styles.partenaires}>
        <Image src={regina} alt="regina" className={styles.image} />
        <Image src={cite} alt="cite"  className={styles.image}  />
        <Image src={gouvernement} alt="gouvernement"  className={styles.image} />
        <Image src={consortium} alt="consortium"   className={styles.image} />
        <Image src={Logo_UniversiteLaval} alt="laval"  className={styles.image}  />
    </div>
  
    <div className={styles.bloc2}>
        <div className={styles.image_container}>
            <Image src={image_traitee1} alt="image traitée 1" className={styles.image_traitee1}  /> 
        </div>
        <div  className={styles.bloc2_texte}>
        <h2> Trouvez facilement des salles adaptées à vos besoins </h2>
        <p>
         Localiser et réserver facilement des salles grâce à un plan interactif de nos locaux. 
         Filtrez les salles en fonction de l'heure, de l'emplacement, de la capacité et des ressources disponibles pour une productivité maximale.
         Epargnez vous des maux de tête liés à la discussion des salles et réserver en toute simplicité.
        </p>
        <Link href="/consulter">
                 <button className={styles.button2}>Visiter</button>
            </Link>
        </div>

    </div>
   

  </>

}
