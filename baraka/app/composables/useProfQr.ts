// Ixcham QR kod generatori: byte rejimi, ECC L, versiya 1–4 (78 baytgacha).
const DATA_CW = [0, 19, 34, 55, 80]
const ECC_CW = [0, 7, 10, 15, 20]
const ALIGN = [0, 0, 18, 22, 26]

function gfMul(x: number, y: number) {
  let z = 0
  for (let i = 7; i >= 0; i--) {
    z = (z << 1) ^ ((z >>> 7) * 0x11D)
    z ^= ((y >>> i) & 1) * x
  }
  return z
}

function rsDivisor(degree: number) {
  const r = Array.from({ length: degree }, () => 0)
  r[degree - 1] = 1
  let root = 1
  for (let i = 0; i < degree; i++) {
    for (let j = 0; j < r.length; j++) {
      r[j] = gfMul(r[j]!, root)
      if (j + 1 < r.length) r[j]! ^= r[j + 1]!
    }
    root = gfMul(root, 0x02)
  }
  return r
}

function rsRemainder(data: number[], divisor: number[]) {
  const r = divisor.map(() => 0)
  for (const b of data) {
    const f = b ^ r.shift()!
    r.push(0)
    divisor.forEach((d, i) => { r[i]! ^= gfMul(d, f) })
  }
  return r
}

export function encodeQr(text: string): boolean[][] | null {
  const bytes = Array.from(new TextEncoder().encode(text))
  let ver = 1
  while (ver <= 4 && 4 + 8 + bytes.length * 8 > DATA_CW[ver]! * 8) ver++
  if (ver > 4) return null
  const cap = DATA_CW[ver]! * 8

  const bits: number[] = []
  const put = (v: number, n: number) => { for (let i = n - 1; i >= 0; i--) bits.push((v >>> i) & 1) }
  put(0b0100, 4)
  put(bytes.length, 8)
  bytes.forEach(b => put(b, 8))
  put(0, Math.min(4, cap - bits.length))
  put(0, (8 - bits.length % 8) % 8)
  for (let pad = 0xEC; bits.length < cap; pad ^= 0xEC ^ 0x11) put(pad, 8)

  const data: number[] = []
  for (let i = 0; i < bits.length; i += 8) data.push(bits.slice(i, i + 8).reduce((a, b) => (a << 1) | b, 0))
  const codewords = [...data, ...rsRemainder(data, rsDivisor(ECC_CW[ver]!))]

  const size = ver * 4 + 17
  const mod: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
  const fn: boolean[][] = Array.from({ length: size }, () => Array.from({ length: size }, () => false))
  const setFn = (x: number, y: number, dark: boolean) => { mod[y]![x] = dark; fn[y]![x] = true }

  for (let i = 0; i < size; i++) { setFn(6, i, i % 2 === 0); setFn(i, 6, i % 2 === 0) }
  for (const [cx, cy] of [[3, 3], [size - 4, 3], [3, size - 4]] as const) {
    for (let dy = -4; dy <= 4; dy++) {
      for (let dx = -4; dx <= 4; dx++) {
        const x = cx + dx, y = cy + dy
        const d = Math.max(Math.abs(dx), Math.abs(dy))
        if (x >= 0 && x < size && y >= 0 && y < size) setFn(x, y, d !== 2 && d !== 4)
      }
    }
  }
  if (ALIGN[ver]) {
    const a = ALIGN[ver]!
    for (let dy = -2; dy <= 2; dy++)
      for (let dx = -2; dx <= 2; dx++) setFn(a + dx, a + dy, Math.max(Math.abs(dx), Math.abs(dy)) !== 1)
  }

  const drawFormat = (mask: number) => {
    const d = (0b01 << 3) | mask // ECC L = 01
    let rem = d
    for (let i = 0; i < 10; i++) rem = (rem << 1) ^ ((rem >>> 9) * 0x537)
    const f = ((d << 10) | rem) ^ 0x5412
    const bit = (i: number) => ((f >>> i) & 1) === 1
    for (let i = 0; i <= 5; i++) setFn(8, i, bit(i))
    setFn(8, 7, bit(6)); setFn(8, 8, bit(7)); setFn(7, 8, bit(8))
    for (let i = 9; i < 15; i++) setFn(14 - i, 8, bit(i))
    for (let i = 0; i < 8; i++) setFn(size - 1 - i, 8, bit(i))
    for (let i = 8; i < 15; i++) setFn(8, size - 15 + i, bit(i))
    setFn(8, size - 8, true)
  }
  drawFormat(0)

  let i = 0
  for (let right = size - 1; right >= 1; right -= 2) {
    if (right === 6) right = 5
    for (let v = 0; v < size; v++) {
      for (let j = 0; j < 2; j++) {
        const x = right - j
        const y = ((right + 1) & 2) === 0 ? size - 1 - v : v
        if (!fn[y]![x] && i < codewords.length * 8) {
          mod[y]![x] = ((codewords[i >>> 3]! >>> (7 - (i & 7))) & 1) === 1
          i++
        }
      }
    }
  }

  const maskFn = (m: number, x: number, y: number) => [
    (x + y) % 2 === 0, y % 2 === 0, x % 3 === 0, (x + y) % 3 === 0,
    (Math.floor(x / 3) + Math.floor(y / 2)) % 2 === 0, (x * y) % 2 + (x * y) % 3 === 0,
    ((x * y) % 2 + (x * y) % 3) % 2 === 0, ((x + y) % 2 + (x * y) % 3) % 2 === 0,
  ][m]
  const applyMask = (m: number) => {
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) if (!fn[y]![x] && maskFn(m, x, y)) mod[y]![x] = !mod[y]![x]
  }
  const penalty = () => {
    let p = 0, dark = 0
    for (let a = 0; a < size; a++) {
      let rr = 1, rc = 1
      for (let b = 1; b < size; b++) {
        if (mod[a]![b] === mod[a]![b - 1]) { rr++; if (rr === 5) p += 3; else if (rr > 5) p++ } else rr = 1
        if (mod[b]![a] === mod[b - 1]![a]) { rc++; if (rc === 5) p += 3; else if (rc > 5) p++ } else rc = 1
      }
    }
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        if (mod[y]![x]) dark++
        if (x < size - 1 && y < size - 1) {
          const c = mod[y]![x]
          if (c === mod[y]![x + 1] && c === mod[y + 1]![x] && c === mod[y + 1]![x + 1]) p += 3
        }
      }
    }
    return p + Math.floor(Math.abs(dark * 20 - size * size * 10) / (size * size)) * 10
  }

  let best = 0, bestScore = Infinity
  for (let m = 0; m < 8; m++) {
    applyMask(m); drawFormat(m)
    const s = penalty()
    if (s < bestScore) { best = m; bestScore = s }
    applyMask(m)
  }
  applyMask(best); drawFormat(best)
  return mod
}

export function useProfQr() {
  return { encodeQr }
}
