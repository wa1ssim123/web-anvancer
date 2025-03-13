export function validateFormData(formData) {
    let errors = {};

    if (!formData || typeof formData !== 'object') {
        return { general: "Données invalides." };
    }

    
    if (!formData.name || formData.name.trim() === "") {
        errors.name = "Le nom est requis.";
    }

    
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email || !emailPattern.test(formData.email.trim())) {
        errors.email = "Veuillez entrer un email valide.";
    }

    
    if (!formData.message || formData.message.trim().length < 10) {
        errors.message = "Le message doit contenir au moins 10 caractères.";
    }

    return errors;
}
