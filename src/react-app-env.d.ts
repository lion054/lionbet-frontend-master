/// <reference types="react-scripts" />

declare namespace NodeJS {
  interface ProcessEnv {
    NODE_ENV: 'development' | 'production' | 'test';
    PUBLIC_URL: string;
    REACT_APP_JSON_RPC_URL: string;
    REACT_APP_CHAIN_ID: string;
  }
}

interface Window {
  ethereum: any;
}
