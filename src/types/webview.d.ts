import type { HTMLAttributes } from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      webview: HTMLAttributes<HTMLElement> & {
        src?: string;
        partition?: string;
        useragent?: string;
        allowpopups?: boolean | string;
        webpreferences?: string;
      };
    }
  }
}

export {};
