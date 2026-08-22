/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_BIS_API_KEY: string;
  readonly VITE_USE_MOCK: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}