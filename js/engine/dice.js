// Dice rolling utilities for 40K

export function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

export function rollD3() {
  return Math.floor(Math.random() * 3) + 1;
}

/** Parse damage/attacks strings like "D6", "D3+1", "2D6", "D6+1", or plain numbers */
export function parseDiceExpr(expr) {
  if (typeof expr === "number") return expr;
  const s = String(expr).trim().toUpperCase();
  const m = s.match(/^(\d*)D(\d+)([+-]\d+)?$/);
  if (!m) return parseInt(s) || 0;
  const count = m[1] ? parseInt(m[1]) : 1;
  const sides = parseInt(m[2]);
  const mod = m[3] ? parseInt(m[3]) : 0;
  return { count, sides, mod };
}

export function rollExpr(expr) {
  const parsed = parseDiceExpr(expr);
  if (typeof parsed === "number") return Math.max(1, parsed);
  let total = parsed.mod;
  for (let i = 0; i < parsed.count; i++) {
    total += Math.floor(Math.random() * parsed.sides) + 1;
  }
  return Math.max(1, total);
}

/** Average of a dice expression */
export function avgExpr(expr) {
  const parsed = parseDiceExpr(expr);
  if (typeof parsed === "number") return parsed;
  return parsed.count * (parsed.sides + 1) / 2 + parsed.mod;
}
