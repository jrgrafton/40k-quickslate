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
