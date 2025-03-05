import ImageCarroussel from './ImageCarroussel';
import styles from './ImageContainer.module.css'; 
import pavillon_de_lexcentricite from "@/public/pavillon_de_lexcentricite.jpg";
import salle1 from "@/public/salle1.png";
import salle2 from "@/public/salle2.png";
import salle3 from "@/public/salle3.png";
import salle_photographie from "@/public/salle_photographie.png";
import salle_telepresence from "@/public/salle_telepresence.png";
import labo_infos from "@/public/labo_infos.png";
import salle_audiovisuelle from "@/public/salle_audiovisuelle.png";




export default function ImageContainer() {
    const images = [pavillon_de_lexcentricite, salle_audiovisuelle, salle_photographie, salle1, labo_infos, salle2, salle_telepresence, salle3]; 

    return (
        <div className={styles.salle_accueil}>
            <ImageCarroussel images={images} />
        </div>
    );
}
