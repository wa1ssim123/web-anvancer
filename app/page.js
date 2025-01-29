export default function Home() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Bienvenue sur le site de l'Équipe Nationale du Maroc 🇲🇦</h1>
      <p>Découvrez l'histoire, les joueurs et les succès des Lions de l'Atlas.</p>
      <img
        src="/equipe-maroc.jpg"
        alt="Équipe Nationale du Maroc"
        style={{ maxWidth: '80%', borderRadius: '10px', margin: '20px 0' }}
      />
      <h2 style={{ textAlign: 'center', margin: '20px 0' }}>Histoire de l'Équipe du Maroc</h2>
      <p style={{ textAlign: 'justify', maxWidth: '800px', margin: '10px auto' }}>
        L'équipe du Maroc de football (en arabe : <b>منتخب المغرب لكرة القدم</b>), créée en 1928, est l'équipe nationale qui représente le Maroc dans les compétitions internationales masculines de football, sous l'égide de la Fédération royale marocaine de football (FRMF). Elle sélectionne les meilleurs joueurs marocains. Ces derniers, composant cette équipe, sont traditionnellement appelés <b>les Lions de l'Atlas</b>.
      </p>
    </div>
  );
}

