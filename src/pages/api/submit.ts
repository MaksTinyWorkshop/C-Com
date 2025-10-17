export const prerender = false;

const GOOGLE_SCRIPT_URL = import.meta.env.GOOGLE_CONTACT_SCRIPT_URL;
const GOOGLE_SECRET = import.meta.env.GOOGLE_CONTACT_SCRIPT_SECRET;

export async function POST({ request }: { request: Request }) {
  try {
    const data = await request.json();

    // On ajoute une clé secrète pour éviter les abus
    const payload = { ...data, secret: GOOGLE_SECRET };

    const res = await fetch(GOOGLE_SCRIPT_URL!, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    return new Response(text, { status: res.status });
  } catch (error) {
    console.error("❌ Erreur lors de la requête backend:", error);
    return new Response("Erreur interne", { status: 500 });
  }
}
