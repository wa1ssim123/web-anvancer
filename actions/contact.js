"use server";

import { validateFormData } from "@/validation/validation"; 

export async function handleContact(formData) {
    const errors = validateFormData(formData);

    if (Object.keys(errors).length > 0) {
        return { success: false, errors };
    }

    console.log("📩 Nouveau message reçu :", formData);
    return { success: true, message: "Votre message a bien été envoyé !" };
}
