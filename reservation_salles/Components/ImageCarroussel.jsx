"use client"
// Nous allons utiliser ce composant pour afficher les images en defilement
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import styles from "./ImageCarroussel.module.css"

const ImageCarroussel = ({ images }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Fonction pour changer l'image
  const changeImage = () => {
    setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length); // Cycle à travers les images
  };

  // Utilise setInterval pour changer l'image toutes les 3 secondes
  useEffect(() => {
    const interval = setInterval(changeImage, 3000);
    return () => clearInterval(interval); // Nettoie l'intervalle quand le composant est démonté
  }, []);

  return (
    <div className={styles.image_container} style={{ position: 'relative', width: '100%', height: '400px', overflow: 'hidden' }}>
      {images.map((image, index) => (
        <Image
          key={index}
          src={image}
          alt={`Image ${index + 1}`}
          className={styles.image}
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            opacity: currentIndex === index ? 1 : 0,
            transition: 'opacity 1s ease-in-out',
            objectFit: 'cover',
          }}
        />
      ))}
    </div>
  );
};

export default ImageCarroussel;
