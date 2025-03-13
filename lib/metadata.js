export function getMetadata(pageName) {
    const metadata = {
        worldcup: {
            title: "Coupe du Monde - Victoire Historique",
            description: "Découvrez comment le Maroc a marqué l'histoire en atteignant les demi-finales de la Coupe du Monde 2022.",
            keywords: "Maroc, Coupe du Monde, FIFA, Football, Demi-finales"
        },
        contact: {
            title: "Contactez-nous - Lions de l'Atlas",
            description: "Envoyez-nous un message pour toute question ou collaboration.",
            keywords: "Contact, Lions de l'Atlas, Support"
        },
        africancup: {
            title: "Coupe d'Afrique - Triomphe du Maroc",
            description: "Retour sur la victoire historique du Maroc à la CAN 1976.",
            keywords: "Maroc, CAN 1976, Football, Victoire"
        },
        apropos: {
            title: "À propos - Histoire des Lions de l'Atlas",
            description: "Découvrez l'histoire et les triomphes de l'équipe nationale du Maroc.",
            keywords: "Maroc, Football, Histoire, Lions de l'Atlas"
        }
    };

    return metadata[pageName] || {
        title: "Site des Lions de l'Atlas",
        description: "Suivez toute l'actualité du football marocain.",
        keywords: "Maroc, Football, Lions de l'Atlas"
    };
}

