import { createElement as h } from "react";

export default function SearchBar({ value, onChange, placeholder = "Search units..." }) {
  return h("div", { className: "search-container" },
    h("span", { className: "search-icon" }, "⌕"),
    h("input", {
      className: "search-input",
      type: "text",
      value,
      onChange: e => onChange(e.target.value),
      placeholder,
    })
  );
}
