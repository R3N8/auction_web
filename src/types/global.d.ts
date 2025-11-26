declare global {
  interface Window {
    searchRender?: (query?: string) => void;
  }
}

export {};
