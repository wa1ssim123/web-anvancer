"use client";  

import { useState } from "react";
import { handleContact } from "@/actions/contact";
import { getMetadata } from "@/lib/metadata";


const metadata = getMetadata("contact");

export default function Contact() {
    const [formData, setFormData] = useState({ name: "", email: "", message: "" });
    const [errors, setErrors] = useState({});
    const [successMessage, setSuccessMessage] = useState("");

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const response = await handleContact(formData);

        if (!response.success) {
            setErrors(response.errors);
            setSuccessMessage("");
        } else {
            setSuccessMessage(response.message);
            setFormData({ name: "", email: "", message: "" });
            setErrors({});
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

                <form action="#" noValidate onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
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
