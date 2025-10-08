// -----------------------------------------------------------------------------
// ----------------------- SCRIPT A COPIER CÔTÉ GOOGLE -------------------------
// -----------------------------------------------------------------------------

/**
 * Configuration
 */
const CONTACT_SHEET_ID = 'identifiant de la feuille google sheet';
const CONTACT_SHEET_NAME = 'Nom de la feuille';
const STATIC_HEADERS = ['Date Demande', 'Formule'];
// Définir cette propriété dans "Project Settings > Script properties" côté Apps Script.
const CONTACT_SECRET_PROPERTY_KEY = 'copier ici  la variable définie dans GOOGLE_CONTACT_SCRIPT_SECRET';
const CONTACT_NOTIFICATION_RECIPIENTS = ['contact@exemple.com'];
const CONTACT_NOTIFICATION_SUBJECT =
  "Nouvelle demande reçue via le formulaire C'Com";

/**
 * Point d’entrée appelé par Astro (POST).
 */
function doPost(e) {
  try {
    const spreadsheet = SpreadsheetApp.openById(CONTACT_SHEET_ID);
    const sheet = spreadsheet.getSheetByName(CONTACT_SHEET_NAME);
    if (!sheet) {
      throw new Error(`Impossible de trouver l'onglet "${CONTACT_SHEET_NAME}".`);
    }

    const payload = parseBody(e);
    if (!payload) {
      throw new Error('Payload vide ou invalide.');
    }

    validateSecret(payload);

    const { formulaId, formulaLabel } = payload;
    if (!formulaId) {
      throw new Error('formule manquante (formulaId).');
    }

    const fields = extractFields(payload);
    if (!Object.keys(fields).length) {
      throw new Error('Aucune donnée de champ à enregistrer.');
    }

    const headers = getHeaders(sheet);
    const fieldHeaders = headers.slice(STATIC_HEADERS.length);

    const row = [
      formatTimestamp(),
      normaliseValue(formulaLabel) || normaliseValue(formulaId),
      ...fieldHeaders.map((header) => (header ? fields[header] ?? '' : '')),
    ];

    sheet.appendRow(row);
    sendNotification({ formulaId, formulaLabel, fields });

    return jsonResponse({ success: true });
  } catch (error) {
    const status =
      typeof error.httpStatus === 'number' && !Number.isNaN(error.httpStatus)
        ? error.httpStatus
        : 500;
    return jsonResponse({ success: false, message: error.message }, status);
  }
}

/**
 * Lit le corps de la requête (JSON ou x-www-form-urlencoded).
 */
function parseBody(e) {
  if (!e?.postData) return null;

  const mime = e.postData.type || '';
  const contents = e.postData.contents || '';

  if (mime.includes('application/json')) {
    return JSON.parse(contents);
  }

  if (mime.includes('application/x-www-form-urlencoded')) {
    const params = e.parameter || {};
    if (params.data) {
      return JSON.parse(params.data);
    }
    return params;
  }

  return null;
}

/**
 * Construit la map label => valeur.
 */
function extractFields(payload) {
  const fields = {};

  if (payload.fields && typeof payload.fields === 'object') {
    Object.entries(payload.fields).forEach(([key, rawValue]) => {
      const trimmedKey = key.trim();
      if (trimmedKey) {
        fields[trimmedKey] = normaliseValue(rawValue);
      }
    });
  }

  if (!Object.keys(fields).length && Array.isArray(payload.entries)) {
    payload.entries.forEach((entry) => {
      if (!entry) return;
      const key =
        (typeof entry.label === 'string' && entry.label.trim()) ||
        (typeof entry.id === 'string' && entry.id.trim()) ||
        '';
      if (!key) return;
      fields[key] = normaliseValue(entry.value);
    });
  }

  return fields;
}

/**
 * Supprime les espaces superflus et force le texte.
 */
function normaliseValue(value) {
  return typeof value === 'string'
    ? value.trim()
    : value == null
    ? ''
    : String(value).trim();
}

/**
 * Récupère les entêtes de la ligne 1.
 */
function getHeaders(sheet) {
  const lastColumn = sheet.getLastColumn();
  return lastColumn === 0
    ? STATIC_HEADERS
    : sheet
        .getRange(1, 1, 1, lastColumn)
        .getValues()[0]
        .map((header) => normaliseValue(header));
}

/**
 * Format ISO → fuseau Europe/Paris au format dd/mm/yyyy hh:mm.
 */
function formatTimestamp() {
  const now = new Date();
  const parts = new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(now);

  const lookup = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const day = lookup.day ?? '';
  const month = lookup.month ?? '';
  const year = lookup.year ?? '';
  const hour = (lookup.hour ?? '').padStart(2, '0');
  const minute = (lookup.minute ?? '').padStart(2, '0');

  return `${day}/${month}/${year} ${hour}:${minute}`.trim();
}

/**
 * Génère une réponse JSON.
 */
function jsonResponse(body, status = 200) {
  return ContentService.createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON)
    .setStatusCode(status);
}

/**
 * Vérifie que la demande est authentifiée via un secret partagé.
 */
function validateSecret(payload) {
  const storedSecretValue = PropertiesService.getScriptProperties().getProperty(
    CONTACT_SECRET_PROPERTY_KEY
  );
  const storedSecret = storedSecretValue ? storedSecretValue.trim() : '';

  if (!storedSecret) {
    return;
  }

  let receivedSecret = '';
  if (payload.secret != null) {
    receivedSecret =
      typeof payload.secret === 'string'
        ? payload.secret.trim()
        : String(payload.secret).trim();
  }

  if (!receivedSecret || receivedSecret !== storedSecret) {
    throw createHttpError('Accès non autorisé.', 403);
  }
}

/**
 * Crée une erreur contenant un code HTTP personnalisé.
 */
function createHttpError(message, status) {
  const error = new Error(message);
  error.httpStatus = status;
  return error;
}

/**
 * Détermine l'adresse email de réponse si un champ pertinent est présent.
 */
function resolveReplyTo(fields) {
  for (const [key, value] of Object.entries(fields)) {
    if (typeof value !== 'string') continue;
    const lowerKey = key.toLowerCase();
    if (lowerKey.includes('email') || lowerKey.includes('mail')) {
      return value;
    }
  }
  return null;
}

/**
 * Envoie un email de notification si des destinataires sont configurés.
 */
function sendNotification({ formulaId, formulaLabel, fields }) {
  const recipients = (CONTACT_NOTIFICATION_RECIPIENTS || []).filter((email) =>
    typeof email === 'string' && email.includes('@')
  );

  if (!recipients.length) {
    return;
  }

  try {
    const label = normaliseValue(formulaLabel) || normaliseValue(formulaId);
    const subject = `${CONTACT_NOTIFICATION_SUBJECT}${label ? ` - ${label}` : ''}`;

    const entries = Object.entries(fields)
      .map(
        ([key, value]) =>
          `<tr><td style="padding:4px 8px;font-weight:600;">${key}</td><td style="padding:4px 8px;">${value}</td></tr>`
      )
      .join('');

    const htmlBody = `
      <p>Une nouvelle demande a été enregistrée dans la feuille "${CONTACT_SHEET_NAME}".</p>
      <p><strong>Formule :</strong> ${label || 'Non spécifiée'}</p>
      <table style="border-collapse:collapse;border:1px solid #ddd;">
        <tbody>${entries || '<tr><td style="padding:4px 8px;">Aucune donnée</td></tr>'}</tbody>
      </table>
    `;

    const plainBodyLines = [
      `Une nouvelle demande a été enregistrée dans la feuille "${CONTACT_SHEET_NAME}".`,
      `Formule : ${label || 'Non spécifiée'}`,
      '',
      ...Object.entries(fields).map(([key, value]) => `${key}: ${value}`),
    ];
    const plainBody = plainBodyLines.join('\n');

    const replyTo = resolveReplyTo(fields);
    GmailApp.sendEmail(recipients.join(','), subject, plainBody, {
      htmlBody,
      replyTo: replyTo || undefined,
      name: "Formulaire C'Com",
    });
  } catch (mailError) {
    console.error("Impossible d'envoyer la notification email :", mailError);
  }
}
