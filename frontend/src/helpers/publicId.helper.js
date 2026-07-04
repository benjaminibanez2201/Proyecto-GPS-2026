const MODULUS = 1000003;
const MULTIPLIER = 654321;

function modInverse(a, m) {
  let [oldR, r] = [a, m];
  let [oldS, s] = [1, 0];

  while (r !== 0) {
    const quotient = Math.floor(oldR / r);
    [oldR, r] = [r, oldR - quotient * r];
    [oldS, s] = [s, oldS - quotient * s];
  }

  return ((oldS % m) + m) % m;
}

const MULTIPLIER_INVERSE = modInverse(MULTIPLIER, MODULUS);

export function encodePublicId(id) {
  const n = Number(id);
  if (!Number.isInteger(n) || n < 0 || n >= MODULUS) return '';
  return ((n * MULTIPLIER) % MODULUS).toString(36);
}

export function decodePublicId(code) {
  if (typeof code !== 'string' || !code) return null;
  const n = parseInt(code, 36);
  if (!Number.isFinite(n) || n < 0 || n >= MODULUS) return null;
  return (n * MULTIPLIER_INVERSE) % MODULUS;
}
