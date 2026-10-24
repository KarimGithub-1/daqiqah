import test from 'node:test';
import assert from 'node:assert/strict';
import {modes,activities,sources} from '../src/gameData.js';
import {emptyProgress,cleanProgress,modeCount,unlockedDifficulty,totalXP,levelInfo,dailyModes,pickActivity,recordCompletion,streak,spotScore,orderScore,matchScore,estimateScore,shuffleIndices} from '../src/gameEngine.js';
const today=new Date(2026,9,21,12);
test('ten distinct game schemas with complete original content and accessible difficulty path',()=>{
 assert.equal(modes.length,10);assert.equal(activities.length,44);assert.equal(new Set(activities.map(a=>a.id)).size,44);
 for(const m of modes){const pool=activities.filter(a=>a.mode===m.id);assert.ok(pool.length>=4);assert.ok(pool.filter(a=>a.difficulty===1).length>=2);for(const a of pool){assert.ok(a.hint&&a.lesson&&sources[a.source]);if(a.mode==='branch'){assert.equal(a.choices.length,3);assert.ok(new Set(a.choices.map(c=>c.response)).size>1);assert.equal(a.followups.length,3);}if(a.mode==='spot')assert.ok(a.lines.some(l=>l.target)&&a.lines.some(l=>!l.target));if(a.mode==='sort')assert.ok(a.items.every(i=>a.buckets[i.bucket]));if(a.mode==='build')assert.equal(a.parts.length,3);if(a.mode==='match')assert.equal(new Set(a.pairs.map(p=>p.right)).size,a.pairs.length);if(a.options)assert.ok(a.answer>=0&&a.answer<a.options.length);}}
});
test('every game starts open; deeper challenges unlock from distinct completions',()=>{
 let state=emptyProgress();for(const m of modes)assert.equal(unlockedDifficulty(state,m.id),1);
 state=recordCompletion(state,'branch-1',.8,{date:today});assert.equal(unlockedDifficulty(state,'branch'),1);
 state=recordCompletion(state,'branch-1',1,{date:today});assert.equal(modeCount(state,'branch'),1);
 state=recordCompletion(state,'branch-2',1,{date:today});assert.equal(unlockedDifficulty(state,'branch'),2);
 state=recordCompletion(state,'branch-3',1,{date:today});assert.equal(unlockedDifficulty(state,'branch'),3);
});
test('XP rewards completion, is bounded, and cannot be farmed by retry or reload',()=>{
 const initial=emptyProgress();let state=recordCompletion(initial,'spot-1',1,{date:today});assert.equal(totalXP(state),30);assert.equal(totalXP(initial),0);
 state=recordCompletion(state,'spot-1',.1,{date:today});assert.equal(totalXP(state),30);
 state=recordCompletion(state,'spot-2',-5,{date:today});assert.equal(totalXP(state),50);
 assert.equal(levelInfo(state).level,1);assert.deepEqual(cleanProgress(JSON.parse(JSON.stringify(state))),state);
});
test('daily plan is stable, uses three different modes, changes with date and awards bonus once',()=>{
 const ids=dailyModes(today);assert.equal(new Set(ids).size,3);assert.deepEqual(dailyModes(today),ids);assert.notDeepEqual(dailyModes(new Date(2026,9,22)),ids);
 let state=emptyProgress();const chosen=ids.map(mode=>pickActivity(state,mode,today));for(const a of chosen)state=recordCompletion(state,a.id,1,{date:today,daily:true});assert.equal(totalXP(state),120);assert.equal(state.daily['2026-10-21'].length,3);
 state=recordCompletion(state,chosen[0].id,1,{date:today,daily:true});assert.equal(totalXP(state),120);
 const another=activities.find(a=>a.mode===chosen[0].mode&&a.id!==chosen[0].id&&a.difficulty===1);state=recordCompletion(state,another.id,1,{date:today,daily:true});assert.equal(state.daily['2026-10-21'].length,3);assert.equal(totalXP(state),150);
});
test('free play does not complete daily stations; unrelated modes cannot count as daily',()=>{
 const ids=dailyModes(today),a=activities.find(a=>a.mode===ids[0]);let state=recordCompletion(emptyProgress(),a.id,1,{date:today});assert.equal(Object.keys(state.daily).length,0);
 const other=activities.find(a=>!ids.includes(a.mode));state=recordCompletion(state,other.id,1,{date:today,daily:true});assert.equal(Object.keys(state.daily).length,0);
});
test('rotation prioritizes unseen eligible content and eventually reaches all activities',()=>{
 for(const m of modes){let state=emptyProgress();const pool=activities.filter(a=>a.mode===m.id);for(let i=0;i<pool.length;i++){const a=pickActivity(state,m.id,today);assert.ok(!state.completed[a.id]);assert.ok(a.difficulty<=unlockedDifficulty(state,m.id));state=recordCompletion(state,a.id,1,{date:today});}assert.equal(modeCount(state,m.id),pool.length);}
});
test('streak handles yesterday, missing days, and daylight-saving calendar transitions',()=>{
 let state={...emptyProgress(),activeDays:['2026-10-19','2026-10-20']};assert.equal(streak(state,today),2);state.activeDays.push('2026-10-21');assert.equal(streak(state,today),3);assert.equal(streak(state,new Date(2026,9,23)),0);
 state.activeDays=['2026-10-24','2026-10-25','2026-10-26'];assert.equal(streak(state,new Date(2026,9,26)),3);
});
test('corrupt persisted progress is sanitized without granting invented XP',()=>{
 const state=cleanProgress({completed:{'branch-1':{score:1,xp:100000},bad:{score:1},'branch-2':{score:NaN}},daily:null,activeDays:'bad',timer:'yes'});assert.equal(totalXP(state),30);assert.deepEqual(state.activeDays,[]);assert.equal(state.timer,false);assert.equal(Object.keys(state.completed).length,1);
});
test('spotting false positives, ordering, matching, estimates all score outcomes meaningfully',()=>{
 const a=activities.find(a=>a.id==='spot-1');assert.equal(spotScore(a,[1,2]),1);assert.equal(spotScore(a,[0,1,2,3]),0);assert.equal(spotScore(a,[]),0);
 assert.equal(orderScore([0,1,2,3]),1);assert.equal(orderScore([3,2,1,0]),0);assert.equal(matchScore([0,1,2]),1);assert.equal(matchScore([2,1,0]),1/3);
 const estimate=activities.find(a=>a.id==='estimate-1');assert.equal(estimateScore(estimate,64),1);assert.ok(estimateScore(estimate,10)<.5);
 assert.deepEqual([...shuffleIndices(4)].sort(),[0,1,2,3]);
});

test('daily recovery rejects fabricated stations, duplicate modes and invalid dates',()=>{
 const date='2026-10-21',mode=dailyModes(today)[0],eligible=activities.filter(a=>a.mode===mode);
 const value={completed:Object.fromEntries(eligible.map(a=>[a.id,{score:1}])),daily:{[date]:eligible.map(a=>a.id),'2026-99-99':['branch-1']}};
 const clean=cleanProgress(value);assert.equal(clean.daily[date].length,1);assert.equal(clean.daily['2026-99-99'],undefined);
});
