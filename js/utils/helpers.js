// General utilities

export function formatPercent(p) {
  return (p * 100).toFixed(1) + "%";
}

export function formatNumber(n, decimals = 1) {
  return Number(n).toFixed(decimals);
}

export function classNames(...args) {
  return args.filter(Boolean).join(" ");
}

/** Debounce a function */
export function debounce(fn, ms = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}

/** Strip HTML tags from a string, converting <br> to newlines */
export function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<[^>]*>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .trim();
}
