import { modes, activities } from './gameData.js';
import { localDay } from './domain.js';
export const PLAY_KEY = 'daqiqah:play:v2';
export const emptyProgress = () => ({ completed: {}, daily: {}, activeDays: [], timer: false });
export function cleanProgress(value) {
  const state = emptyProgress();
  for (const activity of activities) {
    const item = value?.completed?.[activity.id];
    if (item && Number.isFinite(item.score) && item.score >= 0 && item.score <= 1) state.completed[activity.id] = { score: item.score, xp: 20 + Math.round(item.score * 10) };
  }
  if (value?.daily && typeof value.daily === 'object') for (const [date, entry] of Object.entries(value.daily)) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(date) && Array.isArray(entry)) {
      const parsed = new Date(`${date}T12:00:00`);
      if (!Number.isFinite(parsed.getTime()) || localDay(parsed) !== date) continue;
      const allowed = dailyModes(parsed), seen = new Set();
      state.daily[date] = entry.filter(id => {
        const activity = activities.find(a => a.id === id);
        if (!activity || !state.completed[id] || !allowed.includes(activity.mode) || seen.has(activity.mode)) return false;
        seen.add(activity.mode); return true;
      }).slice(0, 3);
    }
  }
  state.activeDays = [...new Set(Array.isArray(value?.activeDays) ? value.activeDays.filter(date => /^\d{4}-\d{2}-\d{2}$/.test(date)) : [])].sort().slice(-365);
  state.timer = value?.timer === true;
  return state;
}
export function modeCount(state, mode) { return activities.filter(a => a.mode === mode && state.completed[a.id]).length; }
export function unlockedDifficulty(state, mode) { const count = modeCount(state, mode); return count >= 3 ? 3 : count >= 2 ? 2 : 1; }
export function totalXP(state) { return Object.values(state.completed).reduce((sum, item) => sum + item.xp, 0) + Object.values(state.daily).filter(items => items.length === 3).length * 30; }
export function levelInfo(state) { const xp = totalXP(state); return { level: Math.floor(xp / 150) + 1, xp, within: xp % 150, next: 150 }; }
export function dayNumber(date) { return Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86400000); }
export function dailyModes(date) { const day = dayNumber(date); return [0, 1, 2].map(i => modes[(day + i * 3) % modes.length].id); }
export function pickActivity(state, mode, date = new Date()) {
  const pool = activities.filter(a => a.mode === mode && a.difficulty <= unlockedDifficulty(state, mode));
  const fresh = pool.filter(a => !state.completed[a.id]);
  const candidates = fresh.length ? fresh : pool;
  return candidates[((dayNumber(date) % candidates.length) + candidates.length) % candidates.length];
}
export function recordCompletion(state, activityId, score, { daily = false, date = new Date() } = {}) {
  const activity = activities.find(a => a.id === activityId);
  if (!activity) return state;
  const day = localDay(date), safeScore = Math.max(0, Math.min(1, Number.isFinite(score) ? score : 0));
  const next = { ...state, completed: { ...state.completed }, daily: { ...state.daily }, activeDays: [...new Set([...state.activeDays, day])].sort().slice(-365) };
  // A completed activity grants XP once. Replays remain available without farming XP.
  if (!next.completed[activityId]) next.completed[activityId] = { score: safeScore, xp: 20 + Math.round(safeScore * 10) };
  if (daily) {
    const done = next.daily[day] ?? [];
    const targetModes = dailyModes(date);
    const completedModes = done.map(id => activities.find(a => a.id === id)?.mode);
    if (targetModes.includes(activity.mode) && !completedModes.includes(activity.mode)) next.daily[day] = [...done, activityId].slice(0, 3);
  }
  return next;
}
export function streak(state, date = new Date()) {
  const days = new Set(state.activeDays); const cursor = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (!days.has(localDay(cursor))) cursor.setDate(cursor.getDate() - 1);
  let count = 0;
  while (days.has(localDay(cursor))) { count++; cursor.setDate(cursor.getDate() - 1); }
  return count;
}
export function spotScore(activity, selected) { const hits = activity.lines.filter((line, index) => line.target && selected.includes(index)).length; const falseHits = activity.lines.filter((line, index) => !line.target && selected.includes(index)).length; return Math.max(0, (hits - falseHits) / activity.lines.filter(line => line.target).length); }
export function orderScore(order) { return order.filter((id, index) => id === index).length / order.length; }
export function matchScore(pairs) { return pairs.filter((value, index) => value === index).length / pairs.length; }
export function estimateScore(activity, value) { return Math.abs(activity.value - value) <= activity.tolerance ? 1 : Math.max(0.2, 1 - Math.abs(activity.value - value) / ((activity.max - activity.min) / 2)); }
export function shuffleIndices(length, offset = 1) { const list = Array.from({length}, (_, i) => i); return [...list.slice(offset % length), ...list.slice(0, offset % length)].reverse(); }
