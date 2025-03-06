'use client';

import { useState } from 'react';

export default function Contact() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');

  const validateForm = () => {
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Le nom est requis.';
    }

    if (!formData.email.includes('@')) {
      newErrors.email = 'Veuillez entrer un email valide.';
    }

    if (formData.email !== "xwassim04@gmail.com") {
      newErrors.email = "Seule l'adresse xwassim04@gmail.com est acceptée.";
    }

    if (formData.message.length < 10) {
      newErrors.message = 'Le message doit contenir au moins 10 caractères.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleAction = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });

        const result = await response.json();

        if (response.ok) {
          setSuccessMessage(result.success);
          setFormData({ name: '', email: '', message: '' });
          setErrors({});
        } else {
          setErrors({ form: result.error });
          setSuccessMessage('');
        }
      } catch (error) {
        setErrors({ form: "Une erreur s'est produite. Veuillez réessayer plus tard." });
        setSuccessMessage('');
      }
    } else {
      setSuccessMessage('');
    }
  };

  return (
    <div style={{
      display: 'flex', justifyContent: 'center', alignItems: 'center',
      minHeight: '100vh', backgroundColor: '#f8f8f8'
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

        {successMessage && <p style={{ color: 'green', textAlign: 'center' }}>{successMessage}</p>}
        {errors.form && <p style={{ color: 'red', textAlign: 'center' }}>{errors.form}</p>}

        <form action="#" noValidate onSubmit={handleAction} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <label style={{ fontWeight: 'bold' }}>Nom :</label>
          <input
            type="text" name="name" value={formData.name} onChange={handleChange}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          {errors.name && <p style={{ color: 'red', fontSize: '0.9rem' }}>{errors.name}</p>}

          <label style={{ fontWeight: 'bold' }}>Email :</label>
          <input
            type="email" name="email" value={formData.email} onChange={handleChange}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc' }}
          />
          {errors.email && <p style={{ color: 'red', fontSize: '0.9rem' }}>{errors.email}</p>}

          <label style={{ fontWeight: 'bold' }}>Message :</label>
          <textarea
            name="message" value={formData.message} onChange={handleChange}
            style={{ padding: '10px', borderRadius: '5px', border: '1px solid #ccc', height: '100px' }}
          />
          {errors.message && <p style={{ color: 'red', fontSize: '0.9rem' }}>{errors.message}</p>}

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
