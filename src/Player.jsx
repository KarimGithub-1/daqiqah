import React, { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowLeft, ArrowRight, Check, Clock3, Lightbulb, Pause, Play, RefreshCw, Star, ExternalLink, X } from 'lucide-react';
import { Game } from './Games';
import { modes, sources } from './gameData';
import { levelInfo, recordCompletion, totalXP } from './gameEngine';
import { localDay } from './domain';
export default function Player({activity,progress,setProgress,daily}) {
 const mode=modes.find(m=>m.id===activity.mode),source=sources[activity.source];
 const [result,setResult]=useState(null),[hint,setHint]=useState(false),[round,setRound]=useState(0),[remaining,setRemaining]=useState(activity.seconds??mode.seconds),[visible,setVisible]=useState(document.visibilityState==='visible');
 const resultRef=useRef(null),headingRef=useRef(null),done=useRef(false);
 useEffect(()=>{headingRef.current?.focus({preventScroll:true});},[]);
 useEffect(()=>{ const update=()=>setVisible(document.visibilityState==='visible'); document.addEventListener('visibilitychange',update); return()=>document.removeEventListener('visibilitychange',update); },[]);
 useEffect(()=>{ if(!progress.timer||result||!visible||remaining<=0)return; const timer=setInterval(()=>setRemaining(value=>Math.max(0,value-1)),1000);return()=>clearInterval(timer);},[progress.timer,result,visible,remaining]);
 useEffect(()=>{if(result)resultRef.current?.focus();},[result]);
 function finish(score,detail) {
  if(done.current)return;done.current=true;
  const next=recordCompletion(progress,activity.id,score,{daily:daily===localDay()});
  const gained=totalXP(next)-totalXP(progress);setProgress(next);setResult({score,detail,gained});
 }
 function retry(){done.current=false;setResult(null);setHint(false);setRemaining(mode.seconds);setRound(previous=>previous+1);}
 return <div className="player-page"><div className="player-top"><a className="back-link" href={daily?'#/daily':`#/mode/${mode.id}`}><ArrowRight size={17} aria-hidden="true"/>{daily?'الجولة اليومية':mode.title}</a><button className={`timer-button ${progress.timer?'on':''}`} aria-pressed={progress.timer} onClick={()=>setProgress(previous=>({...previous,timer:!previous.timer}))}><Clock3 size={17} aria-hidden="true"/>{progress.timer?<><span className="timer-count">{Math.floor(remaining/60)}:{String(remaining%60).padStart(2,'0')}</span><Pause size={14} aria-hidden="true"/></>:'مؤقّت اختياري'}</button></div>
 <div className="player-meta"><span className={`topic-pill ${mode.tone}`}>{mode.title}</span><span>المستوى {activity.difficulty} · {mode.category}</span></div><h1 ref={headingRef} tabIndex={-1}>{activity.title}</h1>
 {progress.timer&&remaining===0&&!result&&<p className="time-message" role="status">انتهى الوقت، لكن الفكرة تستحق أن تكمل. تابع بهدوء دون أي خسارة.</p>}
 <AnimatePresence mode="wait">{result?<motion.section {...{initial:{opacity:0,scale:.98},animate:{opacity:1,scale:1},exit:{opacity:0}}} key="result" className="result-panel"><div className="result-stars" role="img" aria-label={`${result.score>=.85?3:result.score>=.6?2:1} من ثلاث نجوم`}>{[0,1,2].map(i=><motion.span key={i} initial={{scale:.5,opacity:0}} animate={{scale:1,opacity:1}} transition={{delay:i*.08,type:'spring',bounce:.3}}><Star size={34} fill={i<(result.score>=.85?3:result.score>=.6?2:1)?'currentColor':'none'}/></motion.span>)}</div><h2 ref={resultRef} tabIndex={-1}>{result.score>=.85?'جميل. الفكرة أصبحت أوضح.':'المهم هو ما اكتشفته الآن.'}</h2><p className="earned" role="status">{result.gained>0?`+${result.gained} نقطة معرفة`:'مراجعة مفيدة · سبق احتساب نقاط هذه التجربة'}</p><div className="lesson"><span><Lightbulb size={20} aria-hidden="true"/>الفكرة التي تأخذها معك</span><p>{activity.lesson}</p></div><details className="result-detail"><summary>راجع اختياراتك والتفسير</summary><p>{result.detail}</p></details>{source.url?<a className="source-link" href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={14} aria-hidden="true"/></a>:<p className="source-link">مثال حسابي أصلي؛ خطوات الحساب موضحة في التفسير.</p>}<div className="result-actions"><a className="button primary" href={daily?'#/daily':`#/mode/${mode.id}`}>{daily?'أكمل الجولة اليومية':'تحدٍّ آخر في هذه التجربة'}<ArrowLeft size={17} aria-hidden="true"/></a><button className="button secondary" onClick={retry}><RefreshCw size={16} aria-hidden="true"/>جرّب مسارًا آخر</button></div></motion.section>:<motion.div key={`game-${round}`} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="game-surface"><Game key={`${activity.id}-${round}`} activity={activity} onComplete={finish}/><div className="hint-area"><button className="hint-button" aria-expanded={hint} onClick={()=>setHint(!hint)}><Lightbulb size={17} aria-hidden="true"/>{hint?'إخفاء التلميح':'أحتاج تلميحًا'}</button>{hint&&<p role="status">{activity.hint}</p>}</div></motion.div>}</AnimatePresence>
 <p className="player-footnote">جرّب، افهم، وجرّب من جديد. لا قلوب ولا محاولات ضائعة.</p></div>;
}
