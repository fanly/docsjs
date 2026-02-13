import type React from "react";

declare global {
  namespace JSX {
    interface IntrinsicElements {
      "docs-word-editor": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

export {};
