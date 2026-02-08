import { createElement as h } from "react";

export default function LoadingScreen({ progress, error }) {
  const pct = progress.total > 0 ? Math.round((progress.loaded / progress.total) * 100) : 0;
  return h("div", { className: "loading-screen" },
    h("div", { className: "loading-content" },
      h("h1", { style: { color: '#c9a84c', fontSize: 28, letterSpacing: 3, textTransform: 'uppercase' } },
        "40K ", h("span", { style: { color: '#cc2222' } }, "Quick"), "Slate"),
      h("div", { className: "loading-bar-outer" },
        h("div", { className: "loading-bar-inner", style: { width: pct + '%' } }),
      ),
      h("div", { style: { color: '#8a8070', fontSize: 13, marginTop: 8 } }, progress.message),
      h("div", { style: { color: '#5a5548', fontSize: 11, marginTop: 4 } }, `${pct}%`),
      error && h("div", { style: { color: '#cc2222', marginTop: 12 } }, "Error: ", error),
    ),
  );
}
