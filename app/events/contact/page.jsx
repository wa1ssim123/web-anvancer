'use client';

import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Données du formulaire :", formData);
    alert("Votre message a été envoyé !");
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      height: '100vh', backgroundColor: '#f8f8f8'
    }}>
      <div style={{
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '10px',
        boxShadow: '0px 4px 10px rgba(0, 0, 0, 0.1)',
        width: '90%',
        maxWidth: '500px'
      }}>
        <h1 style={{ color: '#c1272d', textAlign: 'center', marginBottom: '20px' }}>Contact</h1>
        
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>Nom :</label>
          <input 
            type="text" name="name" value={formData.name} onChange={handleChange} required
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />

          <label style={{ fontWeight: 'bold' }}>Email :</label>
          <input 
            type="email" name="email" value={formData.email} onChange={handleChange} required
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />

          <label style={{ fontWeight: 'bold' }}>Message :</label>
          <textarea 
            name="message" value={formData.message} onChange={handleChange} required
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', height: '100px' }}
          />

          <button type="submit" style={{
            backgroundColor: '#c1272d', color: 'white', padding: '12px',
            border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer',
            transition: '0.3s'
          }}
          onMouseOver={(e) => e.target.style.backgroundColor = '#9f2024'}
          onMouseOut={(e) => e.target.style.backgroundColor = '#c1272d'}>
            Envoyer
          </button>
        </form>
      </div>
    </div>
  );
}
