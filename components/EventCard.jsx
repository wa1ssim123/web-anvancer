export default function EventCard({ title, description, image }) {
    return (
      <div style={{ border: '1px solid #ccc', padding: '10px', margin: '10px 0', borderRadius: '5px', textAlign: 'center' }}>
        <h2>{title}</h2>
        <p>{description}</p>
        <img src={image} alt={title} style={{ maxWidth: '100%', borderRadius: '5px', marginTop: '10px' }} />
      </div>
    );
  }
  
