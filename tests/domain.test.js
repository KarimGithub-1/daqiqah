import test from 'node:test';
import assert from 'node:assert/strict';
import { cards } from '../src/cards.js';
import { categories, dailyIndex, localDay, normalizeState, readState, saveState, filterCards, STORAGE_KEY } from '../src/domain.js';

test('30 complete cards, unique IDs, valid answers and HTTPS sources', () => {
  assert.equal(cards.length, 30);
  assert.equal(new Set(cards.map(card => card.id)).size, 30);
  for (const card of cards) {
    assert.ok(categories[card.category]);
    for (const key of ['title','question','explanation','takeaway','reviewedAt']) assert.ok(card[key]?.length > 0);
    assert.equal(card.options.length, 3);
    assert.equal(new Set(card.options).size, 3);
    assert.ok(Number.isInteger(card.answer) && card.answer >= 0 && card.answer < 3);
    assert.equal(new URL(card.source.url).protocol, 'https:');
  }
  for (const category of Object.keys(categories)) assert.equal(cards.filter(card => card.category === category).length, 10);
});
test('daily selection uses local calendar days, wraps after 30, supports earlier dates', () => {
  assert.equal(localDay(new Date(2026, 9, 21, 23, 59)), '2026-10-21');
  assert.equal(dailyIndex(new Date(2026, 9, 21, 0, 1), 30), 0);
  assert.equal(dailyIndex(new Date(2026, 9, 21, 23, 59), 30), 0);
  assert.equal(dailyIndex(new Date(2026, 9, 22), 30), 1);
  assert.equal(dailyIndex(new Date(2026, 10, 20), 30), 0);
  assert.equal(dailyIndex(new Date(2026, 9, 20), 30), 29);
  // UK daylight saving ends on 25 October: the next calendar day still advances by one.
  assert.equal(dailyIndex(new Date(2026, 9, 26), 30) - dailyIndex(new Date(2026, 9, 25), 30), 1);
});
test('stored state rejects corrupt shapes, unknown IDs, duplicate favorites and invalid answers', () => {
  assert.deepEqual(normalizeState({favorites:['card-01','bad','card-01'], answers:{'card-01':0,'card-02':-1,'card-03':99,'card-04':'0',bad:1}}, cards), {favorites:['card-01'],answers:{'card-01':0,'card-02':-1}});
  for (const value of [null, 42, 'bad', [], {favorites:{a:1},answers:[]}]) assert.deepEqual(normalizeState(value,cards), {favorites:[],answers:{}});
});
test('local storage round-trip preserves favorites and skipped/correct/wrong answers', () => {
  const values = new Map();
  const storage = {getItem:key => values.get(key) ?? null,setItem:(key,value) => values.set(key,value)};
  const data = {favorites:['card-03'],answers:{'card-01':0,'card-02':-1,'card-03':0}};
  assert.equal(saveState(storage,data),true);
  assert.deepEqual(readState(storage,cards),{state:data,error:false});
  values.set(STORAGE_KEY,'broken JSON');
  assert.equal(readState(storage,cards).error,true);
});
test('unavailable or full storage fails safely', () => {
  const blocked = {getItem(){throw new Error('SecurityError');},setItem(){throw new Error('QuotaExceededError');}};
  assert.deepEqual(readState(blocked,cards), {state:{favorites:[],answers:{}},error:true});
  assert.equal(saveState(blocked,{}),false);
  assert.equal(saveState(null,{}),false);
});
test('combined search, Arabic normalization, category and favorites filters', () => {
  assert.equal(filterCards(cards,{category:'world'}).length,10);
  assert.ok(filterCards(cards,{query:'  الاستعجال  '}).some(card => card.id === 'card-01'));
  assert.ok(filterCards(cards,{query:'ألاستعجال'}).some(card => card.id === 'card-01'));
  assert.deepEqual(filterCards(cards,{favoriteIds:[]}),[]);
  assert.deepEqual(filterCards(cards,{category:'world',favoriteIds:['card-01','card-21']}).map(card => card.id),['card-21']);
  assert.equal(filterCards(cards,{query:'zxqnotfound'}).length,0);
});
