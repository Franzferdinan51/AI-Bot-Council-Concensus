/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_KEY?: string;
  readonly VITE_LM_STUDIO_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
