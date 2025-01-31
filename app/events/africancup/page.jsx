import EventCard from '@/components/EventCard';

export default function AfricanCup() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#c1272d', textAlign: 'center' }}>Coupe d'Afrique</h1>
      <EventCard
        title="Triomphe en Coupe d'Afrique"
        description="Le Maroc remporte la Coupe d'Afrique en 1976 après une finale historique."
        image="/africancup.jpg"
      />
    </div>
  );
}
