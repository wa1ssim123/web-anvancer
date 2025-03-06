export async function POST(req) {
    try {
      const { name, email, message } = await req.json();
  
      // Validation : Vérifier si tous les champs sont remplis
      if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: "Tous les champs sont obligatoires." }), { status: 400 });
      }
  
      // Vérifier si l'email est bien "xwassim04@gmail.com"
      if (email !== "xwassim04@gmail.com") {
        return new Response(JSON.stringify({ error: "Seule l'adresse xwassim04@gmail.com est acceptée." }), { status: 400 });
      }
  
      // Afficher les informations du formulaire dans la console serveur
      console.log("📩 Nouveau message reçu :", { name, email, message });
  
      return new Response(JSON.stringify({ success: "Votre message a bien été envoyé !" }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Une erreur est survenue." }), { status: 500 });
    }
  }
  