/** 86500 -> "86 500" */
export function formatSom(n: number): string {
  return Math.round(n).toLocaleString('ru-RU').replace(/ /g, ' ')
}
