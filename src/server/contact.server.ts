import type { APIRoute } from "astro";
import { appendSheetRow } from "./googleSheets";

export const prerender = false;

type ContactEntry = {
  id?: string;
  label?: string;
  value?: unknown;
};

interface ContactPayload {
  formulaId?: string;
  formulaLabel?: string;
  entries?: ContactEntry[];
  pageUrl?: string;
}

const spreadsheetId =
  import.meta.env.GOOGLE_CONTACT_SHEET_ID ??
  process.env.GOOGLE_CONTACT_SHEET_ID ??
  import.meta.env.GOOGLE_SHEET_ID ??
  process.env.GOOGLE_SHEET_ID;

const sheetName =
  import.meta.env.GOOGLE_CONTACT_SHEET_TAB ??
  process.env.GOOGLE_CONTACT_SHEET_TAB ??
  import.meta.env.GOOGLE_SHEET_TAB ??
  process.env.GOOGLE_SHEET_TAB ??
  "ContactFormResponses";

const parsePayload = async (request: Request): Promise<ContactPayload> => {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw = await request.text();
    const params = new URLSearchParams(raw);
    const dataParam = params.get("data");

    if (dataParam) {
      try {
        return JSON.parse(dataParam) as ContactPayload;
      } catch {
        throw new SyntaxError("Invalid JSON payload");
      }
    }

    const body: Record<string, string> = {};
    params.forEach((value, key) => {
      body[key] = value;
    });

    return body as ContactPayload;
  }

  return (await request.json()) as ContactPayload;
};

const sanitiseEntry = (entry: ContactEntry): { label: string; value: string } | null => {
  if (!entry) {
    return null;
  }

  const rawLabel =
    typeof entry.label === "string" && entry.label.trim()
      ? entry.label.trim()
      : typeof entry.id === "string"
        ? entry.id.trim()
        : "";

  if (!rawLabel) {
    return null;
  }

  const rawValue =
    typeof entry.value === "string"
      ? entry.value.trim()
      : entry.value === undefined || entry.value === null
        ? ""
        : String(entry.value).trim();

  return { label: rawLabel, value: rawValue };
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!spreadsheetId) {
      throw new Error("Missing Google Sheets configuration");
    }

    const body = await parsePayload(request);
    const formulaId = body.formulaId?.trim();
    const formulaLabel = body.formulaLabel?.trim();
    const rawEntries = Array.isArray(body.entries) ? body.entries : [];

    if (!formulaId) {
      return new Response(
        JSON.stringify({ message: "Formule manquante dans la demande." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const entries = rawEntries
      .map((entry) => sanitiseEntry(entry))
      .filter((entry): entry is { label: string; value: string } => Boolean(entry));

    if (entries.length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune donnée à enregistrer." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const meaningfulEntries = entries.filter((entry) => entry.value !== "");
    const fieldDescriptions =
      meaningfulEntries.length > 0
        ? meaningfulEntries.map(({ label, value }) => `${label}: ${value}`)
        : entries.map(({ label, value }) => `${label}: ${value}`);

    const userAgent = request.headers.get("user-agent") ?? "";
    const timestamp = new Date().toISOString();
    const pageUrl = body.pageUrl?.trim?.() ?? "";

    await appendSheetRow({
      spreadsheetId,
      sheetName,
      values: [timestamp, formulaLabel || formulaId, formulaId, pageUrl, userAgent, ...fieldDescriptions],
    });

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("contact form error", error);
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
