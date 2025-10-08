import type { APIRoute } from "astro";

export const prerender = false;

interface Payload {
  name?: string;
  phone?: string;
}

const callbackScriptUrl =
  import.meta.env.GOOGLE_CALLBACK_SCRIPT_URL ??
  import.meta.env.GOOGLE_APPS_SCRIPT_URL ??
  process.env.GOOGLE_CALLBACK_SCRIPT_URL ??
  process.env.GOOGLE_APPS_SCRIPT_URL;

const parsePayload = async (request: Request): Promise<Payload> => {
  const contentType = request.headers.get("content-type") ?? "";
  const rawBody = await request.text();

  if (!rawBody) {
    return {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const params = new URLSearchParams(rawBody);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        return JSON.parse(dataParam) as Payload;
      } catch {
        throw new SyntaxError("Invalid JSON payload");
      }
    }

    const body: Payload = {};
    params.forEach((value, key) => {
      body[key as keyof Payload] = value;
    });

    return body;
  }

  try {
    return JSON.parse(rawBody) as Payload;
  } catch {
    throw new SyntaxError("Invalid JSON payload");
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!callbackScriptUrl) {
      throw new Error("Missing Google Apps Script endpoint");
    }

    const body = await parsePayload(request);
    const name = body.name?.trim();
    const phone = body.phone?.trim();

    if (!name || !phone) {
      return new Response(
        JSON.stringify({ message: "Les champs nom et téléphone sont requis." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(callbackScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, phone }),
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(text || `Apps Script responded with ${response.status}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("callback form error", error);
    const status = error instanceof SyntaxError ? 400 : 500;
    return new Response(
      JSON.stringify({
        message: "Impossible d'envoyer votre demande pour le moment.",
      }),
      {
        status,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
