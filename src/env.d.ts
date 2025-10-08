/// <reference path="../.astro/types.d.ts" />

interface ImportMetaEnv {
  readonly PUBLIC_CALLBACK_ENDPOINT?: string;
  readonly PUBLIC_CONTACT_ENDPOINT?: string;
  readonly GOOGLE_APPS_SCRIPT_URL?: string;
  readonly GOOGLE_CALLBACK_SCRIPT_URL?: string;
  readonly GOOGLE_CONTACT_SCRIPT_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
