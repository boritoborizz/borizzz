'use client';
import { useMemo, useState } from 'react';
import './styles.css';

const makeCode = () => Math.random().toString(36).slice(2,6).toUpperCase();
const ranks = ['A','2','3','4','5','6','7','8','9','10','J','Q','K','★'];
export default function Home(){
 const [name,setName]=useState('Boris'); const [room,setRoom]=useState(''); const [screen,setScreen]=useState('home'); const [players,setPlayers]=useState([]); const [notice,setNotice]=useState('');
 const create=()=>{if(!name.trim())return setNotice('Bitte gib einen Namen ein.'); const code=makeCode();setRoom(code);setPlayers([{name:name.trim(),host:true}]);setScreen('lobby');setNotice('Raum erstellt. Teile den Code mit deinen Freunden.');};
 const join=()=>{if(!name.trim()||room.length!==4)return setNotice('Name und vierstelliger Raumcode erforderlich.');setPlayers([{name:name.trim()}]);setScreen('lobby');setNotice('Dies ist der Online-UI-Prototyp. Die echte Raum-Synchronisierung wird als nächstes mit Supabase verbunden.');};
 const cards=useMemo(()=>[null,null,null,null],[]);
 if(screen==='lobby')return <main className="app"><Header/><section className="panel lobby"><p className="eyebrow">DEIN RAUMCODE</p><div className="code">{room}</div><p>Teile diesen Code mit deinen Freunden.</p><div className="list">{players.map((p,i)=><div key={i}><b>{p.name}</b>{p.host&&<span>HOST</span>}</div>)}</div><button className="gold" onClick={()=>setScreen('game')}>Test-Runde starten</button><p className="note">Die erste Online-Version enthält bereits die Web-App-Struktur. Für echte Mehrgeräte-Räume wird im nächsten Schritt Supabase Realtime verbunden.</p></section></main>;
 if(screen==='game')return <main className="app"><Header/><section className="table"><div className="opponent"><b>Anna</b><div className="hand">{cards.map((_,i)=><Card key={i}/>)}</div></div><div className="center"><p className="eyebrow">TEST-RUNDE</p><h2>Dein Zug</h2><p>Die Online-Spieloberfläche ist bereit.</p><div className="piles"><div><Card/><small>ZIEHSTAPEL</small></div><div><div className="face">7</div><small>ABLAGE</small></div></div><button className="gold" onClick={()=>setNotice('Als Nächstes verbinden wir Räume und Echtzeit-Spielzustände.')}>Karte ziehen</button></div><div className="you"><b>{name}</b><div className="hand">{cards.map((_,i)=><Card key={i}/>)}</div></div></section>{notice&&<p className="toast">{notice}</p>}</main>;
 return <main className="app"><Header/><section className="panel"><p className="eyebrow">PRIVATE ONLINE-KARTENSPIEL-APP</p><h1>Borizzz</h1><p>Erstelle einen Raum, teile den Code und spiele später mit Freunden – im selben WLAN oder online.</p><label>Dein Name</label><input value={name} onChange={e=>setName(e.target.value)} maxLength="16"/><button className="gold" onClick={create}>Raum erstellen</button><div className="split">oder</div><label>Raumcode</label><input value={room} onChange={e=>setRoom(e.target.value.toUpperCase())} maxLength="4" placeholder="AB12"/><button className="ghost" onClick={join}>Raum beitreten</button>{notice&&<p className="notice">{notice}</p>}</section></main>;
}
function Header(){return <header><div><strong>Borizzz</strong><span>ONLINE · V1</span></div><small>Memory & Reaktion</small></header>}
function Card(){return <div className="card"/>}
