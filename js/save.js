// Guardado en localStorage bajo una sola clave (como en El Pino): el día, la caja y la deuda, el
// almacén, el estante, el Libro, las banderas de las historias… Al bajar la persiana se guarda una
// copia del día (las tres últimas), por si algo se rompe. También el código de partida, para
// pasarla a otro móvil.

const CLAVE = 'mililitros-de-perfume';
const COPIAS = 'mililitros-de-perfume-copias';
const VERSION = 1;

// que el navegador no borre la partida para hacer sitio
navigator.storage?.persist?.().catch(() => {});

export function carga() {
  try {
    const d = JSON.parse(localStorage.getItem(CLAVE) || 'null');
    return d && d.v === VERSION ? d : null;
  } catch {
    return null;
  }
}

export function guarda(estado) {
  try {
    localStorage.setItem(CLAVE, JSON.stringify({ ...estado, v: VERSION }));
    return true;
  } catch {
    return false;
  }
}

// Copia del día que se cierra (se quedan las tres últimas)
export function guardaCopia(estado) {
  try {
    const copias = JSON.parse(localStorage.getItem(COPIAS) || '[]').filter(c => c.dia !== estado.dia);
    copias.push({ ...estado, v: VERSION });
    localStorage.setItem(COPIAS, JSON.stringify(copias.slice(-3)));
  } catch { /* sin sitio: se sigue sin copia */ }
}
export function copias() {
  try { return JSON.parse(localStorage.getItem(COPIAS) || '[]'); } catch { return []; }
}

// El código de partida: la partida en base64 (con los acentos bien)
export const exporta = estado => btoa(unescape(encodeURIComponent(JSON.stringify({ ...estado, v: VERSION }))));
export function importa(codigo) {
  try {
    const d = JSON.parse(decodeURIComponent(escape(atob(codigo.trim()))));
    return d && d.v === VERSION && d.dia ? d : null;
  } catch {
    return null;
  }
}

export function borra() {
  try { localStorage.removeItem(CLAVE); localStorage.removeItem(COPIAS); } catch { /* nada */ }
}
