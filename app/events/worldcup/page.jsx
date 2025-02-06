import EventCard from '@/components/EventCard';

export default function WorldCup() {
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1 style={{ color: '#c1272d' }}>Coupe du Monde</h1>
      <img
        src="/worldcup.jpg"
        alt="Victoire Historique à la Coupe du Monde"
        style={{
          maxWidth: '40%',
          height: 'auto',
          borderRadius: '10px',
          border: '3px solid #c1272d',
          display: 'block', 
          margin: '0 auto', 
        }}
      />
      <h2>Victoire Historique à la Coupe du Monde</h2>
      <p>
        Le Maroc devient la première équipe africaine à atteindre les demi-finales en 2022.
        Fernando Santos décide de faire rentrer l'arme suprême peu après le retour des vestiaires. Cristiano Ronaldo prend la place de Ruben Neves, égalisant au passage le record absolu de matches en sélection du Koweitien Bader Al-Mutawa (196). Il se signale immédiatement d'un centre qui finit dans les gants de Bounou (53e).

Le Maroc doit encaisser un coup dur. Romain Saïss, déjà touché à la cuisse lors du match contre l'Espagne, doit quitter le terrain pour une nouvelle douleur à cet endroit. Le capitaine marocain sort en pleurs alors qu'il reste alors plus de 35 minutes à tenir aux Lions de l'Atlas pour entrer dans l'histoire.

Commence alors un long siège : une tête de Gonçalo Ramos manque le cadre (58e), une frappe de Bruno Fernandes passe au-dessus (64e), les corners s'enchaînent... Pour tenir, Walid Regragui fait le choix d'une défense à 5 en sortant le buteur En-Nesyri et faire rentrer le défenseur central Benoun.
      </p>
    </div>
  );
}