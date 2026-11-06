'use client';
import { useEffect, useRef, useState } from 'react';
const rank = c => c?.joker ? '★' : c?.v === 1 ? 'A' : c?.v === 11 ? 'J' : c?.v === 12 ? 'Q' : c?.v === 13 ? 'K' : c?.v;
const card = (playerId, index) => document.querySelector(`[data-player="${playerId}"][data-slot="${index}"]`);
const pile = name => document.querySelector(`[data-pile="${name}"]`);
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));
function restingPlace(playerId) {
 const first = card(playerId, 0);
 if (!first) return null;
 const r = first.getBoundingClientRect();
 return { left: r.left + r.width * 1.2, top: r.top - r.height * .55, width: r.width, height: r.height };
}
async function flight(source, target, face, duration = 700, delay = 0) {
 const a = source?.getBoundingClientRect?.() || source, b = target?.getBoundingClientRect?.() || target;
 if (!a || !b || reduced()) return;
 const ghost = document.createElement('div'); ghost.className = `flying-card motion-ghost ${face ? 'face' : 'back'}`;
 if (face) ghost.textContent = rank(face);
 Object.assign(ghost.style, { left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px` });
 document.body.appendChild(ghost);
 try {
  const animation = ghost.animate([
   { transform: 'translate(0,0) scale(1)', filter: 'brightness(1)', offset: 0 },
   { transform: `translate(${(b.left - a.left) * .5}px,${(b.top - a.top) * .5 - 36}px) scale(1.08)`, filter: 'brightness(1.12)', offset: .52 },
   { transform: `translate(${b.left - a.left}px,${b.top - a.top}px) scale(1)`, filter: 'brightness(1)', offset: 1 }
  ], { duration, delay, easing: 'cubic-bezier(.28,.7,.35,1)', fill: 'forwards' });
  await animation.finished.catch(() => {});
 } finally { ghost.remove(); }
}
async function spotlight(element, duration = 1250) {
 if (!element) return;
 if (reduced()) { element.scrollIntoView({ block: 'nearest', behavior: 'instant' }); return; }
 element.classList.add('motion-spotlight');
 try { await pause(duration); } finally { element.classList.remove('motion-spotlight'); }
}
async function play(e, names, notify) {
 const who = id => names[id] || 'Jemand', from = (id, ix) => card(id, ix), deck = pile('deck'), discard = pile('discard');
 const stand = id => restingPlace(id) || from(id, 0);
 if (e.kind === 'queenPick') { notify(`${who(e.actorId)} wählt Karte ${e.index + 1} von ${who(e.playerId)} für die Dame.`); await spotlight(from(e.playerId, e.index), 900); }
 else if (e.kind === 'queenSwap') {
  const a = from(e.a.playerId, e.a.index), b = from(e.b.playerId, e.b.index);
  notify(`${who(e.actorId)} tauscht Karte ${e.a.index + 1} von ${who(e.a.playerId)} mit Karte ${e.b.index + 1} von ${who(e.b.playerId)}.`);
  if (a && b && !reduced()) { a.classList.add('motion-muted'); b.classList.add('motion-muted'); try { await Promise.all([flight(a, b, null, 1050), flight(b, a, null, 1050)]); } finally { a.classList.remove('motion-muted'); b.classList.remove('motion-muted'); } } else await spotlight(b);
 }
 else if (e.kind === 'look') { notify(`${who(e.actorId)} schaut sich Karte ${e.index + 1} von ${who(e.playerId)} an.`); await spotlight(from(e.playerId, e.index), 1500); }
 else if (e.kind === 'draw') { notify(`${who(e.actorId)} zieht eine verdeckte Karte.`); await flight(deck, stand(e.actorId), null, 700); }
 else if (e.kind === 'discard') { notify(`${who(e.actorId)} legt eine Karte ab.`); await flight(stand(e.actorId), discard, e.card); }
 else if (e.kind === 'swapDrawn') { notify(`${who(e.actorId)} tauscht die gezogene Karte mit Karte ${e.index + 1}.`); await flight(stand(e.actorId), from(e.actorId, e.index), null, 680); await flight(from(e.actorId, e.index), discard, e.card, 680); }
 else if (e.kind === 'take') { notify(`${who(e.actorId)} nimmt die Ablage und legt Karte ${e.index + 1} ab.`); await flight(discard, from(e.actorId, e.index), e.card, 680); await flight(from(e.actorId, e.index), discard, e.discarded, 680); }
 else if (e.kind === 'match') { notify(`${who(e.actorId)} legt Karte ${e.index + 1} von ${who(e.playerId)} passend ab.`); await flight(from(e.playerId, e.index), discard, e.card); }
 else if (e.kind === 'gift') { notify(`${who(e.actorId)} gibt eine Karte an ${who(e.targetId)}, Platz ${e.slot + 1}.`); await flight(from(e.actorId, e.index), from(e.targetId, e.slot), null, 950); }
 else if (e.kind === 'penalty') { notify(`${who(e.actorId)} erhält eine verdeckte Strafkarte.`); await flight(deck, from(e.actorId, e.index), null); }
}
/** Reacts to ordered public events. Never receives hidden card values. */
export default function SyncedMotion({ state }) {
 const seen = useRef(null), room = useRef(null), chain = useRef(Promise.resolve()), [caption, setCaption] = useState('');
 const players = state?.players || [], names = Object.fromEntries(players.map(p => [p.id, p.name]));
 useEffect(() => {
  if (!state?.room?.id) return;
  if (room.current !== state.room.id) { room.current = state.room.id; seen.current = state.seq || 0; chain.current = Promise.resolve(); return; }
  const events = (state.events || []).filter(e => e.seq > (seen.current || 0)).sort((a, b) => a.seq - b.seq);
  if (!events.length) return;
  seen.current = events.at(-1).seq;
  const people = Object.fromEntries(state.players.map(p => [p.id, p.name]));
  for (const e of events) chain.current = chain.current.then(() => play(e, people, setCaption)).catch(() => {});
  chain.current = chain.current.then(() => setCaption(''));
 }, [state?.room?.id, state?.seq, state?.events, state?.players]);
 return <div className="motion-caption" role="status" aria-live="polite" aria-atomic="true">{caption}</div>;
}
