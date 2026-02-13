import { defineComponent, h, onBeforeUnmount, onMounted, ref } from "vue";
import { defineDocsWordElement } from "../core/DocsWordElement";
import type { DocsWordEditorChangeDetail, DocsWordEditorErrorDetail } from "../core/types";

defineDocsWordElement();

export const WordFidelityEditorVue = defineComponent({
  name: "WordFidelityEditorVue",
  emits: ["change", "error"],
  setup(_, { emit }) {
    const elRef = ref<HTMLElement | null>(null);

    const onChange = (event: Event) => {
      emit("change", (event as CustomEvent<DocsWordEditorChangeDetail>).detail);
    };
    const onError = (event: Event) => {
      emit("error", (event as CustomEvent<DocsWordEditorErrorDetail>).detail);
    };

    onMounted(() => {
      elRef.value?.addEventListener("docsjs-change", onChange);
      elRef.value?.addEventListener("docsjs-error", onError);
    });

    onBeforeUnmount(() => {
      elRef.value?.removeEventListener("docsjs-change", onChange);
      elRef.value?.removeEventListener("docsjs-error", onError);
    });

    return () => h("docs-word-editor", { ref: elRef });
  }
});
