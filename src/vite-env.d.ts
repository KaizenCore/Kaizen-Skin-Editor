/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_KAIZEN_CLIENT_ID: string;
  readonly VITE_KAIZEN_BASE_URL: string;
  readonly VITE_KAIZEN_REDIRECT_URI: string;
  readonly VITE_SKIN_API_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
