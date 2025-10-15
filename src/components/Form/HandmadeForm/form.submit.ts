import { collectContactData } from "./form.logic";

const API_SUBMIT_URL = "/api/submit";

/**
 * Nettoie et prépare les valeurs avant envoi
 */
function formatPhone(phone: string): string {
  if (!phone) return "";
  let clean = phone.replace(/\s+/g, "").trim();

  // Si commence par 0 → on remplace par +33
  if (clean.startsWith("0")) clean = "+33" + clean.slice(1);

  // Si l'utilisateur a mis déjà +33, on laisse
  if (clean.startsWith("+33")) return clean;

  return clean;
}

/**
 * Soumission principale du formulaire
 */
export async function submitToGoogleForm(form: HTMLFormElement) {
  const payload = collectContactData(form);

  // Récupération de la formule sélectionnée
  const select = form.querySelector<HTMLSelectElement>("[data-contact-select]");
  const selectedFormulaId = select?.value ?? payload.formula ?? "";

  // On formate la charge utile alignée sur ta feuille Google Sheet
  const data = {
    "Nom": payload.fields.lastName,
    "Prénom": payload.fields.firstName,
    "Email": payload.fields.email,
    "Téléphone": formatPhone(payload.fields.phone),
    "Secteur": payload.fields.industry,
    "Entreprise": payload.fields.company,
    "Adresse": payload.fields.address,
    "Code Postal": payload.fields.postalCode,
    "Ville": payload.fields.city,
    "Siret": payload.fields.siret,
    "Formule": selectedFormulaId,
    "Visuels": payload.fields.visuals,
    "Vidéos": payload.fields.videos,
    "Demande": payload.fields.customRequest,
    secret: import.meta.env.PUBLIC_GOOGLE_SECRET_KEY, // 🔒 clé secrète si tu l’utilises
  };

  try {
    const response = await fetch(API_SUBMIT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const text = await response.text();
    console.log("✅ Réponse du serveur /api/submit :", text);
  } catch (err) {
    console.error("❌ Erreur lors de l’envoi vers /api/submit:", err);
  }
}