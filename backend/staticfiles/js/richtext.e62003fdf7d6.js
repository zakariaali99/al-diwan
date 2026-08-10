/* Attaches a Quill editor to any [data-richtext] textarea and keeps the
   textarea in sync, so the plain HTML is what actually gets submitted.
   If this file fails to load, the textarea remains a working fallback. */
(function () {
  "use strict";

  function init(textarea) {
    if (textarea.dataset.richtextReady === "true" || typeof Quill === "undefined") return;
    textarea.dataset.richtextReady = "true";

    var host = document.createElement("div");
    host.className = "richtext-host";
    var editor = document.createElement("div");
    editor.className = "richtext-editor";
    editor.innerHTML = textarea.value;
    host.appendChild(editor);
    textarea.parentNode.insertBefore(host, textarea.nextSibling);
    textarea.style.display = "none";

    // Arabic-first: default the editor to the document's direction, but leave
    // the direction/align controls so staff can override per block.
    var rtl = document.documentElement.getAttribute("dir") === "rtl";

    var quill = new Quill(editor, {
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

    if (rtl) {
      quill.root.setAttribute("dir", "rtl");
      quill.format("align", "right");
    }

    var sync = function () {
      var html = quill.root.innerHTML;
      textarea.value = html === "<p><br></p>" ? "" : html;
    };
    quill.on("text-change", sync);

    // Belt and braces: sync once more as the form submits, in case a change
    // lands between the last text-change event and the click.
    var form = textarea.closest("form");
    if (form) form.addEventListener("submit", sync);
  }

  function initAll(root) {
    (root || document).querySelectorAll("textarea[data-richtext]").forEach(init);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () { initAll(); });
  } else {
    initAll();
  }

  // Django admin can add inline rows after load.
  document.addEventListener("formset:added", function (event) {
    initAll(event.target);
  });
})();
