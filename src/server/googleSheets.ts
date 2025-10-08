import { google, sheets_v4 } from "googleapis";

const serviceAccountEmail =
  import.meta.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const serviceAccountPrivateKey =
  import.meta.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ??
  process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY;

const SCOPES = ["https://www.googleapis.com/auth/spreadsheets"];

type SheetsClient = sheets_v4.Sheets;

let sheetsClientPromise: Promise<SheetsClient> | null = null;

const createSheetsClient = async (): Promise<SheetsClient> => {
  if (!serviceAccountEmail || !serviceAccountPrivateKey) {
    throw new Error("Missing Google service account configuration");
  }

  const key = serviceAccountPrivateKey.replace(/\\n/g, "\n");

  const auth = new google.auth.JWT({
    email: serviceAccountEmail,
    key,
    scopes: SCOPES,
  });

  await auth.authorize();

  return google.sheets({
    version: "v4",
    auth,
  });
};

export const getSheetsClient = async (): Promise<SheetsClient> => {
  if (!sheetsClientPromise) {
    sheetsClientPromise = createSheetsClient().catch((error) => {
      sheetsClientPromise = null;
      throw error;
    });
  }

  return sheetsClientPromise;
};

type AppendRowOptions = {
  spreadsheetId: string;
  sheetName: string;
  values: Array<string | number | boolean | null | undefined>;
};

export const appendSheetRow = async ({ spreadsheetId, sheetName, values }: AppendRowOptions) => {
  if (!spreadsheetId) {
    throw new Error("Missing Google Sheets spreadsheet id");
  }

  const client = await getSheetsClient();
  const normalisedValues = values.map((value) =>
    value === null || value === undefined ? "" : String(value),
  );

  await client.spreadsheets.values.append({
    spreadsheetId,
    range: sheetName,
    valueInputOption: "USER_ENTERED",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [normalisedValues],
    },
  });
};

export type { SheetsClient };
