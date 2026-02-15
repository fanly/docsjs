import React, { useEffect, useRef } from "react";
import type { Ref } from "react";
import { defineDocsWordElement } from "../index";
import type {
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail,
  DocsWordEditorReadyDetail
} from "../index";

defineDocsWordElement();

export interface WordFidelityEditorReactProps {
  lang?: "zh" | "en";
  onChange?: (payload: DocsWordEditorChangeDetail) => void;
  onError?: (payload: DocsWordEditorErrorDetail) => void;
  onReady?: (payload: DocsWordEditorReadyDetail) => void;
  editorRef?: (el: DocsWordEditorElementApi | null) => void;
}

export function WordFidelityEditorReact({
  lang,
  onChange,
  onError,
  onReady,
  editorRef
}: WordFidelityEditorReactProps) {
  const ref = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const onChangeEvent = (event: Event) => {
      const detail = (event as CustomEvent<DocsWordEditorChangeDetail>).detail;
      onChange?.(detail);
    };
    const onErrorEvent = (event: Event) => {
      const detail = (event as CustomEvent<DocsWordEditorErrorDetail>).detail;
      onError?.(detail);
    };
    const onReadyEvent = (event: Event) => {
      const detail = (event as CustomEvent<DocsWordEditorReadyDetail>).detail;
      onReady?.(detail);
    };

    node.addEventListener("docsjs-change", onChangeEvent);
    node.addEventListener("docsjs-error", onErrorEvent);
    node.addEventListener("docsjs-ready", onReadyEvent);
    editorRef?.(node as DocsWordEditorElementApi);
    return () => {
      node.removeEventListener("docsjs-change", onChangeEvent);
      node.removeEventListener("docsjs-error", onErrorEvent);
      node.removeEventListener("docsjs-ready", onReadyEvent);
      editorRef?.(null);
    };
  }, [editorRef, onChange, onError, onReady]);

  return React.createElement("docs-word-editor", {
    ref: ref as unknown as Ref<HTMLElement>,
    lang
  });
}
