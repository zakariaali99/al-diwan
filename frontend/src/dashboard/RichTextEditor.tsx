import { useEffect, useRef } from "react";

/**
 * Thin React wrapper around Quill 2 (BSD-licensed, vendored in Django's static
 * dir). Quill is loaded from a script tag rather than bundled so the editor
 * only costs bandwidth on the dashboard routes that actually use it.
 *
 * The component owns plain HTML — no editor-specific storage format — so the
 * backend field stays a plain TextField and swapping editors later is a
 * frontend-only change.
 */

declare global {
  interface Window {
    Quill?: new (el: Element, options: unknown) => QuillInstance;
  }
}

interface QuillInstance {
  root: HTMLElement;
  on: (event: string, handler: () => void) => void;
}

const QUILL_JS = "/static/vendor/quill/quill.js";
const QUILL_CSS = "/static/vendor/quill/quill.snow.css";

function loadOnce(): Promise<void> {
  if (window.Quill) return Promise.resolve();

  if (!document.querySelector(`link[href="${QUILL_CSS}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = QUILL_CSS;
    document.head.appendChild(link);
  }

  const existing = document.querySelector<HTMLScriptElement>(`script[src="${QUILL_JS}"]`);
  if (existing) {
    return new Promise((resolve) => existing.addEventListener("load", () => resolve()));
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = QUILL_JS;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load the editor"));
    document.head.appendChild(script);
  });
}

export default function RichTextEditor({
  value,
  onChange,
  dir,
}: {
  value: string;
  onChange: (html: string) => void;
  dir: "rtl" | "ltr";
}) {
  const hostRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<QuillInstance | null>(null);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    let cancelled = false;

    loadOnce()
      .then(() => {
        if (cancelled || !hostRef.current || quillRef.current || !window.Quill) return;

        const editorEl = document.createElement("div");
        editorEl.innerHTML = value;
        hostRef.current.appendChild(editorEl);

        const quill = new window.Quill(editorEl, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [2, 3, 4, false] }],
              ["bold", "italic", "underline", "link", "blockquote"],
              [{ list: "ordered" }, { list: "bullet" }],
              [{ direction: "rtl" }, { align: [] }],
              ["clean"],
            ],
          },
        });

        quill.root.setAttribute("dir", dir);
        quill.on("text-change", () => {
          const html = quill.root.innerHTML;
          onChangeRef.current(html === "<p><br></p>" ? "" : html);
        });

        quillRef.current = quill;
      })
      .catch(() => {
        /* falls back to the textarea below */
      });

    return () => {
      cancelled = true;
    };
    // Initialised once; `value` is only the starting content, and re-running
    // on every keystroke would fight the editor for control of the DOM.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div>
      <div ref={hostRef} className="overflow-hidden rounded-lg border border-line-strong bg-surface [&_.ql-container]:min-h-[280px] [&_.ql-container]:border-0 [&_.ql-editor]:text-base [&_.ql-toolbar]:border-0 [&_.ql-toolbar]:border-b [&_.ql-toolbar]:border-line" />
      <noscript>
        <textarea
          className="field-input mt-2"
          rows={12}
          defaultValue={value}
          onChange={(event) => onChange(event.target.value)}
        />
      </noscript>
    </div>
  );
}
