
'use strict';
// ═══ STATE ═══════════════════════════════════════════════════════════
var S={cur:'home',game:null,passCb:null,feat:null,cfg:{sfx:true,haptic:true,bg:false,save:true,theme:'',music:false,lowPower:true,perfMode:'eco',largeTap:false,colorBlind:false},prof:{name:'Player',av:'👤',xp:0,lvl:1,games:0,wins:0,losses:0,streak:0,best:0,bluff:0,betrayals:0,reflex:null,time:0,hist:[],style:''},ach:[]};
var BOT_BOARD_GAMES=['chess','draughts','ttt','c4','blitz','ludo','snl'];
var BOT_FILL_GAMES=['shadow','spy','hot','split','sv','chaos','impfreq','trust','word','meld','deadrop','heist','chain','bgrid','lsig','dungeon'];
var Save={k:'po5',save:function(){try{localStorage.setItem(this.k,JSON.stringify({p:S.prof,c:S.cfg,a:S.ach}));}catch(e){}},load:function(){try{var d=JSON.parse(localStorage.getItem(this.k)||'null');if(d){if(d.p)Object.assign(S.prof,d.p);if(d.c)Object.assign(S.cfg,d.c);if(d.a)S.ach=d.a;}this.migrateTitles();}catch(e){}},
migrateTitles:function(){
  /* PRSM-P0-01 / G-6 — map old display titles in history; keep game ids */
  var map={'Connect Four':'Four in a Row','Connect 4':'Four in a Row','Codenames':'Clue Grid','Taboo':'Word Dodge','Word Assassin':'Word Dodge','Dead Drop':'Clue Grid','Mind Meld':'Think Alike'};
  var changed=false;
  if(S.prof&&Array.isArray(S.prof.hist)){
    S.prof.hist.forEach(function(h){if(h&&h.g&&map[h.g]){h.g=map[h.g];changed=true;}});
  }
  try{
    var lb=JSON.parse(localStorage.getItem('po5_lb')||'{}');
    Object.keys(lb).forEach(function(id){if(lb[id]&&lb[id].title&&map[lb[id].title]){lb[id].title=map[lb[id].title];changed=true;}});
    if(changed)localStorage.setItem('po5_lb',JSON.stringify(lb));
  }catch(e){}
  if(changed)this.save();
},
reset:function(){localStorage.clear();location.reload();}};

// ═══ EVENT BUS ═══════════════════════════════════════════════════════
var Bus={_l:{},on:function(e,f){(this._l[e]||(this._l[e]=[])).push(f);},emit:function(e,d){(this._l[e]||[]).forEach(function(f){try{f(d);}catch(err){}});}};

// ═══ AUDIO ═══════════════════════════════════════════════════════════
var Snd=(function(){var ctx=null,mg=null;
function init(){try{ctx=new(window.AudioContext||window.webkitAudioContext)();mg=ctx.createGain();mg.gain.value=0.2;mg.connect(ctx.destination);}catch(e){}}
function wake(){if(ctx&&ctx.state==='suspended')ctx.resume();}
function tone(f,tp,dur,g,dl){if(!ctx||!S.cfg.sfx)return;wake();try{var o=ctx.createOscillator(),gn=ctx.createGain(),now=ctx.currentTime+(dl||0);o.type=tp||'sine';o.frequency.setValueAtTime(f,now);gn.gain.setValueAtTime(0,now);gn.gain.linearRampToValueAtTime(g||0.2,now+0.015);gn.gain.exponentialRampToValueAtTime(0.001,now+(dur||0.13));o.connect(gn);gn.connect(mg);o.start(now);o.stop(now+(dur||0.13)+0.04);}catch(e){}}
return{init:init,wake:wake,
click:function(){tone(860,'sine',0.05,0.08);},
ok:function(){tone(440,'sine',0.08,0.17);tone(554,'sine',0.08,0.17,0.08);tone(660,'sine',0.12,0.17,0.17);},
err:function(){tone(150,'sawtooth',0.12,0.17);tone(110,'sawtooth',0.16,0.17,0.08);},
danger:function(){tone(85,'square',0.08,0.25);tone(85,'square',0.08,0.25,0.12);},
reveal:function(){[0,.05,.1,.15,.2].forEach(function(d,i){tone(300+i*80,'sine',0.17,0.2,d);});},
betray:function(){tone(360,'sawtooth',0.04,0.35);tone(170,'sawtooth',0.25,0.35,0.08);},
vote:function(){tone(490,'sine',0.07,0.11);},
blast:function(){tone(75,'sawtooth',0.04,0.42);tone(45,'square',0.32,0.24,0.16);},
pass:function(){tone(580,'sine',0.07,0.16);tone(780,'sine',0.1,0.16,0.08);},
lvlup:function(){[262,294,330,370,392,523].forEach(function(f,i){tone(f,'sine',0.16,0.24,i*0.08);});},
reflex:function(ms){tone(Math.max(150,790-ms*2),'sine',0.05,0.24);},
tick:function(n){tone(n===0?870:410,'sine',0.11,0.24);}
};})();

// ═══ HAPTICS (V1 + V2 combined) ══════════════════════════════════════
var Hap={
l:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate(8);},
m:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate(25);},
h:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([42,15,42]);},
err:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([15,8,15,8,62]);},
ok:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([15,15,48]);},
blast:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([75,24,75,24,160]);},
heartbeat:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([38,55,38,200,38,55,38]);},
panic:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([18,8,18,8,18,8,55,8,18,8,18]);},
heavy:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([75,38,75,38,190]);},
roleReveal:function(isShadow){if(!S.cfg.haptic||!navigator.vibrate)return;if(isShadow)navigator.vibrate([28,18,28,18,95,18,28]);else navigator.vibrate([55,18,190]);},
betray:function(){if(S.cfg.haptic&&navigator.vibrate)navigator.vibrate([140,28,48,28,140]);}
};

// ═══ BACKGROUND CANVAS (lazy, perf-aware) ════════════════════════════
var BG=(function(){var c,x,pts=[],W=0,H=0,running=false,rafId=0;
function _particleCount(){return(S.cfg.lowPower||S.cfg.perfMode==='eco')?8:22;}
function init(){c=document.getElementById('bg');if(!c)return;x=c.getContext('2d');resize();window.addEventListener('resize',resize,{passive:true});_seed();if(S.cfg.bg&&!S.cfg.lowPower){c.style.display='';start();}else{c.style.display='none';}}
function _seed(){var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];pts=[];for(var i=0;i<_particleCount();i++)pts.push({x:Math.random(),y:Math.random(),s:Math.random()*1.2+0.3,vx:(Math.random()-.5)*.00022,vy:(Math.random()-.5)*.00022,c:cols[i%cols.length],p:Math.random()*Math.PI*2});}
function resize(){if(!c)return;W=c.width=window.innerWidth;H=c.height=window.innerHeight;}
function start(){if(running||!x||!S.cfg.bg||S.cfg.lowPower)return;if(c)c.style.display='';running=true;loop();}
function stop(){running=false;if(rafId){cancelAnimationFrame(rafId);rafId=0;}if(c)c.style.display='none';}
function loop(){if(!running||!x)return;x.clearRect(0,0,W,H);if(S.cfg.bg&&!S.cfg.lowPower){var eco=S.cfg.perfMode==='eco';if(!eco){x.strokeStyle='rgba(255,255,255,0.008)';x.lineWidth=1;var gs=72;for(var i=0;i<=W;i+=gs){x.beginPath();x.moveTo(i,0);x.lineTo(i,H);x.stroke();}for(var j=0;j<=H;j+=gs){x.beginPath();x.moveTo(0,j);x.lineTo(W,j);x.stroke();}}var spd=eco?0.008:0.012;pts.forEach(function(p){p.p+=spd;p.x=(p.x+p.vx+1)%1;p.y=(p.y+p.vy+1)%1;x.globalAlpha=Math.sin(p.p)*.08+.08;x.fillStyle=p.c;x.beginPath();x.arc(p.x*W,p.y*H,p.s,0,Math.PI*2);x.fill();});x.globalAlpha=1;}rafId=requestAnimationFrame(loop);}
return{init:init,start:start,stop:stop,_seed:_seed};})();
var PrismPerf={isDebug:function(){return/[?&]debug=1(?:&|$)/.test(location.search);},apply:function(){if(!S||!S.cfg)return;var eco=!!S.cfg.lowPower||S.cfg.perfMode==='eco';document.body.classList.toggle('eco-mode',eco);document.body.classList.toggle('low-power',!!S.cfg.lowPower);document.body.classList.toggle('large-tap',!!S.cfg.largeTap);document.body.classList.toggle('color-blind',!!S.cfg.colorBlind);if(S.cfg.bg&&!S.cfg.lowPower){if(window.BG&&BG.start)BG.start();}else{if(window.BG&&BG.stop)BG.stop();}}};

// ═══ PLAY TRACKER (local most-played insights) ═══════════════════════
var PlayTracker={_k:'po5_plays',
record:function(id){if(!id)return;try{var d=JSON.parse(localStorage.getItem(this._k)||'{}');d[id]=(d[id]||0)+1;localStorage.setItem(this._k,JSON.stringify(d));}catch(e){}},
top:function(n){try{var d=JSON.parse(localStorage.getItem(this._k)||'{}');return Object.keys(d).sort(function(a,b){return d[b]-d[a];}).slice(0,n||3).map(function(id){return{id:id,count:d[id]};});}catch(e){return[];}},
html:function(){var rows=this.top(3);if(!rows.length)return'';return'<div style="margin:0 15px 10px;padding:13px 15px;background:rgba(191,90,242,.07);border:1.5px solid rgba(191,90,242,.2);border-radius:15px"><div class="text-caption" style="margin-bottom:8px">Most played</div>'+rows.map(function(r,i){var g=typeof Reg!=='undefined'?Reg.get(r.id):null;if(!g)return'';return'<div style="display:flex;align-items:center;gap:10px;padding:7px 0'+(i<rows.length-1?';border-bottom:1px solid rgba(255,255,255,.06)':'')+'" onclick="GL.launch(\''+r.id+'\')"><div style="width:28px;text-align:center;font-size:1.1rem" aria-hidden="true">'+g.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+g.title+'</div><div style="font-size:0.75rem;opacity:.55">'+r.count+' launch'+(r.count===1?'':'es')+'</div></div><div style="opacity:.25;font-size:0.75rem">▶</div></div>';}).join('')+'</div>';}};

// ═══ TOAST ═══════════════════════════════════════════════════════════
var _tt=null;
function toast(msg,dur,dir){var el=document.getElementById('toast');el.textContent=msg;el.className='show'+(dir?' dir':'');if(_tt)clearTimeout(_tt);_tt=setTimeout(function(){el.className='';},dur||2400);}

// ═══ MODAL ═══════════════════════════════════════════════════════════
var Modal={_cb:null,open:function(html,cb){var ov=document.getElementById('ov'),m=document.getElementById('modal');document.getElementById('mc').innerHTML=html;ov.className='open';setTimeout(function(){m.classList.add('open');},10);this._cb=cb;ov.onclick=function(e){if(e.target===ov)Modal.close();};Snd.click();},close:function(){var ov=document.getElementById('ov'),m=document.getElementById('modal');m.classList.remove('open');setTimeout(function(){ov.className='';if(Modal._cb)Modal._cb();},300);}};

// ═══ NAVIGATION ══════════════════════════════════════════════════════
var _navGoReal=function(scr){var prev=S.cur;if(prev===scr&&scr!=='game')return;document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('on');});var el=document.getElementById(scr+'-screen');if(el)el.classList.add('active');var ni=document.querySelector('.ni[data-s="'+scr+'"]');if(ni)ni.classList.add('on');S.cur=scr;document.title=(scr.charAt(0).toUpperCase()+scr.slice(1).replace(/-/g," "))+" — PrismCap";var nav=document.getElementById('nav');if(nav)nav.className=scr==='game'?'hide':'';if(scr==='dashboard'){UI.dash();}if(scr==='profile'){UI.prof();}if(scr==='home'){UI.home();}if(scr==='arcade'){Arcade.build();}if(scr==='game'&&S.game){var gr=document.getElementById('gright');if(gr)gr.innerHTML='<div style="display:flex;gap:6px;align-items:center"><button type="button" onclick="QRSync.showTransfer(S.game)" style="font-size: 0.75rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Transfer" aria-label="Transfer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4h14v-4"/></svg></button><button type="button" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});GL.exitGame();}" style="font-size: 0.75rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Suspend" aria-label="Suspend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg></button><span style="opacity:.32;font-size:.73rem">'+(S.game.mp?'👥 '+S.game.players.length:'🎮')+'</span></div>';}Snd.click();Hap.l();};
var Nav={go:function(scr){
  if(scr==='library'||scr==='arcade'){
    /* Switch shell immediately; hydrate games pack async. */
    _navGoReal(scr);
    window.ensureGamesPack(function(){
      try { if (scr==='arcade' && window.Arcade) Arcade.build(); }
      catch(e){}
      try { if (scr==='library' && window.GL && GL._buildLib) GL._buildLib('all'); }
      catch(e){}
    });
    return;
  }
  _navGoReal(scr);
}};
window.Nav = Nav;

window.ensureGamesPack = function (cb) {
  if (window.__PRISM_GAMES_PACK__) { if (cb) cb(); return; }
  if (window.__PRISM_GAMES_LOADING__) {
    (window.__PRISM_GAMES_WAITERS__ = window.__PRISM_GAMES_WAITERS__ || []).push(cb);
    return;
  }
  window.__PRISM_GAMES_LOADING__ = true;
  window.__PRISM_GAMES_WAITERS__ = cb ? [cb] : [];
  function done() {
    window.__PRISM_GAMES_PACK__ = true;
    window.__PRISM_GAMES_LOADING__ = false;
    try {
      if (window.GL) {
        if (GL._buildFeat) GL._buildFeat();
        if (GL._buildScrolls) GL._buildScrolls();
        if (GL._buildLib) GL._buildLib('all');
      }
      var lc = document.getElementById('lib-count');
      if (lc && window.Reg) lc.textContent = Reg.list.length + ' games · Fully offline';
    } catch (e) {}
    var q = window.__PRISM_GAMES_WAITERS__ || [];
    window.__PRISM_GAMES_WAITERS__ = [];
    q.forEach(function (fn) { try { if (fn) fn(); } catch (e) {} });
  }
  function loadScript(src, next) {
    var s = document.createElement('script');
    s.src = src;
    s.onload = next;
    s.onerror = next;
    document.head.appendChild(s);
  }
  function startGames() {
    /* v4 systems only with games pack — never on Home idle (v5 §3d TBT). */
    loadScript('js/v4-systems.js?v=469', function () {
      loadScript('js/games/example-game.js?v=469', function () {
        loadScript('js/games-core.js?v=469', function () {
          loadScript('js/games-deferred.js?v=469', done);
        });
      });
    });
  }
  startGames();
};
window.ensureV4Systems = function (cb) {
  window.ensureGamesPack(cb);
};


// ═══ PASS & PLAY ═════════════════════════════════════════════════════
/* PRSM-P1-04 — pass interstitial + aria-live turn announcements */
var GameShell={
  announceTurn:function(playerName){
    var live=document.getElementById('turn-live');
    if(!live){
      live=document.createElement('div');
      live.id='turn-live';
      live.className='sr-only';
      live.setAttribute('aria-live','polite');
      live.setAttribute('aria-atomic','true');
      document.body.appendChild(live);
    }
    live.textContent='Pass to '+(playerName||'next player');
  },
  passTo:function(player,role,secret,cb){
    var name=player&&player.name?player.name:'Player';
    var av=player&&player.av?player.av:'🎮';
    this.announceTurn(name);
    PP.show(name,av,role||('Pass to '+name),secret,cb);
  }
};
var PP={show:function(name,av,role,secret,cb){var ps=document.getElementById('pass');document.getElementById('pav').textContent=av;document.getElementById('pnm').textContent=name;document.getElementById('prl').textContent=role||('Pass to '+name);document.getElementById('pass-c').style.display='flex';document.getElementById('pass-rv').style.display='none';var btn=document.querySelector('#pass-c button');if(btn)btn.style.display='block';ps.className='on';S.passCb={secret:secret,cb:cb};if(typeof GameShell!=='undefined')GameShell.announceTurn(name);Snd.pass();Hap.m();},
reveal:function(){var cb=S.passCb;if(!cb)return;document.getElementById('pass-c').style.display='none';var rv=document.getElementById('pass-rv');rv.style.display='block';rv.innerHTML=cb.secret;Snd.reveal();Hap.h();setTimeout(function(){rv.innerHTML+='<button type="button" class="btn bw bf" style="margin-top:18px;max-width:250px;display:block;margin-left:auto;margin-right:auto" onclick="PP.done()">✓ Got it — Continue</button>';},400);},
done:function(){var cb=S.passCb;document.getElementById('pass').className='';S.passCb=null;if(cb&&cb.cb)cb.cb();}};

// ═══ XP & RANKS ══════════════════════════════════════════════════════
var XP={ranks:['Rookie','Operative','Agent','Specialist','Veteran','Elite','Phantom','Shadow','Ghost','Legend'],tbl:[0,100,250,450,700,1000,1400,1900,2500,3200],
add:function(n,mult){var m=mult||1;var total=Math.round(n*m);var prev=S.prof.lvl;S.prof.xp+=total;S.prof.lvl=this.lvl(S.prof.xp);if(S.prof.lvl>prev){Snd.lvlup();Hap.ok();toast('⬆️ Level Up! '+this.rank(S.prof.lvl));}Save.save();},
lvl:function(xp){for(var i=this.tbl.length-1;i>=0;i--){if(xp>=this.tbl[i])return i+1;}return 1;},
rank:function(l){return this.ranks[Math.min(l-1,this.ranks.length-1)];},
pct:function(xp){var l=this.lvl(xp),i=l-1,c=this.tbl[i]||0,n=this.tbl[i+1]||c+1000;return((xp-c)/(n-c))*100;},
nxt:function(xp){var l=this.lvl(xp),i=l-1;return(this.tbl[i+1]||99999)-xp;}};

// ═══ ACHIEVEMENTS ════════════════════════════════════════════════════
var Ach={all:[{id:'g1',i:'🎮',n:'First Launch',d:'Play your first game',xp:50},{id:'w1',i:'🏆',n:'Winner',d:'Win your first game',xp:100},{id:'w10',i:'👑',n:'Champion',d:'Win 10 games',xp:250},{id:'bet',i:'🗡️',n:'Betrayer',d:'First betrayal',xp:75},{id:'s3',i:'🔥',n:'On Fire',d:'3-game win streak',xp:150},{id:'s5',i:'💥',n:'Unstoppable',d:'5-game win streak',xp:300},{id:'blf',i:'🃏',n:'Master Bluffer',d:'Fool 5 players',xp:200},{id:'r200',i:'⚡',n:'Lightning',d:'Sub 200ms reflex',xp:200},{id:'r150',i:'🌩️',n:'Thunder',d:'Sub 150ms reflex',xp:400},{id:'m10',i:'🧠',n:'Sharp Mind',d:'Memory level 10',xp:200},{id:'p25',i:'🎯',n:'Devoted',d:'Play 25 games',xp:300},{id:'p50',i:'🌟',n:'Veteran',d:'Play 50 games',xp:500},{id:'all',i:'🎰',n:'Explorer',d:'Try every game',xp:750},{id:'owl',i:'🌙',n:'Night Owl',d:'Play after midnight',xp:100},{id:'daily5',i:'📅',n:'Daily Grinder',d:'Complete 5 daily challenges',xp:350},{id:'surv10',i:'🛡️',n:'Survivor',d:'Survive 10 rounds in any survival game',xp:180}],
unlock:function(id){if(S.ach.includes(id))return;var a=this.all.find(function(x){return x.id===id;});if(!a)return;S.ach.push(id);toast('🏆 '+a.n+'! +'+a.xp+'XP');XP.add(a.xp);Save.save();},
check:function(){var p=S.prof;if(p.games>=1)this.unlock('g1');if(p.wins>=1)this.unlock('w1');if(p.wins>=10)this.unlock('w10');if(p.betrayals>=1)this.unlock('bet');if(p.best>=3)this.unlock('s3');if(p.best>=5)this.unlock('s5');if(p.games>=25)this.unlock('p25');if(p.games>=50)this.unlock('p50');if(new Date().getHours()<5)this.unlock('owl');}};

// ═══ DRAMA ENGINE (now fully wired) ══════════════════════════════════
var Drama={
state:{tension:0,trust:{},paranoia:{},momentum:'neutral'},
reset:function(players){var self=this;this.state.tension=0;this.state.trust={};this.state.paranoia={};players.forEach(function(p){self.state.trust[p.id]=50;self.state.paranoia[p.id]=20;});this.state.momentum='neutral';},
tick:function(ev){if(ev==='betray'){this.state.tension=Math.min(100,this.state.tension+22);}else if(ev==='vote'){this.state.tension=Math.min(100,this.state.tension+7);}else if(ev==='win'){this.state.tension=Math.max(0,this.state.tension-12);}else{this.state.tension=Math.min(100,this.state.tension+3);}this.state.momentum=this.state.tension>85?'critical':this.state.tension>65?'escalating':'neutral';Bus.emit('drama:tick',this.state);this._updateBanner();},
_updateBanner:function(){var b=this.getBanner();var el=document.getElementById('tension-bar');if(!el)return;if(b&&S.cur==='game'){el.style.display='flex';el.style.background=b.col+'22';el.style.color=b.col;el.style.borderBottom='1px solid '+b.col+'44';el.textContent=b.text;}else{el.style.display='none';}},
getEvent:function(){var t=this.state.tension;var e={low:['A strange silence falls.','Someone is watching carefully.'],mid:['Trust levels dropping.','Paranoia spreads through the ranks.','An alliance may be forming — or breaking.'],high:['⚠️ Multiple deception patterns detected.','Trust has collapsed. Betrayal imminent.'],peak:['🚨 CHAOS THRESHOLD REACHED.','No one trusts anyone anymore.']};var pool=t<30?e.low:t<60?e.mid:t<85?e.high:e.peak;return pool[Math.floor(Math.random()*pool.length)];},
getBanner:function(){var t=this.state.tension;if(t>85)return{text:'🚨 CRITICAL TENSION',col:PCBrand.h_ff2d55};if(t>60)return{text:'⚠️ ESCALATING',col:PCBrand.h_ff6b00};if(t>35)return{text:'👁 MONITORING',col:PCBrand.h_ffd60a};return null;}};

// ═══ DIRECTOR ENGINE ═════════════════════════════════════════════════
var Director={
state:{intensity:0.3,phase:'buildup',round:0},
curve:[0.2,0.3,0.5,0.65,0.8,0.9,0.75,0.95,1.0,0.85],
init:function(pc){this.state.intensity=0.3;this.state.phase='buildup';this.state.round=0;},
next:function(){this.state.round++;var idx=Math.min(this.state.round,this.curve.length-1);this.state.intensity=this.curve[idx];this.state.phase=this.state.round<=2?'buildup':this.state.round<=5?'rising':this.state.round<=7?'peak':'climax';Announcer.phaseChange();return this.state;},
chaos:function(){return Math.random()<this.state.intensity*0.38;},
announce:function(){var m={buildup:['Phase: INFILTRATION','Agents deployed. Trust wisely.'],rising:['Phase: ESCALATION','Tensions rising. Betrayals imminent.'],peak:['Phase: CRITICAL MASS','⚠️ All safeguards off.'],climax:['ENDGAME PROTOCOL','🚨 Final phase. No mercy.']};var p=m[this.state.phase]||m.buildup;return p[Math.floor(Math.random()*p.length)];}};

// ═══ ANNOUNCER ═══════════════════════════════════════════════════════
var Announcer={_q:[],_t:null,
say:function(msg,dur){this._q.push({msg:msg,dur:dur||2600});this._flush();},
_flush:function(){if(this._t||!this._q.length)return;var item=this._q.shift();toast('[DIRECTOR] '+item.msg,item.dur,true);var self=this;this._t=setTimeout(function(){self._t=null;self._flush();},item.dur+280);},
betray:function(name){this.say(name+' just made a move.',2800);},
tension:function(){this.say(Drama.getEvent(),3000);},
gameStart:function(title,n){this.say('▶ '+title+' — '+n+' operatives.',2600);},
win:function(name){this.say('🏆 '+name+' dominates. Session complete.',2800);},
phaseChange:function(){this.say(Director.announce(),2800);}};

// ═══ SESSION MEMORY (properly wired) ════════════════════════════════
var Memory={_k:'po5_mem',data:{rivalries:{},session:{betrayals:0},history:[]},
load:function(){try{var d=JSON.parse(localStorage.getItem(this._k)||'null');if(d)Object.assign(this.data,d);}catch(e){}},
save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
recordBetrayal:function(fromName,toName){var k=fromName+'->'+toName;if(!this.data.rivalries[k])this.data.rivalries[k]={from:fromName,to:toName,count:0};this.data.rivalries[k].count++;this.data.session.betrayals++;this.save();Announcer.betray(fromName);Drama.tick('betray');},
getInsight:function(name){var msgs=[];Object.values(this.data.rivalries).forEach(function(r){if(r.from===name&&r.count>0)msgs.push('You\'ve betrayed '+r.to+' '+r.count+'× before');if(r.to===name&&r.count>0)msgs.push(r.from+' has betrayed you '+r.count+'× in past sessions');});return msgs.length?msgs[0]:null;}};

// ═══ SUSPEND SYSTEM ══════════════════════════════════════════════════
var Suspend={_k:'po5_sus',
save:function(game,gs,meta){if(!game)return;var snap={id:game.id,title:game.title,icon:game.icon,col:game.col,gs:JSON.parse(JSON.stringify(gs)),players:JSON.parse(JSON.stringify(game.players)),ts:Date.now(),meta:meta||{}};try{localStorage.setItem(this._k,JSON.stringify(snap));}catch(e){}toast('💾 Saved — resume anytime');},
load:function(){try{return JSON.parse(localStorage.getItem(this._k)||'null');}catch(e){return null;}},
clear:function(){localStorage.removeItem(this._k);},
has:function(){return!!localStorage.getItem(this._k);},
resume:function(){var snap=this.load();if(!snap)return false;var game=Reg.get(snap.id);if(!game)return false;game.players=snap.players;game.gs=snap.gs;game.t0=Date.now();S.game=game;Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);game.render();toast('▶ Resuming '+game.title);return true;}};

// ═══ DAILY CHALLENGE ════════════════════════════════════════════════
var Daily={
all:[{id:'reflex_200',title:'Lightning Hands',desc:'Get sub-200ms reflex',game:'reflex',xp:150,icon:'⚡',check:function(){return S.prof.reflex&&S.prof.reflex<200;}},{id:'memory_8',title:'Matrix Mind',desc:'Reach level 8 in Memory Matrix',game:'mem',xp:200,icon:'🧠',check:function(){return false;}},{id:'survive_12',title:'AI Survivor',desc:'Survive 12 turns in AI Survival',game:'aisurv',xp:175,icon:'🤖',check:function(){return false;}},{id:'chaos_card',title:'Chaos Master',desc:'Play a full Chaos Cards game',game:'chaos',xp:160,icon:'🃏',check:function(){return false;}},{id:'spy_win',title:'Spy Hunter',desc:'Win a game of Spy Hunt',game:'spy',xp:140,icon:'👁️',check:function(){return false;}},{id:'tap_80',title:'Tap God',desc:'Get 80+ taps in Quick Tap',game:'qtap',xp:165,icon:'👆',check:function(){return false;}},{id:'decode_5',title:'Code Breaker',desc:'Decode 5 signals in one session',game:'decode',xp:190,icon:'🔐',check:function(){return false;}},{id:'maze_3',title:'Maze Runner',desc:'Complete 3 maze levels',game:'maze',xp:130,icon:'🌀',check:function(){return false;}},{id:'rhythm_10',title:'Beat Master',desc:'Reach x10 combo in Rhythm Pulse',game:'rhythm',xp:155,icon:'🎵',check:function(){return false;}},{id:'reflex_150',title:'Thunder Strike',desc:'Get sub-150ms reflex',game:'reflex',xp:220,icon:'🌩️',check:function(){return S.prof.reflex&&S.prof.reflex<150;}}],
getToday:function(){var d=new Date();var seed=d.getFullYear()*10000+(d.getMonth()+1)*100+d.getDate();return this.all[seed%this.all.length];},
isDone:function(){return!!localStorage.getItem('po5_d_'+new Date().toDateString());},
complete:function(){var ch=this.getToday();var k='po5_d_'+new Date().toDateString();if(localStorage.getItem(k))return;localStorage.setItem(k,'1');XP.add(ch.xp);var dc=(parseInt(localStorage.getItem('po5_dc')||'0'))+1;localStorage.setItem('po5_dc',dc);if(dc>=5)Ach.unlock('daily5');toast('🎯 Daily Complete! +'+ch.xp+' XP');Announcer.say('Daily mission complete. Outstanding.',2800);},
completeForGame:function(gameId){var ch=this.getToday();if(this.isDone())return;if(ch.game===gameId)this.complete();},
checkComplete:function(gameId){var ch=this.getToday();if(this.isDone())return;if(ch.game===gameId&&(ch.check&&ch.check()||false))this.complete();}};

// ═══ MUTATOR SYSTEM (now with game reads) ════════════════════════════
var Mutators={
all:[{id:'speed',name:'Speed Round',icon:'⏱️',desc:'Timers halved',col:PCBrand.h_ff6b00},{id:'silent',name:'Silent Mode',icon:'🤫',desc:'No talking',col:PCBrand.h_888},{id:'chaos',name:'Double Chaos',icon:'🌀',desc:'2× chaos events',col:PCBrand.h_bf5af2},{id:'sudden',name:'Sudden Death',icon:'💀',desc:'One miss = eliminated',col:PCBrand.h_ff2d55},{id:'blind',name:'Blind',icon:'🙈',desc:'Scores hidden',col:PCBrand.h_64d2ff},{id:'elite',name:'Elite Mode',icon:'🔥',desc:'Triple XP',col:PCBrand.h_ffd60a},{id:'corrupt',name:'Corrupted',icon:'👾',desc:'UI glitches',col:PCBrand.h_8888ff}],
active:[],
presets:[],
_presKey:'po5_presets',
loadPresets:function(){try{this.presets=JSON.parse(localStorage.getItem(this._presKey)||'[]');}catch(e){this.presets=[];}},
savePresets:function(){try{localStorage.setItem(this._presKey,JSON.stringify(this.presets));}catch(e){}},
// Read helpers - called by games
speed:function(base){return this.has('speed')?Math.round(base/2):base;},
hasBlind:function(){return this.has('blind');},
hasSudden:function(){return this.has('sudden');},
xpMult:function(){return this.has('elite')?3:1;},
hasChaos:function(){return this.has('chaos');},
has:function(id){return this.active.some(function(m){return m.id===id;});},
apply:function(){if(this.has('silent'))toast('🤫 SILENT MODE — No talking!');if(this.has('corrupt')){setInterval(function(){if(Math.random()<0.1){var el=document.getElementById('gbody');if(el){el.style.filter='hue-rotate(25deg)';setTimeout(function(){el.style.filter='';},80);}}},2000);}},
showPicker:function(cb){var self=this;var sel=this.active.map(function(m){return m.id;});Modal.open('<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">⚙️ Mutators</div><div style="font-size:.76rem;opacity:.38;margin-bottom:14px">Choose up to 3 game modifiers</div><div style="display:flex;flex-direction:column;gap:7px">'+this.all.map(function(m){var on=sel.includes(m.id);return'<div class="pchip" style="cursor:pointer;background:'+(on?m.col+'22':'rgba(255,255,255,.04)')+';border-color:'+(on?m.col+'55':'var(--border)')+'" onclick="window._mut(\''+m.id+'\')"><div style="font-size:1.3rem">'+m.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+m.name+'</div><div style="font-size: 0.75rem;opacity:.38">'+m.desc+'</div></div>'+(on?'<div style="color:'+m.col+';font-weight:800;font-size:.8rem">ON</div>':'<div style="opacity:.25;font-size:.8rem">off</div>')+'</div>';}).join('')+'</div><div style="margin-top:12px"><div style="font-size: 0.75rem;opacity:.35;margin-bottom:7px;text-transform:uppercase;letter-spacing:.1em">Saved Presets</div>'+
(this.presets.length?this.presets.map(function(pr,i){return'<div style="display:flex;align-items:center;gap:8px;padding:9px 11px;background:rgba(255,255,255,.04);border-radius:10px;margin-bottom:6px;cursor:pointer" onclick="window._loadpreset('+i+')"><div style="flex:1"><div style="font-size:.82rem;font-weight:700">'+pr.name+'</div><div style="font-size: 0.75rem;opacity:.35">'+pr.ids.join(', ')+'</div></div><div style="font-size:0.75rem;opacity:.4">Load</div></div>';}).join(''):'<div style="opacity:.28;font-size:.78rem;text-align:center;padding:8px">No saved presets</div>')+
'</div><div style="display:flex;gap:8px;margin-top:12px"><button type="button" class="btn bg" style="flex:1" onclick="window._savepreset()">Save preset</button><button type="button" class="btn bw" style="flex:1" onclick="window._mutdone()">Apply →</button></div></div>');
window._mut=function(id){var idx=sel.indexOf(id);if(idx>-1)sel.splice(idx,1);else{if(sel.length>=3){toast('Max 3 mutators');return;}sel.push(id);}self.active=self.all.filter(function(m){return sel.includes(m.id);});Modal.close();setTimeout(function(){self.showPicker(cb);},260);Snd.click();};
window._mutdone=function(){Modal.close();setTimeout(cb,260);};
window._savepreset=function(){
  if(typeof CapPrompt!=='function')return;
  CapPrompt({title:'Name this preset',placeholder:'Preset name',confirmLabel:'Save'}).then(function(nm){
    if(!nm)return;
    self.presets.push({name:nm,ids:sel});
    self.savePresets();
    toast('Preset saved!');
  });
};
window._loadpreset=function(i){sel=self.presets[i].ids.slice();self.active=self.all.filter(function(m){return sel.includes(m.id);});Modal.close();setTimeout(function(){self.showPicker(cb);},260);};}};

// ═══ META PROGRESSION ════════════════════════════════════════════════
var Meta={_k:'po5_meta',data:{unlocked:[]},
unlockables:[{id:'theme_cyber',type:'theme',name:'Cyberpunk',req:{xp:500},icon:'🟢',rare:false},{id:'theme_horror',type:'theme',name:'Horror',req:{xp:800},icon:'🔴',rare:false},{id:'theme_gold',type:'theme',name:'Gold',req:{wins:20},icon:'🟡',rare:false},{id:'theme_synth',type:'theme',name:'Synthwave',req:{xp:1200},icon:'🩷',rare:true},{id:'theme_glitch',type:'theme',name:'⚡ GLITCH',req:{xp:2500},icon:'👾',rare:true,legendary:true},{id:'title_shadow',type:'title',name:'Shadow Operative',req:{xp:600},icon:'👻',rare:false},{id:'title_ghost',type:'title',name:'Ghost Protocol',req:{xp:2000},icon:'☠️',rare:true,legendary:true},{id:'daily_5',type:'badge',name:'Daily Grinder',req:{xp:0,dailyDone:5},icon:'📅',rare:false}],
load:function(){try{var d=JSON.parse(localStorage.getItem(this._k)||'null');if(d)Object.assign(this.data,d);}catch(e){}},
save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
isUnlocked:function(id){return this.data.unlocked.includes(id);},
check:function(prof){var self=this,news=[];this.unlockables.forEach(function(u){if(self.data.unlocked.includes(u.id))return;var r=u.req,ok=true;if(r.xp&&(prof.xp||0)<r.xp)ok=false;if(r.wins&&(prof.wins||0)<r.wins)ok=false;if(r.games&&(prof.games||0)<r.games)ok=false;if(ok){self.data.unlocked.push(u.id);news.push(u);self.save();}});news.forEach(function(u,i){setTimeout(function(){toast((u.legendary?'🌟 LEGENDARY: ':'✨ Unlocked: ')+u.name);if(u.legendary){Snd.lvlup();Hap.heavy();}else{Snd.ok();}},i*1300);});},
getProgress:function(id){var u=this.unlockables.find(function(x){return x.id===id;});if(!u||!u.req)return 100;var p=S.prof,r=u.req;if(r.xp&&r.xp>0)return Math.min(100,Math.round((p.xp||0)/r.xp*100));if(r.wins&&r.wins>0)return Math.min(100,Math.round((p.wins||0)/r.wins*100));return 0;}};

// ═══ AI ENGINE ═══════════════════════════════════════════════════════
var AI={
evt:function(t){var e={shadow:['Hidden comms detected. Send one anonymous message.','Emergency vote! Fastest wins.','Double agent activated.','Blackout — all roles hidden.','New mission objective.','Loyalty called into question.','False intel distributed.'],chaos:['SILENCE: 30 seconds, no talking.','REVERSAL: Loser gains a bonus.','SPEED: All actions in 10s.','BETRAYAL WINDOW: 20s to switch sides.'],dungeon:['Secret vault in corridor.','Trap activates — floor shakes.','Merchant appears with rare gear.','Enemy reinforcements.','Hidden passage found.','Healing fountain — one drink.']};var pool=e[t]||e.chaos;return pool[Math.floor(Math.random()*pool.length)];},
roles:function(n){var base=[{name:'Field Agent',icon:'🕵️',team:'res',power:'Vote manipulation once',col:PCBrand.h_00d4ff},{name:'Corrupted Agent',icon:'🦹',team:'shadow',power:'Sabotage one vote silently',col:PCBrand.h_ff2d55},{name:'Analyst',icon:'🔍',team:'res',power:'Peek at one alignment',col:PCBrand.h_30d158},{name:'Sleeper',icon:'😴',team:'shadow',power:'Hidden until Round 3',col:PCBrand.h_bf5af2},{name:'Medic',icon:'💊',team:'res',power:'Block one elimination',col:PCBrand.h_64d2ff},{name:'Handler',icon:'📟',team:'shadow',power:'Frame another player',col:PCBrand.h_ff6b00},{name:'Ghost',icon:'👻',team:'res',power:'Skip one vote unseen',col:PCBrand.h_888},{name:'Double Agent',icon:'🎭',team:'wild',power:'Switch sides once',col:PCBrand.h_ffd60a}];var sh=[].concat(base).sort(function(){return Math.random()-.5;});var max=Math.max(1,Math.floor(n*.25)),roles=[],sw=0;for(var i=0;i<n;i++){var r=sh[i%sh.length];if(r.team==='shadow'&&sw<max){roles.push(Object.assign({},r));sw++;}else if(r.team!=='shadow'){roles.push(Object.assign({},r));}else{roles.push(Object.assign({},base[0]));}}return roles.sort(function(){return Math.random()-.5;});},
bluffs:[{t:'The average person walks 100,000 miles in a lifetime',l:'The average person walks 50,000 miles'},{t:'Honey never expires — 3000-year-old honey found edible',l:'Honey expires after 2 years'},{t:'Octopuses have three hearts',l:'Octopuses have two hearts'},{t:'A day on Venus is longer than a year on Venus',l:'A year on Venus is longer than a day'},{t:'Hot water can freeze faster than cold water (Mpemba)',l:'Cold water always freezes faster'},{t:'Crows recognize faces and hold grudges',l:'Crows have very poor individual memory'},{t:'Bananas are berries but strawberries are not',l:'Strawberries are berries but bananas are not'},{t:'Oxford University is older than the Aztec Empire',l:'The Aztec Empire is older than Oxford'},{t:'Nintendo was founded in 1889',l:'Nintendo was founded in 1985'},{t:'Cleopatra lived closer to the Moon landing than to the pyramids',l:'Cleopatra lived closer to the pyramids than the Moon landing'},{t:'You cannot hum with your nose pinched closed',l:'You can hum with your nose pinched'},{t:'It rains diamonds on Neptune',l:'It rains sulfuric acid on Neptune'},{t:'The shortest war lasted 38-45 minutes',l:'The shortest war lasted 6 hours'}],
chaos:[{tp:'challenge',i:'⚡',txt:'Everyone does 5 push-ups or loses a point.',c:PCBrand.h_ff6b00},{tp:'sabotage',i:'💣',txt:'Choose a player. They skip their next turn.',c:PCBrand.h_ff2d55},{tp:'alliance',i:'🤝',txt:'Form a secret alliance with the player to your left.',c:PCBrand.h_30d158},{tp:'bluff',i:'🎭',txt:'Lie about your score. Others must guess the real one.',c:PCBrand.h_bf5af2},{tp:'memory',i:'🧠',txt:'Remember: 847291. You will be tested later.',c:PCBrand.h_64d2ff},{tp:'strategy',i:'♟️',txt:'Take 3 points from any one player.',c:PCBrand.h_00d4ff},{tp:'betrayal',i:'🗡️',txt:'Secretly vote to eliminate a player this round.',c:PCBrand.h_ff2d55},{tp:'chaos',i:'🌀',txt:'All players swap scores with the person to their left.',c:PCBrand.h_ff6b00},{tp:'truth',i:'🔮',txt:'Ask any player a yes/no question. They must answer truthfully.',c:PCBrand.h_30d158},{tp:'speed',i:'⏱️',txt:'Name 5 countries in 10 seconds or lose 2 points.',c:PCBrand.h_ff6b00},{tp:'deal',i:'💰',txt:'Offer any player a deal. Refuse = both lose 1 point.',c:PCBrand.h_ffd60a},{tp:'mystery',i:'❓',txt:'Draw 2 chaos cards. Choose which one applies.',c:PCBrand.h_bf5af2},{tp:'reverse',i:'🔄',txt:'Highest scorer gives 2 points to the lowest.',c:PCBrand.h_00d4ff},{tp:'bonus',i:'⭐',txt:'Impression of another player. Everyone laughs = +3 pts.',c:PCBrand.h_ffd60a},{tp:'silence',i:'🤫',txt:'No talking for 60 seconds. Hand signals only.',c:PCBrand.h_888},{tp:'double',i:'✌️',txt:'Everything scores double this round.',c:PCBrand.h_30d158},{tp:'wildcard',i:'🃏',txt:'You create the rule. Everyone follows.',c:PCBrand.h_ff6b00}],
room:function(){var r=[{n:'Armory',i:'⚔️',dan:.2},{n:'Dark Vault',i:'🔒',dan:.3},{n:'Healing Chamber',i:'💊',dan:0},{n:'Trap Room',i:'💀',dan:.8},{n:'Market',i:'🛒',dan:.1},{n:'Boss Chamber',i:'👹',dan:.9},{n:'Shrine',i:'🛕',dan:.4},{n:'Library',i:'📚',dan:0}];return r[Math.floor(Math.random()*r.length)];},
sevts:[{i:'🔋',t:'Power surge! +15 energy.'},{i:'⚠️',t:'Hostile approaching sector 4.'},{i:'💡',t:'Abandoned cache. Risk it?'},{i:'🌪️',t:'Malfunction! -10 resources.'},{i:'⭐',t:'Efficiency exceeded. Bonus!'},{i:'🕳️',t:'Sensor anomaly. Something is wrong.'},{i:'📡',t:'Unknown signal. Another survivor?'},{i:'🚨',t:'CRITICAL: Life support at 15%.'}],
mission:function(){var m=['Identify corrupted agents before extraction.','Protect the data core for 5 rounds.','Collect 3 intelligence fragments.','Survive until reinforcements — trust no one.','Find the agent with the detonator.','Complete objective under comms blackout.'];return m[Math.floor(Math.random()*m.length)];}};

// ═══ THEME ENGINE (now with glitch theme) ════════════════════════════
var Theme={list:[{id:'',nm:'Minimal',i:'⬛',bg:[PCBrand.h_000,PCBrand.h_111]},{id:'t-cyber',nm:'Cyberpunk',i:'🟢',bg:[PCBrand.h_001a0e,PCBrand.h_003320],req:'theme_cyber'},{id:'t-neon',nm:'Neon',i:'🟣',bg:[PCBrand.h_0d001a,PCBrand.h_1a0033]},{id:'t-term',nm:'Terminal',i:'💻',bg:[PCBrand.h_000500,PCBrand.h_001400]},{id:'t-horror',nm:'Horror',i:'🔴',bg:[PCBrand.h_050000,PCBrand.h_200000],req:'theme_horror'},{id:'t-space',nm:'Deep Space',i:'🔵',bg:[PCBrand.h_00000d,PCBrand.h_00001a]},{id:'t-gold',nm:'Gold',i:'🟡',bg:[PCBrand.h_0a0800,PCBrand.h_1a1400],req:'theme_gold'},{id:'t-synth',nm:'Synthwave',i:'🩷',bg:[PCBrand.h_0d0010,PCBrand.h_1a0020],req:'theme_synth'},{id:'t-mid',nm:'Midnight',i:'🔮',bg:[PCBrand.h_05050f,PCBrand.h_0a0a1e]},{id:'t-red',nm:'Red Alert',i:'🚨',bg:[PCBrand.h_0f0000,PCBrand.h_1f0000]},{id:'t-glitch',nm:'GLITCH',i:'👾',bg:[PCBrand.h_000,PCBrand.h_001a1a],req:'theme_glitch',legendary:true}],
apply:function(id){document.body.className='';if(id)document.body.classList.add(id);S.cfg.theme=id;Save.save();},
build:function(el){if(!el)return;el.innerHTML='';var self=this;this.list.forEach(function(th){var locked=th.req&&!Meta.isUnlocked(th.req);var d=document.createElement('div');d.className='ttile'+(S.cfg.theme===th.id?' act':'')+(locked?' locked-tile':'');d.style.background='linear-gradient(135deg,'+th.bg[0]+','+th.bg[1]+')';d.style.opacity=locked?'0.38':'1';d.innerHTML='<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:9px"><div style="font-size:1.2rem">'+(locked?'🔒':th.i)+'</div><div style="font-size:0.75rem;font-weight:700">'+(th.legendary?'★ ':'')+th.nm+'</div></div>';d.onclick=function(){if(locked){toast('🔒 Unlock required');return;}self.apply(th.id);el.querySelectorAll('.ttile').forEach(function(x){x.classList.remove('act');});d.classList.add('act');Hap.m();toast('Theme: '+th.nm);};el.appendChild(d);});}};

// ═══ PERSONA ENGINE ══════════════════════════════════════════════════
var Persona={types:{aggressive:{label:'Aggressor',icon:'⚔️',traits:['Votes fast','Targets strong players']},deceptive:{label:'Shadow',icon:'🎭',traits:['Lies often','Builds false alliances']},strategic:{label:'Architect',icon:'♟️',traits:['Plans ahead','Votes tactically']},chaotic:{label:'Chaos Agent',icon:'🌀',traits:['Unpredictable','Random actions']},survivor:{label:'Survivor',icon:'🛡️',traits:['Defensive','Hides intentions']}},
analyze:function(p){var w=p.wins||0,b=p.betrayals||0,g=Math.max(1,p.games||1),bl=p.bluff||0,wr=w/g;if(b/g>0.3)return this.types.deceptive;if(wr>0.6&&b<3)return this.types.strategic;if(bl>5)return this.types.deceptive;if(wr<0.3)return this.types.chaotic;if(wr>0.5)return this.types.aggressive;return this.types.survivor;},
getTitle:function(p){var l=XP.lvl(p.xp||0),w=p.wins||0,b=p.betrayals||0;if(l>=10&&w>50)return'👻 Ghost Operative';if(b>20)return'🗡️ Master Betrayer';if(w>30)return'👑 Elite Strategist';if(l>=7)return'🔥 Phantom Agent';if(l>=5)return'⚡ Veteran';if(p.bluff>10)return'🎭 Shadow Bluffer';if(w>10)return'🏆 Rising Champion';return'🔰 Field Operative';}};

// ═══ GAME REGISTRY & BASE ════════════════════════════════════════════
var Reg={list:[],add:function(g){this.list.push(g);},get:function(id){return this.list.find(function(g){return g.id===id;});},mp:function(){return this.list.filter(function(g){return g.mp;});},solo:function(){return this.list.filter(function(g){return!g.mp;});},byCat:function(c){if(c==='all')return this.list;if(c==='multiplayer')return this.mp();if(c==='solo')return this.solo();return this.list.filter(function(g){return g.cat===c||g.type===c;});},board:function(){var ids=['chess','draughts','ttt','c4','ludo','snl'];return this.list.filter(function(g){return g.type==='board'||ids.indexOf(g.id)>-1;});}};
function Game(cfg){Object.assign(this,cfg);this.players=[];this.gs={};this.t0=null;}
Game.prototype.setup=function(pl){this.players=pl;this.t0=Date.now();};
Game.prototype.shuf=function(a){return[].concat(a).sort(function(){return Math.random()-.5;});};
Game.prototype.timerMs=function(base){return Mutators.speed(base);};// mutator-aware timer
var Leaderboard={k:'po5_lb',all:function(){try{return JSON.parse(localStorage.getItem(this.k)||'{}');}catch(e){return {};}},best:function(id){var e=this.all()[id];return e&&e.best?e.best:0;},record:function(id,title,score){if(typeof score!=='number'||!isFinite(score))return this.best(id);var lb=this.all();var prev=(lb[id]&&lb[id].best)||0;if(score>prev){lb[id]={best:score,title:title||id,ts:Date.now()};try{localStorage.setItem(this.k,JSON.stringify(lb));}catch(e){}return score;}return prev;}};
Game.prototype.done=function(winner){
  var dur=Math.floor((Date.now()-(this.t0||Date.now()))/60000);
  S.prof.games++;S.prof.time+=dur;
  var tried=JSON.parse(localStorage.getItem('po5t')||'[]');
  tried.push(this.id);tried=[...new Set(tried)];
  localStorage.setItem('po5t',JSON.stringify(tried));
  if(tried.length>=Reg.list.length)Ach.unlock('all');
  S.prof.hist.unshift({g:this.title,i:this.icon,w:winner,d:dur,dt:new Date().toLocaleDateString(),c:this.col});
  if(S.prof.hist.length>30)S.prof.hist=S.prof.hist.slice(0,30);
  var lp=this.players.find(function(p){return p.local;});
  if(lp&&lp.name===winner){S.prof.wins++;S.prof.streak++;if(S.prof.streak>S.prof.best)S.prof.best=S.prof.streak;XP.add(150,Mutators.xpMult());}
  else{S.prof.losses=(S.prof.losses||0)+1;S.prof.streak=0;XP.add(50,Mutators.xpMult());}
  var soloScore=(this.gs&&typeof this.gs.sc==='number')?this.gs.sc:null;
  if(soloScore!=null)Leaderboard.record(this.id,this.title,soloScore);
  Ach.check();Meta.check(S.prof);
  Daily.checkComplete(this.id);
  if (typeof Prog !== 'undefined') {
    Prog.markPlayed(this.id);
    Prog.addXP(12, 'Round complete');
  }
  Drama.tick('win');Announcer.win(winner||'Nobody');
  Save.save();
};
function prismBindTap(el,fn){if(!el||typeof fn!=='function')return;var lock=false;var wrap=function(e){if(lock)return;lock=true;try{fn(e);}finally{setTimeout(function(){lock=false;},280);}};el.addEventListener('click',wrap);el.addEventListener('touchend',function(e){e.preventDefault();wrap(e);},{passive:false});}
Game.prototype.showWin=function(winner,scores,extra){var c=this.col;var sc=(scores||[]).slice(0,5).map(function(s,i){return'<div class="rcard"><div class="rbadge" style="background:'+(i===0?c:'rgba(255,255,255,.08)')+'">'+(i===0?'👑':i+1)+'</div><div><div style="font-weight:700">'+s.n+'</div><div style="font-size:.73rem;opacity:.43">'+s.s+' pts</div></div></div>';}).join('');var cur=(this.gs&&typeof this.gs.sc==='number')?this.gs.sc:0;var best=Leaderboard.best(this.id);var lbExtra='';if(best>0||cur>0){var isNew=cur>0&&cur>=best;lbExtra='<div style="padding:10px 13px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:13px;margin:12px 0;display:flex;align-items:center;justify-content:center;gap:10px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size: 0.75rem;opacity:.38">Local best</div><div style="font-weight:800;font-size:.92rem;color:var(--amber)">'+best+' pts'+(isNew&&cur===best?' · New best!':'')+'</div></div></div>';}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px 0 30px"><div style="font-size:3.4rem;margin-bottom:5px">🏆</div><div style="font-size:2rem;font-weight:800;letter-spacing:-.03em;color:'+c+'">'+winner+'</div><div style="opacity:.38;margin-top:6px;font-size:.84rem">Wins this round!</div>'+(Mutators.active.length?'<div style="margin-top:8px;display:flex;flex-wrap:wrap;gap:4px;justify-content:center">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border-radius:100px;padding:2px 8px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+lbExtra+(extra||'')+sc+'<div style="margin-top:20px;display:flex;gap:8px;justify-content:center;flex-wrap:wrap"><button type="button" class="btn ba" style="--acc:'+c+';--glow:'+c+'3a" onclick="GL.launch(\''+this.id+'\')">Play Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';Snd.ok();Hap.ok();};

// ═══ CINEMATIC INTRO ═════════════════════════════════════════════════
var Cinematic={show:function(game,players,cb){var ov=document.createElement('div');ov.style.cssText='position:fixed;inset:0;z-index:999;background:'+PCBrand.h_000+';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:26px;transition:opacity .6s ease';ov.innerHTML='<div style="font-size:0.75rem;letter-spacing:.2em;text-transform:uppercase;opacity:.28;margin-bottom:18px">PRISMCAP · MATCH</div><div style="font-size:3.4rem;margin-bottom:12px">'+game.icon+'</div><div style="font-size:1.55rem;font-weight:800;letter-spacing:-.03em;color:'+game.col+';margin-bottom:5px">'+game.title+'</div><div style="opacity:.38;font-size:.8rem;margin-bottom:22px">'+game.desc+'</div>'+(Mutators.active.length?'<div style="margin-bottom:14px;display:flex;flex-wrap:wrap;gap:5px;justify-content:center">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:3px 10px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin-bottom:24px">'+players.map(function(p){return'<div style="background:'+p.col+'1e;border:1px solid '+p.col+'44;border-radius:100px;padding:5px 12px;font-size:.76rem;font-weight:700">'+p.av+' '+p.name+'</div>';}).join('')+'</div><div id="_cs" style="font-size: 0.75rem;opacity:.3;letter-spacing:.1em;font-family:monospace;min-height:14px"></div>';document.body.appendChild(ov);var msgs=['Scanning operators...','Loading betrayal protocols...','⚡ MATCH STARTING'];var i=0;var iv=setInterval(function(){var el=document.getElementById('_cs');if(el)el.textContent=msgs[i]||'';i++;if(i>=msgs.length){clearInterval(iv);setTimeout(function(){ov.style.opacity='0';setTimeout(function(){if(ov.parentNode)ov.parentNode.removeChild(ov);if(cb)cb();},600);},450);}},420);Announcer.gameStart(game.title,players.length);}};

// ═══ QR SYNC ═════════════════════════════════════════════════════════
var QRSync={encode:function(d){try{return btoa(JSON.stringify(d)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');}catch(e){return null;}},decode:function(s){try{var p=s.replace(/-/g,'+').replace(/_/g,'/');while(p.length%4)p+='=';return JSON.parse(atob(p));}catch(e){return null;}},
showTransfer:function(game){if(!game)return;var pkt=this.encode({v:3,id:game.id,gs:game.gs,players:game.players,ts:Date.now()});if(!pkt)return;Modal.open('<div style="text-align:center"><div style="font-size:1rem;font-weight:800;margin-bottom:3px">📡 Transfer State</div><div style="font-size:.75rem;opacity:.38;margin-bottom:14px">Share code with another device</div><div style="background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.18);border-radius:12px;padding:13px;margin-bottom:12px;font-family:monospace;font-size: 0.75rem;word-break:break-all;color:var(--cyan)">'+pkt.slice(0,100)+'...</div><button type="button" class="btn bw bf" onclick="window._cpPkt()">Copy full code</button></div>');window._fullPkt=pkt;},
showReceiver:function(){Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">📡 Receive State</div><div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Paste code from host device</div><textarea id="_qrin" style="width:100%;height:80px;padding:10px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-size:0.75rem;color:'+PCBrand.h_fff+';font-family:monospace;resize:none" placeholder="Paste code here..."></textarea><button type="button" class="btn bw bf" style="margin-top:9px" onclick="QRSync._recv()">▶ Load State</button></div>');},
_recv:function(){var code=(document.getElementById('_qrin')||{}).value||'';var d=this.decode(code.trim());if(!d||!d.id){toast('❌ Invalid code');return;}var game=Reg.get(d.id);if(!game){toast('Game not found');return;}game.players=d.players;game.gs=d.gs;Modal.close();setTimeout(function(){S.game=game;Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);game.render();toast('✅ State loaded!');},280);}};
window.QRSync=QRSync;
// ═══ MULTIPLAYER GAMES (Drama/Director/Haptics fully wired) ══════════

/* Lightweight game meta for Home — impl in games-core.js (v5 §3d). */
Reg.add({id:'shadow',title:'Shadow Protocol',icon:'🕵️',type:'deduction',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:3,max:10,desc:'Hidden roles. Social deduction. Betrayal.',_stub:true});
Reg.add({id:'hot',title:'Hot Device',icon:'💣',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Pass before it explodes! Hidden timers.',_stub:true});
Reg.add({id:'split',title:'Split Truth',icon:'🎭',type:'bluffing',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:2,max:10,desc:'Mix truth with lies. Detect the bluffs.',_stub:true});
Reg.add({id:'sv',title:'Silent Vote',icon:'🗳️',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:3,max:10,desc:'Secret voting. Hidden agendas.',_stub:true});
Reg.add({id:'chaos',title:'Chaos Cards',icon:'🃏',type:'party',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Infinite procedural party card challenges.',_stub:true});
Reg.add({id:'truthbomb',title:'Truth Bomb',icon:'💣',type:'party',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:10,desc:'Answer truth or face the bomb — party confessions.',_stub:true});
Reg.add({id:'dungeon',title:'One Device Dungeon',icon:'⚔️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:6,desc:'Pass-and-play roguelike. Alliances & betrayals.',_stub:true});
Reg.add({id:'spy',title:'Spy Hunt',icon:'👁️',type:'deduction',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:3,max:10,desc:'Find the spy before they complete their mission.',_stub:true});
Reg.add({id:'lsig',title:'Last Signal',icon:'📡',type:'survival',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:8,desc:'Cooperate to survive. But someone has a hidden agenda.',_stub:true});
Reg.add({id:'chain',title:'Chain Reaction',icon:'⚡',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'React to chain events. Combos & escalating chaos.',_stub:true});
Reg.add({id:'bgrid',title:'Betrayal Grid',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:8,desc:'Control zones. Sabotage opponents secretly.',_stub:true});
Reg.add({id:'reflex',title:'Neon Reflex',icon:'⚡',type:'reflex',cat:'solo',col:PCBrand.h_64d2ff,mp:false,min:1,max:1,desc:'Ultra-fast reflex training. Set your record.',_stub:true});
Reg.add({id:'mem',title:'Memory Matrix',icon:'🧠',type:'memory',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Remember complex patterns under pressure.',_stub:true});
Reg.add({id:'decode',title:'Signal Decode',icon:'🔐',type:'puzzle',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Decode transmissions under pressure.',_stub:true});
Reg.add({id:'qtap',title:'Quick Tap',icon:'👆',type:'reflex',cat:'solo',col:PCBrand.h_ff6b00,mp:false,min:1,max:1,desc:'Maximum tap speed. Beat your record.',_stub:true});
Reg.add({id:'pat',title:'Pattern Shift',icon:'🔷',type:'puzzle',cat:'solo',col:PCBrand.h_bf5af2,mp:false,min:1,max:1,desc:'Patterns mutate. Adapt before time runs out.',_stub:true});
Reg.add({id:'ghost',title:'Ghost Mode',icon:'👻',type:'survival',cat:'solo',col:PCBrand.h_8888ff,mp:false,min:1,max:1,desc:'Something invisible adapts to your behavior.',_stub:true});
Reg.add({id:'aisurv',title:'AI Survival',icon:'🤖',type:'survival',cat:'solo',col:PCBrand.h_ffd60a,mp:false,min:1,max:1,desc:'Procedural AI director generates survival scenarios.',_stub:true});
Reg.add({id:'cyber',title:'Cyber Tiles',icon:'🔲',type:'puzzle',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Tile-merge tactics. Chain reactions.',_stub:true});
Reg.add({id:'rhythm',title:'Rhythm Pulse',icon:'🎵',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Tap to the beat. Dynamic rhythm patterns.',_stub:true});
Reg.add({id:'maze',title:'Infinite Maze',icon:'🌀',type:'survival',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Endlessly generated mazes. Hidden dangers.',_stub:true});
Reg.add({id:'impfreq',title:'Imposter Frequency',icon:'📻',type:'deduction',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:3,max:10,desc:'Everyone gets the same topic — except the imposters.',_stub:true});
Reg.add({id:'trust',title:'Trust Fall',icon:'🤝',type:'strategy',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:2,max:8,desc:'Cooperate or defect? Prisoner\'s dilemma at scale.',_stub:true});
Reg.add({id:'rxlad',title:'Reflex Ladder',icon:'🪜',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Climb endless reflex tiers. Ghost of your best run.',_stub:true});
Reg.add({id:'snake',title:'Neon Snake',icon:'🐍',type:'reflex',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Classic snake. Neon aesthetic. Personal best.',_stub:true});
Reg.add({id:'heist',title:'The Heist',icon:'🏦',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:3,max:8,desc:'Co-op vault crack. But one player is the mole.',_stub:true});
Reg.add({id:'pressure',title:'Pressure Cooker',icon:'💢',type:'reflex',cat:'solo',col:PCBrand.h_ff2d55,mp:false,min:1,max:1,desc:'Tap the right button before pressure explodes.',_stub:true});
Reg.add({id:'chess',title:'Chess',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_64d2ff,mp:true,min:2,max:2,desc:'Classic chess. Pass-and-play on one device.',_stub:true});
Reg.add({id:'draughts',title:'Draughts',icon:'⚫',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:2,desc:'Classic checkers. Jump, capture, crown your pieces.',_stub:true});
Reg.add({id:'c4',title:'Four in a Row',icon:'⬡',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:2,max:2,desc:'Drop discs. First to line up four wins.',_stub:true});

var UI={
home:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  var h=new Date().getHours();
  set('home-greeting',h<5?'Good night, '+p.name:h<12?'Good morning, '+p.name:h<17?'Good afternoon, '+p.name:'Good evening, '+p.name);
  set('hlvl','LV'+lvl);
  var xb=document.getElementById('hxp');if(xb)xb.style.width=XP.pct(p.xp)+'%';
  set('hav',p.av);set('sg',p.games);set('sw',p.wins);set('ss',p.best);
  // Widgets area
  var wa=document.getElementById('hw-area');
  if(wa){
    var html='';
    // Resume banner
    if(Suspend.has()){var snap=Suspend.load();if(snap){html+='<div style="margin:0 15px 10px;padding:13px 15px;background:rgba(0,212,255,.08);border:1.5px solid rgba(0,212,255,.25);border-radius:15px;cursor:pointer;display:flex;align-items:center;gap:12px" onclick="Suspend.resume()"><div style="font-size:1.75rem">'+snap.icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.9rem">▶ Resume '+snap.title+'</div><div style="font-size:0.75rem;opacity:.4;margin-top:1px">'+Math.round((Date.now()-snap.ts)/60000)+'m ago</div></div><div style="font-size:0.75rem;color:var(--cyan);font-weight:700">RESUME →</div></div>';}}
    // Daily challenge
    var daily=Daily.getToday(),done=Daily.isDone();
    html+='<div style="margin:0 15px 10px;padding:13px 15px;background:'+(done?'rgba(48,209,88,.07)':'rgba(255,214,10,.07)')+';border:1.5px solid '+(done?'rgba(48,209,88,.22)':'rgba(255,214,10,.22)')+';border-radius:15px;cursor:pointer" onclick="GL.launch(\''+daily.game+'\')"><div style="display:flex;align-items:center;gap:10px"><div style="font-size:1.6rem" aria-hidden="true">'+daily.icon+'</div><div style="flex:1"><div class="text-caption" style="margin-bottom:2px">Today\'s challenge'+(done?' ✓':'')+'</div><div style="font-weight:700;font-size:.86rem">'+daily.title+'</div><div style="font-size:0.75rem;opacity:.55;margin-top:1px">'+daily.desc+'</div></div><div style="font-size:.73rem;color:var(--amber);font-weight:700">+'+daily.xp+'XP</div></div></div>';
    if(typeof PlayTracker!=='undefined')html+=PlayTracker.html();
    wa.innerHTML=html;
  }
  // Recent
  var rc=document.getElementById('recent');
  if(rc){
    if(!p.hist.length)rc.innerHTML='<div style="text-align:center;padding:18px 12px"><div style="font-size:1.6rem;margin-bottom:8px">🎮</div><div style="font-size:.84rem;opacity:.45;margin-bottom:12px;line-height:1.45">No games yet — pick your first adventure!</div><button type="button" class="btn bw bf" style="max-width:220px;margin:0 auto" onclick="Nav.go(\'library\')">Browse games →</button></div>';
    else rc.innerHTML=p.hist.slice(0,3).map(function(h){var g=Reg.list.find(function(gm){return gm.title===h.g;});return'<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer" onclick="GL.launch(\''+(g?g.id:'')+'\')"><div style="width:30px;height:30px;border-radius:8px;background:'+h.c+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem">'+h.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+h.g+'</div><div style="font-size: 0.75rem;opacity:.3">'+h.dt+(h.w?' · '+h.w:' · no winner')+'</div></div><div style="opacity:.25;font-size:0.75rem">▶</div></div>';}).join('');
  }
},
dash:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  set('drank',XP.rank(lvl));set('dlvl',lvl);set('dxp',p.xp);
  var xb=document.getElementById('dxpb');if(xb)xb.style.width=XP.pct(p.xp)+'%';
  set('dlc',lvl);set('dnxt',XP.nxt(p.xp)+' XP to next');
  set('dtg',p.games);set('dtw',p.wins);set('dts',p.best);
  set('dtt',p.time>=60?Math.floor(p.time/60)+'h':p.time+'m');
  set('dtr',p.reflex?p.reflex+'ms':'—');set('dtb',p.betrayals);
  var mp=document.getElementById('most-played-dash');
  if(mp&&typeof PlayTracker!=='undefined')mp.innerHTML=PlayTracker.html()||'<div style="text-align:center;padding:16px"><div style="font-size:1.4rem;margin-bottom:6px">📊</div><div style="font-size:.8rem;opacity:.45;margin-bottom:10px">Launch games to see your top picks</div><button type="button" class="btn bg bf" style="max-width:200px;margin:0 auto" onclick="Nav.go(\'library\')">Pick a game →</button></div>';
  // Win trend chart
  setTimeout(function(){
    var c=document.getElementById('wchart');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height;
    ctx.clearRect(0,0,W,H);
    var hist=(p.hist||[]).slice(-12).reverse();
    if(!hist.length){ctx.fillStyle='rgba(255,255,255,.15)';ctx.font='11px system-ui';ctx.fillText('Play some games first!',10,H/2);return;}
    var wins=0;
    hist.forEach(function(h,i){var isW=h.w===p.name;if(isW)wins++;var x=(i/(Math.max(hist.length-1,1)))*(W-20)+10;var y=isW?H*0.22:H*0.75;if(i>0){var px=((i-1)/(Math.max(hist.length-1,1)))*(W-20)+10;var ph=(hist[i-1].w===p.name)?H*0.22:H*0.75;ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1.5;ctx.beginPath();ctx.moveTo(px,ph);ctx.lineTo(x,y);ctx.stroke();}ctx.fillStyle=isW?PCBrand.h_30d158:PCBrand.h_ff2d55;ctx.shadowColor=isW?PCBrand.h_30d158:PCBrand.h_ff2d55;ctx.shadowBlur=8;ctx.beginPath();ctx.arc(x,y,4.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0;});
    ctx.fillStyle='rgba(255,255,255,.28)';ctx.font='10px system-ui';ctx.fillText(hist.length>0?Math.round(wins/hist.length*100)+'% win rate':'',5,H-5);
  },60);
  // Radar chart
  setTimeout(function(){
    var c=document.getElementById('radar');if(!c)return;
    var ctx=c.getContext('2d'),W=c.width,H=c.height,cx=W/2,cy=H/2,r=W*.38;
    ctx.clearRect(0,0,W,H);
    var labels=['Wins','Speed','Bluff','Betrayal','Survival'];
    var vals=[Math.min(1,(p.wins||0)/20),Math.min(1,p.reflex?Math.max(0,(500-p.reflex)/400):0),Math.min(1,(p.bluff||0)/10),Math.min(1,(p.betrayals||0)/10),Math.min(1,(p.time||0)/120)];
    // Grid
    for(var ring=1;ring<=3;ring++){ctx.strokeStyle='rgba(255,255,255,.07)';ctx.lineWidth=1;ctx.beginPath();labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;var rx=cx+Math.cos(a)*r*(ring/3);var ry=cy+Math.sin(a)*r*(ring/3);if(i===0)ctx.moveTo(rx,ry);else ctx.lineTo(rx,ry);});ctx.closePath();ctx.stroke();}
    // Axes
    labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;ctx.strokeStyle='rgba(255,255,255,.1)';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();});
    // Data
    var grd=ctx.createLinearGradient(0,0,W,H);grd.addColorStop(0,'rgba(191,90,242,.6)');grd.addColorStop(1,'rgba(0,212,255,.6)');
    ctx.fillStyle=grd;ctx.strokeStyle='rgba(0,212,255,.8)';ctx.lineWidth=2;ctx.beginPath();
    labels.forEach(function(_,i){var a=i/labels.length*Math.PI*2-Math.PI/2;var rv=vals[i];var px=cx+Math.cos(a)*r*rv;var py=cy+Math.sin(a)*r*rv;if(i===0)ctx.moveTo(px,py);else ctx.lineTo(px,py);});
    ctx.closePath();ctx.fill();ctx.stroke();
    // Persona block
    var pb=document.getElementById('persona-block');
    if(pb){var prs=Persona.analyze(p),title=Persona.getTitle(p);pb.innerHTML='<div style="font-size:0.75rem;opacity:.32;text-transform:uppercase;margin-bottom:5px">Playstyle</div><div style="font-size:1.1rem">'+prs.icon+'</div><div style="font-weight:700;font-size:.86rem;margin-top:3px">'+prs.label+'</div><div style="font-size: 0.75rem;opacity:.35;margin-top:2px">'+title+'</div><div style="margin-top:7px;display:flex;flex-direction:column;gap:2px">'+prs.traits.map(function(t){return'<div style="font-size: 0.75rem;opacity:.42">• '+t+'</div>';}).join('')+'</div>';}
  },60);
  // Achievements
  var al=document.getElementById('achl');
  if(al)al.innerHTML=Ach.all.map(function(a){return'<div class="ach'+(S.ach.includes(a.id)?' got':'')+'"><div style="font-size:1.6rem;opacity:'+(S.ach.includes(a.id)?1:.22)+'">'+a.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem;'+(S.ach.includes(a.id)?'':' opacity:.32')+'">'+a.n+'</div><div style="font-size: 0.75rem;opacity:.38">'+a.d+'</div></div><div style="font-size: 0.75rem;color:var(--amber);font-weight:700">+'+a.xp+'</div></div>';}).join('');
  // History
  var hl=document.getElementById('hlist');
  if(hl){if(!p.hist.length)hl.innerHTML='<div style="text-align:center;padding:18px;opacity:.22;font-size:.84rem">No games yet</div>';else hl.innerHTML=p.hist.slice(0,12).map(function(h){return'<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)"><div style="font-size:1.25rem">'+h.i+'</div><div style="flex:1"><div style="font-weight:700;font-size:.84rem">'+h.g+'</div><div style="font-size: 0.75rem;opacity:.32">'+(h.w||'N/A')+' · '+h.dt+'</div></div><div style="font-size: 0.75rem;opacity:.3">'+h.d+'m</div></div>';}).join('');}
  // Unlock progress
  var ul=document.getElementById('unlock-list');
  if(ul)ul.innerHTML=Meta.unlockables.map(function(u){var pct=Meta.getProgress(u.id),unlocked=Meta.isUnlocked(u.id);return'<div style="margin-bottom:8px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid '+(unlocked?'rgba(255,214,10,.28)':'var(--border)')+';border-radius:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(unlocked?'0':'5px')+'"><div style="display:flex;align-items:center;gap:7px"><span style="font-size:1rem;opacity:'+(unlocked?1:.45)+'">'+u.icon+'</span><span style="font-size:.8rem;font-weight:700;opacity:'+(unlocked?.95:.55)+'">'+u.name+'</span>'+(u.legendary?'<span style="font-size: 0.75rem;background:rgba(255,214,10,.18);color:var(--amber);border-radius:100px;padding:1px 5px;font-weight:700">★</span>':'')+'</div><span style="font-size: 0.75rem;color:'+(unlocked?'var(--green)':'var(--dim)')+';font-weight:700">'+(unlocked?'✓':pct+'%')+'</span></div>'+(unlocked?'':'<div class="btrack"><div class="bfill" style="width:'+pct+'%;background:'+(u.legendary?'var(--amber)':'var(--cyan)')+'"></div></div>')+'</div>';}).join('');
},
prof:function(){
  var p=S.prof,lvl=XP.lvl(p.xp);
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  var wr=p.games>0?Math.floor((p.wins/p.games)*100):0;
  set('pav2',p.av);set('pnm2',p.name);set('prk2',XP.rank(lvl)+' · Level '+lvl);
  set('pwr',wr+'%');set('pbl',p.bluff||0);
  function setB(id,w){var el=document.getElementById(id);if(el)el.style.width=w+'%';}
  setB('pwrb',wr);setB('pblb',Math.min(100,(p.bluff||0)*5));
  if(p.reflex){set('prf',p.reflex+'ms');setB('prfb',Math.max(0,100-p.reflex/10));}
  // Avatar glow for high level
  var av2=document.getElementById('pav2');
  if(av2)av2.style.boxShadow=lvl>=7?'0 0 22px rgba(255,214,10,.32)':'';
  // Badges
  var pb=document.getElementById('pbadges');
  if(pb){var prs=Persona.analyze(p),title=Persona.getTitle(p);var badges=[{l:prs.label,i:prs.icon,c:'rgba(255,255,255,.1)'},{l:title,c:'rgba(255,214,10,.13)'}];if((p.betrayals||0)>10)badges.push({l:'Betrayer',i:'🗡️',c:'rgba(255,45,85,.13)'});if((p.bluff||0)>5)badges.push({l:'Bluffer',i:'🎭',c:'rgba(191,90,242,.13)'});pb.innerHTML=badges.map(function(b){return'<div style="background:'+b.c+';border-radius:100px;padding:4px 11px;font-size: 0.75rem;font-weight:700;white-space:nowrap">'+(b.i?b.i+' ':'')+b.l+'</div>';}).join('');}
  // Themes
  Theme.build(document.getElementById('tgrid'));
  // Settings toggles
  ['sfx','haptic','bg','save','largeTap','colorBlind'].forEach(function(k){var id={sfx:'tsfx',haptic:'thap',bg:'tbg',save:'tsv',largeTap:'tlargetap',colorBlind:'tcb'}[k];var el=document.getElementById(id);if(el)el.className='tog'+(S.cfg[k]?' on':'');});
  if(typeof PrismPerf!=='undefined')PrismPerf.apply();
}};

// ═══ ARCADE SCREEN ═══════════════════════════════════════════════════
var Arcade={build:function(){this._daily();this._tourney();this._custom();this._vault();},$:function(id){return document.getElementById(id);},
_daily:function(){var dw=this.$('daily-widget');if(!dw)return;var ch=Daily.getToday(),done=Daily.isDone();dw.innerHTML='<div style="display:flex;align-items:center;gap:11px;cursor:pointer" onclick="GL.launch(\''+ch.game+'\')"><div style="font-size:2rem">'+ch.icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.95rem">'+ch.title+'</div><div style="font-size:.73rem;opacity:.42;margin-top:2px">'+ch.desc+'</div></div><div style="text-align:right"><div style="font-size:.73rem;color:var(--amber);font-weight:700">+'+ch.xp+' XP</div><div style="font-size: 0.75rem;margin-top:3px;color:'+(done?'var(--green)':'var(--dim)')+'">'+( done?'✅ Done':'In Progress')+'</div></div></div>';},
_tourney:function(){var tw=this.$('tourney-widget');if(!tw)return;try{var ts=JSON.parse(localStorage.getItem('po5_tourney')||'null');}catch(e){var ts=null;}if(ts&&!ts.done){tw.innerHTML='<div class="glass" style="padding:13px;margin-bottom:8px"><div style="font-size:.86rem;font-weight:700;margin-bottom:8px">'+ts.gameIcon+' '+ts.gameTitle+' · Round '+ts.round+'</div>'+ts.bracket.map(function(m){return'<div style="display:flex;align-items:center;gap:8px;padding:8px;background:rgba(255,255,255,.03);border-radius:9px;margin-bottom:5px"><div style="flex:1;text-align:center"><div>'+m.a.av+'</div><div style="font-size: 0.75rem">'+m.a.name+'</div></div><div style="font-size:0.75rem;opacity:.35">vs</div><div style="flex:1;text-align:center">'+(m.b?'<div>'+m.b.av+'</div><div style="font-size: 0.75rem">'+m.b.name+'</div>':'<div style="opacity:.3;font-size:0.75rem">BYE</div>')+'</div>'+(m.winner?'<div style="font-size: 0.75rem;color:var(--green)">✓ '+m.winner.name+'</div>':'<button type="button" class="btn bg bsm" style="font-size: 0.75rem;padding:4px 8px" onclick="window._twinn(\''+m.a.id+'\',\''+m.b?.id+'\')">Enter winner</button>')+'</div>';}).join('')+'</div><button type="button" class="btn bg bf" onclick="window._tnew()">New Tournament</button>';}else if(ts&&ts.done){tw.innerHTML='<div class="glass" style="padding:13px;text-align:center;margin-bottom:8px"><div style="font-size:1.8rem">🏆</div><div style="font-weight:800;color:var(--amber);margin-top:5px">'+(ts.champion?ts.champion.av+' '+ts.champion.name:'Champion')+'</div><div style="opacity:.38;font-size:.78rem;margin-top:3px">Tournament Complete</div></div><button type="button" class="btn bg bf" onclick="window._tnew()">New Tournament</button>';}else{tw.innerHTML='<button type="button" class="btn bg bf" onclick="window._tnew()">🏆 Create Tournament</button>';}window._twinn=function(aid,bid){try{var s=JSON.parse(localStorage.getItem('po5_tourney'));var m=s.bracket.find(function(m){return!m.winner&&(m.a.id===aid||(m.b&&m.b.id===aid));});if(m){m.winner=m.a.id===aid?m.a:m.b;if(s.bracket.every(function(m){return m.winner;})){var winners=s.bracket.map(function(m){return m.winner;});if(winners.length<=1){s.done=true;s.champion=winners[0];}else{s.round++;s.players=winners;// rebuild bracket
var ps=winners.sort(function(){return Math.random()-.5;});s.bracket=[];for(var i=0;i<ps.length;i+=2){if(ps[i+1])s.bracket.push({a:ps[i],b:ps[i+1],winner:null});else s.bracket.push({a:ps[i],b:null,winner:ps[i]});}}}}localStorage.setItem('po5_tourney',JSON.stringify(s));}catch(e){}Arcade.build();};window._tnew=function(){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾'];Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">🏆 New Tournament</div><div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Create bracket for 4 players</div>'+Array.from({length:4},function(_,i){return'<div class="pchip" style="margin-bottom:6px"><div style="font-size:1.1rem">'+avs[i]+'</div><input class="pinp" id="_tnp'+i+'" placeholder="Player '+(i+1)+'" value="Player '+(i+1)+'"></div>';}).join('')+'<div style="font-size:0.75rem;opacity:.35;margin-bottom:7px;margin-top:4px">Game:</div><select id="_tng" style="width:100%;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:'+PCBrand.h_fff+';font-size:.84rem;margin-bottom:12px">'+Reg.mp().map(function(g){return'<option value="'+g.id+'">'+g.icon+' '+g.title+'</option>';}).join('')+'</select><button type="button" class="btn bw bf" onclick="window._tstart()">Start</button></div>');window._tstart=function(){var players=Array.from({length:4},function(_,i){var nm=(document.getElementById('_tnp'+i)||{}).value||'Player '+(i+1);return{id:'t'+i,name:nm,av:avs[i],col:PCBrand.h_00d4ff};});var gId=(document.getElementById('_tng')||{}).value||'shadow';var g=Reg.get(gId);var ps=players.sort(function(){return Math.random()-.5;});var bracket=[];for(var i=0;i<ps.length;i+=2){if(ps[i+1])bracket.push({a:ps[i],b:ps[i+1],winner:null});else bracket.push({a:ps[i],b:null,winner:ps[i]});}var state={game:gId,gameTitle:g?g.title:'',gameIcon:g?g.icon:'🎮',players:players,bracket:bracket,round:1,done:false};localStorage.setItem('po5_tourney',JSON.stringify(state));Modal.close();setTimeout(function(){Arcade.build();},280);};};},
_custom:function(){var cc=this.$('custom-creator');if(!cc)return;Mutators.loadPresets();cc.innerHTML='<div style="display:flex;flex-direction:column;gap:8px"><div style="display:flex;gap:8px"><select id="_cgg" style="flex:1;padding:10px;border-radius:10px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.07);color:'+PCBrand.h_fff+';font-size:.82rem">'+Reg.list.map(function(g){return'<option value="'+g.id+'">'+g.icon+' '+g.title+'</option>';}).join('')+'</select></div>'+(Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:5px;margin:-2px 0">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 9px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'<div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Mutators.showPicker(function(){Arcade.build();})">⚙️ Mutators</button><button type="button" class="btn bw" style="flex:1" onclick="window._cgstart()">▶ Play Now</button></div>'+(Mutators.presets.length?'<div style="font-size: 0.75rem;opacity:.32;letter-spacing:.02em;margin-top:3px">Saved presets</div>'+Mutators.presets.map(function(pr,i){return'<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:rgba(255,255,255,.04);border-radius:9px"><div style="flex:1"><div style="font-size:.82rem;font-weight:700">'+pr.name+'</div><div style="font-size: 0.75rem;opacity:.35">'+pr.ids.join(', ')+'</div></div><button type="button" class="btn bg bsm" style="font-size: 0.75rem;padding:4px 8px" onclick="window._cgpreset('+i+')">Load</button></div>';}).join(''):'')+'</div>';window._cgstart=function(){var gId=(document.getElementById('_cgg')||{}).value||'shadow';var g=Reg.get(gId);if(!g)return;Mutators.apply();GL.launch(gId);};window._cgpreset=function(i){Mutators.active=Mutators.all.filter(function(m){return Mutators.presets[i].ids.includes(m.id);});Arcade.build();toast('Preset loaded: '+Mutators.presets[i].name);};},
_vault:function(){var vl=this.$('vault-list');if(!vl)return;vl.innerHTML=Meta.unlockables.map(function(u){var pct=Meta.getProgress(u.id),unl=Meta.isUnlocked(u.id);return'<div style="margin-bottom:8px;padding:11px 13px;background:rgba(255,255,255,.04);border:1px solid '+(unl?'rgba(255,214,10,.28)':'var(--border)')+';border-radius:12px"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:'+(unl?'0':'5px')+'"><div style="display:flex;align-items:center;gap:7px"><span style="font-size:.97rem;opacity:'+(unl?1:.4)+'">'+u.icon+'</span><div><div style="font-size:.82rem;font-weight:700;opacity:'+(unl?.95:.5)+'">'+u.name+'</div><div style="font-size: 0.75rem;opacity:.35">'+u.type+(u.legendary?' · Legendary':'')+'</div></div></div><span style="font-size: 0.75rem;font-weight:700;color:'+(unl?'var(--green)':'var(--dim)')+'">'+(unl?'✓ OWNED':pct+'%')+'</span></div>'+(unl?'':'<div class="btrack"><div class="bfill" style="width:'+pct+'%;background:'+(u.legendary?'var(--amber)':'var(--cyan)')+'"></div></div>')+'</div>';}).join('');}};

// ═══ GAME LAUNCHER ════════════════════════════════════════════════════
var GL={
launch:function(id){var game=Reg.get(id);if(!game){toast('Game not found');return;}if(typeof PlayTracker!=='undefined')PlayTracker.record(id);Snd.click();Hap.m();if(game.mp)this._setup(game);else{var players=[{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];Cinematic.show(game,players,function(){GL._start(game,players);});}},
launchFeat:function(){if(S.feat)this.launch(S.feat.id);},
_setup:function(game){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'],cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f],self=this;var pc=Math.max(game.min,2);var players=Array.from({length:pc},function(_,i){return{id:'p'+(i+1),name:'Player '+(i+1),av:avs[i%avs.length],col:cols[i%cols.length],local:i===0};});var render=function(){Modal.open('<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:2px">'+game.icon+' '+game.title+'</div><div style="font-size:.76rem;opacity:.38;margin-bottom:13px">'+game.desc+'</div><div style="font-size: 0.75rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase;margin-bottom:7px">Players ('+pc+'/'+game.max+')</div><div id="_pl">'+players.map(function(p,i){return'<div class="pchip"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+p.av+'</div><input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+'</div>';}).join('')+'</div>'+(pc<game.max?'<button type="button" class="btn bg bf" style="margin-bottom:9px;margin-top:5px" onclick="window._ap()">+ Add Player</button>':'')+( Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'')+'\x3cdiv style="display:flex;gap:7px">\x3cbutton class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="window._smut()">⚙️\x3c/button>\x3cbutton class="btn bw" style="flex:1" onclick="window._sg()">▶ Start Game\x3c/button>\x3c/div>\x3c/div>');window._pn=function(i,v){players[i].name=v||'Player '+(i+1);};window._ap=function(){if(pc>=game.max)return;pc++;players.push({id:'p'+pc,name:'Player '+pc,av:avs[(pc-1)%avs.length],col:cols[(pc-1)%cols.length]});render();};window._rp=function(i){if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;players.forEach(function(p,j){p.id='p'+(j+1);});render();};window._sg=function(){Modal.close();setTimeout(function(){Cinematic.show(game,players,function(){self._start(game,players);});},270);};window._smut=function(){Modal.close();setTimeout(function(){Mutators.showPicker(function(){render();});},270);};};render();},
_start:function(game,players){S.game=game;game.setup(players);Mutators.apply();Nav.go('game');document.getElementById('gtitle').textContent=game.title;document.getElementById('gbody').style.setProperty('--acc',game.col);document.getElementById('gbody').style.setProperty('--glow',game.col+'3a');game.render();Snd.reveal();// Auto-checkpoint after 3s (not immediately)
clearTimeout(this._ck);this._ck=setTimeout(function(){if(S.game&&S.game.gs&&Object.keys(S.game.gs).length>2)Suspend.save(S.game,S.game.gs,{});},3000);},
exitGame:function(){if(S.game){['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt'].forEach(function(k){clearInterval(S.game[k]);clearTimeout(S.game[k]);});S.game=null;}Drama.state.tension=0;Drama._updateBanner();Mutators.active=[];Nav.go('home');},
requestLeave:function(){
  var self=this;
  if(!S.game){self.exitGame();return Promise.resolve(true);}
  if(typeof CapConfirm!=='function'){self.exitGame();return Promise.resolve(true);}
  return CapConfirm({
    title:'Leave this game?',
    body:'Progress for this round will end. You can start again from Games.',
    confirmLabel:'Leave game',
    cancelLabel:'Keep playing',
    destructive:true
  }).then(function(ok){if(ok)self.exitGame();return ok;});
},
filter:function(cat){document.querySelectorAll('.pill').forEach(function(p){p.classList.remove('on');});var el=document.querySelector('.pill[data-c="'+cat+'"]');if(el)el.classList.add('on');this._buildLib(cat);},
_buildFeat:function(){var gs=Reg.list;var f=gs[Math.floor(Math.random()*gs.length)];S.feat=f;var bg=document.getElementById('feat-bg');if(bg)bg.style.background='linear-gradient(135deg,'+f.col+'36,'+f.col+'07)';function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}set('feat-title',f.title);set('feat-type',f.type);set('feat-desc',f.desc);set('feat-icon',f.icon);var badge=document.getElementById('feat-badge');if(badge){badge.textContent=f.mp?'Multiplayer':'Solo';badge.className='text-caption';badge.style.background=f.col+'2a';}},
_buildScrollRow:function(id,games){var row=document.getElementById(id);if(!row)return;var mk=function(g){var d=document.createElement('div');d.className='mcard';d.setAttribute('role','button');d.setAttribute('tabindex','0');d.setAttribute('aria-label',(g.title||'Game')+' — '+(g.type||''));d.style.cssText='background:'+g.col+'15;border:1px solid '+g.col+'2e;flex-shrink:0';d.innerHTML='<div style="padding:11px;height:100%;display:flex;flex-direction:column;justify-content:space-between"><div style="font-size:1.65rem" aria-hidden="true">'+g.icon+'</div><div><div style="font-size:.78rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size: 0.75rem;opacity:.38;margin-top:1px;letter-spacing:.02em">'+g.type+'</div></div></div>';d.onclick=function(){GL.launch(g.id);};d.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();GL.launch(g.id);}};return d;};row.innerHTML='';(games||[]).forEach(function(g){row.appendChild(mk(g));});},
_buildScrolls:function(){this._buildScrollRow('mp-row',Reg.mp());this._buildScrollRow('solo-row',Reg.solo());this._buildScrollRow('board-row',Reg.board());},
_buildLib:function(filter){var grid=document.getElementById('lib');if(!grid)return;var games=filter==='all'?Reg.list:filter==='multiplayer'?Reg.mp():filter==='solo'?Reg.solo():Reg.byCat(filter);var lc=document.getElementById('lib-count');if(lc)lc.textContent=games.length+' games · Fully offline';grid.innerHTML=games.map(function(g){return'<div class="lcard" style="background:'+g.col+'12;border:1px solid '+g.col+'28" onclick="GL.launch(\''+g.id+'\')"><div><div style="font-size:1.8rem;margin-bottom:5px">'+g.icon+'</div><div style="font-size:.88rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size:0.75rem;opacity:.4;margin-top:2px;letter-spacing:.02em">'+g.type+'</div></div><div><div style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.07);border-radius:100px;padding:3px 8px;font-size:0.75rem;font-weight:700;margin-top:5px">'+(g.mp?'👥 '+g.min+'-'+g.max+'p':'🎮 Solo')+'</div></div></div>';}).join('');},
editProfile:function(){var p=S.prof;var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥','🌟','⚡','🎯'];Modal.open('<div><div style="font-size:1rem;font-weight:800;margin-bottom:12px">Edit Profile</div><input id="_ename" value="'+p.name+'" placeholder="Name" autocorrect="off" style="width:100%;padding:11px;border-radius:11px;border:1px solid rgba(255,255,255,.13);background:rgba(255,255,255,.06);font-size:.9rem;color:'+PCBrand.h_fff+';margin-bottom:12px"><div style="font-size: 0.75rem;opacity:.32;margin-bottom:5px;letter-spacing:.02em">Avatar</div><div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px">'+avs.map(function(a){return'<div onclick="window._pav(\''+a+'\',this)" style="width:38px;height:38px;border-radius:9px;background:rgba(255,255,255,.06);border:2px solid '+(p.av===a?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer" id="_av-'+a+'">'+a+'</div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._savep()">Save</button></div>');var sel=p.av;window._pav=function(a,el){sel=a;document.querySelectorAll('[id^="_av-"]').forEach(function(e){e.style.borderColor='transparent';});el.style.borderColor=PCBrand.h_fff;Snd.click();};window._savep=function(){var nm=document.getElementById('_ename').value.trim();if(nm)S.prof.name=nm;S.prof.av=sel;Save.save();Modal.close();UI.prof();UI.home();toast('Profile saved!');};},
togSet:function(key,el){S.cfg[key]=!S.cfg[key];el.className='tog'+(S.cfg[key]?' on':'');Save.save();Snd.click();if(key==='bg'||key==='lowPower'||key==='colorBlind'){if(typeof PrismPerf!=='undefined')PrismPerf.apply();}},
loadDemoSeed:function(opts){var silent=opts&&opts.silent;var run=function(){var nGames=(typeof Reg!=='undefined'&&Reg.list&&Reg.list.length)?Reg.list.length:39;var seedIds=['spy','ttt','reflex','chaos','chess'];var hist=[];seedIds.forEach(function(id){var g=Reg.get&&Reg.get(id);if(!g)return;hist.push({g:g.title,i:g.icon,w:'Demo Operative',d:12,dt:new Date().toLocaleDateString(),c:g.col});});S.prof={name:'Demo Operative',av:'🎭',xp:2850,lvl:XP.lvl(2850),games:nGames,wins:28,losses:14,streak:4,best:7,bluff:12,betrayals:6,reflex:187,time:3600,hist:hist,style:'chaos'};S.ach=['g1','w1','w10','p25','s3'];localStorage.setItem('po5s','1');Save.save();if(window.Prog&&Prog.data){Prog.data.xp=S.prof.xp;Prog.data.rank=XP.rank(S.prof.lvl);Prog.data.streak=4;Prog.data.gamesById=Prog.data.gamesById||{};seedIds.forEach(function(id){Prog.data.gamesById[id]=(Prog.data.gamesById[id]||0)+3;});if(Prog.save)Prog.save();}if(window.Rec){Rec.recent=[];seedIds.forEach(function(id){var g=Reg.get&&Reg.get(id);if(g)Rec.addRecent(g);});}if(GL._buildScrolls)GL._buildScrolls();UI.prof();UI.home();UI.dash();if(window.Rec&&Rec.render)Rec.render();toast('Demo profile loaded — Level '+S.prof.lvl+' · '+S.prof.games+' games');};if(silent){run();return;}if(typeof CapConfirm!=='function'){run();return;}CapConfirm({title:'Load demo profile?',body:'Adds XP, games played, wins, and achievements for demos.',confirmLabel:'Load demo',cancelLabel:'Cancel'}).then(function(ok){if(ok)run();});},
resetData:function(){Modal.open('<div style="text-align:center"><div style="font-size:1.75rem;margin-bottom:5px">⚠️</div><div style="font-size:.97rem;font-weight:700;margin-bottom:4px">Reset All Data?</div><div style="font-size:.78rem;opacity:.38;margin-bottom:14px">All progress deleted.</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Cancel</button><button type="button" class="btn br" style="flex:1" onclick="Save.reset()">Reset</button></div></div>');}};

// ═══ WELCOME (multi-step) ════════════════════════════════════════════
var W={_step:1,_av:'😎',_style:'',
init:function(){var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀'];var c=document.getElementById('wavs');if(!c)return;c.innerHTML=avs.map(function(a){return'<div onclick="W._selAv(\''+a+'\',this)" style="width:40px;height:40px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid '+(a===this._av?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer">'+a+'</div>';},this).join('');},
_selAv:function(a,el){this._av=a;document.querySelectorAll('#wavs div').forEach(function(e){e.style.borderColor='transparent';});el.style.borderColor=PCBrand.h_fff;Hap.l();},
setStyle:function(s,el){this._style=s;document.querySelectorAll('#wstyles .pchip').forEach(function(e){e.classList.remove('on');});if(el)el.classList.add('on');S.prof.style=s;Hap.l();},
_goStep:function(n){document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});var el=document.getElementById('ws'+n);if(el)el.classList.add('active');this._step=n;var dots=document.querySelectorAll('.wprogdot');dots.forEach(function(d,i){d.className='wprogdot'+(i<n?' on':'');});Snd.click();},
next:function(){if(this._step===1){var nm=(document.getElementById('wname').value||'').trim();if(!nm){toast('Enter your name!');return;}S.prof.name=nm;}if(this._step===4)return;if(this._step===3){this._scan();return;}this._goStep(this._step+1);},
_scan:function(){var self=this;this._goStep(4);var msgs=['Analyzing playstyle...','Building operator profile...','Calibrating betrayal index...','Computing trust matrix...','⚡ Profile ready!'];var bar=document.getElementById('wscan-bar');var msg=document.getElementById('wscan-msg');var icon=document.getElementById('wscan-icon');var result=document.getElementById('wscan-result');var prs=Persona.types[{deception:'deceptive',strategy:'strategic',reflex:'aggressive',chaos:'chaotic'}[self._style||'chaos']||'survivor'];var i=0;var iv=setInterval(function(){if(msg)msg.textContent=msgs[i]||'';if(bar)bar.style.width=((i+1)/msgs.length*100)+'%';i++;if(i>=msgs.length){clearInterval(iv);if(icon)icon.textContent=prs?prs.icon:'🔰';if(result){result.style.opacity='1';result.innerHTML='<div style="font-size:1.25rem;font-weight:800;margin-bottom:4px">'+(prs?prs.label:'Operative')+'</div><div style="opacity:.42;font-size:.78rem;margin-bottom:16px">Starting rank: Rookie</div><button type="button" class="btn bw bf" style="max-width:240px" onclick="W.finish()">Enter PrismCap →</button>';}Hap.ok();}},450);},
finish:function(){S.prof.av=this._av;localStorage.setItem('po5s','1');Save.save();var w=document.getElementById('welcome');if(w){w.style.opacity='0';w.style.transition='opacity .45s ease';setTimeout(function(){w.classList.add('out');},450);}UI.home();UI.prof();Snd.ok();Hap.ok();toast('Welcome, '+S.prof.name+'!');setTimeout(function(){if(!S.prof.games){var ch=Daily.getToday();Modal.open('<div style="text-align:center;padding:4px 0"><div style="font-size:2.2rem;margin-bottom:10px">'+ch.icon+'</div><div style="font-weight:800;font-size:1.02rem;margin-bottom:6px">Your first mission</div><div style="font-size:.8rem;opacity:.45;margin-bottom:18px;line-height:1.55">'+ch.title+' — '+ch.desc+'<br><span style="color:var(--amber);font-weight:700">+'+ch.xp+' XP</span> when you complete it</div><button type="button" class="btn bw bf" onclick="Modal.close();GL.launch(\''+ch.game+'\')">▶ Play now</button><button type="button" class="btn bg bf" style="margin-top:8px" onclick="Modal.close();Nav.go(\'library\')">Browse all games</button></div>');}else if(typeof Prog!=='undefined'&&!Prog.data.dailyClaimed){toast('🎁 Daily reward waiting on Home');}},1100);}};

// ═══ LOGO ANIMATION ══════════════════════════════════════════════════
function animLogo(id){var c=document.getElementById(id);if(!c)return;var x=c.getContext('2d'),a=0,W=c.width,H=c.height;var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];(function draw(){x.clearRect(0,0,W,H);x.save();x.translate(W/2,H/2);x.rotate(a);for(var i=0;i<6;i++){x.save();x.rotate(Math.PI*2/6*i);x.fillStyle=cols[i];x.globalAlpha=0.85;x.beginPath();x.moveTo(0,0);x.lineTo(W*.38,-W*.12);x.lineTo(W*.38,W*.12);x.closePath();x.fill();x.restore();}x.fillStyle=PCBrand.h_fff;x.globalAlpha=1;x.beginPath();x.arc(0,0,W*.095,0,Math.PI*2);x.fill();x.restore();a+=0.026;requestAnimationFrame(draw);})();}

// ═══ SINGLE BOOT (no duplicates) ═════════════════════════════════════
// [boot moved to v4_boot_patch]
;

// ═══ FEATURE PATCHES & ADDITIONS ════════════════════════════════════

// ── QUICK LAUNCH: Shake to suggest a game ────────────────────────────
document.addEventListener('prism:shake', function(e){
  if(S.cur==='home'&&e.detail&&e.detail.intensity>40){
    var g=Reg.list[Math.floor(Math.random()*Reg.list.length)];
    if(g){toast('🎲 Try: '+g.title);Hap.m();}
  }
});

// ── WAKE LOCK: Keep screen on during games ───────────────────────────
var _wl=null;
function requestWakeLock(){
  if('wakeLock' in navigator){
    navigator.wakeLock.request('screen').then(function(wl){_wl=wl;}).catch(function(){});
  }
}
function releaseWakeLock(){if(_wl){_wl.release().catch(function(){});_wl=null;}}
Bus.on('game:start',function(){requestWakeLock();});
Bus.on('game:end',function(){releaseWakeLock();});
// Hook into GL
var _origGLstart=GL._start.bind(GL);
GL._start=function(game,players){
  requestWakeLock();
  Bus.emit('game:start',{game:game});
  _origGLstart(game,players);
};
var _origGLLeaveFn=GL.exitGame.bind(GL);
GL.exitGame=function(){releaseWakeLock();Bus.emit('game:end',{});_origGLLeaveFn();};

// ── INSTALL PROMPT (PWA) ─────────────────────────────────────────────
var _deferredInstall=null;
window.addEventListener('beforeinstallprompt',function(e){
  e.preventDefault();_deferredInstall=e;
  // Show install button in profile
  var btn=document.createElement('button');
  btn.className='btn bg bf';btn.style.marginBottom='10px';
  btn.textContent='📱 Install PrismCap';
  btn.onclick=function(){if(_deferredInstall){_deferredInstall.prompt();_deferredInstall.userChoice.then(function(r){if(r.outcome==='accepted')toast('✅ PrismCap installed!');_deferredInstall=null;});}};
  var prof=document.getElementById('profile-screen');
  if(prof){var last=prof.querySelector('[onclick="GL.resetData()"]');if(last&&last.parentNode)last.parentNode.insertBefore(btn,last);}
});

// ── LONG PRESS to suspend game ───────────────────────────────────────
var _lpt=null,_lph=false;
document.addEventListener('touchstart',function(e){
  if(S.cur!=='game'||!S.game)return;
  _lph=false;
  _lpt=setTimeout(function(){
    _lph=true;
    // Long press on header = suspend
    if(e.target.closest('.ghdr')){
      Hap.heavy();
      Modal.open('<div style="text-align:center"><div style="font-size:1.6rem;margin-bottom:7px">💾</div><div style="font-weight:700;margin-bottom:4px">Suspend Game?</div><div style="font-size:.78rem;opacity:.38;margin-bottom:14px">Resume anytime</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Keep Playing</button><button type="button" class="btn bw" style="flex:1" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});GL.exitGame();}Modal.close();">Suspend</button></div></div>');
    }
  },600);
},{passive:true});
document.addEventListener('touchend',function(){clearTimeout(_lpt);},{passive:true});

// Swipe navigation: permanently removed

// ── PLAYER COUNT SMART RECOMMENDER on Home ───────────────────────────
function buildRecommended(){
  var area=document.getElementById('hw-area');
  if(!area||S.prof.games<3)return;
  var tried=JSON.parse(localStorage.getItem('po5t')||'[]');
  var daily=(typeof Daily!=='undefined'&&Daily.getToday)?Daily.getToday():null;
  var recentIds={};if(window.Rec&&Rec.recent)Rec.recent.forEach(function(x){if(x&&x.id)recentIds[x.id]=1;});
  var untried=Reg.list.filter(function(g){
    if(tried.indexOf(g.id)>-1)return false;
    if(daily&&g.id===daily.game)return false;
    if(recentIds[g.id])return false;
    return true;
  });
  if(!untried.length)return;
  if(area.querySelector('[data-try-new]'))return;
  var pick=untried[Math.floor(Math.random()*Math.min(untried.length,5))];
  var div=document.createElement('div');
  div.setAttribute('data-try-new','1');
  div.style.cssText='margin:0 15px 10px;padding:12px 15px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.09);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:10px';
  div.setAttribute('role','button');div.setAttribute('tabindex','0');div.setAttribute('aria-label','Try something new: '+pick.title);
  div.innerHTML='<div style="font-size:1.55rem" aria-hidden="true">'+pick.icon+'</div><div style="flex:1"><div class="text-caption" style="margin-bottom:2px;opacity:.72">Try something new</div><div style="font-weight:700;font-size:.86rem">'+pick.title+'</div></div><div style="font-size:0.75rem;color:var(--dim)">→</div>';
  div.onclick=function(){GL.launch(pick.id);};
  div.onkeydown=function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();GL.launch(pick.id);}};
  if(area.children.length<3)area.appendChild(div);
}

// ── SCORE SHARING (copy to clipboard) ────────────────────────────────
function shareScore(game,score,extra){
  var txt='PrismCap | '+game+': '+score+(extra?' | '+extra:'')+' | Rank: '+XP.rank(XP.lvl(S.prof.xp))+' (Lv'+XP.lvl(S.prof.xp)+')';
  if(navigator.clipboard){navigator.clipboard.writeText(txt).then(function(){toast('📋 Score copied!');});}
  else{toast(txt,4000);}
}
window.shareScore=shareScore;

// ── STREAK ANIMATION on Win ──────────────────────────────────────────
Bus.on('drama:tick',function(state){
  // Pulse home stats on high tension
  if(state.tension>80&&S.cur==='home'){
    var el=document.getElementById('sg');
    if(el)el.style.animation='heartbeat .5s ease 3';
    setTimeout(function(){if(el)el.style.animation='';},1600);
  }
});

// ── KEYBOARD SUPPORT (iPad with keyboard) ────────────────────────────
document.addEventListener('keydown',function(e){
  if(S.cur==='game'&&S.game){
    var k=e.key;
    // Arrow keys for maze
    if(S.game.id==='maze'&&window._mv){
      if(k==='ArrowUp')window._mv('u');
      else if(k==='ArrowDown')window._mv('d');
      else if(k==='ArrowLeft')window._mv('l');
      else if(k==='ArrowRight')window._mv('r');
      e.preventDefault();
    }
    // Arrow keys for snake
    if(S.game.id==='snake'&&S.game.gs){
      var gs=S.game.gs;
      if(k==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};
      else if(k==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};
      else if(k==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};
      else if(k==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};
    }
    // Escape = exit
    if(k==='Escape')GL.exitGame();
  }
  // Tab = switch screens
  if(k==='Tab'&&S.cur!=='game'){
    var tabs=['home','library','arcade','dashboard','profile'];
    var ci=tabs.indexOf(S.cur);
    Nav.go(tabs[(ci+1)%tabs.length]);
    e.preventDefault();
  }
});

// ── SMART GREETINGS + HOME REFRESH ───────────────────────────────────
// UI.home enhanced below

// ── GAME COUNT DISPLAY UPDATE ─────────────────────────────────────────
setTimeout(function(){
  var lc=document.getElementById('lib-count');
  if(lc)lc.textContent=Reg.list.length+' games · Fully offline';
},500);

// ── ORIENT LOCK attempt (portrait preferred) ─────────────────────────
if(screen.orientation&&screen.orientation.lock){
  screen.orientation.lock('portrait').catch(function(){});
}



// ═══════════════════════════════════════════════════════════════════
// PRISM OS v4 — PROFESSIONAL SYSTEMS
// ═══════════════════════════════════════════════════════════════════

// ── DEVICE SELECTION ─────────────────────────────────────────────
var DevSel = {
  _k: 'po5_dev',
  device: 'iphone', // iphone | ipad | mac
  init: function() {
    var saved = localStorage.getItem(this._k);
    if (saved) { this.device = saved; this._hide(); return; }
    // Auto-detect
    var w = window.innerWidth;
    if (w >= 1024) this.device = 'mac';
    else if (w >= 768) this.device = 'ipad';
    else this.device = 'iphone';
    // Show screen (let user confirm)
    var sel = document.getElementById('device-sel');
    if (sel) sel.style.display = 'flex';
    animLogo('dcan');
  },
  pick: function(dev) {
    this.device = dev;
    localStorage.setItem(this._k, dev);
    this._applyLayout(dev);
    this._hide();
    Hap.ok(); Snd.ok();
    toast('Layout: ' + dev.charAt(0).toUpperCase() + dev.slice(1));
  },
  _hide: function() {
    var sel = document.getElementById('device-sel');
    if (!sel) return;
    sel.style.transition = 'opacity .5s ease';
    sel.style.opacity = '0';
    setTimeout(function() { sel.style.display = 'none'; }, 520);
    this._applyLayout(this.device);
  },
  _applyLayout: function(dev) {
    document.body.setAttribute('data-device', dev);
    // CSS custom properties per device
    if (dev === 'mac') {
      document.documentElement.style.setProperty('--font-scale', '1.05');
      document.documentElement.style.setProperty('--card-radius', '20px');
    } else if (dev === 'ipad') {
      document.documentElement.style.setProperty('--font-scale', '1.02');
      document.documentElement.style.setProperty('--card-radius', '18px');
    } else {
      document.documentElement.style.setProperty('--font-scale', '1');
      document.documentElement.style.setProperty('--card-radius', '16px');
    }
  }
};

// ── HINT SYSTEM ───────────────────────────────────────────────────
var Hints = {
  _db: {
    // Per game hints
    shadow: [
      'Watch who votes quickly — fast voters often know more than they should.',
      'Shadows win if they avoid 2+ eliminations. Protect your allies.',
      'The Analyst can peek at alignments — find them and ally early.',
      'Resistance: focus votes on players with rising suspicion scores.',
      'Shadows: coordinate silently. If one is exposed, deny everything.'
    ],
    hot: [
      'Pass the device quickly when you hear it heating up in your hands.',
      'The fuse timer is completely random — never feel safe.',
      'Chaos cards change the passing rules. Read them fast.',
      'When few players remain, fuse timers get shorter.',
      'You lose a life when caught with the device, not when you pass it.'
    ],
    split: ['The presenter chooses which statement to read — top or bottom.', 'Bluffing successfully earns you 10 points per fooled guesser.', 'Watch facial expressions when the presenter reads — they reveal everything.', 'Lie detectors: look for hesitation, eye contact, and over-explanation.'],
    reflex: ['Tap the instant you see it appear, not when you recognize it.', 'Your best reaction time improves with practice — aim for sub-200ms.', 'Combo multiplier stacks — chain hits for massive scores.', 'The target size shrinks each level — use your thumb pad, not fingertip.'],
    mem: ['Say the sequence out loud quietly while watching.', 'Visualize the pattern as a path, not individual positions.', 'At higher levels, chunk the sequence into groups of 3.', 'Red cells are always top-left — use color as a spatial anchor.'],
    decode: ['Caesar ciphers: count backwards through the alphabet.', 'Pattern sequences: find the rule in the differences between numbers.', 'Math sums: estimate first, then verify. Speed beats precision.', 'BONUS hint: type and immediately submit — every second counts.'],
    chess: ['Control the center with pawns and knights in the opening.', 'Develop all pieces before launching an attack.', 'Castle early to protect your king.', 'Knights attack in an L-shape — use them to fork two pieces at once.', 'Rooks belong on open files — push pawns to open them.'],
    draughts: ['Control the center — pieces there have maximum mobility.', 'Force your opponent to the edge where their pieces have fewer moves.', 'Kings (crowned pieces) move in all 4 diagonal directions.', 'Plan 2-3 jumps ahead — chain captures win games.'],
    heist: ['The mole benefits from tripping 2 alarms in one action.', 'If someone consistently picks "watch for guards" with no result, suspect them.', 'Hackers crack 2 locks at once but raise alarms — use sparingly.', 'Discuss who does what before choosing — the mole will hesitate.'],
    trust: ['If everyone cooperates every round, everyone wins together.', 'One defector ruins mutual cooperation — punish defectors next round.', 'In small groups, defecting hurts you as much as others.', 'The safest strategy: cooperate until someone defects, then punish once.'],
    impfreq: ['Listen for words that are almost right — slightly wrong vocabulary is the tell.', 'Ask specific follow-up questions: imposters give vague answers.', 'Ask everyone the same question and compare answers for inconsistencies.'],
    spy: ['Spies: give accurate-sounding but vague answers. Never say the location directly.', 'Investigators: ask about specific aspects of the location only insiders would know.', 'Vote early if someone gives an answer that fits too many locations.'],
    snake: ['Avoid boxing yourself into corners — always leave an escape route.', 'Follow the walls early, then spiral inward as the snake grows.', 'Slow down near the food — a clean approach beats a risky one.'],
    maze: ['Try all directions before backtracking — dead ends are rare.', 'Stars give bonus points — small detours are worth it.', 'Traps are usually placed near the exit — approach carefully.'],
    pressure: ['Focus on the TARGET indicator, not the buttons themselves.', 'Tap the moment your eye lands on the correct button — hesitation costs.', 'At high pressure, your eyes widen — use peripheral vision.'],
    default: ['Take your time reading the rules before your first move.', 'The AI announcer gives clues about what\'s happening — listen!', 'You can suspend any game and resume it later with the 💾 button.', 'Earn XP to unlock themes and titles in your profile.']
  },
  get: function(gameId) {
    var pool = this._db[gameId] || this._db.default;
    return pool[Math.floor(Math.random() * pool.length)];
  },
  show: function(gameId) {
    var hint = this.get(gameId);
    Modal.open('<div style="text-align:center"><div style="font-size:2rem;margin-bottom:11px">💡</div><div style="font-size:.75rem;opacity:.38;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px">Hint</div><div style="font-size:.97rem;font-weight:600;line-height:1.55;margin-bottom:18px">' + hint + '</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="Hints.show(\'' + gameId + '\');Modal.close()">Next Hint</button><button type="button" class="btn bw" style="flex:1" onclick="Modal.close()">Got It</button></div></div>');
    Snd.click();
  }
};

// ── TUTORIAL SYSTEM ───────────────────────────────────────────────
var Tutorial = {
  _seen: {},
  _load: function() {
    try { this._seen = JSON.parse(localStorage.getItem('po5_tut') || '{}'); } catch(e) {}
  },
  _save: function() {
    try { localStorage.setItem('po5_tut', JSON.stringify(this._seen)); } catch(e) {}
  },
  hasSeen: function(id) { return !!this._seen[id]; },
  markSeen: function(id) { this._seen[id] = 1; this._save(); },
  show: function(game, cb) {
    if (this.hasSeen(game.id)) { if (cb) cb(); return; }
    var steps = this._getSteps(game);
    if (!steps.length) { if (cb) cb(); return; }
    this._showStep(steps, 0, game.id, cb);
  },
  _showStep: function(steps, i, id, cb) {
    var self = this;
    if (i >= steps.length) { self.markSeen(id); if (cb) cb(); return; }
    var s = steps[i], total = steps.length;
    var isLast = i === total - 1;
    Modal.open(
      '<div>' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<div style="font-size: 0.75rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em">How to Play · ' + (i+1) + '/' + total + '</div>' +
        '<div style="display:flex;gap:4px">' + steps.map(function(_,j){return '<div style="width:6px;height:6px;border-radius:50%;background:'+(j<=i?PCBrand.h_fff:'rgba(255,255,255,.2)') +'"></div>';}).join('') + '</div>' +
      '</div>' +
      '<div style="font-size:2.5rem;text-align:center;margin-bottom:12px">' + s.icon + '</div>' +
      '<div style="font-size:1rem;font-weight:800;text-align:center;margin-bottom:8px">' + s.title + '</div>' +
      '<div style="font-size:.86rem;opacity:.6;line-height:1.6;text-align:center;margin-bottom:20px">' + s.body + '</div>' +
      '<div style="display:flex;gap:8px">' +
        (i > 0 ? '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 16px" onclick="Modal.close();setTimeout(function(){Tutorial._showStep(steps,' + (i-1) + ',id,cb);},280)" aria-label="Previous">←</button>' : '') +
        '<button type="button" class="btn bw" style="flex:1" onclick="Modal.close();setTimeout(function(){Tutorial._showStep(steps,' + (i+1) + ',id,cb);},280)">' + (isLast ? 'Start Game →' : 'Next →') + '</button>' +
      '</div></div>',
      function() { if (isLast) { self.markSeen(id); if (cb) cb(); } }
    );
    // Make refs available inside onclick strings
    window._tutSteps = steps; window._tutId = id; window._tutCb = cb;
  },
  _getSteps: function(game) {
    var db = {
      shadow: [
        {icon:'🕵️',title:'Hidden Roles',body:'Each player gets a secret role — Resistance or Shadow. You must deduce who is who through discussion and voting.'},
        {icon:'🗳️',title:'Voting Rounds',body:'Each round, all players vote on who to eliminate. Highest votes gets removed. Their role is then revealed.'},
        {icon:'⚠️',title:'Win Conditions',body:'Resistance wins by eliminating all Shadow agents. Shadows win by surviving until the last round or gaining the majority.'},
        {icon:'💡',title:'Pro Tip',body:'Trust is everything. Shadow agents must blend in and cast doubt. Resistance must observe voting patterns carefully.'}
      ],
      chess: [
        {icon:'♟️',title:'Chess: The Basics',body:'Each piece moves differently. The goal is to checkmate the opponent\'s King — trap it with no escape.'},
        {icon:'♛',title:'How Pieces Move',body:'Pawns move forward 1 (or 2 on first move). Knights jump in an L. Bishops move diagonally. Rooks move in lines. Queens move anywhere. King moves 1 square.'},
        {icon:'🏰',title:'Special Moves',body:'Castling: King + Rook swap sides for safety. En passant: capture a pawn that just moved 2 squares. Promotion: pawn reaching the back row becomes a Queen.'},
        {icon:'⚔️',title:'Strategy',body:'Control the center, develop pieces early, protect your King. Never give up pieces for free — always look for captures.'}
      ],
      draughts: [
        {icon:'⚫',title:'Draughts Basics',body:'Move your pieces diagonally forward. Jump over an opponent\'s piece to capture it. Multiple jumps in one turn are allowed and mandatory.'},
        {icon:'👑',title:'Becoming a King',body:'Reach the opponent\'s back row to become a King. Kings move diagonally in ALL four directions.'},
        {icon:'🎯',title:'Winning',body:'Capture all opponent\'s pieces or block them so they cannot move. Forced captures are mandatory — you must jump if you can.'}
      ],
      hot: [
        {icon:'💣',title:'Hot Device',body:'The device is a ticking bomb! Pass it before the hidden timer explodes. You never know how long you have.'},
        {icon:'💥',title:'Losing a Life',body:'If the timer runs out while you\'re holding it, you lose a life (❤️). Lose all 3 and you\'re eliminated.'},
        {icon:'⚠️',title:'Chaos Modifiers',body:'Sometimes you\'ll get a chaos rule — pass with eyes closed, spin first, or use one hand. Everyone must follow the rule!'}
      ],
      reflex: [
        {icon:'⚡',title:'Neon Reflex',body:'A target appears on screen. Tap it as fast as you can. Your reaction time in milliseconds is shown after each tap.'},
        {icon:'🎯',title:'Scoring',body:'Faster taps = more points. Maintain a combo by hitting every target. Miss one and your combo resets.'},
        {icon:'❤️',title:'Lives',body:'Miss a target (let it time out) and lose a life. Lose all 3 and the game ends. Sub-200ms earns special achievements!'}
      ]
    };
    return db[game.id] || [];
  }
};

// ── DIFFICULTY SYSTEM ─────────────────────────────────────────────
var Difficulty = {
  current: 'normal', // easy | normal | hard | chaos
  levels: {
    easy:   {label:'Easy',    icon:'🟢', desc:'More lives, slower timers, extra hints',      mult:0.7,  lives:5,  timeScale:1.4},
    normal: {label:'Normal',  icon:'🟡', desc:'Balanced experience for all players',          mult:1.0,  lives:3,  timeScale:1.0},
    hard:   {label:'Hard',    icon:'🔴', desc:'Fewer lives, faster timers, no hints',         mult:1.5,  lives:2,  timeScale:0.7},
    chaos:  {label:'Chaos',   icon:'🌀', desc:'Maximum chaos — unpredictable everything',     mult:2.0,  lives:1,  timeScale:0.5}
  },
  get: function() { return this.levels[this.current]; },
  lives: function(base) { return Math.max(1, Math.round((base||3) * this.get().lives/3)); },
  timer: function(base) { return Math.round(base * this.get().timeScale); },
  xpMult: function() { return this.get().mult * Mutators.xpMult(); },
  pick: function(cb) {
    var self = this;
    Modal.open(
      '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:4px">⚙️ Difficulty</div>' +
      '<div style="font-size:.76rem;opacity:.38;margin-bottom:14px">Affects timers, lives and XP rewards</div>' +
      Object.entries(this.levels).map(function(e) {
        var id = e[0], lv = e[1];
        var active = self.current === id;
        return '<div onclick="window._dpick(\'' + id + '\')" style="padding:13px 14px;border-radius:13px;border:2px solid ' + (active?'rgba(255,255,255,.4)':'var(--border)') + ';background:' + (active?'rgba(255,255,255,.07)':'rgba(255,255,255,.03)') + ';margin-bottom:8px;cursor:pointer;display:flex;align-items:center;gap:12px"><div style="font-size:1.5rem">' + lv.icon + '</div><div style="flex:1"><div style="font-weight:700">' + lv.label + '</div><div style="font-size:0.75rem;opacity:.42;margin-top:1px">' + lv.desc + '</div></div><div style="font-size:0.75rem;color:var(--amber);font-weight:700">×' + lv.mult.toFixed(1) + ' XP</div></div>';
      }).join('') +
      '</div>'
    );
    window._dpick = function(id) {
      self.current = id;
      Modal.close();
      toast('Difficulty: ' + self.levels[id].label);
      Hap.m(); Snd.click();
      if (cb) setTimeout(cb, 280);
    };
  }
};

// ── LOCAL MULTI-DEVICE SYNC (QR + code transfer) ──────────────────
var LocalSync = {
  // Encode game state to a short transfer code (base62)
  _chars: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
  encode: function(obj) {
    try {
      var json = JSON.stringify(obj);
      var b64 = btoa(unescape(encodeURIComponent(json)));
      return b64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,'');
    } catch(e) { return null; }
  },
  decode: function(str) {
    try {
      var b64 = str.replace(/-/g,'+').replace(/_/g,'/');
      while (b64.length % 4) b64 += '=';
      return JSON.parse(decodeURIComponent(escape(atob(b64))));
    } catch(e) { return null; }
  },
  generateCode: function(game) {
    if (!game) return null;
    var payload = {
      v: 4, id: game.id, title: game.title,
      gs: game.gs, players: game.players,
      diff: Difficulty.current, ts: Date.now()
    };
    return this.encode(payload);
  },
  showSend: function(game) {
    var code = this.generateCode(game);
    if (!code) { toast('Cannot sync this game state'); return; }
    // Split into 4-char groups for readability
    var display = code.slice(0, 32).match(/.{1,4}/g).join('-');
    Modal.open(
      '<div style="text-align:center">' +
      '<div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">Sync to device</div>' +
      '<div style="font-size:.75rem;opacity:.38;margin-bottom:16px">Other player enters this code on their device</div>' +
      '<div style="background:rgba(0,212,255,.07);border:1px solid rgba(0,212,255,.2);border-radius:14px;padding:16px;margin-bottom:12px">' +
        '<div style="font-size:1.1rem;font-weight:800;font-family:monospace;letter-spacing:.12em;color:var(--cyan);word-break:break-all">' + display + '</div>' +
      '</div>' +
      '<div style="font-size: 0.75rem;opacity:.28;margin-bottom:14px">Full code: ' + code.length + ' chars · State snapshot at ' + new Date().toLocaleTimeString() + '</div>' +
      '<div style="display:flex;gap:8px">' +
        '<button type="button" class="btn bg" style="flex:1" onclick="LocalSync._copy(\'' + code + '\')">📋 Copy Code</button>' +
        '<button type="button" class="btn bg" style="flex:1" onclick="Modal.close()">Close</button>' +
      '</div></div>'
    );
  },
  showReceive: function() {
    Modal.open(
      '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:3px">📡 Receive Game</div>' +
      '<div style="font-size:.75rem;opacity:.38;margin-bottom:12px">Enter the sync code from the host device</div>' +
      '<input id="_syncin" placeholder="Paste or type code..." autocorrect="off" autocapitalize="off" style="width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.06);font-size:.88rem;color:'+PCBrand.h_fff+';font-family:monospace;margin-bottom:12px">' +
      '<button type="button" class="btn bw bf" onclick="LocalSync._recv()">▶ Load & Continue</button></div>'
    );
  },
  _copy: function(code) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(code).then(function() { toast('📋 Code copied!'); });
    } else { toast('Select and copy the code manually'); }
  },
  _recv: function() {
    var code = (document.getElementById('_syncin') || {}).value || '';
    code = code.replace(/-/g, '').trim();
    var data = this.decode(code);
    if (!data || !data.id) { toast('❌ Invalid sync code'); return; }
    var game = Reg.get(data.id);
    if (!game) { toast('Game not found on this device'); return; }
    game.players = data.players;
    game.gs = data.gs;
    if (data.diff) Difficulty.current = data.diff;
    Modal.close();
    setTimeout(function() {
      S.game = game;
      Nav.go('game');
      document.getElementById('gtitle').textContent = game.title;
      document.getElementById('gbody').style.setProperty('--acc', game.col);
      game.render();
      toast('✅ Synced! Continuing ' + game.title);
    }, 280);
  }
};

// ── GAME SETTINGS PANEL (in-game) ─────────────────────────────────
GL.showGameSettings = function() {
  var game = S.game;
  if (!game) return;
  Modal.open(
    '<div><div style="font-size:1.05rem;font-weight:800;margin-bottom:14px">⚙️ ' + (game.title || 'Game') + '</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){Hints.show(\'' + game.id + '\');},280)">Show hint</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){Tutorial.show(S.game,function(){});},280)">📖 How to Play</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){LocalSync.showSend(S.game);},280)">Sync to device</button>' +
    '<button type="button" class="btn bg bf" onclick="Modal.close();setTimeout(function(){LocalSync.showReceive();},280)">Receive sync</button>' +
    '<button type="button" class="btn bg bf" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});toast(\'Game saved!\');}Modal.close()">Save and suspend</button>' +
    '<div style="height:1px;background:rgba(255,255,255,.08);margin:4px 0"></div>' +
    '<div class="srow" style="padding:0;border:none"><span style="font-size:.84rem;font-weight:600">Sound</span><div class="tog ' + (S.cfg.sfx?'on':'') + '" onclick="GL.togSet(\'sfx\',this)"></div></div>' +
    '<div class="srow" style="padding:0;border:none"><span style="font-size:.84rem;font-weight:600">Haptics</span><div class="tog ' + (S.cfg.haptic?'on':'') + '" onclick="GL.togSet(\'haptic\',this)"></div></div>' +
    '<div style="height:1px;background:rgba(255,255,255,.08);margin:4px 0"></div>' +
    '<button type="button" class="btn br bf" onclick="Modal.close();GL.exitGame()">← Exit Game</button>' +
    '</div></div>'
  );
};

// ── SHOW HINT (public) ────────────────────────────────────────────
GL.showHint = function() {
  if (S.game) Hints.show(S.game.id);
};

// ── ENHANCE GAME LAUNCHER to include Tutorial + Difficulty ─────────
var _origSetupV4 = GL._setup.bind(GL);
GL._setup = function(game) {
  var self = this;
  var avs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
  var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f];
  var pc = Math.max(game.min, 2);
  var players = Array.from({length:pc}, function(_,i){ return {id:'p'+(i+1),name:'Player '+(i+1),av:avs[i%avs.length],col:cols[i%cols.length],local:i===0}; });

  var render = function() {
    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">' + game.icon + '</div>' +
        '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div><div style="font-size:.73rem;opacity:.38">' + game.desc + '</div></div>' +
      '</div>' +
      // Difficulty strip
      '<div onclick="Difficulty.pick(function(){Modal.close();setTimeout(render,280);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
        '<span style="font-size:1.2rem">' + Difficulty.get().icon + '</span>' +
        '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">' + Difficulty.get().label + '</div><div style="font-size: 0.75rem;opacity:.38">' + Difficulty.get().desc + '</div></div>' +
        '<div style="font-size: 0.75rem;opacity:.4">Change ›</div>' +
      '</div>' +
      '<div style="font-size: 0.75rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase;margin-bottom:7px">Players (' + pc + '/' + game.max + ')</div>' +
      '<div id="_pl">' + players.map(function(p,i){
        return '<div class="pchip"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+p.av+'</div><input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+'</div>';
      }).join('') + '</div>' +
      (pc < game.max ? '<button type="button" class="btn bg bf" style="margin-bottom:9px;margin-top:5px" onclick="window._ap()">+ Add Player</button>' : '') +
      (Mutators.active.length ? '<div style="display:flex;flex-wrap:wrap;gap:4px;margin-bottom:9px">' + Mutators.active.map(function(m){return '<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('') + '</div>' : '') +
      '<div style="display:flex;gap:7px">' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="window._smut()">⚙️</button>' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){Modal.open(\'\');render();});},280)">📖</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._sg()">▶ Start</button>' +
      '</div></div>'
    );
    window._pn = function(i,v){ players[i].name=v||'Player '+(i+1); };
    window._ap = function(){ if(pc>=game.max)return;pc++;players.push({id:'p'+pc,name:'Player '+pc,av:avs[(pc-1)%avs.length],col:cols[(pc-1)%cols.length]});render(); };
    window._rp = function(i){ if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;players.forEach(function(p,j){p.id='p'+(j+1);});render(); };
    window._sg = function(){ Modal.close(); setTimeout(function(){ Tutorial.show(game, function(){ Cinematic.show(game, players, function(){ self._start(game, players); }); }); }, 270); };
    window._smut = function(){ Modal.close(); setTimeout(function(){ Mutators.showPicker(function(){ render(); }); }, 270); };
  };
  render();
};

// Also enhance solo launch with tutorial + difficulty
var _origLaunchV4 = GL.launch.bind(GL);
GL.launch = function(id) {
  var self=this, args=arguments;
  window.ensureGamesPack(function(){ _glLaunchV4Body(id); });
};
function _glLaunchV4Body(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  /* Stubs lack setup/render — pack must have replaced Reg entry. */
  if (game._stub || typeof game.setup !== 'function') {
    toast('Loading game…');
    window.ensureGamesPack(function () { _glLaunchV4Body(id); });
    return;
  }
  Snd.click(); Hap.m();
  if (game.mp) {
    GL._setup(game);
  } else {
    // Solo: show difficulty picker first if not played before
    var self = GL;
    var players = [{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];
    // Show solo options
    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">' + game.icon + '</div>' +
        '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div><div style="font-size:.73rem;opacity:.38">' + game.desc + '</div></div>' +
      '</div>' +
      '<div onclick="Difficulty.pick(function(){Modal.close();GL.launch(\''+id+'\');})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
        '<span style="font-size:1.2rem">' + Difficulty.get().icon + '</span>' +
        '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">' + Difficulty.get().label + '</div><div style="font-size: 0.75rem;opacity:.38">' + Difficulty.get().desc + '</div></div>' +
        '<div style="font-size: 0.75rem;opacity:.4">Change ›</div>' +
      '</div>' +
      '<div style="display:flex;gap:7px">' +
        '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){GL.launch(\''+id+'\');});},280)">📖 How to Play</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._ssg()">▶ Play</button>' +
      '</div></div>'
    );
    window._ssg = function() {
      Modal.close();
      setTimeout(function() {
        Tutorial.show(game, function() {
          Cinematic.show(game, players, function() {
            self._start(game, players);
          });
        });
      }, 270);
    };
    // Enable hint button for this game
    var hb = document.getElementById('ghint-btn');
    if (hb) hb.style.display = 'flex';
  }
};

// ── ENABLE HINT BUTTON WHEN IN-GAME ──────────────────────────────
var _origStartV4 = GL._start.bind(GL);
GL._start = function(game, players) {
  requestWakeLock();
  Bus.emit('game:start', {game:game});
  _origStartV4(game, players);
  // Show hint button if hints exist for this game
  var hb = document.getElementById('ghint-btn');
  if (hb) {
    var hasHints = Hints._db[game.id] && Hints._db[game.id].length > 0;
    hb.style.display = hasHints ? 'flex' : 'none';
  }
  // Auto checkpoint after 4s
  // Auto-suspend disabled - user controls save
};



// ═══════════════════════════════════════════════════════════════════
// BOARD GAMES — Chess, Draughts, Tic-Tac-Toe (pass-and-play)
// ═══════════════════════════════════════════════════════════════════

// ── CHESS ─────────────────────────────────────────────────────────
// ═══ V4 BOOT PATCH ════════════════════════════════════════════════
// Single DOMContentLoaded — replaces previous boot
document.addEventListener('DOMContentLoaded', function() {
  Save.load(); Memory.load(); Meta.load();
  Mutators.loadPresets();

  // Modular games (js/games/*.js) register via PRISM_GAME_FACTORIES
  (window.PRISM_GAME_FACTORIES || []).forEach(function(factory) {
    try { var g = factory(); if (g) Reg.add(g); } catch (e) { console.warn('Game factory failed', e); }
  });
  if (typeof window._patchTTTBot === 'function') window._patchTTTBot();
  /* Core impls: ensureGamesPack → games-core.js (v5 §3d). */

  // Demo AFTER Reg is full — games count + Smart Hub need real list
  if (new URLSearchParams(location.search).get('demo') === '1' && window.GL && GL.loadDemoSeed) {
    setTimeout(function(){ try { GL.loadDemoSeed({ silent: true }); } catch(e){} }, 0);
  }

  Theme.apply(S.cfg.theme||'');
  if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
  /* Defer audio + canvas BG — main-thread TBT (v5 §3b). */
  var _fxReady=false;
  var _deferFx = function() {
    if (_fxReady) return; _fxReady=true;
    try { Snd.init(); } catch (e) {}
    try { BG.init(); } catch (e) {}
  };
  /* No idle timeout — pointer wakes audio/BG (v5 §3d TBT). */
  document.addEventListener('touchstart', function(){_deferFx();Snd.wake();}, {once:true,passive:true});
  document.addEventListener('click', function(){_deferFx();Snd.wake();}, {once:true,passive:true});

  // Keyboard: Escape = back from game
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape' && S.cur === 'game') { GL.requestLeave(); e.preventDefault(); }
    if (e.key === 'Escape' && S.cur !== 'game') {
      var ov = document.getElementById('ov');
      if (ov && ov.className === 'open') { Modal.close(); e.preventDefault(); }
    }
    // Tab cycling (Alt+Arrow — do not hijack Tab; breaks keyboard focus)
    if (e.altKey && e.key === 'ArrowRight' && S.cur !== 'game') {
      var tabs=['home','library','arcade','dashboard','profile'];
      var ci = tabs.indexOf(S.cur);
      Nav.go(tabs[(ci+1)%tabs.length]);
      e.preventDefault();
    }
    // Arrow keys for maze
    if (S.cur==='game' && S.game && S.game.id==='maze' && window._mv) {
      var dir = {ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.key];
      if (dir) { window._mv(dir); e.preventDefault(); }
    }
    // Arrow keys for snake
    if (S.cur==='game' && S.game && S.game.id==='snake' && S.game.gs) {
      var gs=S.game.gs;
      if(e.key==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};
      else if(e.key==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};
      else if(e.key==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};
      else if(e.key==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};
    }
  });

  /* Kill cabinet ritual on cold path — hide loader/welcome immediately (v5 §3c TBT/CLS). */
  (function () {
    var loader = document.getElementById('loader');
    if (loader) { loader.style.display = 'none'; loader.classList.add('out'); }
    var w = document.getElementById('welcome');
    if (w) { w.classList.add('out'); w.classList.remove('ready'); w.style.display = 'none'; }
    try { localStorage.setItem('po5s', '1'); } catch (e) {}
  })();

  /* Home shell sync — no setTimeout delay (v5 §3c). */
  try { GL._buildFeat(); } catch (e) {}
  try { UI.home(); } catch (e) {}
  /* scrolls: on first library visit / games pack — not Home TBT (v5 §3d). */
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
  try { window.__APP_READY__ = true; document.documentElement.dataset.appReady = 'true'; } catch (e) {}

  /* v4 systems + games packs: only via ensureGamesPack (nav/launch) — no Home idle (v5 §3d TBT). */

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    window._installEvt = e;
  });
});




