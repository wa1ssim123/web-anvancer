export async function POST(req) {
    try {
      const { name, email, message } = await req.json();
  
      
      if (!name || !email || !message) {
        return new Response(JSON.stringify({ error: "Tous les champs sont obligatoires." }), { status: 400 });
      }
  
    
      if (email !== "xwassim04@gmail.com") {
        return new Response(JSON.stringify({ error: "Seule l'adresse xwassim04@gmail.com est acceptée." }), { status: 400 });
      }
  
      
      console.log("📩 Nouveau message reçu :", { name, email, message });
  
      return new Response(JSON.stringify({ success: "Votre message a bien été envoyé !" }), { status: 200 });
    } catch (error) {
      return new Response(JSON.stringify({ error: "Une erreur est survenue." }), { status: 500 });
    }
  }
  