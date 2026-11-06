// Run with: node tests/multiplayer-smoke.cjs
// Mock the Supabase query surface; no network or secret keys are needed.
const fs = require('fs');
const vm = require('vm');
const assert = require('assert');
const crypto = require('crypto');
const store = { rooms: [], room_players: [], room_private: [] };
let seq = 0;
class Query {
  constructor(table) { this.table = table; this.filters = []; this.op = 'select'; }
  select() { return this; }
  eq(k, v) { this.filters.push([k, v]); return this; }
  order(k) { this.orderKey = k; return this; }
  insert(p) { this.op = 'insert'; this.payload = p; return this; }
  upsert(p) { this.op = 'upsert'; this.payload = p; return this; }
  update(p) { this.op = 'update'; this.payload = p; return this; }
  single() { return this.run(true); }
  maybeSingle() { return this.run(true); }
  then(ok, bad) { return Promise.resolve(this.run()).then(ok, bad); }
  run(single = false) {
    const rows = store[this.table];
    if (this.op === 'insert') {
      const row = { id: `row${++seq}`, ...this.payload };
      if (this.table === 'rooms' && rows.some(r => r.code === row.code)) return { error: { message: 'duplicate' } };
      rows.push(row);
      return { data: single ? row : [row], error: null };
    }
    if (this.op === 'upsert') {
      const key = this.table === 'room_private' ? 'room_id' : 'id';
      const old = rows.find(r => r[key] === this.payload[key]);
      if (old) Object.assign(old, this.payload); else rows.push({ ...this.payload });
      return { error: null };
    }
    const found = rows.filter(r => this.filters.every(([k, v]) => r[k] === v));
    if (this.op === 'update') { found.forEach(r => Object.assign(r, this.payload)); return { error: null }; }
    if (this.orderKey) found.sort((a, b) => a[this.orderKey] - b[this.orderKey]);
    return { data: single ? found[0] || null : found, error: null };
  }
}
const source = fs.readFileSync(require('path').join(__dirname, '..', 'app/api/game/route.js'), 'utf8')
  .replace(/^import .*;\s*$/gm, '')
  .replace('export const dynamic', 'const dynamic')
  .replace('export async function POST', 'async function POST') + '\nmodule.exports={POST};';
const context = {
  module: { exports: {} }, createClient: () => ({ from: t => new Query(t) }),
  NextResponse: { json: (obj, opts = {}) => ({ status: opts.status || 200, json: async () => JSON.parse(JSON.stringify(obj)) }) },
  process: { env: { SUPABASE_SERVICE_ROLE_KEY: 'test-only', SUPABASE_URL: 'mock' } },
  crypto, console, Date, Math
};
vm.createContext(context);
vm.runInContext(source, context);
async function ask(action, token, room, extra = {}) {
  const res = await context.module.exports.POST({ json: async () => ({ action, token, room, ...extra }) });
  const body = await res.json();
  if (res.status !== 200) throw new Error(`${action}: ${JSON.stringify(body)}`);
  return body.state;
}
(async () => {
  let host = await ask('create', 'host', '', { name: 'Host' });
  const room = host.room.code;
  assert(host.me.id && host.me.id !== 'self');
  let guest = await ask('join', 'guest', room, { name: 'Gast' });
  assert.equal(guest.players.length, 2);
  host = await ask('start', 'host', room);
  guest = await ask('state', 'guest', room);
  assert.equal(host.phase, 'peek');
  assert.equal(host.me.startPeek.length, 2);
  assert.equal(guest.me.startPeek.length, 2);
  assert.notEqual(host.me.id, guest.me.id);
  assert(host.me.hand.every(c => c.back && !('v' in c)));
  assert(guest.me.hand.every(c => c.back && !('v' in c)));
  assert.equal(guest.players[0].slots.length, 4);
  store.room_private[0].state.peekUntil = Date.now() - 1;
  host = await ask('state', 'host', room);
  assert.equal(host.phase, 'turn');
  assert.equal(host.turnPlayerId, host.me.id);
  assert.equal(host.me.startPeek, null);
  host = await ask('draw', 'host', room);
  assert.equal(typeof host.me.drawn.v, 'number');
  guest = await ask('state', 'guest', room);
  assert.equal(guest.me.drawn, null);
  host = await ask('discardDrawn', 'host', room);
  if (host.phase === 'special') {
    if (host.special.type === 'Q') host = await ask('specialSkip', 'host', room);
    else host = await ask('specialPick', 'host', room, { targetPlayerId: host.special.type === 'K' ? guest.me.id : host.me.id, index: 0 });
  }
  assert.equal(host.phase, 'reaction');
  host = await ask('advance', 'host', room);
  assert.equal(host.players[1].turn, true);
  console.log('PASS: lobby, both private peeks, hidden card values, draw, discard, turn handoff');
})().catch(e => { console.error(e); process.exitCode = 1; });
