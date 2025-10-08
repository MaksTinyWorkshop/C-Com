/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_CALLBACK_ENDPOINT?: string;
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_EMAIL?: string;
  readonly GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  readonly GOOGLE_SHEET_ID?: string;
  readonly GOOGLE_SHEET_TAB?: string;
  readonly GOOGLE_CONTACT_SHEET_ID?: string;
  readonly GOOGLE_CONTACT_SHEET_TAB?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
