import EventCard from '@/components/EventCard';

export default function WorldCup() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#c1272d', textAlign: 'center' }}>Coupe du Monde</h1>
      <EventCard
        title="Victoire Historique à la Coupe du Monde"
        description="Le Maroc devient la première équipe africaine à atteindre les demi-finales en 2022."
        image="/worldcup.jpg"
      />
    </div>
  );
}
