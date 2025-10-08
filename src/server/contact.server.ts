import type { APIRoute } from "astro";

export const prerender = false;

type ContactEntry = {
  id?: string;
  label?: string;
  value?: unknown;
};

interface ContactPayload {
  formulaId?: string;
  formulaLabel?: string;
  fields?: Record<string, unknown>;
  entries?: ContactEntry[];
}

const contactScriptUrl =
  import.meta.env.GOOGLE_CONTACT_SCRIPT_URL ??
  import.meta.env.GOOGLE_APPS_SCRIPT_URL ??
  process.env.GOOGLE_CONTACT_SCRIPT_URL ??
  process.env.GOOGLE_APPS_SCRIPT_URL;

const parsePayload = async (request: Request): Promise<ContactPayload> => {
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

  try {
    return JSON.parse(rawBody) as ContactPayload;
  } catch {
    throw new SyntaxError("Invalid JSON payload");
  }
};

const normaliseValue = (value: unknown) =>
  typeof value === "string"
    ? value.trim()
    : value === undefined || value === null
      ? ""
      : String(value).trim();

const extractFields = (payload: ContactPayload) => {
  const fields: Record<string, string> = {};

  if (payload.fields && typeof payload.fields === "object") {
    for (const [key, rawValue] of Object.entries(payload.fields)) {
      const trimmedKey = key.trim();
      if (!trimmedKey) {
        continue;
      }
      fields[trimmedKey] = normaliseValue(rawValue);
    }
  }

  if (Object.keys(fields).length === 0 && Array.isArray(payload.entries)) {
    payload.entries.forEach((entry) => {
      if (!entry) {
        return;
      }

      const key =
        typeof entry.id === "string" && entry.id.trim()
          ? entry.id.trim()
          : typeof entry.label === "string"
            ? entry.label.trim()
            : "";

      if (!key) {
        return;
      }

      fields[key] = normaliseValue(entry.value);
    });
  }

  return fields;
};

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!contactScriptUrl) {
      throw new Error("Missing Google Apps Script endpoint");
    }

    const body = await parsePayload(request);
    const formulaId = body.formulaId?.trim();
    const formulaLabel = body.formulaLabel?.trim();
    const fields = extractFields(body);

    if (!formulaId) {
      return new Response(
        JSON.stringify({ message: "Formule manquante dans la demande." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (Object.keys(fields).length === 0) {
      return new Response(
        JSON.stringify({ message: "Aucune donnée à enregistrer." }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const response = await fetch(contactScriptUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        formulaId,
        formulaLabel,
        fields,
        entries: Array.isArray(body.entries) ? body.entries : undefined,
      }),
    });

    const responseText = await response.text();

    if (!response.ok) {
      throw new Error(responseText || `Apps Script responded with ${response.status}`);
    }

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
