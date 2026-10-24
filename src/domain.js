export const STORAGE_KEY = 'daqiqah:v1';
export const categories = {
  digital: { label: 'حياتك الرقمية', short: 'وعي رقمي', description: 'خطوات أذكى في عالم متّصل', color: 'peach' },
  thinking: { label: 'التفكير بوضوح', short: 'تفكير نقدي', description: 'مساحة للسؤال قبل الاستنتاج', color: 'sage' },
  world: { label: 'العالم حولك', short: 'معرفة يومية', description: 'أشياء مألوفة، وتفسيرات مدهشة', color: 'sand' },
};
export const localDay = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
export function dailyIndex(date, count) {
  const day = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate());
  return ((Math.floor((day - Date.UTC(2026, 9, 21)) / 86400000) % count) + count) % count;
}
export function normalizeState(value, cards) {
  const ids = new Set(cards.map(card => card.id));
  const favorites = [...new Set(Array.isArray(value?.favorites) ? value.favorites.filter(id => ids.has(id)) : [])];
  const answers = {};
  if (value?.answers && typeof value.answers === 'object') {
    for (const card of cards) {
      const answer = value.answers[card.id];
      if (Number.isInteger(answer) && answer >= -1 && answer < card.options.length) answers[card.id] = answer;
    }
  }
  return { favorites, answers };
}
export function readState(storage, cards) {
  try { return { state: normalizeState(JSON.parse(storage.getItem(STORAGE_KEY)), cards), error: false }; }
  catch { return { state: normalizeState(null, cards), error: true }; }
}
export function saveState(storage, state) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(state)); return true; }
  catch { return false; }
}
export function filterCards(cards, { category = 'all', query = '', favoriteIds = null } = {}) {
  const clean = text => text.normalize('NFKD').replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').toLowerCase();
  const term = clean(query.trim());
  return cards.filter(card => (category === 'all' || card.category === category) && (!favoriteIds || favoriteIds.includes(card.id)) && clean(`${card.title} ${card.question} ${card.explanation} ${categories[card.category].label}`).includes(term));
}
