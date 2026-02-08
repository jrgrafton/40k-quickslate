import { createElement as h } from "react";
import { getCacheMeta } from "../data/wahapedia-loader.js";

const BUILD_TIMESTAMP = new Date().toISOString().replace('T', ' ').replace(/\.\d+Z$/, '');

export default function DataStatus({ db, onRefresh, loading }) {
  const meta = getCacheMeta();
  const when = meta?.timestamp ? new Date(meta.timestamp).toLocaleString() : 'Never';
  const unitCount = db?.units?.length || 0;

  return h("div", { className: "data-status" },
    h("span", null, `${unitCount} units loaded`),
    h("span", { style: { color: '#5a5548' } }, ` • Last fetched: ${when}`),
    h("button", {
      className: "btn btn-sm btn-gold",
      style: { marginLeft: 8 },
      onClick: onRefresh,
      disabled: loading,
    }, loading ? "Loading..." : "↻ Refresh Data"),
    h("span", { style: { marginLeft: 'auto', color: '#5a5548', fontSize: 10, fontFamily: 'var(--font-mono)' } }, `v${BUILD_TIMESTAMP}`),
  );
}
