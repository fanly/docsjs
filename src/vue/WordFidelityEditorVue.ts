import { defineComponent, h, onBeforeUnmount, onMounted, ref } from "vue";
import { defineDocsWordElement } from "../index";
import type {
  DocsWordEditorChangeDetail,
  DocsWordEditorElementApi,
  DocsWordEditorErrorDetail,
  DocsWordEditorReadyDetail
} from "../index";

defineDocsWordElement();

export const WordFidelityEditorVue = defineComponent({
  name: "WordFidelityEditorVue",
  props: {
    lang: {
      type: String as () => "zh" | "en",
      default: "zh"
    }
  },
  emits: ["change", "error", "ready"],
  setup(props, { emit }) {
    const elRef = ref<DocsWordEditorElementApi | null>(null);

    const onChange = (event: Event) => {
      emit("change", (event as CustomEvent<DocsWordEditorChangeDetail>).detail);
    };
    const onError = (event: Event) => {
      emit("error", (event as CustomEvent<DocsWordEditorErrorDetail>).detail);
    };
    const onReady = (event: Event) => {
      emit("ready", (event as CustomEvent<DocsWordEditorReadyDetail>).detail);
    };

    onMounted(() => {
      elRef.value?.addEventListener("docsjs-change", onChange);
      elRef.value?.addEventListener("docsjs-error", onError);
      elRef.value?.addEventListener("docsjs-ready", onReady);
    });

    onBeforeUnmount(() => {
      elRef.value?.removeEventListener("docsjs-change", onChange);
      elRef.value?.removeEventListener("docsjs-error", onError);
      elRef.value?.removeEventListener("docsjs-ready", onReady);
    });

    return () => h("docs-word-editor", { ref: elRef, lang: props.lang });
  }
});
