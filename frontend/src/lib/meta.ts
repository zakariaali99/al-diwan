import { useEffect } from "react";

/** Client-side <title>/<meta description> management. Routing is client-side,
 *  so each page sets its own head tags on mount. */
export function usePageMeta({ title, description }: { title?: string; description?: string }) {
  useEffect(() => {
    if (title) document.title = title;
  }, [title]);

  useEffect(() => {
    if (!description) return;
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement("meta");
      tag.name = "description";
      document.head.appendChild(tag);
    }
    tag.content = description.slice(0, 300);
  }, [description]);
}
