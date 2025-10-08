import type { APIRoute } from "astro";
import { appendSheetRow } from "./googleSheets";

export const prerender = false;

interface Payload {
  name?: string;
  phone?: string;
}

const parsePayload = async (request: Request): Promise<Payload> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        return JSON.parse(dataParam) as Payload;
      } catch (error) {
        throw new SyntaxError("Invalid JSON payload");
      }
    }

    const body: Payload = {};
    params.forEach((value, key) => {
      body[key as keyof Payload] = value;
    });

    return body;
  }

  return (await request.json()) as Payload;
};

const spreadsheetId = import.meta.env.GOOGLE_SHEET_ID ?? process.env.GOOGLE_SHEET_ID;
const sheetName =
  import.meta.env.GOOGLE_SHEET_TAB ?? process.env.GOOGLE_SHEET_TAB ?? "FormResponses";

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!spreadsheetId) {
      throw new Error("Missing Google Sheets configuration");
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

    const timestamp = new Date().toISOString();
    await appendSheetRow({
      spreadsheetId,
      sheetName,
      values: [timestamp, name, phone],
    });

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
