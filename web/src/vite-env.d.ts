/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** 'true' in the static GitHub Pages build, where the API runs in the page. */
  readonly VITE_DEMO?: string;
}
