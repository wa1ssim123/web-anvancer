import EventCard from '@/components/EventCard';

export default function Apropos() {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1 style={{ color: '#c1272d', textAlign: 'center' }}>À propos</h1>

        <img 
          src="/logo.jpg" 
          alt="Image de l'équipe nationale du Maroc" 
          style={{
            maxWidth: '500px', 
            width: '100%', 
            height: 'auto', 
            margin: '20px auto', 
            display: 'block', 
            borderRadius: '10px', 
            border: '3px solid #c1272d'
          }} 
        />
  
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', textAlign: 'justify', maxWidth: '800px', margin: '20px auto' }}>
          L'équipe nationale de football du Maroc, également connue sous le nom de "Lions de l'Atlas", est l'une des équipes les plus prestigieuses d'Afrique. 
          Depuis sa création en 1928, elle a inspiré des générations de fans grâce à ses performances incroyables sur le terrain. 
          Ce site célèbre l'histoire, les joueurs et les triomphes marquants de cette équipe légendaire.
        </p>
        
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', textAlign: 'justify', maxWidth: '800px', margin: '20px auto' }}>
          Notre objectif est de mettre en lumière les moments historiques, les talents extraordinaires et l'esprit de camaraderie qui définissent l'équipe nationale du Maroc.
        </p>
  
        <p style={{ fontSize: '1.2rem', lineHeight: '1.6', textAlign: 'justify', maxWidth: '800px', margin: '20px auto' }}>
          Merci de visiter notre site et de soutenir les Lions de l'Atlas !
        </p>
      </div>
    );
  }
  
  