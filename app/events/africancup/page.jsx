import EventCard from '@/components/EventCard';

export default function AfricanCup() {
  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ color: '#c1272d', textAlign: 'center' }}>Coupe d'Afrique</h1>
      <EventCard
        title="Triomphe en Coupe d'Afrique"
        description="Le Maroc remporte la Coupe d'Afrique en 1976 après une finale historique.Pas besoin d’avoir une mémoire d’éléphant pour se souvenir des titres remportés par le Maroc. Il n’y en a qu’un, et son souvenir commence sérieusement à s’estomper dans les limbes de l’Histoire. C’était en 1976, en Éthiopie, lors de sa deuxième participation à une phase finale de la CAN.

Ahmad Faras, qui est alors âgé de 29 ans, fait partie de cette génération qui se voit proposer ce qui est peut-être sa dernière chance de régner sur le toit de l’Afrique avant de passer le relais. « Nous avions vécu la CAN 1972 au Cameroun. Celle-ci s’était soldée par un échec car nous étions partis à Douala avec de grandes ambitions. Nous avions également eu à digérer une élimination amère de la Coupe du monde 1974 en RFA. La détermination et la discipline de l’équipe étaient nos principaux atouts », explique l’ex-buteur du SCC Mohammedia et de la sélection (42 buts en 77 capes)."
image="\africancup.jpg"
      />
    </div>
  );
}
