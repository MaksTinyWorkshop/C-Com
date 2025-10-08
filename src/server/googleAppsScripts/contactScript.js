// -----------------------------------------------------------------------------
// ----------------------- SCRIPT A COPIER CÔTÉ GOOGLE -------------------------
// -----------------------------------------------------------------------------

/**
 * Configuration
 */
const CONTACT_SHEET_ID = '1hh4LihfRMUGLwulb5vjqq_nhkkoi7jf21lJ2wkuqNXQ';
const CONTACT_SHEET_NAME = 'Feuille 1';
const STATIC_HEADERS = ['Date Demande', 'Formule'];

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
    return jsonResponse({ success: true });
  } catch (error) {
    return jsonResponse({ success: false, message: error.message }, 500);
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
