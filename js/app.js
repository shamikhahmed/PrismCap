
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
var Nav={go:function(scr){var prev=S.cur;if(prev===scr&&scr!=='game')return;document.querySelectorAll('.screen').forEach(function(s){s.classList.remove('active');});document.querySelectorAll('.ni').forEach(function(n){n.classList.remove('on');});var el=document.getElementById(scr+'-screen');if(el)el.classList.add('active');var ni=document.querySelector('.ni[data-s="'+scr+'"]');if(ni)ni.classList.add('on');S.cur=scr;document.title=(scr.charAt(0).toUpperCase()+scr.slice(1).replace(/-/g," "))+" — PrismCap";var nav=document.getElementById('nav');if(nav)nav.className=scr==='game'?'hide':'';if(scr==='dashboard'){UI.dash();}if(scr==='profile'){UI.prof();}if(scr==='home'){UI.home();}if(scr==='arcade'){Arcade.build();}if(scr==='game'&&S.game){var gr=document.getElementById('gright');if(gr)gr.innerHTML='<div style="display:flex;gap:6px;align-items:center"><button type="button" onclick="QRSync.showTransfer(S.game)" style="font-size: 0.75rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Transfer" aria-label="Transfer"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M12 3v12"/><path d="m7 8 5-5 5 5"/><path d="M5 15v4h14v-4"/></svg></button><button type="button" onclick="if(S.game){Suspend.save(S.game,S.game.gs,{});GL.exitGame();}" style="font-size: 0.75rem;opacity:.38;cursor:pointer;background:none;border:none;color:'+PCBrand.h_fff+';padding:3px" title="Suspend" aria-label="Suspend"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg></button><span style="opacity:.32;font-size:.73rem">'+(S.game.mp?'👥 '+S.game.players.length:'🎮')+'</span></div>';}Snd.click();Hap.l();}};
window.Nav = Nav;

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

var ShadowProtocol=new Game({id:'shadow',title:'Shadow Protocol',icon:'🕵️',type:'deduction',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:3,max:10,desc:'Hidden roles. Social deduction. Betrayal.'});
ShadowProtocol.setup=function(pl){Game.prototype.setup.call(this,pl);var roles=AI.roles(pl.length);Drama.reset(pl);Director.init(pl.length);this.gs={phase:'reveal',round:1,maxR:4,players:pl.map(function(x,i){return Object.assign({},x,{role:roles[i],alive:true,votes:0,sus:0,elim:false});}),pidx:0,ridx:0,mission:AI.mission(),sw:0,rw:0};};
ShadowProtocol.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='vote')this._vote();else this._result();};
ShadowProtocol._reveal=function(){var gs=this.gs,self=this;var p=gs.players[gs.ridx];if(!p){gs.phase='vote';Nav.go('game');this._vote();return;}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;margin-bottom:5px">Round '+gs.round+'/'+gs.maxR+' · '+gs.mission+'</div><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" id="_nb">Pass to '+p.name+' →</button></div>';document.getElementById('_nb').onclick=function(){var isShadow=p.role.team==='shadow';Hap.roleReveal(isShadow);PP.show(p.name,p.av,'Your role','<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:7px">'+p.role.icon+'</div><div style="font-size:1.45rem;font-weight:800;color:'+p.role.col+';margin-bottom:4px">'+p.role.name+'</div><div style="opacity:.52;margin-bottom:11px;font-size:.84rem">'+p.role.power+'</div><div style="padding:9px;background:'+p.role.col+'22;border-radius:10px;font-size:.82rem"><strong style="color:'+p.role.col+'">'+(p.role.team==='shadow'?'⚠️ SHADOW':p.role.team==='wild'?'🎲 WILD':'✅ RESISTANCE')+'</strong></div></div>',function(){gs.ridx++;if(gs.ridx>=gs.players.length){gs.phase='vote';gs.ridx=0;}Nav.go('game');self.render();});};};
ShadowProtocol._vote=function(){var gs=this.gs,self=this;var dir=Director.next();Drama.tick('vote');var alive=gs.players.filter(function(p){return!p.elim;});var extraEvt=Director.chaos()?'<div style="padding:10px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:12px;font-size:.78rem;margin-bottom:11px">🎲 '+AI.evt('shadow')+'</div>':'';document.getElementById('gbody').innerHTML='<div style="margin-bottom:11px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;letter-spacing:.1em">Round '+gs.round+' · Vote</div><div style="font-size:.97rem;font-weight:700;margin-top:3px">Who do you suspect?</div></div>'+extraEvt+'<div id="vl">'+alive.map(function(p){return'<div class="vopt" onclick="_sv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.15rem">'+p.av+'</div><div><div style="font-weight:700">'+p.name+'</div><div style="font-size: 0.75rem;opacity:.32">Sus: '+p.sus+'%</div></div></div>';}).join('')+'</div><button type="button" class="btn br bf" id="_svb" style="margin-top:11px;display:none" onclick="_svs()">Submit Vote</button>';window._sel=null;window._sv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');window._sel=pid;document.getElementById('_svb').style.display='block';Snd.vote();Hap.l();};window._svs=function(){if(!window._sel)return;var t=gs.players.find(function(p){return p.id===window._sel;});if(t){t.votes=(t.votes||0)+1;t.sus=Math.min(100,(t.sus||0)+20);}Drama.tick('vote');gs.pidx++;if(gs.pidx>=alive.length){gs.phase='result';Nav.go('game');self._result();}else{window._sel=null;Nav.go('game');self._vote();toast('Pass to '+alive[gs.pidx].name);}Snd.vote();};};
ShadowProtocol._result=function(){var gs=this.gs,self=this;var alive=gs.players.filter(function(p){return!p.elim;});var maxV=Math.max.apply(null,alive.map(function(p){return p.votes||0;}));var cands=alive.filter(function(p){return(p.votes||0)===maxV;});var tgt=cands[Math.floor(Math.random()*cands.length)];if(!tgt)return;tgt.elim=true;var wasSh=tgt.role.team==='shadow';if(wasSh){gs.rw++;Snd.ok();Drama.tick('win');}else{gs.sw++;Snd.betray();Drama.tick('betray');Hap.betray();Memory.recordBetrayal('Shadow',tgt.name);}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:2.9rem">'+tgt.av+'</div><div style="font-size:1.45rem;font-weight:800;margin:5px 0">'+tgt.name+'</div><div style="opacity:.38;margin-bottom:11px">eliminated</div><div style="padding:11px;border-radius:12px;background:'+tgt.role.col+'1e;border:1px solid '+tgt.role.col+'42;margin-bottom:11px"><div style="font-size:1.3rem">'+tgt.role.icon+'</div><div style="font-size:.97rem;font-weight:800;color:'+tgt.role.col+';margin-top:4px">'+tgt.role.name+' · '+tgt.role.team.toUpperCase()+'</div></div><div style="font-size:.9rem;font-weight:700;margin-bottom:15px;color:'+(wasSh?PCBrand.h_30d158:PCBrand.h_ff2d55)+'">'+(wasSh?'✅ Resistance wins!':'⚠️ Shadow gains advantage!')+'</div>'+(gs.round<gs.maxR&&alive.filter(function(p){return!p.elim;}).length>=2?'<button type="button" class="btn bw" onclick="_snx()">Next Round →</button>':'<button type="button" class="btn bw" onclick="_sfi()">Final Results</button>')+'</div>';Hap.h();window._snx=function(){gs.round++;gs.phase='vote';gs.pidx=0;gs.players.forEach(function(p){p.votes=0;});if(gs.round%2===0&&Drama.state.tension>50)Announcer.tension();Nav.go('game');self._vote();};window._sfi=function(){var w=gs.rw>gs.sw?'Resistance':'Shadow Network';self.done(w);S.prof.betrayals+=gs.sw;self.showWin(w,[],'\x3cdiv style="opacity:.38;margin:5px 0">'+gs.rw+' — '+gs.sw+'\x3c/div>');};};

var HotDevice=new Game({id:'hot',title:'Hot Device',icon:'💣',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Pass before it explodes! Hidden timers.'});
HotDevice.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,pidx:0,lives:pl.reduce(function(o,p){o[p.id]=3;return o;},{}),elim:[]};};
HotDevice._fuse=function(){return this.timerMs(Math.floor(Math.random()*12000)+5000);};
HotDevice.render=function(){var gs=this.gs,self=this;var alive=this.players.filter(function(p){return!gs.elim.includes(p.id);});var cur=alive[gs.pidx%Math.max(1,alive.length)];if(!cur||alive.length<1){this._end();return;}var chaos=['','','','EYES CLOSED','ONE HAND ONLY','SILENCE','SPIN FIRST','FAKE OUT x3'][Math.floor(Math.random()*8)];document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:6px 0"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;letter-spacing:.1em;margin-bottom:14px">Round '+gs.round+'</div><div style="position:relative;display:inline-block;margin:4px auto 18px"><div id="hdev" style="width:112px;height:178px;border-radius:22px;background:linear-gradient(145deg,'+PCBrand.h_1a1a1a+','+PCBrand.h_0a0a0a+');border:2.5px solid var(--orange);box-shadow:0 0 32px rgba(255,107,0,.4);margin:0 auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px"><div style="font-size:2.2rem">💣</div><div style="font-size: 0.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:var(--orange)">LIVE</div></div></div><div style="font-size:1.45rem;font-weight:800;margin-bottom:3px">'+cur.av+' '+cur.name+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:13px">HOLDING</div>'+(chaos?'<div style="margin:0 0 11px;padding:9px;background:rgba(255,107,0,.08);border:1px solid rgba(255,107,0,.16);border-radius:11px;font-size:.78rem">⚠️ '+chaos+'</div>':'')+'<div style="display:flex;justify-content:center;gap:9px;flex-wrap:wrap;margin-bottom:15px">'+alive.map(function(p){return'<div style="text-align:center;opacity:'+(gs.elim.includes(p.id)?.15:1)+'"><div>'+p.av+'</div><div style="font-size: 0.75rem;margin-top:1px">'+'❤️'.repeat(Math.max(0,gs.lives[p.id]||0))+'</div></div>';}).join('')+'</div><button type="button" class="btn br blg bf" style="max-width:250px;margin:0 auto" onclick="window._hp()">💨 PASS</button></div>';// heartbeat haptic as fuse runs
var fuseTime=this._fuse();var hbStart=Date.now();var hbInt=setInterval(function(){var elapsed=Date.now()-hbStart;var ratio=elapsed/fuseTime;if(ratio>0.7)Hap.heartbeat();if(elapsed>=fuseTime)clearInterval(hbInt);},900);clearInterval(hbInt);hbInt=setInterval(function(){var elapsed=Date.now()-hbStart;if(elapsed>=fuseTime){clearInterval(hbInt);return;}if((fuseTime-elapsed)<4000)Hap.heartbeat();},900);clearTimeout(this._ft);this._ft=setTimeout(function(){clearInterval(hbInt);if(S.cur!=='game')return;var d=document.getElementById('hdev');if(d){d.style.background='linear-gradient(145deg,'+PCBrand.h_3d0000+','+PCBrand.h_2d0000+')';d.style.borderColor=PCBrand.h_f00;d.style.boxShadow='0 0 62px rgba(255,0,0,.7)';d.innerHTML='<div style="font-size:2.8rem">💥</div>';}Snd.blast();Hap.blast();Drama.tick('betray');gs.lives[cur.id]=(gs.lives[cur.id]||3)-1;if(gs.lives[cur.id]<=0){gs.elim.push(cur.id);toast('💥 '+cur.name+' eliminated!');Announcer.betray(cur.name);}setTimeout(function(){var rem=self.players.filter(function(p){return!gs.elim.includes(p.id);});if(rem.length<=1){self._end(rem[0]);}else{gs.pidx=(gs.pidx+1)%rem.length;gs.round++;Nav.go('game');self.render();}},1300);},fuseTime);window._hp=function(){clearTimeout(self._ft);clearInterval(hbInt);Snd.pass();Hap.m();var al=self.players.filter(function(p){return!gs.elim.includes(p.id);});gs.pidx=(gs.pidx+1)%al.length;gs.round++;Drama.tick('vote');Nav.go('game');self.render();};};
HotDevice._end=function(w){if(w){this.done(w.name);this.showWin(w.name);}else{this.done('Draw');this.showWin('Nobody',[],'\x3cdiv style="opacity:.38">Everyone exploded!\x3c/div>');}};

var SplitTruth=new Game({id:'split',title:'Split Truth',icon:'🎭',type:'bluffing',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:2,max:10,desc:'Mix truth with lies. Detect the bluffs.'});
SplitTruth.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:0,maxR:Math.min(pl.length*2,12),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pIdx:0,phase:'present',prompts:this.shuf(AI.bluffs),used:0,gIdx:0};};
SplitTruth.render=function(){var gs=this.gs;if(gs.round>=gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}if(gs.phase==='present')this._present();else this._guess();};
SplitTruth._present=function(){var gs=this.gs,self=this;var pi=gs.pIdx%this.players.length;var pr=this.players[pi];var prompt=gs.prompts[gs.used%gs.prompts.length];gs.curP=prompt;gs.presI=pi;document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;margin-bottom:9px">Round '+(gs.round+1)+'/'+gs.maxR+'</div><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._stp()">Pass to '+pr.av+' '+pr.name+'</button></div>';window._stp=function(){PP.show(pr.name,pr.av,'Presenter','<div style="text-align:center"><div style="opacity:.38;font-size:.73rem;margin-bottom:7px">Read ONE aloud</div><div style="background:rgba(191,90,242,.12);border:1px solid rgba(191,90,242,.24);border-radius:11px;padding:13px;margin-bottom:7px;font-size:.88rem;font-weight:600;line-height:1.45">"'+prompt.t+'"</div><div style="background:rgba(255,45,85,.12);border:1px solid rgba(255,45,85,.24);border-radius:11px;padding:13px;margin-bottom:15px;font-size:.88rem;font-weight:600;line-height:1.45">"'+prompt.l+'"</div><div style="display:flex;gap:8px"><button type="button" class="btn bg" style="flex:1" onclick="window._stc(\'t\')">Read TOP</button><button type="button" class="btn bg" style="flex:1" onclick="window._stc(\'l\')">Read BOTTOM</button></div></div>',function(){Nav.go('game');self.render();});window._stc=function(ch){gs.curStmt=ch==='t'?prompt.t:prompt.l;gs.isLie=ch==='l';gs.phase='guess';gs.gIdx=0;PP.done();Nav.go('game');self._guess();};};};
SplitTruth._guess=function(){var gs=this.gs,self=this;var guessers=this.players.filter(function(_,i){return i!==gs.presI;});if(gs.gIdx>=guessers.length){gs.round++;gs.pIdx++;gs.used++;gs.gIdx=0;gs.phase='present';Drama.tick('vote');Director.next();Nav.go('game');this.render();return;}var gsr=guessers[gs.gIdx];var pres=this.players[gs.presI];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px;padding:14px;margin-bottom:14px"><div style="font-size: 0.75rem;opacity:.32;margin-bottom:5px">'+pres.av+' '+pres.name+' says:</div><div style="font-size:.9rem;font-weight:600;line-height:1.5">"'+gs.curStmt+'"</div></div><div style="text-align:center;margin-bottom:12px"><div style="font-size:.97rem;font-weight:700">'+gsr.av+' '+gsr.name+'</div><div style="opacity:.38;margin-top:2px">Truth or Lie?</div></div><div style="display:flex;gap:9px"><button type="button" class="btn" style="flex:1;background:rgba(48,209,88,.12);border:1px solid var(--green);font-size:.9rem;padding:16px" onclick="window._stg(\'t\')">✅ TRUTH</button><button type="button" class="btn" style="flex:1;background:rgba(255,45,85,.12);border:1px solid var(--red);font-size:.9rem;padding:16px" onclick="window._stg(\'l\')">❌ LIE</button></div></div>';window._stg=function(g){var ok=(g==='t'&&!gs.isLie)||(g==='l'&&gs.isLie);if(ok){gs.sc[gsr.id]=(gs.sc[gsr.id]||0)+10;toast('✅ +10');Snd.ok();}else{gs.sc[pres.id]=(gs.sc[pres.id]||0)+10;toast('🎭 Fooled! +10');Snd.betray();S.prof.bluff++;Drama.tick('betray');if(S.prof.bluff>=5)Ach.unlock('blf');}Hap.m();gs.gIdx++;Nav.go('game');self._guess();};};

var SilentVote=new Game({id:'sv',title:'Silent Vote',icon:'🗳️',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:3,max:10,desc:'Secret voting. Hidden agendas.'});
SilentVote.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:5,sc:pl.reduce(function(o,p){o[p.id]=100;return o;},{}),votes:{},phase:'vote',pidx:0,elim:[]};};
SilentVote.render=function(){var gs=this.gs;if(gs.phase==='vote')this._vote();else this._reveal();};
SilentVote._vote=function(){var gs=this.gs,self=this;var alive=this.players.filter(function(p){return!gs.elim.includes(p.id);});var voter=alive[gs.pidx%Math.max(1,alive.length)];if(!voter){gs.phase='reveal';Nav.go('game');this._reveal();return;}Drama.tick('vote');var sec='<div style="text-align:center"><div style="font-weight:600;margin-bottom:3px">Round '+gs.round+' Secret Vote</div><div style="opacity:.38;font-size:.73rem;margin-bottom:12px">Anonymous</div>'+alive.filter(function(p){return p.id!==voter.id;}).map(function(p){return'<div class="vopt" onclick="window._svv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div style="font-weight:700">'+p.name+'</div>'+(Mutators.hasBlind()?'':'<div style="margin-left:auto;font-size:.73rem;color:var(--cyan)">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'<button type="button" class="btn bg bf" style="margin-top:12px;display:none" id="_svvb" onclick="window._svvs()">Submit →</button></div>';PP.show(voter.name,voter.av,'Cast your vote',sec,function(){Nav.go('game');self.render();});window._svvs2=null;window._svv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');window._svvs2=pid;document.getElementById('_svvb').style.display='block';Snd.vote();};window._svvs=function(){if(!window._svvs2)return;gs.votes[voter.id]=window._svvs2;gs.pidx++;PP.done();Nav.go('game');self.render();};};
SilentVote._reveal=function(){var gs=this.gs,self=this;var tally={};Object.values(gs.votes).forEach(function(v){tally[v]=(tally[v]||0)+1;});var maxV=Math.max.apply(null,Object.values(tally).concat([0]));var targets=Object.keys(tally).filter(function(k){return tally[k]===maxV;});var elId=targets[Math.floor(Math.random()*targets.length)];var elP=this.players.find(function(p){return p.id===elId;});if(elP&&!gs.elim.includes(elId)){gs.elim.push(elId);gs.sc[elId]=0;Drama.tick('betray');}Object.entries(gs.votes).forEach(function(e){if(e[1]===elId)gs.sc[e[0]]=(gs.sc[e[0]]||100)+15;else gs.sc[e[0]]=Math.max(0,(gs.sc[e[0]]||100)-5);});Director.next();document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:5px 0"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;margin-bottom:12px">Round '+gs.round+' Results</div>'+(elP?'<div style="font-size:2.8rem">'+elP.av+'</div><div style="font-size:1.45rem;font-weight:800;margin:5px 0">'+elP.name+'</div><div style="opacity:.38;margin-bottom:12px">voted out — '+(tally[elId]||0)+' votes</div>':'<div style="opacity:.38;margin-bottom:12px">No consensus</div>')+'<div style="margin-bottom:15px">'+this.players.map(function(p){return'<div style="display:flex;align-items:center;gap:9px;padding:8px;border-bottom:1px solid rgba(255,255,255,.05)"><div>'+p.av+'</div><div style="flex:1;font-weight:600;'+(gs.elim.includes(p.id)?'opacity:.22;text-decoration:line-through':'')+'">' +p.name+'</div>'+(Mutators.hasBlind()?'':'<div style="color:var(--cyan);font-weight:700">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div>'+(this.players.filter(function(p){return!gs.elim.includes(p.id);}).length<=1||gs.round>=gs.maxR?'<button type="button" class="btn bw" onclick="window._svend()">Final Results</button>':'<button type="button" class="btn bw" onclick="window._svnx()">Next Round →</button>')+'</div>';Snd.reveal();Hap.h();window._svnx=function(){gs.round++;gs.phase='vote';gs.votes={};gs.pidx=0;Nav.go('game');self.render();};window._svend=function(){var sc=self.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});self.done(sc[0].n);self.showWin(sc[0].n,sc);};};

var ChaosCards=new Game({id:'chaos',title:'Chaos Cards',icon:'🃏',type:'party',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'Infinite procedural party card challenges.'});
ChaosCards.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:Mutators.hasChaos()?30:20,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),deck:this.shuf(AI.chaos.concat(AI.chaos)),didx:0,pidx:0};};
var TruthBomb=new Game({id:'truthbomb',title:'Truth Bomb',icon:'💣',type:'party',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:10,desc:'Answer truth or face the bomb — party confessions.'});
TruthBomb._qs=['What is your most embarrassing moment?','Who here would you trust with a secret?','What habit do you hide from friends?','What is the boldest thing you have done?','What would you do with a million dollars?','Who was your first crush?','What app do you waste the most time on?','What is a skill you pretend to have?'];
TruthBomb.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:Math.min(15,pl.length*3),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pidx:0,qidx:0,bombs:0};};
TruthBomb.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=this.players[gs.pidx%this.players.length];var q=this._qs[gs.qidx%this._qs.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0;text-align:center"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase;margin-bottom:8px">Round '+gs.round+'/'+gs.maxR+'</div><button type="button" class="btn bw bf" onclick="window._tbgo()">Pass to '+player.av+' '+player.name+'</button></div>';window._tbgo=function(){var sec='<div style="text-align:center"><div style="font-size:2.4rem;margin-bottom:8px">💣</div><div style="font-size:.9rem;font-weight:700;line-height:1.5;margin-bottom:14px">'+q+'</div><div style="display:flex;flex-direction:column;gap:8px"><button type="button" class="btn bg bf" onclick="window._tbans(1)">✅ Answer Truth (+10)</button><button type="button" class="btn br bf" onclick="window._tbans(0)">💥 Take the Bomb (-5)</button></div></div>';PP.show(player.name,player.av,'Truth Bomb',sec,function(){gs.round++;gs.pidx++;gs.qidx++;Nav.go('game');self.render();});};window._tbans=function(ok){if(ok){gs.sc[player.id]=(gs.sc[player.id]||0)+10;Snd.ok();Hap.ok();toast('Truth told! +10');}else{gs.sc[player.id]=Math.max(0,(gs.sc[player.id]||0)-5);gs.bombs++;Snd.danger();Hap.err();toast('💥 Bomb! -5');Drama.tick('betray');}PP.done();gs.round++;gs.pidx++;gs.qidx++;Nav.go('game');self.render();};};

ChaosCards.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);Daily.completeForGame('chaos');return;}var player=this.players[gs.pidx%this.players.length];var card=gs.deck[gs.didx%gs.deck.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase">Card '+gs.round+'/'+gs.maxR+'</div><div style="font-size:.97rem;font-weight:700;margin-top:3px">'+player.av+' '+player.name+'</div></div><div id="_cc" style="border-radius:19px;padding:24px 18px;text-align:center;margin:0 0 14px;background:'+card.c+'1c;border:2px solid '+card.c+'52;min-height:182px;display:flex;flex-direction:column;align-items:center;justify-content:center;cursor:pointer" onclick="window._cf()"><div style="font-size:0.75rem;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:'+card.c+';margin-bottom:9px">'+card.tp+'</div><div style="font-size:2.7rem;margin-bottom:12px">'+card.i+'</div><div id="_ct" style="font-size:.9rem;font-weight:600;line-height:1.5;opacity:0">'+card.txt+'</div><div id="_ch" style="font-size:0.75rem;opacity:.32;margin-top:5px">TAP TO REVEAL</div></div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;margin-bottom:12px">'+this.players.map(function(p){return'<div style="text-align:center;padding:5px 9px;background:rgba(255,255,255,.04);border-radius:9px"><div>'+p.av+'</div>'+(Mutators.hasBlind()?'':'<div style="font-size: 0.75rem;font-weight:700;color:var(--orange)">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="window._cs(-5)">👎 Fail</button><button type="button" class="btn" style="flex:1;background:'+card.c+';color:'+PCBrand.h_000+'" onclick="window._cs(10)">✅ Done!</button></div></div>';var rev=false;window._cf=function(){if(rev)return;rev=true;document.getElementById('_ct').style.opacity='1';document.getElementById('_ch').style.display='none';Snd.reveal();Hap.m();};window._cs=function(pts){gs.sc[player.id]=Math.max(0,(gs.sc[player.id]||0)+pts);if(pts>0){Snd.ok();Hap.ok();}else{Snd.err();Drama.tick('betray');}gs.round++;gs.pidx++;gs.didx++;Nav.go('game');self.render();};};

var Dungeon=new Game({id:'dungeon',title:'One Device Dungeon',icon:'⚔️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:6,desc:'Pass-and-play roguelike. Alliances & betrayals.'});
Dungeon.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={floor:1,maxF:8,players:pl.map(function(x){return Object.assign({},x,{hp:30,gold:10,alive:true});}),turn:0};};
Dungeon.render=function(){var gs=this.gs,self=this;var alive=gs.players.filter(function(p){return p.alive;});if(!alive.length||gs.floor>gs.maxF){var sc=gs.players.map(function(p){return{n:p.name,s:p.gold+p.hp};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=alive[gs.turn%alive.length];var room=AI.room();Drama.tick('vote');Director.next();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:9px 12px;background:rgba(255,214,10,.07);border:1px solid rgba(255,214,10,.15);border-radius:12px"><div><div style="opacity:.38;font-size:0.75rem;text-transform:uppercase">Floor</div><div style="font-size:1.25rem;font-weight:800;color:var(--amber)">'+gs.floor+'</div></div><div style="font-size:1.75rem">'+room.i+'</div><div style="text-align:right"><div style="opacity:.38;font-size:0.75rem;text-transform:uppercase">Room</div><div style="font-size:.84rem;font-weight:700">'+room.n+'</div></div></div><div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:12px" class="noscroll">'+gs.players.map(function(p){return'<div style="min-width:70px;text-align:center;padding:7px 5px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:11px;opacity:'+(p.alive?1:.22)+'"><div>'+p.av+'</div><div style="font-size:0.75rem;font-weight:700;margin-top:1px">'+p.name.slice(0,6)+'</div><div style="font-size: 0.75rem;color:var(--red)">❤️'+p.hp+'</div><div style="font-size: 0.75rem;color:var(--amber)">💰'+p.gold+'</div></div>';}).join('')+'</div><div style="text-align:center;margin-bottom:5px;font-size:.73rem;font-weight:700">Pass to '+player.av+' '+player.name+'</div><button type="button" class="btn bw bf" onclick="window._da()">Enter '+room.n+'</button></div>';window._da=function(){var isDan=Math.random()<room.dan;var dmg=isDan?Math.floor(Math.random()*10)+5:0;var gold=isDan?0:Math.floor(Math.random()*15)+5;var bets=gs.players.filter(function(p){return p.alive&&p.id!==player.id;});if(isDan){player.hp=Math.max(0,player.hp-dmg);if(player.hp<=0){player.alive=false;}}else{player.gold+=gold;}var sec='<div style="text-align:center"><div style="font-size:2.6rem;margin-bottom:6px">'+room.i+'</div><div style="font-size:1.15rem;font-weight:800;margin-bottom:3px">'+room.n+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:12px">'+AI.evt('dungeon')+'</div>'+(isDan?'<div style="padding:11px;background:rgba(255,45,85,.12);border:1px solid rgba(255,45,85,.24);border-radius:11px;margin-bottom:12px"><div style="font-size:1rem">⚠️</div><div style="font-weight:700;margin-top:3px">-'+dmg+' HP · '+player.hp+' remaining</div></div>':'<div style="padding:11px;background:rgba(255,214,10,.12);border:1px solid rgba(255,214,10,.24);border-radius:11px;margin-bottom:12px"><div style="font-size:1rem">💰</div><div style="font-weight:700;margin-top:3px">+'+gold+' Gold · Total: '+player.gold+'</div></div>')+(bets.length?'<div style="padding:9px;background:rgba(255,45,85,.07);border:1px solid rgba(255,45,85,.12);border-radius:9px;text-align:left;margin-bottom:9px"><div style="font-size: 0.75rem;opacity:.38;margin-bottom:5px">Secret sabotage?</div>'+bets.map(function(t){return'<button type="button" onclick="window._db(\''+t.id+'\',\''+t.name+'\')" class="btn bg bsm" style="margin:2px">🗡️ '+t.name+'</button>';}).join('')+'</div>':'')+'</div>';PP.show(player.name,player.av,'Floor '+gs.floor,sec,function(){gs.floor++;gs.turn++;Nav.go('game');self.render();});window._db=function(tid,tname){var t=gs.players.find(function(p){return p.id===tid;});if(t){t.hp=Math.max(0,t.hp-8);S.prof.betrayals++;Memory.recordBetrayal(player.name,tname);Ach.check();toast('🗡️ Sabotaged!');Snd.betray();Hap.betray();}};};};

var SpyHunt=new Game({id:'spy',title:'Spy Hunt',icon:'👁️',type:'deduction',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:3,max:10,desc:'Find the spy before they complete their mission.'});
SpyHunt.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);var sc=Math.max(1,Math.floor(pl.length*.2));var spyIds=this.shuf([...pl.keys()]).slice(0,sc).map(function(i){return pl[i].id;});var locs=['Embassy','Casino','Hotel','Airport','Museum','Submarine','Space Station','Arctic Base'];var missions=['Steal the documents','Identify the Director','Plant the device','Send the signal','Eliminate the target'];this.gs={phase:'reveal',spyIds:spyIds,loc:locs[Math.floor(Math.random()*locs.length)],mission:missions[Math.floor(Math.random()*missions.length)],ridx:0,sus:{},ts:null};};
SpyHunt.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='int')this._int();else this._vote();};
SpyHunt._reveal=function(){var gs=this.gs,self=this;var p=this.players[gs.ridx];if(!p){gs.phase='int';Nav.go('game');this._int();return;}var isSpy=gs.spyIds.includes(p.id);Hap.roleReveal(isSpy);var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isSpy?'🕵️':'📍')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isSpy?PCBrand.h_ff2d55:PCBrand.h_30d158)+';margin-bottom:9px">'+(isSpy?'YOU ARE THE SPY':'You Are Safe')+'</div>'+(isSpy?'<div style="padding:11px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:11px;margin-bottom:9px"><div style="opacity:.38;font-size:.73rem">MISSION</div><div style="font-weight:700;margin-top:3px">'+gs.mission+'</div></div>':'<div style="padding:11px;background:rgba(48,209,88,.08);border:1px solid rgba(48,209,88,.16);border-radius:11px;margin-bottom:9px"><div style="opacity:.38;font-size:.73rem">LOCATION</div><div style="font-weight:700;margin-top:3px">'+gs.loc+'</div></div>')+'</div>';document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._spy1()">Pass to '+p.av+' '+p.name+'</button></div>';window._spy1=function(){PP.show(p.name,p.av,'Your identity',sec,function(){gs.ridx++;Nav.go('game');self.render();});};};
SpyHunt._int=function(){var gs=this.gs,self=this;if(!gs.ts)gs.ts=Date.now();Drama.tick('vote');var rem=Math.max(0,300-Math.floor((Date.now()-gs.ts)/1000));var mm=Math.floor(rem/60),ss=rem%60;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div id="_spt" style="font-size:2.7rem;font-weight:800;color:var(--green)">'+mm+':'+(ss<10?'0':'')+ss+'</div><div style="opacity:.38;margin-top:3px">Ask questions. Find the spy.</div></div><div style="padding:11px;background:rgba(48,209,88,.07);border:1px solid rgba(48,209,88,.11);border-radius:11px;margin-bottom:12px"><div style="opacity:.38;font-size: 0.75rem;text-transform:uppercase;margin-bottom:3px">Location (non-spies know)</div><div style="font-size:.97rem;font-weight:700">'+gs.loc+'</div></div><div style="margin-bottom:12px">'+this.players.map(function(p){return'<div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;padding:8px 10px;background:rgba(255,255,255,.03);border-radius:10px"><div>'+p.av+'</div><div style="flex:1;font-size:.78rem;font-weight:600">'+p.name+'</div><button type="button" onclick="window._spsu(\''+p.id+'\')" style="padding:2px 7px;background:rgba(255,107,0,.15);border:1px solid rgba(255,107,0,.24);border-radius:6px;font-size: 0.75rem;cursor:pointer">+Sus</button><div id="sus-'+p.id+'" style="font-size:0.75rem;color:var(--orange)">'+(gs.sus[p.id]||0)+'🔍</div></div>';}).join('')+'</div><div style="display:flex;gap:7px"><button type="button" class="btn bg" style="flex:1" onclick="window._spvt()">🗳️ Vote</button><button type="button" class="btn br" style="flex:1" onclick="window._spvt()">⚡ Emergency</button></div></div>';this._si=setInterval(function(){var r=Math.max(0,300-Math.floor((Date.now()-gs.ts)/1000));var el=document.getElementById('_spt');if(el)el.textContent=Math.floor(r/60)+':'+(r%60<10?'0':'')+(r%60);if(r<=30&&r%10===0){Drama.tick('vote');if(r<=30)Hap.m();}if(r<=0){clearInterval(self._si);gs.phase='vote';Nav.go('game');self._vote();}},1000);window._spsu=function(pid){gs.sus[pid]=(gs.sus[pid]||0)+1;var el=document.getElementById('sus-'+pid);if(el)el.textContent=gs.sus[pid]+'🔍';Snd.click();Drama.tick('vote');};window._spvt=function(){clearInterval(self._si);gs.phase='vote';Nav.go('game');self._vote();};};
SpyHunt._vote=function(){var gs=this.gs,self=this;Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="font-size:.97rem;font-weight:700">Who Is The Spy?</div></div>'+this.players.map(function(p){return'<div class="vopt" onclick="window._spfv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div><div style="font-weight:700">'+p.name+'</div><div style="font-size: 0.75rem;color:var(--orange)">'+(gs.sus[p.id]||0)+' sus</div></div></div>';}).join('')+'<button type="button" class="btn br bf" style="margin-top:12px;display:none" id="_sprvb" onclick="window._sprvl()">Reveal!</button></div>';var voted=null;window._spfv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');voted=pid;document.getElementById('_sprvb').style.display='block';Snd.vote();};window._sprvl=function(){if(!voted)return;var isSpy=gs.spyIds.includes(voted);var accused=self.players.find(function(p){return p.id===voted;});var spies=gs.spyIds.map(function(id){return self.players.find(function(p){return p.id===id;});});if(isSpy){Daily.completeForGame('spy');}document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(isSpy?'✅':'❌')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(isSpy?'SPY CAUGHT!':'WRONG TARGET!')+'</div><div style="font-size:2.7rem;margin:9px 0">'+accused.av+'</div><div style="font-size:1.05rem;font-weight:700">'+accused.name+'</div><div style="opacity:.38;margin-bottom:12px">'+(isSpy?'was the spy':'was innocent')+'</div><div style="padding:11px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.16);border-radius:11px;margin-bottom:15px">'+spies.map(function(sp){return'<div style="font-weight:700;font-size:.97rem;margin:3px 0">'+sp.av+' '+sp.name+'</div>';}).join('')+'</div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--green);--glow:rgba(48,209,88,.28)" onclick="GL.launch(\'spy\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';self.done(isSpy?'Resistance':spies[0].name);isSpy?(Snd.ok(),Hap.ok()):(Snd.betray(),Hap.err());};};

var LastSignal=new Game({id:'lsig',title:'Last Signal',icon:'📡',type:'survival',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:2,max:8,desc:'Cooperate to survive. But someone has a hidden agenda.'});
LastSignal.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:0,maxR:6,res:{power:60,food:60,comms:60,oxygen:60},players:pl.map(function(x){return Object.assign({},x,{alive:true,agenda:Math.random()<.25});}),pidx:0,acts:{}};};
LastSignal.render=function(){var gs=this.gs,self=this;if(gs.round>=gs.maxR){var surv=Object.values(gs.res).every(function(v){return v>0;});var sc=gs.players.map(function(p){return{n:p.name,s:Object.values(gs.res).reduce(function(a,b){return a+b;},0)};}).sort(function(a,b){return b.s-a.s;});this.done(surv?sc[0].n:'Nobody');this.showWin(surv?sc[0].n+' leads!':'Station Lost',sc,'<div style="opacity:.38;margin:5px 0">'+(surv?'Survived!':'Station fell.')+'</div>');return;}var ev=AI.sevts[gs.round%AI.sevts.length];Drama.tick('vote');Director.next();var rbars=Object.entries(gs.res).map(function(e){return'<div style="margin-bottom:7px"><div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:.73rem"><span>'+e[0]+'</span><span style="font-weight:700;color:'+(e[1]>30?'var(--green)':'var(--red)')+'">'+e[1]+'%</span></div><div class="btrack"><div class="bfill" style="width:'+Math.min(100,e[1])+'%;background:'+(e[1]>30?'var(--green)':'var(--red)')+'"></div></div></div>';}).join('');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase">Crisis '+(gs.round+1)+'/'+gs.maxR+'</div><div style="font-size:1.75rem;margin:5px 0">'+ev.i+'</div><div style="font-size:.9rem;font-weight:700;margin-bottom:3px">'+ev.t+'</div></div><div class="glass" style="padding:12px;margin-bottom:12px">'+rbars+'</div><button type="button" class="btn bw bf" onclick="window._lss()">Begin Actions</button></div>';window._lss=function(){gs.pidx=0;gs.acts={};self._action();};};
LastSignal._action=function(){var gs=this,self=this;gs=this.gs;var alive=this.gs.players.filter(function(p){return p.alive;});if(this.gs.pidx>=alive.length){Object.entries(this.gs.acts).forEach(function(e){if(e[1]==='fix'){var mk=Object.keys(this.gs.res).reduce(function(a,b){return this.gs.res[a]<this.gs.res[b]?a:b;}.bind(self));self.gs.res[mk]=Math.min(100,self.gs.res[mk]+15);}else if(e[1]==='gather'){Object.keys(self.gs.res).forEach(function(k){self.gs.res[k]=Math.min(100,self.gs.res[k]+20);});}else if(e[1]==='sab'){self.gs.res.power=Math.max(0,self.gs.res.power-20);Drama.tick('betray');}}.bind(self));Object.keys(self.gs.res).forEach(function(k){self.gs.res[k]=Math.max(0,self.gs.res[k]-15);});self.gs.round++;Nav.go('game');self.render();return;}var player=alive[this.gs.pidx];var sec='<div><div style="font-size:.84rem;font-weight:700;text-align:center;margin-bottom:9px">Round '+(this.gs.round+1)+' — Choose Action</div>'+(player.agenda?'<div style="padding:6px;background:rgba(255,45,85,.08);border-radius:8px;font-size:.73rem;color:var(--red);text-align:center;margin-bottom:9px">⚠️ Hidden Agenda</div>':'')+'<div style="display:flex;flex-direction:column;gap:7px"><button type="button" class="btn bg bf" onclick="window._lsa(\'fix\')">🔧 Fix (+15 lowest)</button><button type="button" class="btn bg bf" onclick="window._lsa(\'gather\')">📦 Gather (+20 all)</button><button type="button" class="btn bg bf" onclick="window._lsa(\'rest\')">💤 Conserve</button>'+(player.agenda?'<button type="button" class="btn" style="background:rgba(255,45,85,.16);border:1px solid rgba(255,45,85,.28)" onclick="window._lsa(\'sab\')">🗡️ SABOTAGE (-20 power)</button>':'')+'</div></div>';PP.show(player.name,player.av,'Crisis Response',sec,function(){Nav.go('game');self.gs.pidx++;self._action();});window._lsa=function(a){if(a==='sab'){Memory.recordBetrayal(player.name,'Station');Hap.betray();}self.gs.acts[player.id]=a;PP.done();Nav.go('game');self.gs.pidx++;self._action();};};

var ChainReaction=new Game({id:'chain',title:'Chain Reaction',icon:'⚡',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:10,desc:'React to chain events. Combos & escalating chaos.'});
ChainReaction.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:pl.length*3,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),pidx:0,combo:0};};
ChainReaction.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var len=Math.min(3+gs.round+(Mutators.hasChaos()?2:0),8);var icons=['⚡','🔥','💥','🌊','🌪️','✨','⭐','💫'];var seq=Array.from({length:len},function(){return icons[Math.floor(Math.random()*icons.length)];});var player=this.players[gs.pidx%this.players.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:12px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase">Round '+gs.round+' · '+player.av+' '+player.name+'</div></div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap;min-height:68px;align-items:center;padding:12px;background:rgba(255,255,255,.03);border-radius:12px;margin-bottom:12px">'+seq.map(function(s,i){return'<div id="_cn'+i+'" style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,.05);display:flex;align-items:center;justify-content:center;font-size:1.3rem;opacity:.16;transition:all .25s">'+s+'</div>';}).join('')+'</div><div style="text-align:center;margin-bottom:12px;opacity:.38">Combo: <span style="color:var(--orange);font-weight:700;opacity:1">x'+gs.combo+'</span></div><button type="button" class="btn bw bf" id="_cst" onclick="window._cst()">Watch Sequence →</button><div id="_ci" style="display:none;margin-top:12px"><div style="text-align:center;margin-bottom:9px;font-weight:700">Recreate it!</div><div style="display:flex;justify-content:center;gap:6px;flex-wrap:wrap">'+icons.map(function(ic){return'<div style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer" onclick="window._ct(\''+ic+'\',this)">'+ic+'</div>';}).join('')+'</div></div></div>';var inp=[];var speed=this.timerMs(560);window._cst=function(){document.getElementById('_cst').style.display='none';var i=0;var iv=setInterval(function(){if(i>0){var p=document.getElementById('_cn'+(i-1));if(p){p.style.opacity='.16';p.style.background='rgba(255,255,255,.05)';p.style.boxShadow='none';}}if(i<seq.length){var el=document.getElementById('_cn'+i);if(el){el.style.opacity='1';el.style.background='rgba(255,107,0,.34)';el.style.boxShadow='0 0 14px rgba(255,107,0,.5)';Snd.reflex(i*26);}i++;}else{clearInterval(iv);if(i>0){var last=document.getElementById('_cn'+(i-1));if(last){last.style.opacity='.16';last.style.background='rgba(255,255,255,.05)';last.style.boxShadow='none';}}setTimeout(function(){document.getElementById('_ci').style.display='block';},320);}},speed);};window._ct=function(icon,el){inp.push(icon);el.style.background='rgba(255,107,0,.24)';setTimeout(function(){el.style.background='rgba(255,255,255,.07)';},160);Snd.reflex(inp.length);Hap.l();if(inp.length===seq.length){var ok=inp.every(function(v,j){return v===seq[j];});if(ok){gs.combo++;var pts=10*Math.max(1,gs.combo);gs.sc[player.id]=(gs.sc[player.id]||0)+pts;toast('✅ Combo x'+gs.combo+'! +'+pts);Snd.ok();Hap.ok();Drama.tick('vote');}else{gs.combo=0;toast('❌ Wrong!');Snd.err();Hap.err();}gs.round++;gs.pidx++;setTimeout(function(){Nav.go('game');self.render();},700);}};};

var BetrayalGrid=new Game({id:'bgrid',title:'Betrayal Grid',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:8,desc:'Control zones. Sabotage opponents secretly.'});
BetrayalGrid.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);var sz=5;this.gs={round:1,maxR:8,grid:Array(sz*sz).fill(null).map(function(){return{own:null};}),sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),sz:sz,pidx:0,sabs:pl.reduce(function(o,p){o[p.id]=2;return o;},{})};};
BetrayalGrid.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}var player=this.players[gs.pidx%this.players.length];Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:9px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase">Round '+gs.round+'/'+gs.maxR+'</div></div><div style="display:grid;grid-template-columns:repeat('+gs.sz+',1fr);gap:4px;margin-bottom:12px">'+gs.grid.map(function(cell){var op=cell.own?self.players.find(function(p){return p.id===cell.own;}):null;return'<div style="height:44px;border-radius:7px;background:'+(op?op.col+'1c':'rgba(255,255,255,.03)')+';border:1px solid '+(op?op.col+'42':'rgba(255,255,255,.06)')+';display:flex;align-items:center;justify-content:center;font-size:.95rem">'+(op?op.av:'')+'</div>';}).join('')+'</div><div style="display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin-bottom:12px">'+this.players.map(function(p){return'<div style="text-align:center;padding:6px 9px;background:rgba(255,255,255,.04);border-radius:9px"><div>'+p.av+'</div>'+(Mutators.hasBlind()?'':'<div style="font-size: 0.75rem;font-weight:700;color:'+p.col+'">'+(gs.sc[p.id]||0)+'</div>')+'</div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._bgt()">Pass to '+player.av+' '+player.name+'</button></div>';window._bgt=function(){var sec='<div><div style="font-size:.84rem;font-weight:700;text-align:center;margin-bottom:5px">Claim or Sabotage</div><div style="opacity:.38;font-size: 0.75rem;text-align:center;margin-bottom:9px">Tap to claim · Tap enemy to sabotage ('+(gs.sabs[player.id]||0)+' left)</div><div style="display:grid;grid-template-columns:repeat('+gs.sz+',1fr);gap:4px">'+gs.grid.map(function(cell,i){var op=cell.own?self.players.find(function(p){return p.id===cell.own;}):null;return'<div class="bgcell" style="height:44px;background:'+(op?op.col+'1c':'rgba(255,255,255,.04)')+';border-color:'+(op?op.col+'42':'rgba(255,255,255,.08)')+'" onclick="window._bgc('+i+',this)">'+(op?op.av:'')+'</div>';}).join('')+'</div></div>';PP.show(player.name,player.av,'Your move',sec,function(){self.players.forEach(function(p){gs.sc[p.id]=gs.grid.filter(function(c){return c.own===p.id;}).length*5;});gs.round++;gs.pidx++;Director.next();Nav.go('game');self.render();});window._bgc=function(idx,el){var cell=gs.grid[idx];if(!cell.own||cell.own===player.id){cell.own=player.id;el.style.background=player.col+'1c';el.style.borderColor=player.col+'62';el.textContent=player.av;Snd.click();Hap.l();}else if((gs.sabs[player.id]||0)>0){cell.own=null;gs.sabs[player.id]--;el.style.background='rgba(255,45,85,.12)';el.textContent='💥';setTimeout(function(){el.style.background='rgba(255,255,255,.04)';el.textContent='';el.style.borderColor='rgba(255,255,255,.08)';},500);toast('🗡️ Sabotaged!');Memory.recordBetrayal(player.name,'Grid');Snd.betray();Hap.betray();Drama.tick('betray');S.prof.betrayals++;Ach.check();}};};};
// ═══ SOLO GAMES (11-20, mutators wired) ═════════════════════════════

var NeonReflex=new Game({id:'reflex',title:'Neon Reflex',icon:'⚡',type:'reflex',cat:'solo',col:PCBrand.h_64d2ff,mp:false,min:1,max:1,desc:'Ultra-fast reflex training. Set your record.'});
NeonReflex.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,lives:3,lvl:1,spd:950,active:false,rt:null,hist:[],combo:0,phase:'ready'};};
NeonReflex.render=function(){var gs=this.gs,self=this;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px;padding:0 2px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--ice)">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--orange)">'+(gs.combo>0?'x'+gs.combo:'—')+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Combo</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'🖤'.repeat(Math.max(0,3-gs.lives))+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Lives</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--green)">'+gs.lvl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Level</div></div></div><div id="rxarena" style="height:280px;border-radius:16px;background:rgba(100,210,255,.04);border:1px solid rgba(100,210,255,.11);position:relative;overflow:hidden;margin-bottom:12px"><div id="rxov" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px">'+(gs.phase==='ready'?'<div style="opacity:.38">Ready?</div><button type="button" class="btn bw" onclick="window._rxs()">▶ START</button>':gs.phase==='over'?'<div style="font-size:2.2rem;font-weight:800;color:var(--ice)">'+gs.sc+'</div><div style="opacity:.38;font-size:.8rem">Final Score</div>'+(gs.rt?'<div style="font-size:.78rem;color:var(--cyan)">Best: '+gs.rt+'ms</div>':'')+'<button type="button" class="btn bw" onclick="window._rxr()">Play Again</button>':'')+'</div><div id="rxtc" style="position:absolute;inset:0"></div></div><div style="display:flex;gap:4px;flex-wrap:wrap">'+gs.hist.slice(-8).map(function(t){return'<div style="padding:2px 8px;border-radius:6px;font-size: 0.75rem;font-weight:700;background:'+(t<200?'rgba(48,209,88,.17)':t<350?'rgba(100,210,255,.17)':'rgba(255,45,85,.17)')+';color:'+(t<200?'var(--green)':t<350?'var(--ice)':'var(--red)')+'">'+t+'ms</div>';}).join('')+'</div></div>';window._rxs=function(){gs.phase='playing';gs.active=true;document.getElementById('rxov').innerHTML='';self._spawn();};window._rxr=function(){clearTimeout(self._rt2);gs.sc=0;gs.lives=3;gs.lvl=1;gs.spd=Mutators.speed(950);gs.combo=0;gs.hist=[];gs.phase='ready';gs.active=false;Nav.go('game');self.render();};};
NeonReflex._spawn=function(){var gs=this.gs,self=this;if(!gs.active||gs.lives<=0)return;var arena=document.getElementById('rxtc');if(!arena)return;var sz=Math.max(44,73-gs.lvl*2.5);var ax=arena.clientWidth,ay=arena.clientHeight;var x=Math.random()*(ax-sz),y=Math.random()*(ay-sz);var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];var c=cols[Math.floor(Math.random()*cols.length)];arena.innerHTML='';var t=document.createElement('div');t.className='rtgt';t.style.cssText='left:'+x+'px;top:'+y+'px;width:'+sz+'px;height:'+sz+'px;background:'+c+'1c;border:2.5px solid '+c+';box-shadow:0 0 14px '+c+'52;font-size:'+(sz*.34)+'px;color:'+c+';cursor:pointer';t.textContent='◉';var t0=Date.now(),hit=false;t.addEventListener('touchstart',function(e){e.preventDefault();if(hit)return;hit=true;var rt=Date.now()-t0;gs.hist.push(rt);if(!gs.rt||rt<gs.rt){gs.rt=rt;if(rt<S.prof.reflex||!S.prof.reflex){S.prof.reflex=rt;Daily.checkComplete('reflex');}}clearTimeout(self._rt2);gs.sc+=Math.max(5,Math.floor(100/(rt/100)));gs.combo++;gs.lvl=Math.floor(gs.sc/50)+1;gs.spd=Mutators.speed(Math.max(370,950-gs.lvl*44));if(rt<150){Ach.unlock('r150');Daily.checkComplete('reflex');}if(rt<200){Ach.unlock('r200');Daily.checkComplete('reflex');}if(Mutators.hasSudden()&&rt>400){gs.lives=0;}t.style.transform='scale(0)';Snd.reflex(rt);Hap.l();toast((rt<200?'⚡':rt<350?'✅':'🐢')+' '+rt+'ms');setTimeout(function(){self._spawn();},170);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._spawn();},{passive:false});arena.appendChild(t);self._rt2=setTimeout(function(){if(hit)return;arena.innerHTML='';gs.lives--;gs.combo=0;Snd.err();Hap.err();if(gs.lives<=3-gs.lives<2)Hap.panic();toast('Miss! -1 Life');if(gs.lives<=0){gs.active=false;gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}else{setTimeout(function(){self._spawn();},440);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._spawn();}},Mutators.speed(gs.spd));};

var MemoryMatrix=new Game({id:'mem',title:'Memory Matrix',icon:'🧠',type:'memory',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Remember complex patterns under pressure.'});
MemoryMatrix.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sz:3,seq:[],pSeq:[],phase:'ready',sc:0,lives:3,showing:false};};
MemoryMatrix._gen=function(len,tot){return Array.from({length:len},function(){return Math.floor(Math.random()*tot);});};
MemoryMatrix.render=function(){var gs=this.gs,self=this;var sz=gs.sz,tot=sz*sz;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-around;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--green)">'+gs.lvl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div id="mst" style="text-align:center;margin-bottom:9px;font-size:.84rem;opacity:.48;height:16px">'+(gs.phase==='show'?'Watch...':gs.phase==='input'?'Tap in order!':'')+'</div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px" id="mgrid">'+Array.from({length:tot},function(_,i){return'<div class="mcell" id="mc'+i+'" onclick="window._mt('+i+')">'+'🟦🟩🟥🟨🟪🟧'[i%6]+'</div>';}).join('')+'</div><div style="height:3px;background:rgba(255,255,255,.06);border-radius:2px;overflow:hidden;margin-bottom:12px"><div id="mprog" style="height:100%;background:var(--green);border-radius:2px;transition:width .25s;width:'+(gs.seq.length?(gs.pSeq.length/gs.seq.length)*100:0)+'%"></div></div>'+(gs.phase==='ready'?'<button type="button" class="btn bw bf" onclick="window._ms()">▶ Level '+gs.lvl+'</button>':gs.phase==='over'?'<div style="text-align:center"><div style="font-size:1.75rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:12px">Level '+gs.lvl+'</div><button type="button" class="btn bw" onclick="window._mr()">Play Again</button></div>':'')+'</div>';if(gs.phase==='show'&&gs.seq.length&&!gs.showing){gs.showing=true;var spd=this.timerMs(550);var i=0;var iv=setInterval(function(){if(i>0){var p=document.getElementById('mc'+(gs.seq[i-1]));if(p)p.classList.remove('lit');}if(i<gs.seq.length){var el=document.getElementById('mc'+gs.seq[i]);if(el){el.classList.add('lit');Snd.reflex(i*16);}i++;}else{clearInterval(iv);var last=document.getElementById('mc'+gs.seq[i-1]);if(last)last.classList.remove('lit');gs.phase='input';gs.showing=false;var st=document.getElementById('mst');if(st)st.textContent='Tap in order!';}},spd);}window._ms=function(){gs.seq=self._gen(gs.lvl+2,tot);gs.pSeq=[];gs.phase='show';gs.showing=false;Nav.go('game');self.render();};window._mt=function(idx){if(gs.phase!=='input')return;var exp=gs.seq[gs.pSeq.length];gs.pSeq.push(idx);Snd.reflex(idx*8);Hap.l();var cell=document.getElementById('mc'+idx);if(idx===exp){if(cell){cell.classList.add('lit');setTimeout(function(){var c=document.getElementById('mc'+idx);if(c)c.classList.remove('lit');},250);}var prog=document.getElementById('mprog');if(prog)prog.style.width=((gs.pSeq.length/gs.seq.length)*100)+'%';if(gs.pSeq.length===gs.seq.length){gs.sc+=gs.lvl*10*(Mutators.xpMult());gs.lvl++;gs.sz=Math.min(5,3+Math.floor(gs.lvl/4));if(gs.lvl>=8)Daily.completeForGame('mem');if(gs.lvl>=10)Ach.unlock('m10');Snd.ok();Hap.ok();toast('Level '+(gs.lvl-1)+' done!');gs.phase='ready';gs.showing=false;setTimeout(function(){Nav.go('game');self.render();},500);}}else{if(cell){cell.style.background='rgba(255,45,85,.34)';setTimeout(function(){var c=document.getElementById('mc'+idx);if(c)c.style.background='';},450);}if(Mutators.hasSudden()){gs.lives=0;}else{gs.lives--;}Snd.err();Hap.err();toast('Wrong!');if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}else{gs.pSeq=[];gs.phase='show';gs.showing=false;setTimeout(function(){Nav.go('game');self.render();},700);}}};window._mr=function(){gs.lvl=1;gs.sz=3;gs.seq=[];gs.pSeq=[];gs.sc=0;gs.lives=3;gs.phase='ready';gs.showing=false;Nav.go('game');self.render();};};

var SignalDecode=new Game({id:'decode',title:'Signal Decode',icon:'🔐',type:'puzzle',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Decode transmissions under pressure.'});
SignalDecode.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sc:0,tl:60,phase:'ready',solved:0};};
SignalDecode._puz=function(lvl){var c=function(){var ws=['SIGNAL','DECODE','BREACH','CIPHER','NEXUS','GHOST','AGENT','PRISM','OMEGA','DELTA'];var w=ws[Math.floor(Math.random()*ws.length)];var sh=Math.floor(Math.random()*5)+1;return{type:'CAESAR',q:'DECODE: '+w.split('').map(function(x){return String.fromCharCode(((x.charCodeAt(0)-65+sh)%26)+65);}).join(''),a:w,h:'Shift back '+sh};};var m=function(){var s=Array.from({length:4},function(){return Math.floor(Math.random()*9)+1;});return{type:'MATH',q:'SUM: '+s.join(' + ')+' = ?',a:String(s.reduce(function(a,b){return a+b;},0)),h:'Add all'};};var pats=[{q:'2, 4, 8, 16, ?',a:'32',h:'Doubles'},{q:'1, 3, 6, 10, ?',a:'15',h:'Add 2,3,4,5'},{q:'1, 1, 2, 3, 5, ?',a:'8',h:'Fibonacci'},{q:'2, 3, 5, 7, 11, ?',a:'13',h:'Primes'},{q:'100, 91, 82, 73, ?',a:'64',h:'Minus 9'}];var pt=function(){var p=pats[Math.floor(Math.random()*pats.length)];return{type:'PATTERN',q:p.q,a:p.a,h:p.h};};var fns=[c,m,pt];return fns[Math.min(Math.floor(Math.random()*Math.min(fns.length,1+Math.floor(lvl/2))),fns.length-1)]();};
SignalDecode.render=function(){var gs=this.gs,self=this;var body=document.getElementById('gbody');if(gs.phase==='ready'){body.innerHTML='<div style="text-align:center;padding:30px 14px"><div style="font-size:3.4rem;margin-bottom:12px">🔐</div><div style="font-size:1.25rem;font-weight:800;margin-bottom:5px">Signal Decode</div><div style="opacity:.38;margin-bottom:24px">Break ciphers before time runs out</div><button type="button" class="btn bw blg bf" onclick="window._dstart()">▶ Begin</button></div>';window._dstart=function(){gs.phase='playing';gs.puz=self._puz(gs.lvl);gs.tl=Mutators.speed(Math.max(20,60-gs.lvl*5));Nav.go('game');self.render();self._timer();};return;}if(gs.phase==='over'){body.innerHTML='<div style="text-align:center;padding:30px 14px"><div style="font-size:2.7rem;margin-bottom:5px">🔐</div><div style="font-size:1.75rem;font-weight:800;color:var(--cyan)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">'+gs.solved+' decoded</div><button type="button" class="btn bw" onclick="window._drst()">Again</button></div>';window._drst=function(){gs.lvl=1;gs.sc=0;gs.phase='ready';gs.solved=0;Nav.go('game');self.render();};return;}var pz=gs.puz;body.innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--cyan)">'+gs.lvl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div id="_dtmr" style="font-size:1.45rem;font-weight:800;color:'+(gs.tl<=10?'var(--red)':'var(--green)')+'">'+gs.tl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Sec</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div></div><div style="padding:18px;background:rgba(0,212,255,.06);border:1px solid rgba(0,212,255,.15);border-radius:15px;text-align:center;margin-bottom:15px"><div style="font-size:0.75rem;opacity:.32;letter-spacing:.15em;text-transform:uppercase;margin-bottom:5px">'+pz.type+'</div><div style="font-size:1.25rem;font-weight:800;font-family:monospace;color:var(--cyan)">'+pz.q+'</div><div style="opacity:.24;margin-top:9px;font-size: 0.75rem">Hint: '+pz.h+'</div></div><div style="display:flex;gap:7px;margin-bottom:9px"><input id="_dinp" type="text" placeholder="Answer..." autocomplete="off" autocorrect="off" autocapitalize="characters" style="flex:1;padding:11px 14px;border-radius:11px;border:1px solid rgba(255,255,255,.14);background:rgba(255,255,255,.05);font-size:.9rem;font-weight:600;color:'+PCBrand.h_fff+';text-transform:uppercase" oninput="this.value=this.value.toUpperCase()" onkeydown="if(event.key===\'Enter\')window._dsub()"><button type="button" class="btn ba" style="padding:11px 15px;flex-shrink:0" onclick="window._dsub()" aria-label="Submit answer">→</button></div></div>';window._dsub=function(){var val=(document.getElementById('_dinp').value||'').trim().toUpperCase();if(val===pz.a.toUpperCase()){clearInterval(self._dt);gs.solved++;if(gs.solved>=5)Daily.completeForGame('decode');gs.sc+=gs.lvl*20+Math.floor(gs.tl*2);gs.lvl++;gs.puz=self._puz(gs.lvl);gs.tl=Mutators.speed(Math.max(20,60-gs.lvl*5));Snd.ok();Hap.ok();toast('✅ +'+gs.lvl*20+' pts');Nav.go('game');self.render();self._timer();}else{Snd.err();Hap.err();var inp=document.getElementById('_dinp');if(inp){inp.style.borderColor='var(--red)';setTimeout(function(){var i=document.getElementById('_dinp');if(i)i.style.borderColor='';},440);}}};};
SignalDecode._timer=function(){var gs=this.gs,self=this;clearInterval(this._dt);this._dt=setInterval(function(){gs.tl--;var el=document.getElementById('_dtmr');if(el){el.textContent=gs.tl;el.style.color=gs.tl<=10?'var(--red)':'var(--green)';}if(gs.tl<=10)Snd.tick(gs.tl);if(gs.tl<=5)Hap.m();if(gs.tl<=0){clearInterval(self._dt);gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}},1000);};

var QuickTap=new Game({id:'qtap',title:'Quick Tap',icon:'👆',type:'reflex',cat:'solo',col:PCBrand.h_ff6b00,mp:false,min:1,max:1,desc:'Maximum tap speed. Beat your record.'});
QuickTap.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={taps:0,tl:Mutators.speed(10),active:false,phase:'ready',best:0};};
QuickTap.render=function(){var gs=this.gs,self=this;document.getElementById('gbody').innerHTML='<div style="padding:5px 0;text-align:center"><div style="display:flex;justify-content:space-around;margin-bottom:18px"><div><div id="_qtt" style="font-size:2.1rem;font-weight:800;color:var(--orange)">'+gs.taps+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Taps</div></div><div><div id="_qtm" style="font-size:2.1rem;font-weight:800">'+gs.tl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Seconds</div></div><div><div style="font-size:2.1rem;font-weight:800;color:var(--amber)">'+gs.best+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Best</div></div></div><div id="_tz" class="tapz" style="margin:0 auto 18px;--acc:var(--orange);--glow:rgba(255,107,0,.26)">'+(gs.phase==='ready'?'▶':gs.phase==='over'?'🏆':'👆')+'</div>'+(gs.phase==='ready'?'<div style="opacity:.38;font-size:.84rem">Tap to start!</div>':'')+(gs.phase==='over'?'<div style="margin-top:5px"><div style="opacity:.38;margin-bottom:12px">'+(gs.taps>=gs.best?'🎉 NEW RECORD!':'Best: '+gs.best)+'</div>'+(gs.taps>=80?'<div style="color:var(--amber);font-size:.8rem;margin-bottom:10px">🎯 Daily Challenge met!</div>':'')+'<button type="button" class="btn bw" onclick="window._qtr()">Try Again</button></div>':'')+'</div>';var tz=document.getElementById('_tz');tz.addEventListener('touchstart',function(e){e.preventDefault();if(gs.phase==='ready'){gs.phase='playing';gs.taps=0;gs.active=true;clearInterval(self._qi);self._qi=setInterval(function(){gs.tl--;var el=document.getElementById('_qtm');if(el)el.textContent=gs.tl;if(gs.tl<=3){Snd.tick(gs.tl);Hap.m();}if(gs.tl<=0){clearInterval(self._qi);if(gs.taps>gs.best)gs.best=gs.taps;gs.phase='over';gs.active=false;Snd.ok();Hap.ok();XP.add(gs.taps*2,Mutators.xpMult());if(gs.taps>=80)Daily.completeForGame('qtap');self.done(null);Nav.go('game');self.render();}},1000);}if(gs.phase!=='playing')return;gs.taps++;var el=document.getElementById('_qtt');if(el)el.textContent=gs.taps;Snd.reflex(gs.taps%5);Hap.l();tz.style.transform='scale(0.89)';setTimeout(function(){tz.style.transform='';},70);},{passive:false});window._qtr=function(){clearInterval(self._qi);gs.taps=0;gs.tl=Mutators.speed(10);gs.active=false;gs.phase='ready';Nav.go('game');self.render();};};

var PatternShift=new Game({id:'pat',title:'Pattern Shift',icon:'🔷',type:'puzzle',cat:'solo',col:PCBrand.h_bf5af2,mp:false,min:1,max:1,desc:'Patterns mutate. Adapt before time runs out.'});
PatternShift.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={lvl:1,sc:0,lives:3,phase:'new',target:[],cur:[],sz:3,tl:15};};
PatternShift._gen=function(sz){var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];return Array.from({length:sz*sz},function(){return cols[Math.floor(Math.random()*cols.length)];});};
PatternShift.render=function(){var gs=this.gs,self=this;var sz=gs.sz;if(!gs.target.length||gs.phase==='new'){gs.target=this._gen(sz);gs.cur=[].concat(gs.target);gs.phase='show';gs.tl=Mutators.speed(Math.max(8,15-gs.lvl));}var cols=[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a];var h=Math.floor(272/sz);document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-around;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--violet)">'+gs.lvl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div>'+(gs.phase==='show'?'<div style="text-align:center;margin-bottom:7px;opacity:.48;font-size:.84rem">Memorize!</div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.target.map(function(c){return'<div class="pcell" style="background:'+c+';height:'+h+'px;border-radius:'+(11-sz)+'px"></div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._prd()">Got It!</button>':gs.phase==='input'?'<div style="text-align:center;margin-bottom:7px;opacity:.48;font-size:.84rem">Recreate! <span style="color:var(--violet);font-weight:700" id="_ptmr">'+gs.tl+'s</span></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.cur.map(function(c,i){return'<div class="pcell" id="_pc'+i+'" style="background:'+c+';height:'+h+'px;border-radius:'+(11-sz)+'px" onclick="window._ptap('+i+')"></div>';}).join('')+'</div><button type="button" class="btn bw bf" onclick="window._pchk()">Submit</button>':gs.phase==='over'?'<div style="text-align:center;padding:30px 0"><div style="font-size:2.1rem;font-weight:800;color:var(--violet)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:20px">Level '+gs.lvl+'</div><button type="button" class="btn bw" onclick="window._prst()">Play Again</button></div>':'')+'</div>';window._prd=function(){gs.phase='input';gs.cur=self._gen(sz);Nav.go('game');self.render();clearInterval(self._pti);self._pti=setInterval(function(){gs.tl--;var el=document.getElementById('_ptmr');if(el)el.textContent=gs.tl+'s';if(gs.tl<=0){clearInterval(self._pti);window._pchk();}},1000);};window._ptap=function(idx){var ci=cols.indexOf(gs.cur[idx]);gs.cur[idx]=cols[(ci+1)%cols.length];var el=document.getElementById('_pc'+idx);if(el)el.style.background=gs.cur[idx];Snd.click();Hap.l();};window._pchk=function(){clearInterval(self._pti);var ok=gs.target.every(function(c,i){return c===gs.cur[i];});if(ok){gs.sc+=gs.lvl*20*Mutators.xpMult();gs.lvl++;gs.sz=Math.min(5,3+Math.floor(gs.lvl/5));Snd.ok();Hap.ok();toast('✅ Level '+gs.lvl);gs.phase='new';gs.target=[];setTimeout(function(){Nav.go('game');self.render();},420);}else{if(Mutators.hasSudden())gs.lives=0;else gs.lives--;Snd.err();Hap.err();if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);}else{gs.phase='show';toast('Not quite!');}Nav.go('game');self.render();}};window._prst=function(){gs.lvl=1;gs.sc=0;gs.lives=3;gs.sz=3;gs.target=[];gs.phase='new';Nav.go('game');self.render();};};

var GhostMode=new Game({id:'ghost',title:'Ghost Mode',icon:'👻',type:'survival',cat:'solo',col:PCBrand.h_8888ff,mp:false,min:1,max:1,desc:'Something invisible adapts to your behavior.'});
GhostMode.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={round:1,maxR:10,hp:100,sc:0,phase:'choose',safe:null,last:null,hist:[],aggr:0.3};};
GhostMode.render=function(){var gs=this.gs,self=this;var grid=4,tot=grid*grid;if(gs.phase==='new'||gs.phase==='choose'){var avoid=gs.hist.slice(-3);var safe;do{safe=Math.floor(Math.random()*tot);}while(avoid.includes(safe)||safe===gs.last);gs.safe=safe;gs.last=safe;gs.phase='choose';}if(gs.phase==='over'){document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">👻</div><div style="font-size:1.75rem;font-weight:800;color:'+PCBrand.h_8888ff+'">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Survived '+(gs.round-1)+' rounds</div><button type="button" class="btn bw" onclick="window._grst()">Try Again</button></div>';window._grst=function(){gs.round=1;gs.hp=100;gs.sc=0;gs.phase='choose';gs.hist=[];gs.aggr=0.3;gs.safe=null;gs.last=null;Nav.go('game');self.render();};return;}if(gs.hp<=20)Hap.panic();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:'+PCBrand.h_8888ff+'">'+gs.round+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Round</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:'+(gs.hp>30?'var(--green)':'var(--red)')+(gs.hp<=30?' ;animation:heartbeat 1s ease infinite':'')+'">'+gs.hp+'%</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">HP</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div></div><div style="padding:9px;background:rgba(136,136,255,.07);border:1px solid rgba(136,136,255,.15);border-radius:11px;margin-bottom:12px;text-align:center;opacity:.58;font-size:.78rem">👻 Find the safe cell.</div><div style="display:grid;grid-template-columns:repeat('+grid+',1fr);gap:5px;margin-bottom:12px">'+Array.from({length:tot},function(_,i){return'<div class="ghcell" id="_gc'+i+'" style="height:62px;background:rgba(136,136,255,.05);border:1px solid rgba(136,136,255,.08)" onclick="window._gt('+i+')">?</div>';}).join('')+'</div><div style="opacity:.28;text-align:center;font-size: 0.75rem">Aggression: '+'🔴'.repeat(Math.floor(gs.aggr*5))+'</div></div>';window._gt=function(idx){gs.hist.push(idx);var isSafe=idx===gs.safe;for(var i=0;i<tot;i++){var c=document.getElementById('_gc'+i);if(c){if(i===gs.safe){c.textContent='✅';c.style.background='rgba(48,209,88,.15)';c.style.borderColor='var(--green)';}else{c.textContent='👻';c.style.background='rgba(136,136,255,.08)';}}}if(isSafe){gs.sc+=10*gs.round;Snd.ok();Hap.ok();toast('✅ Safe! +'+(10*gs.round));}else{var dmg=Math.floor(gs.aggr*(Mutators.hasSudden()?100:24));gs.hp=Math.max(0,gs.hp-dmg);Snd.danger();Hap.err();toast('👻 Caught! -'+dmg+' HP');}gs.round++;gs.aggr=Math.min(0.9,gs.aggr+0.05);if(gs.hp<=0||gs.round>gs.maxR){setTimeout(function(){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();},900);}else{gs.phase='new';setTimeout(function(){Nav.go('game');self.render();},900);}};};

var AISurvival=new Game({id:'aisurv',title:'AI Survival',icon:'🤖',type:'survival',cat:'solo',col:PCBrand.h_ffd60a,mp:false,min:1,max:1,desc:'Procedural AI director generates survival scenarios.'});
AISurvival.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={turn:0,maxT:Mutators.hasSudden()?8:15,hp:100,en:80,food:70,ammo:5,sc:0};};
AISurvival.render=function(){var gs=this.gs,self=this;if(gs.turn>=gs.maxT||gs.hp<=0){XP.add(gs.sc,Mutators.xpMult());if(gs.turn>=12)Daily.completeForGame('aisurv');self.done(null);document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">🤖</div><div style="font-size:1.75rem;font-weight:800;color:var(--amber)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">'+gs.turn+' turns survived</div><div style="opacity:.28;font-size:.78rem;margin-bottom:20px">'+(gs.hp>0?'Mission Complete!':'HP depleted.')+'</div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--amber);--glow:rgba(255,214,10,.28)" onclick="GL.launch(\'aisurv\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';Snd.ok();return;}if(gs.hp<=20)Hap.panic();var ev=AI.sevts[Math.floor(Math.random()*AI.sevts.length)];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="opacity:.32;font-size: 0.75rem;text-transform:uppercase">Turn '+(gs.turn+1)+'/'+gs.maxT+'</div><div style="font-size:.78rem;font-weight:700;color:var(--amber)">'+gs.sc+' pts</div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:12px">'+[['❤️','HP',gs.hp,'var(--red)'],['⚡','Energy',gs.en,'var(--amber)'],['🍖','Food',gs.food,'var(--green)'],['🔫','Ammo',gs.ammo*10,'var(--cyan)']].map(function(row){return'<div style="padding:9px;background:rgba(255,255,255,.04);border-radius:11px;border:1px solid rgba(255,255,255,.07)"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size: 0.75rem">'+row[0]+' '+row[1]+'</span><span style="font-size: 0.75rem;font-weight:700;color:'+row[3]+'">'+(row[1]==='Ammo'?gs.ammo:row[2])+'</span></div><div class="btrack"><div class="bfill" style="width:'+Math.min(100,row[2])+'%;background:'+row[3]+'"></div></div></div>';}).join('')+'</div><div style="padding:14px;background:rgba(255,214,10,.06);border:1px solid rgba(255,214,10,.15);border-radius:14px;margin-bottom:12px;text-align:center"><div style="font-size:2.1rem;margin-bottom:5px">'+ev.i+'</div><div style="opacity:.38;font-size: 0.75rem;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px">AI DIRECTOR</div><div style="font-size:.88rem;font-weight:600;line-height:1.5">'+ev.t+'</div></div><div style="display:flex;flex-direction:column;gap:6px"><button type="button" class="btn bg bf" onclick="window._aia(\'fight\')">⚔️ Fight (costs 1 ammo)</button><button type="button" class="btn bg bf" onclick="window._aia(\'hide\')">🫥 Hide (risky)</button><button type="button" class="btn bg bf" onclick="window._aia(\'scav\')">🔍 Scavenge (risky)</button><button type="button" class="btn bg bf" onclick="window._aia(\'rest\')">💤 Rest (+20 HP)</button></div></div>';window._aia=function(a){var r=Math.random(),msg='';if(a==='fight'){if(gs.ammo>0){gs.ammo--;gs.sc+=15;var dmg=r<.3?Math.floor(Math.random()*12)+4:0;gs.hp=Math.max(0,gs.hp-dmg);msg=dmg?'⚔️ -'+dmg+' HP':'⚔️ Victory!';Snd.ok();}else{gs.hp=Math.max(0,gs.hp-20);msg='❌ No ammo!';Snd.err();}}else if(a==='hide'){gs.en=Math.max(0,gs.en-10);if(r<.25){gs.hp=Math.max(0,gs.hp-12);msg='🫥 Found! -12 HP';Snd.danger();}else{gs.sc+=5;msg='🫥 Hidden';Snd.click();}}else if(a==='scav'){if(r<.38){gs.hp=Math.max(0,gs.hp-16);msg='🕳️ Trap!';Snd.err();}else{gs.food=Math.min(100,gs.food+16);gs.ammo++;gs.sc+=10;msg='🔍 Supplies!';Snd.ok();}}else{gs.hp=Math.min(100,gs.hp+20);msg='💤 +20 HP';Snd.click();}gs.food=Math.max(0,gs.food-10);gs.en=Math.max(0,gs.en-5);if(gs.food<=0){gs.hp=Math.max(0,gs.hp-8);msg+=' Starving!';}if(Mutators.hasSudden()&&gs.hp<50){gs.hp=0;}gs.turn++;toast(msg);Hap.m();Nav.go('game');self.render();};};

var CyberTiles=new Game({id:'cyber',title:'Cyber Tiles',icon:'🔲',type:'puzzle',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Tile-merge tactics. Chain reactions.'});
CyberTiles.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var vs=[2,2,4,4,8,8,0,0,0,0,0,0,0,0,0,0];this.gs={grid:vs.slice().sort(function(){return Math.random()-.5;}).map(function(v){return{v:v};}),sz:4,sc:0,moves:0,combos:0,sel:null};};
CyberTiles._cm={'0':'rgba(255,255,255,.04)','2':'rgba(48,209,88,.12)','4':'rgba(0,212,255,.12)','8':'rgba(255,107,0,.12)','16':'rgba(191,90,242,.12)','32':'rgba(255,45,85,.12)','64':'rgba(255,214,10,.12)','128':'rgba(100,210,255,.2)','256':'rgba(48,209,88,.28)'};
CyberTiles._tc={'0':'transparent','2':PCBrand.h_30d158,'4':PCBrand.h_00d4ff,'8':PCBrand.h_ff6b00,'16':PCBrand.h_bf5af2,'32':PCBrand.h_ff2d55,'64':PCBrand.h_ffd60a,'128':PCBrand.h_64d2ff,'256':PCBrand.h_30d158};
CyberTiles.render=function(){var gs=this.gs,self=this;var sz=gs.sz;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:12px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.moves+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Moves</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--amber)">'+gs.combos+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Combos</div></div></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:5px;margin-bottom:12px">'+gs.grid.map(function(cell,i){return'<div class="tile" id="_t'+i+'" style="height:64px;background:'+(self._cm[cell.v]||self._cm[0])+';color:'+(self._tc[cell.v]||'transparent')+';font-size:'+(cell.v>=128?'.82rem':'1rem')+'" onclick="window._ctap('+i+')">'+(cell.v||'')+'</div>';}).join('')+'</div><div style="opacity:.32;text-align:center;font-size:0.75rem;margin-bottom:9px">Tap adjacent matching tiles to merge</div><button type="button" class="btn bg bf" onclick="window._csh()">🔀 Shuffle (+5 moves)</button></div>';gs.sel=null;window._ctap=function(idx){if(gs.sel===null){if(!gs.grid[idx].v)return;gs.sel=idx;var el=document.getElementById('_t'+idx);if(el){el.style.borderColor='var(--green)';el.style.borderWidth='2px';}Snd.click();return;}var a=gs.sel,b=idx;gs.sel=null;document.querySelectorAll('.tile').forEach(function(t){t.style.borderColor='';t.style.borderWidth='';});if(a===b)return;var ra=Math.floor(a/sz),ca=a%sz,rb=Math.floor(b/sz),cb=b%sz;if(Math.abs(ra-rb)+Math.abs(ca-cb)!==1){Snd.err();toast('Not adjacent!');return;}if(gs.grid[a].v===gs.grid[b].v&&gs.grid[a].v>0){gs.grid[b].v*=2;gs.grid[a].v=0;gs.sc+=gs.grid[b].v*Mutators.xpMult();gs.combos++;gs.moves++;Snd.ok();Hap.m();toast('✅ +'+gs.grid[b].v);var empty=gs.grid.map(function(c,i){return c.v===0?i:null;}).filter(function(i){return i!==null;});if(empty.length>0)gs.grid[empty[Math.floor(Math.random()*empty.length)]].v=Math.random()<.7?2:4;}else{var tmp=gs.grid[a].v;gs.grid[a].v=gs.grid[b].v;gs.grid[b].v=tmp;gs.moves++;Snd.click();}Nav.go('game');self.render();};window._csh=function(){var vs=gs.grid.map(function(c){return c.v;}).sort(function(){return Math.random()-.5;});gs.grid=vs.map(function(v){return{v:v};});gs.moves+=5;Snd.reveal();Nav.go('game');self.render();};};

var RhythmPulse=new Game({id:'rhythm',title:'Rhythm Pulse',icon:'🎵',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Tap to the beat. Dynamic rhythm patterns.'});
RhythmPulse.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,combo:0,lives:3,phase:'ready',lvl:1,perfect:0,good:0,miss:0};};
RhythmPulse.render=function(){var gs=this.gs,self=this;var lc=[PCBrand.h_ff2d55,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158],li=['❤️','⭐','💎','🔥'];document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.45rem;font-weight:800;color:var(--orange)">'+(gs.combo>0?'x'+gs.combo:'—')+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Combo</div></div><div style="text-align:center"><div style="font-size:1.2rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div id="_rf" style="height:228px;background:'+PCBrand.h_111+';border:1px solid rgba(255,255,255,.06);border-radius:12px;position:relative;overflow:hidden;margin-bottom:9px;display:flex">'+lc.map(function(c,i){return'<div style="flex:1;border-right:1px solid rgba(255,255,255,.04);position:relative;display:flex;align-items:flex-end;justify-content:center;padding-bottom:9px"><div style="width:38px;height:38px;border-radius:50%;border:2px solid '+c+'3e;display:flex;align-items:center;justify-content:center;font-size:.88rem">'+li[i]+'</div></div>';}).join('')+'<div id="_nc" style="position:absolute;inset:0;pointer-events:none"></div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;margin-bottom:9px">'+lc.map(function(c,i){return'<button type="button" style="height:50px;border-radius:11px;background:'+c+'1c;border:2px solid '+c+'52;font-size:1.15rem;cursor:pointer;transition:all .07s" id="_hb'+i+'" ontouchstart="window._rh('+i+',this);event.preventDefault()" onclick="window._rh('+i+',this)">'+li[i]+'</button>';}).join('')+'</div>'+(gs.phase==='ready'?'<button type="button" class="btn bw bf" onclick="window._rst()">▶ Start</button>':gs.phase==='over'?'<div style="text-align:center"><div style="display:flex;justify-content:center;gap:12px;margin-bottom:12px;font-size:.73rem"><span style="color:var(--cyan)">💎 '+gs.perfect+'</span><span style="color:var(--green)">✅ '+gs.good+'</span><span style="color:var(--red)">❌ '+gs.miss+'</span></div><button type="button" class="btn bw" onclick="window._rr()">Play Again</button></div>':'')+'</div>';window._rst=function(){gs.phase='playing';clearInterval(self._rl);var intv=Mutators.speed(Math.max(270,630-gs.lvl*18));self._rl=setInterval(function(){if(gs.phase!=='playing'){clearInterval(self._rl);return;}var nc=document.getElementById('_nc');if(!nc){clearInterval(self._rl);return;}var lane=Math.floor(Math.random()*4);var lw=nc.offsetWidth/4;var note=document.createElement('div');note.setAttribute('data-l',lane);note.style.cssText='position:absolute;width:38px;height:38px;border-radius:50%;background:'+lc[lane]+';box-shadow:0 0 10px '+lc[lane]+';left:'+(lane*lw+lw/2-19)+'px;top:-38px;transition:top '+intv+'ms linear;display:flex;align-items:center;justify-content:center;font-size:.82rem;font-weight:800;color:'+PCBrand.h_000+'';nc.appendChild(note);setTimeout(function(){note.style.top='238px';},7);setTimeout(function(){if(note.parentNode){note.remove();gs.miss++;gs.combo=0;gs.lives--;Snd.err();if(gs.lives<=3-gs.lives<2)Hap.panic();if(gs.lives<=0){clearInterval(self._rl);gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();}}},intv+150);gs.lvl=Math.min(18,1+Math.floor(gs.sc/80));},intv);Nav.go('game');self.render();};window._rh=function(lane,btn){if(gs.phase!=='playing')return;btn.style.transform='scale(0.85)';setTimeout(function(){btn.style.transform='';},80);var nc=document.getElementById('_nc');if(!nc)return;var notes=nc.querySelectorAll('[data-l="'+lane+'"]');var hit=false;notes.forEach(function(n){var ny=parseInt(n.style.top);if(ny>=182&&ny<=246&&!hit){var diff=Math.abs(ny-214);var pts,tp;if(diff<12){pts=20;tp='💎 PERFECT';gs.perfect++;}else{pts=10;tp='✅ GOOD';gs.good++;}gs.combo++;gs.sc+=pts*Math.max(1,Math.floor(gs.combo/5))*Mutators.xpMult();n.remove();hit=true;Snd.reflex(lane*44);Hap.l();toast(tp+' +'+pts);if(gs.combo>=10)Daily.completeForGame('rhythm');}});if(!hit){gs.combo=0;Snd.err();}};window._rr=function(){clearInterval(self._rl);gs.sc=0;gs.combo=0;gs.lives=3;gs.phase='ready';gs.perfect=0;gs.good=0;gs.miss=0;gs.lvl=1;Nav.go('game');self.render();};};

var InfiniteMaze=new Game({id:'maze',title:'Infinite Maze',icon:'🌀',type:'survival',cat:'solo',col:PCBrand.h_00d4ff,mp:false,min:1,max:1,desc:'Endlessly generated mazes. Hidden dangers.'});
InfiniteMaze.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var sz=7;this.gs={lvl:1,sc:0,lives:3,phase:'play',maze:this._gen(sz),pos:0,exit:sz*sz-1,sz:sz,mazeCount:0};};
InfiniteMaze._gen=function(sz){var cells=Array.from({length:sz*sz},function(){return{wall:Math.random()<.22,trap:Math.random()<.08,bonus:Math.random()<.05};});cells[0].wall=false;cells[sz*sz-1].wall=false;var p=0;while(p<sz*sz-1){cells[p].wall=false;var r=p+1,d=p+sz;if(Math.random()<.5&&r<sz*sz&&Math.floor(r/sz)===Math.floor(p/sz))p=r;else if(d<sz*sz)p=d;else p++;}return cells;};
InfiniteMaze.render=function(){var gs=this.gs,self=this;var sz=gs.sz;if(gs.phase==='over'){document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:2.7rem;margin-bottom:5px">🌀</div><div style="font-size:1.75rem;font-weight:800;color:var(--cyan)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Level '+gs.lvl+'</div>'+(gs.mazeCount>=3?'<div style="color:var(--amber);font-size:.8rem;margin-bottom:10px">🎯 Daily Challenge met!</div>':'')+'<button type="button" class="btn bw" onclick="GL.launch(\'maze\')">Play Again</button></div>';return;}var h=Math.floor(236/sz);document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:9px"><div style="text-align:center"><div style="font-size:1.25rem;font-weight:800;color:var(--cyan)">'+gs.lvl+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Level</div></div><div style="text-align:center"><div style="font-size:1.25rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.15rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div style="display:grid;grid-template-columns:repeat('+sz+',1fr);gap:2px;margin-bottom:12px;padding:5px;background:rgba(0,212,255,.04);border-radius:12px;border:1px solid rgba(0,212,255,.11)">'+gs.maze.map(function(cell,i){var ip=i===gs.pos,ie=i===gs.exit;var bg=cell.wall?'rgba(255,255,255,.12)':ip?'rgba(0,212,255,.34)':ie?'rgba(48,209,88,.34)':'rgba(255,255,255,.02)';return'<div style="height:'+h+'px;border-radius:2px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size: 0.75rem">'+(ip?'🔵':ie?'🟢':cell.trap?'':'')+'</div>';}).join('')+'</div><div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;max-width:172px;margin:0 auto"><div></div><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'u\')" aria-label="Move up">↑</button><div></div><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'l\')" aria-label="Move left">←</button><button type="button" class="btn bg" style="padding:11px;background:rgba(0,212,255,.07)" onclick="window._mv(\'d\')" aria-label="Move down">↓</button><button type="button" class="btn bg" style="padding:11px" onclick="window._mv(\'r\')" aria-label="Move right">→</button></div></div>';window._mv=function(dir){var pos=gs.pos,r=Math.floor(pos/sz),c=pos%sz,np=pos;if(dir==='u'&&r>0)np=pos-sz;else if(dir==='d'&&r<sz-1)np=pos+sz;else if(dir==='l'&&c>0)np=pos-1;else if(dir==='r'&&c<sz-1)np=pos+1;if(np===pos||gs.maze[np].wall){Snd.err();return;}gs.pos=np;gs.sc++;Snd.click();Hap.l();if(gs.maze[np].trap){if(Mutators.hasSudden())gs.lives=0;else gs.lives--;gs.maze[np].trap=false;toast('💀 Trap! -1 Life');Snd.danger();Hap.err();}if(gs.maze[np].bonus){gs.sc+=10;gs.maze[np].bonus=false;toast('⭐ +10 pts');Snd.ok();}if(np===gs.exit){gs.mazeCount++;gs.lvl++;gs.sc+=gs.lvl*20;gs.sz=Math.min(11,7+Math.floor(gs.lvl/3));gs.maze=self._gen(gs.sz);gs.pos=0;gs.exit=gs.sz*gs.sz-1;toast('🎉 Level '+gs.lvl+'!');Snd.ok();Hap.ok();if(gs.mazeCount>=3)Daily.completeForGame('maze');}if(gs.lives<=0){gs.phase='over';XP.add(gs.sc,Mutators.xpMult());self.done(null);}Nav.go('game');self.render();};};
// ═══ 4 NEW GAMES ════════════════════════════════════════════════════

// 21. IMPOSTER FREQUENCY (MP)
var ImposterFreq=new Game({id:'impfreq',title:'Imposter Frequency',icon:'📻',type:'deduction',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:3,max:10,desc:'Everyone gets the same topic — except the imposters.'});
ImposterFreq.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);var topics=[{real:'Things on a beach',fake:'Things at a pool'},{real:'Parts of a car',fake:'Parts of a truck'},{real:'Things in a kitchen',fake:'Things in a restaurant'},{real:'Olympic sports',fake:'Sports in general'},{real:'Things at a wedding',fake:'Things at a birthday party'},{real:'Actions in a spy movie',fake:'Actions in an action movie'},{real:'Things you carry in a bag',fake:'Things in a backpack'},{real:'Words describing weather',fake:'Words describing temperature'},{real:'Things on a smartphone',fake:'Things on a computer'},{real:'Ingredients in pizza',fake:'Ingredients in a sandwich'}];var topic=topics[Math.floor(Math.random()*topics.length)];var sc=Math.max(1,Math.floor(pl.length*.2));var imposterIdxs=this.shuf([...pl.keys()]).slice(0,sc);var imposterIds=imposterIdxs.map(function(i){return pl[i].id;});this.gs={phase:'reveal',topic:topic,imposterIds:imposterIds,ridx:0,sus:{},votes:{},pidx:0,sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),round:1,chatLog:[]};};
ImposterFreq.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='discuss')this._discuss();else this._vote();};
ImposterFreq._reveal=function(){var gs=this.gs,self=this;var p=this.players[gs.ridx];if(!p){gs.phase='discuss';Nav.go('game');this._discuss();return;}var isImp=gs.imposterIds.includes(p.id);Hap.roleReveal(isImp);var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isImp?'👾':'📻')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isImp?'var(--violet)':'var(--cyan)')+';margin-bottom:9px">'+(isImp?'YOU ARE THE IMPOSTER':'Your Topic')+'</div><div style="padding:14px;background:'+(isImp?'rgba(191,90,242,.12)':'rgba(0,212,255,.12)')+';border:1px solid '+(isImp?'rgba(191,90,242,.28)':'rgba(0,212,255,.28)')+';border-radius:14px;margin-bottom:9px"><div style="font-weight:800;font-size:1rem">'+(isImp?gs.topic.fake:gs.topic.real)+'</div></div><div style="opacity:.38;font-size:.8rem">'+(isImp?'Your topic is SLIGHTLY different. Blend in.':'Discuss naturally. Find who doesn\'t fit.')+'</div></div>';document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._ifp()">Pass to '+p.av+' '+p.name+'</button></div>';window._ifp=function(){PP.show(p.name,p.av,'Your role',sec,function(){gs.ridx++;Nav.go('game');self.render();});};};
ImposterFreq._discuss=function(){var gs=this.gs,self=this;Drama.tick('vote');Director.next();var timer=Mutators.speed(120);if(!gs.discStart)gs.discStart=Date.now();document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div id="_ift" style="font-size:2.5rem;font-weight:800;color:var(--violet)">'+timer+'</div><div style="opacity:.38;margin-top:3px;font-size:.8rem">Discuss freely. Be natural.</div></div><div style="padding:13px;background:rgba(191,90,242,.07);border:1px solid rgba(191,90,242,.15);border-radius:13px;margin-bottom:14px"><div style="opacity:.38;font-size: 0.75rem;text-transform:uppercase;margin-bottom:4px">Everyone knows their topic</div><div style="font-size:.97rem;font-weight:700">Talk about it — but the imposter\'s topic is slightly different!</div></div><div style="margin-bottom:12px"><div style="font-size: 0.75rem;opacity:.38;margin-bottom:8px;text-transform:uppercase;letter-spacing:.1em">Discussion tips</div>'+['Ask "What\'s your favourite part?"','Say one specific fact','React to what others say','Watch for hesitation'].map(function(t){return'<div style="padding:7px 10px;background:rgba(255,255,255,.04);border-radius:8px;margin-bottom:4px;font-size:.78rem">→ '+t+'</div>';}).join('')+'</div><button type="button" class="btn ba" style="--acc:var(--violet);--glow:rgba(191,90,242,.28)" onclick="clearInterval(self._ifi);gs.phase=\'vote\';Nav.go(\'game\');self._vote()">🗳️ Start Voting</button></div>';var tl=timer;this._ifi=setInterval(function(){tl--;var el=document.getElementById('_ift');if(el){el.textContent=tl;el.style.color=tl<=20?'var(--red)':'var(--violet)';}if(tl<=10)Hap.m();if(tl<=0){clearInterval(self._ifi);gs.phase='vote';Nav.go('game');self._vote();}},1000);};
ImposterFreq._vote=function(){var gs=this.gs,self=this;Drama.tick('vote');document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div style="font-size:.97rem;font-weight:700">Vote for the Imposter</div><div style="opacity:.38;font-size:.78rem;margin-top:3px">Who seemed to be talking about something different?</div></div>'+this.players.map(function(p){return'<div class="vopt" onclick="window._ifv(this,\''+p.id+'\')"><div style="width:32px;height:32px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:1.1rem">'+p.av+'</div><div style="font-weight:700">'+p.name+'</div></div>';}).join('')+'<button type="button" class="btn br bf" style="margin-top:12px;display:none" id="_ifvb" onclick="window._ifrvl()">Reveal!</button></div>';var voted=null;window._ifv=function(el,pid){document.querySelectorAll('.vopt').forEach(function(v){v.classList.remove('sel');});el.classList.add('sel');voted=pid;document.getElementById('_ifvb').style.display='block';Snd.vote();};window._ifrvl=function(){if(!voted)return;var isImp=gs.imposterIds.includes(voted);var accused=self.players.find(function(p){return p.id===voted;});var imposters=gs.imposterIds.map(function(id){return self.players.find(function(p){return p.id===id;});});document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(isImp?'✅':'❌')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(isImp?'IMPOSTER FOUND!':'WRONG!')+'</div><div style="font-size:2.7rem;margin:9px 0">'+accused.av+'</div><div style="font-size:1rem;font-weight:700">'+accused.name+'</div><div style="opacity:.38;margin-bottom:12px">'+(isImp?'was the imposter':'was innocent')+'</div><div class="glass" style="padding:13px;margin-bottom:14px"><div style="opacity:.38;font-size: 0.75rem;text-transform:uppercase;margin-bottom:5px">The real topics</div><div style="font-size:.9rem"><span style="color:var(--cyan)">Real: '+gs.topic.real+'</span><br><span style="color:var(--violet);margin-top:4px;display:block">Fake: '+gs.topic.fake+'</span></div></div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--violet);--glow:rgba(191,90,242,.28)" onclick="GL.launch(\'impfreq\')">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';self.done(isImp?'Resistance':imposters[0].name);isImp?(Snd.ok(),Hap.ok()):(Snd.betray(),Hap.err());Drama.tick(isImp?'win':'betray');};};

// 22. TRUST FALL (MP) — prisoner's dilemma
var TrustFall=new Game({id:'trust',title:'Trust Fall',icon:'🤝',type:'strategy',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:2,max:8,desc:'Cooperate or defect? Prisoner\'s dilemma at scale.'});
TrustFall.setup=function(pl){Game.prototype.setup.call(this,pl);Drama.reset(pl);this.gs={round:1,maxR:6,sc:pl.reduce(function(o,p){o[p.id]=10;return o;},{}),choices:{},pidx:0,history:[],phase:'choose'};};
TrustFall.render=function(){var gs=this.gs,self=this;if(gs.round>gs.maxR){var sc=this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});this.done(sc[0].n);this.showWin(sc[0].n,sc);return;}if(gs.phase==='choose')this._choose();else this._reveal();};
TrustFall._choose=function(){var gs=this.gs,self=this;var player=this.players[gs.pidx%this.players.length];if(gs.pidx>=this.players.length){gs.phase='reveal';Nav.go('game');this._reveal();return;}Drama.tick('vote');var insight=Memory.getInsight(player.name);var sec='<div style="text-align:center"><div style="font-size:2rem;margin-bottom:12px">🤝</div><div style="font-weight:700;font-size:1rem;margin-bottom:4px">Round '+gs.round+'/'+gs.maxR+'</div><div style="opacity:.38;font-size:.78rem;margin-bottom:16px">Your choice is secret until all players decide</div>'+(insight?'<div style="padding:8px 12px;background:rgba(255,255,255,.05);border-radius:10px;font-size:0.75rem;opacity:.55;margin-bottom:14px;font-style:italic">💬 '+insight+'</div>':'')+'\x3cdiv style="display:flex;gap:10px">\x3cbutton class="btn" style="flex:1;background:rgba(48,209,88,.15);border:1px solid var(--green);padding:18px;font-size:.9rem;flex-direction:column;gap:4px" onclick="window._tf(\'coop\')">\x3cdiv style="font-size:1.5rem">🤝\x3c/div>\x3cdiv style="font-weight:700">COOPERATE\x3c/div>\x3cdiv style="font-size: 0.75rem;opacity:.55">Both gain if mutual\x3c/div>\x3c/button>\x3cbutton class="btn" style="flex:1;background:rgba(255,45,85,.15);border:1px solid var(--red);padding:18px;font-size:.9rem;flex-direction:column;gap:4px" onclick="window._tf(\'def\')">\x3cdiv style="font-size:1.5rem">🗡️\x3c/div>\x3cdiv style="font-weight:700">DEFECT\x3c/div>\x3cdiv style="font-size: 0.75rem;opacity:.55">Steal from cooperators\x3c/div>\x3c/button>\x3c/div>\x3c/div>';PP.show(player.name,player.av,'Round '+gs.round,sec,function(){Nav.go('game');self.render();});window._tf=function(choice){gs.choices[player.id]=choice;gs.pidx++;PP.done();Nav.go('game');self.render();};};
TrustFall._reveal=function(){var gs=this.gs,self=this;var coops=Object.entries(gs.choices).filter(function(e){return e[1]==='coop';}).map(function(e){return e[0];});var defs=Object.entries(gs.choices).filter(function(e){return e[1]==='def';}).map(function(e){return e[0];});var pts={};this.players.forEach(function(p){pts[p.id]=0;if(coops.includes(p.id)&&defs.length===0){pts[p.id]+=3;}else if(coops.includes(p.id)&&defs.length>0){pts[p.id]-=defs.length;}else if(defs.includes(p.id)){pts[p.id]+=coops.length*2;}gs.sc[p.id]=Math.max(0,(gs.sc[p.id]||10)+pts[p.id]);if(defs.includes(p.id)&&coops.length>0){Drama.tick('betray');Memory.recordBetrayal(p.name,'Group');S.prof.betrayals++;Ach.check();}});gs.history.push({round:gs.round,coops:coops.length,defs:defs.length});document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="text-align:center;margin-bottom:14px"><div style="font-size:1rem;font-weight:700">Round '+gs.round+' Results</div></div><div style="display:flex;gap:9px;justify-content:center;margin-bottom:16px"><div style="text-align:center;padding:14px 20px;background:rgba(48,209,88,.1);border:1px solid rgba(48,209,88,.25);border-radius:13px"><div style="font-size:2rem">🤝</div><div style="font-size:1.25rem;font-weight:800;color:var(--green)">'+coops.length+'</div><div style="font-size:0.75rem;opacity:.45">Cooperated</div></div><div style="text-align:center;padding:14px 20px;background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.25);border-radius:13px"><div style="font-size:2rem">🗡️</div><div style="font-size:1.25rem;font-weight:800;color:var(--red)">'+defs.length+'</div><div style="font-size:0.75rem;opacity:.45">Defected</div></div></div>'+this.players.map(function(p){var choice=gs.choices[p.id];var chg=pts[p.id];return'<div style="display:flex;align-items:center;gap:9px;padding:9px;border-bottom:1px solid rgba(255,255,255,.05)"><div>'+p.av+'</div><div style="font-size:1.2rem">'+(choice==='coop'?'🤝':'🗡️')+'</div><div style="flex:1;font-weight:700">'+p.name+'</div><div style="font-weight:800;color:'+(chg>0?'var(--green)':chg<0?'var(--red)':'var(--dim)')+'">'+(chg>0?'+':'')+chg+'</div><div style="opacity:.45;font-size:.8rem">= '+(gs.sc[p.id]||0)+'</div></div>';}).join('')+'<button type="button" class="btn bw bf" style="margin-top:14px" onclick="window._tfnx()">'+(gs.round>=gs.maxR?'Final Results':'Next Round →')+'</button></div>';Snd.reveal();Hap.h();window._tfnx=function(){if(gs.round>=gs.maxR){var sc=self.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});self.done(sc[0].n);self.showWin(sc[0].n,sc);return;}gs.round++;gs.choices={};gs.pidx=0;gs.phase='choose';Director.next();Nav.go('game');self.render();};};

// 23. REFLEX LADDER (Solo — ghost replay)
var ReflexLadder=new Game({id:'rxlad',title:'Reflex Ladder',icon:'🪜',type:'reflex',cat:'solo',col:PCBrand.h_ff375f,mp:false,min:1,max:1,desc:'Climb endless reflex tiers. Ghost of your best run.'});
ReflexLadder.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));var best=JSON.parse(localStorage.getItem('po5_rxlad')||'null');this.gs={tier:1,lives:5,sc:0,phase:'ready',history:[],ghost:best,targetMs:600,streak:0};};
ReflexLadder.render=function(){var gs=this.gs,self=this;if(gs.phase==='over'){var prev=JSON.parse(localStorage.getItem('po5_rxlad')||'null');var isNewBest=!prev||gs.sc>prev.sc;if(isNewBest)localStorage.setItem('po5_rxlad',JSON.stringify({sc:gs.sc,tier:gs.tier,hist:gs.history.slice(-20)}));document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">🪜</div><div style="font-size:1.75rem;font-weight:800;color:var(--pink)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:5px">Tier '+gs.tier+'</div>'+(isNewBest?'<div style="color:var(--amber);font-size:.9rem;margin-bottom:12px">⭐ NEW BEST!</div>':'')+'<button type="button" class="btn bw" onclick="GL.launch(\'rxlad\')">Play Again</button></div>';XP.add(gs.sc,Mutators.xpMult());self.done(null);return;}var tierTarget=Math.max(100,600-gs.tier*30);gs.targetMs=tierTarget;document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--pink)">'+gs.tier+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Tier</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.65rem;font-weight:800;color:var(--cyan)">'+tierTarget+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Target ms</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div>'+(gs.ghost?'<div style="padding:8px 12px;background:rgba(255,55,95,.08);border:1px solid rgba(255,55,95,.18);border-radius:10px;margin-bottom:12px;font-size:0.75rem;display:flex;justify-content:space-between"><span style="opacity:.55">👻 Ghost Best</span><span style="color:var(--pink);font-weight:700">'+gs.ghost.sc+' pts</span></div>':'')+'<div id="rxarena" style="height:265px;border-radius:16px;background:rgba(255,55,95,.04);border:1px solid rgba(255,55,95,.11);position:relative;overflow:hidden;margin-bottom:12px"><div id="rxov" style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:9px">'+(gs.phase==='ready'?'<div style="opacity:.38;font-size:.84rem">React faster than '+tierTarget+'ms</div><button type="button" class="btn bw" onclick="window._rxls()">▶ START</button>':'')+'</div><div id="rxtc" style="position:absolute;inset:0"></div></div><div style="display:flex;gap:3px;flex-wrap:wrap">'+gs.history.slice(-10).map(function(t){return'<div style="padding:2px 7px;border-radius:5px;font-size: 0.75rem;font-weight:700;background:'+(t<=tierTarget?'rgba(48,209,88,.17)':'rgba(255,45,85,.17)')+';color:'+(t<=tierTarget?'var(--green)':'var(--red)')+'">'+t+'</div>';}).join('')+'</div></div>';window._rxls=function(){gs.phase='playing';document.getElementById('rxov').innerHTML='';self._lspawn();};};
ReflexLadder._lspawn=function(){var gs=this.gs,self=this;var arena=document.getElementById('rxtc');if(!arena)return;var sz=62;var ax=arena.clientWidth,ay=arena.clientHeight;var x=Math.random()*(ax-sz),y=Math.random()*(ay-sz);arena.innerHTML='';var t=document.createElement('div');t.className='rtgt';t.style.cssText='left:'+x+'px;top:'+y+'px;width:'+sz+'px;height:'+sz+'px;background:rgba(255,55,95,.2);border:3px solid #FF375F;box-shadow:0 0 22px #FF375F55;font-size:1.4rem;color:'+PCBrand.h_ff375f+';cursor:pointer';t.textContent='◉';var t0=Date.now(),hit=false;t.addEventListener('touchstart',function(e){e.preventDefault();if(hit)return;hit=true;var rt=Date.now()-t0;gs.history.push(rt);clearTimeout(self._rt2);var beat=rt<=gs.targetMs;if(beat){gs.sc+=Math.max(10,Math.floor(gs.targetMs/rt*10));gs.streak++;if(gs.streak>=3){gs.tier++;gs.streak=0;toast('🔥 Tier '+gs.tier+'! Target: '+Math.max(100,600-gs.tier*30)+'ms');Snd.lvlup();}else{toast('✅ '+rt+'ms'+(rt<200?' ⚡':''));Snd.ok();}Hap.l();}else{gs.lives--;gs.streak=0;toast('❌ '+rt+'ms (need <'+gs.targetMs+'ms)');Snd.err();Hap.err();}if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{setTimeout(function(){self._lspawn();},250);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._lspawn();}},{passive:false});arena.appendChild(t);self._rt2=setTimeout(function(){if(hit)return;arena.innerHTML='';gs.lives--;gs.streak=0;Snd.err();Hap.err();toast('Timeout! -1 Life');if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{setTimeout(function(){self._lspawn();},440);Nav.go('game');self.render();var ov=document.getElementById('rxov');if(ov)ov.innerHTML='';self._lspawn();}},gs.targetMs+400);};

// 24. NEON SNAKE (Solo)
var NeonSnake=new Game({id:'snake',title:'Neon Snake',icon:'🐍',type:'reflex',cat:'solo',col:PCBrand.h_30d158,mp:false,min:1,max:1,desc:'Classic snake. Neon aesthetic. Personal best.'});
NeonSnake.setup=function(pl){
  Game.prototype.setup.call(this,pl.slice(0,1));
  var best=parseInt(localStorage.getItem('po5_snake')||'0');
  this.gs={phase:'ready',sc:0,best:best,snake:[{x:10,y:10},{x:9,y:10},{x:8,y:10}],dir:{x:1,y:0},ndir:{x:1,y:0},food:{x:15,y:10},sz:20,speed:Mutators.speed(180),dead:false};
};
NeonSnake.render=function(){
  var gs=this.gs,self=this;
  var cw=Math.min(window.innerWidth-32,360);
  var cs=Math.floor(cw/gs.sz);
  var w=cs*gs.sz,h=cs*gs.sz;
  document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:10px"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--green)">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--amber)">'+gs.best+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Best</div></div></div><canvas id="snakecan" width="'+w+'" height="'+h+'" style="display:block;margin:0 auto;border-radius:12px;border:1px solid rgba(48,209,88,.18);background:'+PCBrand.h_0a0a0a+';touch-action:none"></canvas>'+(gs.phase==='ready'?'<div style="text-align:center;margin-top:13px"><button type="button" class="btn bw" onclick="window._snkstart()">▶ Start</button></div>':gs.phase==='over'?'<div style="text-align:center;margin-top:11px"><div style="opacity:.38;margin-bottom:9px">'+(gs.sc>=gs.best&&gs.sc>0?'🎉 NEW BEST!':'Score: '+gs.sc)+'</div><button type="button" class="btn bw" onclick="GL.launch(\'snake\')">Play Again</button></div>':'<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:5px;max-width:155px;margin:11px auto 0"><div></div><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:0,y:-1};event.preventDefault()" aria-label="Move up">↑</button><div></div><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:-1,y:0};event.preventDefault()" aria-label="Move left">←</button><button type="button" class="btn bg" style="padding:10px;font-size:.9rem;background:rgba(48,209,88,.08)" ontouchstart="gs.ndir={x:0,y:1};event.preventDefault()" aria-label="Move down">↓</button><button type="button" class="btn bg" style="padding:10px;font-size:.9rem" ontouchstart="gs.ndir={x:1,y:0};event.preventDefault()" aria-label="Move right">→</button></div>')+'</div>';
  this._draw();
  if(gs.phase==='ready'||gs.phase==='over'){return;}
  var can=document.getElementById('snakecan');
  if(!can)return;
  var ts={x:0,y:0};
  can.addEventListener('touchstart',function(e){e.preventDefault();ts.x=e.touches[0].clientX;ts.y=e.touches[0].clientY;},{passive:false,once:false});
  can.addEventListener('touchend',function(e){
    e.preventDefault();
    var dx=e.changedTouches[0].clientX-ts.x,dy=e.changedTouches[0].clientY-ts.y;
    if(Math.abs(dx)>Math.abs(dy)){if(dx>15&&gs.dir.x!==-1)gs.ndir={x:1,y:0};else if(dx<-15&&gs.dir.x!==1)gs.ndir={x:-1,y:0};}
    else{if(dy>15&&gs.dir.y!==-1)gs.ndir={x:0,y:1};else if(dy<-15&&gs.dir.y!==1)gs.ndir={x:0,y:-1};}
  },{passive:false});
  window._snkstart=function(){
    gs.phase='playing';gs.snake=[{x:10,y:10},{x:9,y:10},{x:8,y:10}];
    gs.dir={x:1,y:0};gs.ndir={x:1,y:0};gs.sc=0;
    self._loop();Nav.go('game');self.render();
  };
};
NeonSnake._draw=function(){
  var gs=this.gs;
  var can=document.getElementById('snakecan');if(!can)return;
  var ctx=can.getContext('2d'),W=can.width,H=can.height,sz=gs.sz,cs=Math.floor(W/sz);
  ctx.fillStyle=PCBrand.h_0a0a0a;ctx.fillRect(0,0,W,H);
  ctx.fillStyle='rgba(255,255,255,.03)';
  for(var i=0;i<sz;i++)for(var j=0;j<sz;j++){ctx.fillRect(i*cs+cs/2-1,j*cs+cs/2-1,2,2);}
  gs.snake.forEach(function(seg,i){
    var isH=i===0;
    ctx.fillStyle=isH?PCBrand.h_30d158:'rgba(48,209,88,'+(Math.max(0.1,0.85-i*0.04))+')';
    ctx.shadowColor=PCBrand.h_30d158;ctx.shadowBlur=isH?10:0;
    ctx.fillRect(seg.x*cs+1,seg.y*cs+1,cs-2,cs-2);
    ctx.shadowBlur=0;
  });
  ctx.fillStyle=PCBrand.h_ff2d55;ctx.shadowColor=PCBrand.h_ff2d55;ctx.shadowBlur=14;
  ctx.beginPath();ctx.arc(gs.food.x*cs+cs/2,gs.food.y*cs+cs/2,cs/2-2,0,Math.PI*2);ctx.fill();
  ctx.shadowBlur=0;
};
NeonSnake._loop=function(){
  var gs=this.gs,self=this;
  clearInterval(this._snki);
  this._snki=setInterval(function(){
    if(gs.phase!=='playing'){clearInterval(self._snki);return;}
    if(!(gs.ndir.x===-gs.dir.x&&gs.ndir.y===-gs.dir.y))gs.dir=gs.ndir;
    var head={x:(gs.snake[0].x+gs.dir.x+gs.sz)%gs.sz,y:(gs.snake[0].y+gs.dir.y+gs.sz)%gs.sz};
    if(gs.snake.some(function(s){return s.x===head.x&&s.y===head.y;})){
      clearInterval(self._snki);
      if(gs.sc>gs.best){gs.best=gs.sc;localStorage.setItem('po5_snake',String(gs.best));}
      gs.phase='over';Snd.err();Hap.err();XP.add(gs.sc,Mutators.xpMult());self.done(null);Nav.go('game');self.render();return;
    }
    gs.snake.unshift(head);
    if(head.x===gs.food.x&&head.y===gs.food.y){
      gs.sc++;Snd.reflex(50);Hap.l();
      do{gs.food={x:Math.floor(Math.random()*gs.sz),y:Math.floor(Math.random()*gs.sz)};}
      while(gs.snake.some(function(s){return s.x===gs.food.x&&s.y===gs.food.y;}));
      if(gs.sc%5===0)gs.speed=Mutators.speed(Math.max(80,180-gs.sc*6));
    }else{gs.snake.pop();}
    self._draw();
  },gs.speed);
};



// ═══ BONUS GAMES 25-26 ════════════════════════════════════════════════

// 25. THE HEIST (MP co-op with mole)
var TheHeist=new Game({id:'heist',title:'The Heist',icon:'🏦',type:'strategy',cat:'multiplayer',col:PCBrand.h_ffd60a,mp:true,min:3,max:8,desc:'Co-op vault crack. But one player is the mole.'});
TheHeist.setup=function(pl){
  Game.prototype.setup.call(this,pl);Drama.reset(pl);Director.init(pl.length);
  var moleIdx=Math.floor(Math.random()*pl.length);
  var roles_h=['Hacker','Safecracker','Lookout','Driver','Explosives','Muscle'];
  this.gs={phase:'reveal',moleId:pl[moleIdx].id,ridx:0,round:0,maxR:5,
    players:pl.map(function(x,i){return Object.assign({},x,{role:roles_h[i%roles_h.length],heat:0});}),
    vault:{locks:4,cracked:0},alarms:0,acts:{}};
};
TheHeist.render=function(){var gs=this.gs;if(gs.phase==='reveal')this._reveal();else if(gs.phase==='plan')this._plan();else this._result();};
TheHeist._reveal=function(){var gs=this.gs,self=this;var p=gs.players[gs.ridx];
  if(!p){gs.phase='plan';Nav.go('game');this._plan();return;}
  var isMole=p.id===gs.moleId;Hap.roleReveal(isMole);
  var sec='<div style="text-align:center"><div style="font-size:2.7rem;margin-bottom:9px">'+(isMole?'🐀':'🦸')+'</div><div style="font-size:1.3rem;font-weight:800;color:'+(isMole?'var(--red)':'var(--amber)')+';margin-bottom:9px">'+(isMole?'YOU ARE THE MOLE':'Your Role: '+p.role)+'</div><div style="padding:11px;background:'+(isMole?'rgba(255,45,85,.1)':'rgba(255,214,10,.1)')+';border:1px solid '+(isMole?'rgba(255,45,85,.25)':'rgba(255,214,10,.25)')+';border-radius:12px"><div style="font-size:.84rem;font-weight:600">'+(isMole?'Slow down the heist without getting caught.':'Crack '+gs.vault.locks+' locks. Work together.')+'</div></div></div>';
  document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:14px"><button type="button" class="btn bg bf" style="max-width:250px;margin:0 auto" onclick="window._hrv()">Pass to '+p.av+' '+p.name+'</button></div>';
  window._hrv=function(){PP.show(p.name,p.av,'Your role',sec,function(){gs.ridx++;Nav.go('game');self.render();});};
};
TheHeist._plan=function(){var gs=this.gs,self=this;Drama.tick('vote');Director.next();
  var player=gs.players[gs.round%gs.players.length];
  var isMole=player.id===gs.moleId;
  var sec='<div><div style="font-size:.88rem;font-weight:700;text-align:center;margin-bottom:11px">Round '+(gs.round+1)+'/'+gs.maxR+' — '+player.role+'</div><div style="display:flex;gap:8px;margin-bottom:9px"><div style="flex:1;text-align:center;padding:10px;background:rgba(48,209,88,.1);border-radius:11px"><div style="font-size:1.1rem">🔓</div><div style="font-size:.75rem;font-weight:700;color:var(--green)">'+gs.vault.cracked+'/'+gs.vault.locks+'</div><div style="font-size: 0.75rem;opacity:.4">Cracked</div></div><div style="flex:1;text-align:center;padding:10px;background:rgba(255,45,85,.1);border-radius:11px"><div style="font-size:1.1rem">🚨</div><div style="font-size:.75rem;font-weight:700;color:var(--red)">'+gs.alarms+'</div><div style="font-size: 0.75rem;opacity:.4">Alarms</div></div></div><div style="display:flex;flex-direction:column;gap:7px"><button type="button" class="btn bg bf" onclick="window._ha(0)">🔧 Crack a lock (+1 cracked)</button><button type="button" class="btn bg bf" onclick="window._ha(1)">👁 Watch for guards</button><button type="button" class="btn bg bf" onclick="window._ha(2)">💻 Hack cameras (+2 cracked)</button>'+(isMole?'<button type="button" class="btn" style="background:rgba(255,45,85,.16);border:1px solid rgba(255,45,85,.28)" onclick="window._ha(3)">🚨 Trip the alarm</button>':'')+'</div></div>';
  PP.show(player.name,player.av,'Your action',sec,function(){Nav.go('game');self.render();});
  window._ha=function(action){
    if(action===0){gs.vault.cracked++;toast('🔧 Lock cracked!');}
    else if(action===1){gs.alarms=Math.max(0,gs.alarms-1);toast('👁 Area secured.');}
    else if(action===2){gs.vault.cracked+=2;gs.alarms++;toast('💻 Hacked! +2 locks');}
    else if(action===3){gs.alarms+=2;Memory.recordBetrayal(player.name,'Crew');Drama.tick('betray');toast('🚨 ALARM TRIGGERED!');Hap.betray();}
    gs.round++;
    if(gs.alarms>=4){PP.done();gs.phase='caught';Nav.go('game');self._gameover(false);}
    else if(gs.vault.cracked>=gs.vault.locks){PP.done();Nav.go('game');self._gameover(true);}
    else{PP.done();Nav.go('game');self._plan();}
  };
};
TheHeist._gameover=function(success){
  var gs=this.gs,self=this;
  var mole=gs.players.find(function(p){return p.id===gs.moleId;});
  var div=document.getElementById('gbody');
  div.innerHTML='<div style="text-align:center;padding:14px"><div style="font-size:3.4rem;margin-bottom:5px">'+(success?'\U0001f4b0':'\U0001f6a8')+'</div><div style="font-size:1.45rem;font-weight:800;margin-bottom:5px">'+(success?'VAULT CRACKED!':'CAUGHT!')+'</div><div style="opacity:.38;margin-bottom:14px">'+(success?'The crew pulled it off!':'Too many alarms.')+'</div><div style="padding:12px;background:rgba(255,45,85,.1);border:1px solid rgba(255,45,85,.2);border-radius:12px;margin-bottom:15px"><div style="opacity:.38;font-size: 0.75rem;text-transform:uppercase;margin-bottom:4px">The Mole Was...</div><div style="font-size:1.1rem;font-weight:800">'+mole.av+' '+mole.name+'</div></div><div style="display:flex;gap:7px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--amber);--glow:rgba(255,214,10,.28)" id="_hag">Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div></div>';
  document.getElementById('_hag').onclick=function(){GL.launch('heist');};
  self.done(success?'Crew':'Mole');Snd.ok();Hap.ok();
};
// 26. PRESSURE COOKER (Solo - escalating stress game)
var PressureCooker=new Game({id:'pressure',title:'Pressure Cooker',icon:'💢',type:'reflex',cat:'solo',col:PCBrand.h_ff2d55,mp:false,min:1,max:1,desc:'Tap the right button before pressure explodes.'});
PressureCooker.setup=function(pl){Game.prototype.setup.call(this,pl.slice(0,1));this.gs={sc:0,lives:3,lvl:1,phase:'ready',pressure:0,maxP:100,round:0};};
PressureCooker.render=function(){var gs=this.gs,self=this;
  if(gs.phase==='over'){
    document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:5px">💢</div><div style="font-size:1.75rem;font-weight:800;color:var(--red)">'+gs.sc+'</div><div style="opacity:.38;margin-bottom:20px">Level '+gs.lvl+'</div><button type="button" class="btn bw" id="_pcbtn">Try Again</button></div>';
    var b2=document.getElementById('_pcbtn');if(b2)b2.onclick=function(){GL.launch('pressure');};
    XP.add(gs.sc,Mutators.xpMult());self.done(null);return;
  }
  if(gs.phase==='ready'){
    document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:30px 0"><div style="font-size:3.4rem;margin-bottom:14px">💢</div><div style="font-size:1.25rem;font-weight:800;margin-bottom:7px">Pressure Cooker</div><div style="opacity:.38;margin-bottom:26px">Tap the highlighted button before pressure hits 100!</div><button type="button" class="btn bw blg bf" onclick="window._pcstart()">▶ Start</button></div>';
    window._pcstart=function(){gs.phase='playing';Nav.go('game');self._loop();};
    return;
  }
  var pct=gs.pressure;
  var col=pct<50?'var(--green)':pct<80?'var(--amber)':'var(--red)';
  var btns=['🔴','🟡','🟢','🔵'];var target=Math.floor(Math.random()*4);gs._target=target;
  document.getElementById('gbody').innerHTML='<div style="padding:5px 0"><div style="display:flex;justify-content:space-between;margin-bottom:14px"><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--red)">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div><div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:'+col+'">'+Math.round(pct)+'%</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Pressure</div></div><div style="text-align:center"><div style="font-size:1.25rem">'+'❤️'.repeat(gs.lives)+'</div></div></div><div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden;margin-bottom:20px"><div id="_pcbar" style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,'+(pct<50?'var(--green),var(--green)':pct<80?'var(--amber),var(--orange)':'var(--red),'+PCBrand.h_ff0000+'')+');border-radius:4px;transition:width .1s"></div></div><div style="text-align:center;margin-bottom:18px;font-size:.84rem;opacity:.48">Tap: <span style="font-size:1.8rem">'+btns[target]+'</span></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:11px">'+btns.map(function(b,i){return'<button type="button" style="height:80px;border-radius:16px;font-size:2.2rem;background:'+(i===target?'rgba(255,255,255,.12)':'rgba(255,255,255,.04)')+';border:2px solid '+(i===target?'rgba(255,255,255,.4)':'rgba(255,255,255,.08)')+';transition:all .1s;cursor:pointer" onclick="window._pct('+i+')" ontouchstart="window._pct('+i+')">'+b+'</button>';}).join('')+'</div></div>';
  window._pct=function(idx){
    clearTimeout(self._pct);
    if(idx===gs._target){gs.sc+=10+gs.lvl;gs.pressure=Math.max(0,gs.pressure-20);Snd.ok();Hap.l();toast('✅ +'+( 10+gs.lvl));}
    else{gs.pressure=Math.min(100,gs.pressure+25);gs.lives--;Snd.err();Hap.err();if(gs.pressure>=100||gs.lives<=0){gs.phase='over';Nav.go('game');self.render();return;}}
    gs.round++;if(gs.round%8===0)gs.lvl++;Nav.go('game');self.render();
  };
};
PressureCooker._loop=function(){var gs=this.gs,self=this;
  clearInterval(this._pci);
  var spd=Mutators.speed(Math.max(300,1200-gs.lvl*80));
  this._pci=setInterval(function(){
    if(gs.phase!=='playing'){clearInterval(self._pci);return;}
    gs.pressure=Math.min(100,gs.pressure+2+gs.lvl*.5);
    var bar=document.getElementById('_pcbar');
    if(bar)bar.style.width=gs.pressure+'%';
    if(gs.pressure>=100){clearInterval(self._pci);gs.lives--;if(gs.lives<=0){gs.phase='over';Nav.go('game');self.render();}else{gs.pressure=50;Nav.go('game');self.render();}}
  },spd);
};


// ═══ UI BUILDERS ════════════════════════════════════════════════════

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
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();
  if (game.mp) {
    this._setup(game);
  } else {
    // Solo: show difficulty picker first if not played before
    var self = this;
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
var ChessGame = new Game({id:'chess',title:'Chess',icon:'♟️',type:'strategy',cat:'multiplayer',col:PCBrand.h_64d2ff,mp:true,min:2,max:2,desc:'Classic chess. Pass-and-play on one device.'});
ChessGame.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {
    board: this._initBoard(),
    turn: 0, // 0=white, 1=black
    sel: null,
    moves: [],
    history: [],
    check: false,
    mate: false,
    captured: {w:[], b:[]},
    players: pl.slice(0,2)
  };
};
ChessGame._pieces = {
  wK:'♔',wQ:'♕',wR:'♖',wB:'♗',wN:'♘',wP:'♙',
  bK:'♚',bQ:'♛',bR:'♜',bB:'♝',bN:'♞',bP:'♟'
};
ChessGame._initBoard = function() {
  var b = Array(8).fill(null).map(function(){ return Array(8).fill(null); });
  var order = ['R','N','B','Q','K','B','N','R'];
  for (var i=0;i<8;i++) {
    b[0][i] = 'b'+order[i]; b[1][i] = 'bP';
    b[6][i] = 'wP'; b[7][i] = 'w'+order[i];
  }
  return b;
};
ChessGame._color = function(piece) { return piece ? piece[0] : null; };
ChessGame._type  = function(piece) { return piece ? piece[1] : null; };
ChessGame._validMoves = function(board, r, c) {
  var piece = board[r][c]; if (!piece) return [];
  var col = piece[0], type = piece[1], moves = [];
  var self = this;
  var add = function(nr, nc) {
    if (nr<0||nr>7||nc<0||nc>7) return false;
    if (self._color(board[nr][nc])===col) return false;
    moves.push([nr,nc]);
    return !board[nr][nc]; // can continue sliding if empty
  };
  var slide = function(dr, dc) {
    for (var i=1;i<8;i++) { if (!add(r+dr*i, c+dc*i)) break; }
  };
  if (type==='P') {
    var dir = col==='w'?-1:1, start = col==='w'?6:1;
    if (!board[r+dir]||!board[r+dir][c]) {
      add(r+dir, c);
      if (r===start && (!board[r+dir*2]||!board[r+dir*2][c])) add(r+dir*2, c);
    }
    [[r+dir,c-1],[r+dir,c+1]].forEach(function(p){ if (self._color(board[p[0]]&&board[p[0]][p[1]])!==col && board[p[0]]&&board[p[0]][p[1]]) add(p[0],p[1]); });
  }
  if (type==='N') { [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]].forEach(function(d){add(r+d[0],c+d[1]);}); }
  if (type==='B'||type==='Q') { [[-1,-1],[-1,1],[1,-1],[1,1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (type==='R'||type==='Q') { [[-1,0],[1,0],[0,-1],[0,1]].forEach(function(d){slide(d[0],d[1]);}); }
  if (type==='K') { [[-1,-1],[-1,0],[-1,1],[0,-1],[0,1],[1,-1],[1,0],[1,1]].forEach(function(d){add(r+d[0],c+d[1]);}); }
  return moves;
};
ChessGame.render = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  var curPlayer = gs.players[gs.turn];
  var cellSz = Math.min(44, Math.floor((Math.min(window.innerWidth, 480)-32)/8));
  var bSz = cellSz * 8;

  var boardHTML = '<div style="display:inline-grid;grid-template-columns:repeat(8,'+cellSz+'px);border:2px solid rgba(255,255,255,.15);border-radius:8px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,.6)">';
  for (var r=0;r<8;r++) {
    for (var c=0;c<8;c++) {
      var piece = gs.board[r][c];
      var isLight = (r+c)%2===0;
      var isSel = gs.sel && gs.sel[0]===r && gs.sel[1]===c;
      var isMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      var isCapture = isMove && !!piece;
      var bg = isSel ? PCBrand.h_4a7c59 : isMove ? (isLight?'rgba(100,210,255,.5)':'rgba(100,210,255,.35)') : isLight ? PCBrand.h_f0d9b5 : PCBrand.h_b58863;
      var pieceSymbol = piece ? this._pieces[piece] || '' : '';
      var pieceCol = piece && piece[0]==='w' ? PCBrand.h_fff : PCBrand.h_111;
      boardHTML += '<div onclick="window._cc('+r+','+c+')" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;font-size:'+(cellSz*.58)+'px;cursor:pointer;position:relative;user-select:none;-webkit-user-select:none">';
      if (isCapture) boardHTML += '<div style="position:absolute;inset:3px;border-radius:50%;background:rgba(255,45,85,.4);border:2px solid rgba(255,45,85,.7)"></div>';
      if (isMove && !piece) boardHTML += '<div style="width:'+(cellSz*.32)+'px;height:'+(cellSz*.32)+'px;border-radius:50%;background:rgba(100,210,255,.55)"></div>';
      if (piece) boardHTML += '<span style="color:'+pieceCol+';text-shadow:'+( piece[0]==='w'?'0 1px 2px rgba(0,0,0,.6)':'0 1px 2px rgba(255,255,255,.2)')+';position:relative;z-index:1">'+pieceSymbol+'</span>';
      boardHTML += '</div>';
    }
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    // Status bar
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">' + curPlayer.av + '</span><div><div style="font-weight:700;font-size:.86rem">' + curPlayer.name + '</div><div style="font-size: 0.75rem;opacity:.38">' + (curCol==='w'?'White':'Black') + ' to move</div></div></div>' +
      '<div style="font-size:.75rem;color:'+(gs.check?'var(--red)':'var(--dim)')+'font-weight:700">' + (gs.check?'⚠️ CHECK':'') + '</div>' +
      '<div style="font-size:0.75rem;opacity:.38">Move ' + (gs.history.length+1) + '</div>' +
    '</div>' +
    // Captured pieces
    '<div style="font-size:.88rem;margin-bottom:8px;min-height:20px">' + gs.captured.b.join('') + '</div>' +
    // Board
    '<div style="display:flex;justify-content:center;margin-bottom:8px">' + boardHTML + '</div>' +
    '<div style="font-size:.88rem;margin-bottom:10px;min-height:20px">' + gs.captured.w.join('') + '</div>' +
    // Coordinates hint
    '<div style="display:flex;justify-content:center;gap:0;margin-top:-4px;opacity:.3;font-size: 0.75rem;font-family:monospace">' +
      ['a','b','c','d','e','f','g','h'].map(function(l){return '<div style="width:'+cellSz+'px;text-align:center">'+l+'</div>';}).join('') +
    '</div>' +
    // Pass prompt when no selection
    (!gs.sel ? '<div style="text-align:center;margin-top:8px;font-size:.78rem;opacity:.4">Tap a ' + (curCol==='w'?'white':'black') + ' piece to select</div>' : '') +
    '</div>';

  window._cc = function(r, c) {
    var piece = gs.board[r][c];
    // If a piece is selected and this is a valid move
    if (gs.sel) {
      var validMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      if (validMove) {
        // Execute move
        var from = gs.sel;
        var captured = gs.board[r][c];
        if (captured) {
          if (captured[0]==='w') gs.captured.w.push(self._pieces[captured]);
          else gs.captured.b.push(self._pieces[captured]);
        }
        gs.board[r][c] = gs.board[from[0]][from[1]];
        gs.board[from[0]][from[1]] = null;
        // Pawn promotion
        if (gs.board[r][c]==='wP' && r===0) gs.board[r][c]='wQ';
        if (gs.board[r][c]==='bP' && r===7) gs.board[r][c]='bQ';
        gs.history.push({from:from,to:[r,c],piece:gs.board[r][c],cap:captured});
        gs.sel = null; gs.moves = [];
        gs.turn = 1 - gs.turn;
        Snd.click(); Hap.l();
        // Check for game end (simplified - king capture)
        var nextCol = gs.turn===0?'w':'b';
        var kings = []; for(var rr=0;rr<8;rr++) for(var cc2=0;cc2<8;cc2++) if(gs.board[rr][cc2]===nextCol+'K') kings.push(1);
        if (!kings.length) {
          self.done(curPlayer.name);
          self.showWin(curPlayer.name, [{n:curPlayer.name,s:'Checkmate!'},{n:gs.players[gs.turn].name,s:'Defeated'}]);
          return;
        }
        // Pass to next player
        Nav.go('game'); self.render();
        return;
      }
      // Deselect
      gs.sel = null; gs.moves = [];
    }
    // Select piece if it's the current player's color
    if (piece && piece[0]===curCol) {
      gs.sel = [r, c];
      gs.moves = self._validMoves(gs.board, r, c);
      Snd.click(); Hap.l();
    } else {
      gs.sel = null; gs.moves = [];
    }
    Nav.go('game'); self.render();
  };
};

// ── DRAUGHTS / CHECKERS ───────────────────────────────────────────
var Draughts = new Game({id:'draughts',title:'Draughts',icon:'⚫',type:'strategy',cat:'multiplayer',col:PCBrand.h_ff6b00,mp:true,min:2,max:2,desc:'Classic checkers. Jump, capture, crown your pieces.'});
Draughts.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  var b = Array(8).fill(null).map(function(){return Array(8).fill(null);});
  for (var r=0;r<8;r++) for (var c=0;c<8;c++) {
    if ((r+c)%2!==0) {
      if (r<3) b[r][c]={col:'b',king:false};
      if (r>4) b[r][c]={col:'w',king:false};
    }
  }
  this.gs = {board:b,turn:0,sel:null,moves:[],jumps:[],history:[],captured:{w:0,b:0},players:pl.slice(0,2)};
};
Draughts._getMoves = function(board, r, c) {
  var p = board[r][c]; if (!p) return {moves:[],jumps:[]};
  var dirs = p.col==='w'?[[-1,-1],[-1,1]]:[[ 1,-1],[ 1,1]];
  if (p.king) dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
  var moves=[], jumps=[];
  dirs.forEach(function(d) {
    var nr=r+d[0],nc=c+d[1];
    if (nr<0||nr>7||nc<0||nc>7) return;
    if (!board[nr][nc]) moves.push([nr,nc]);
    else if (board[nr][nc].col!==p.col) {
      var jr=r+d[0]*2,jc=c+d[1]*2;
      if (jr>=0&&jr<=7&&jc>=0&&jc<=7&&!board[jr][jc]) jumps.push([jr,jc,nr,nc]);
    }
  });
  return {moves:jumps.length?[]:moves, jumps:jumps};
};
Draughts.render = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  var curPlayer = gs.players[gs.turn];
  var cellSz = Math.min(44, Math.floor((Math.min(window.innerWidth,480)-32)/8));

  var boardHTML = '<div style="display:inline-grid;grid-template-columns:repeat(8,'+cellSz+'px);border:2px solid rgba(255,255,255,.15);border-radius:8px;overflow:hidden">';
  for (var r=0;r<8;r++) {
    for (var c=0;c<8;c++) {
      var p = gs.board[r][c];
      var isLight = (r+c)%2===0;
      var isSel = gs.sel && gs.sel[0]===r && gs.sel[1]===c;
      var isMove = gs.moves.some(function(m){return m[0]===r&&m[1]===c;});
      var isJump = gs.jumps.some(function(j){return j[0]===r&&j[1]===c;});
      var bg = isSel?PCBrand.h_4a7c59:isLight?PCBrand.h_f0d9b5:PCBrand.h_b58863;
      boardHTML += '<div onclick="window._dc('+r+','+c+')" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+bg+';display:flex;align-items:center;justify-content:center;cursor:pointer;position:relative">';
      if ((isMove||isJump) && !p) boardHTML += '<div style="width:'+(cellSz*.4)+'px;height:'+(cellSz*.4)+'px;border-radius:50%;background:'+(isJump?'rgba(255,107,0,.7)':'rgba(100,210,255,.5)')+'"></div>';
      if (p) {
        var pc = p.col==='w'?PCBrand.h_e8d5b0:PCBrand.h_333;
        var border = p.col==='w'?'rgba(0,0,0,.3)':'rgba(255,255,255,.3)';
        boardHTML += '<div style="width:'+(cellSz*.72)+'px;height:'+(cellSz*.72)+'px;border-radius:50%;background:'+pc+';border:2px solid '+border+';display:flex;align-items:center;justify-content:center;font-size:'+(cellSz*.3)+'px;box-shadow:0 2px 6px rgba(0,0,0,.4)">' + (p.king?'♔':'') + '</div>';
      }
      boardHTML += '</div>';
    }
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="display:flex;align-items:center;gap:8px"><span>'+curPlayer.av+'</span><div><div style="font-weight:700;font-size:.86rem">'+curPlayer.name+'</div><div style="font-size: 0.75rem;opacity:.38">'+(curCol==='w'?'Light':'Dark')+' pieces</div></div></div>' +
      '<div style="font-size:.8rem;opacity:.38">W:'+gs.captured.w+' B:'+gs.captured.b+'</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:10px">'+boardHTML+'</div>' +
    '<div style="text-align:center;font-size:.75rem;opacity:.38">'+(!gs.sel?'Tap your piece to select':'Tap highlighted square to move or jump')+'</div>' +
    '</div>';

  window._dc = function(r,c) {
    var p = gs.board[r][c];
    if (gs.sel) {
      var mv = gs.moves.find(function(m){return m[0]===r&&m[1]===c;});
      var jp = gs.jumps.find(function(j){return j[0]===r&&j[1]===c;});
      if (mv || jp) {
        var from = gs.sel;
        gs.board[r][c] = gs.board[from[0]][from[1]];
        gs.board[from[0]][from[1]] = null;
        if (jp) { gs.board[jp[2]][jp[3]]=null; gs.captured[curCol==='w'?'b':'w']++; }
        // Crown
        if ((curCol==='w'&&r===0)||(curCol==='b'&&r===7)) gs.board[r][c].king=true;
        gs.sel=null;gs.moves=[];gs.jumps=[];
        gs.turn=1-gs.turn;
        Snd.click();Hap.l();
        // Check win
        var opp=gs.turn===0?'w':'b';
        var oppPieces=0;for(var rr=0;rr<8;rr++)for(var cc2=0;cc2<8;cc2++)if(gs.board[rr][cc2]&&gs.board[rr][cc2].col===opp)oppPieces++;
        if(!oppPieces){self.done(curPlayer.name);self.showWin(curPlayer.name,[{n:curPlayer.name,s:'All pieces captured!'},{n:gs.players[gs.turn].name,s:'Defeated'}]);return;}
        Nav.go('game');self.render();return;
      }
      gs.sel=null;gs.moves=[];gs.jumps=[];
    }
    if (p && p.col===curCol) {
      gs.sel=[r,c];
      var m=self._getMoves(gs.board,r,c);
      gs.moves=m.moves;gs.jumps=m.jumps;
      Snd.click();Hap.l();
    } else {gs.sel=null;gs.moves=[];gs.jumps=[];}
    Nav.go('game');self.render();
  };
};

// ── CONNECT FOUR ──────────────────────────────────────────────────
/* PRSM-P0-01 / D-06 — Four in a Row (was Connect Four); neutral discs + original board */
var ConnectFour = new Game({id:'c4',title:'Four in a Row',icon:'⬡',type:'strategy',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:2,max:2,desc:'Drop discs. First to line up four wins.'});
ConnectFour.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {board:Array(6).fill(null).map(function(){return Array(7).fill(null);}),turn:0,players:pl.slice(0,2)};
};
ConnectFour._drop = function(board, col, mark) {
  for (var r=5;r>=0;r--) { if (!board[r][col]) { board[r][col]=mark; return r; } }
  return -1;
};
ConnectFour._check = function(board,r,c) {
  var mark=board[r][c]; if(!mark) return false;
  var dirs=[[0,1],[1,0],[1,1],[1,-1]];
  return dirs.some(function(d){
    var count=1;
    for(var i=1;i<4;i++){var nr=r+d[0]*i,nc=c+d[1]*i;if(nr<0||nr>5||nc<0||nc>6||board[nr][nc]!==mark)break;count++;}
    for(var i=1;i<4;i++){var nr=r-d[0]*i,nc=c-d[1]*i;if(nr<0||nr>5||nc<0||nc>6||board[nr][nc]!==mark)break;count++;}
    return count>=4;
  });
};
ConnectFour.render = function() {
  var gs = this.gs, self = this;
  var marks=['A','B'], colors={A:PCBrand.h_5ac8fa,B:PCBrand.h_bf5af2}, curMark=marks[gs.turn], curPlayer=gs.players[gs.turn];
  var cellSz = Math.min(42, Math.floor((Math.min(window.innerWidth,480)-32)/7));
  GameShell.announceTurn(curPlayer.name);

  var colBtns = Array(7).fill(0).map(function(_,c){
    return '<button type="button" onclick="window._c4d('+c+')" aria-label="Drop in column '+(c+1)+'" style="width:'+cellSz+'px;text-align:center;cursor:pointer;font-size:'+(cellSz*.45)+'px;padding-bottom:4px;opacity:.7;background:none;border:none;color:var(--cyan)">▼</button>';
  }).join('');

  var boardHTML = '<div style="background:linear-gradient(160deg,'+PCBrand.h_1a2438+','+PCBrand.h_0d1524+');border:2px solid rgba(90,200,250,.35);border-radius:14px;padding:8px;display:inline-block;box-shadow:0 8px 28px rgba(0,0,0,.45)">';
  for (var r=0;r<6;r++) {
    boardHTML += '<div style="display:flex;gap:4px;margin-bottom:4px">';
    for (var c=0;c<7;c++) {
      var cell = gs.board[r][c];
      var bg = cell ? colors[cell] : 'rgba(255,255,255,.06)';
      boardHTML += '<div style="width:'+cellSz+'px;height:'+cellSz+'px;border-radius:50%;background:'+bg+';border:1px solid rgba(255,255,255,.12);box-shadow:inset 0 2px 4px rgba(0,0,0,.35)"></div>';
    }
    boardHTML += '</div>';
  }
  boardHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding:8px 11px;background:rgba(255,255,255,.05);border-radius:11px">' +
      '<div style="font-size:1.1rem">'+curPlayer.av+'</div>' +
      '<div style="font-weight:700;font-size:.88rem">'+curPlayer.name+' · <span style="color:'+colors[curMark]+'">●</span></div>' +
      '<div style="font-size:0.75rem;opacity:.55">'+gs.players.map(function(p,i){return p.name;}).join(' vs ')+'</div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center">' +
      '<div>' +
        '<div style="display:flex;gap:4px;padding:0 6px;margin-bottom:2px">'+colBtns+'</div>' +
        boardHTML +
      '</div>' +
    '</div>' +
    '</div>';

  window._c4d = function(col) {
    var row = self._drop(gs.board, col, curMark);
    if (row < 0) { toast('Column full!'); return; }
    Snd.click(); Hap.l();
    if (self._check(gs.board, row, col)) {
      self.done(curPlayer.name);
      Nav.go('game');
      self.showWin(curPlayer.name, [{n:curPlayer.name,s:'Four in a row!'},{n:gs.players[1-gs.turn].name,s:'Defeated'}]);
      return;
    }
    if (gs.board.every(function(row2){return row2.every(function(c2){return !!c2;});})) {
      self.done(null);
      document.getElementById('gbody').innerHTML='<div style="text-align:center;padding:40px 0"><div style="font-size:1.3rem;font-weight:700;margin:10px 0">Draw!</div><button type="button" class="btn bw" onclick="GL.launch(\'c4\')">Play Again</button></div>';
      return;
    }
    gs.turn = 1-gs.turn;
    Nav.go('game'); self.render();
  };
};



// ═══ V4 BOOT PATCH ════════════════════════════════════════════════
// Single DOMContentLoaded — replaces previous boot
document.addEventListener('DOMContentLoaded', function() {
  Save.load(); Memory.load(); Meta.load();
  Mutators.loadPresets(); Tutorial._load();

  // Modular games (js/games/*.js) register via PRISM_GAME_FACTORIES
  (window.PRISM_GAME_FACTORIES || []).forEach(function(factory) {
    try { var g = factory(); if (g) Reg.add(g); } catch (e) { console.warn('Game factory failed', e); }
  });
  if (typeof window._patchTTTBot === 'function') window._patchTTTBot();
  // Register core multiplayer + solo games (38 total with v5 + board)
  [ShadowProtocol,HotDevice,SplitTruth,SilentVote,ChaosCards,TruthBomb,Dungeon,
   SpyHunt,LastSignal,ChainReaction,BetrayalGrid,NeonReflex,MemoryMatrix,
   SignalDecode,QuickTap,PatternShift,GhostMode,AISurvival,CyberTiles,
   RhythmPulse,InfiniteMaze,ImposterFreq,TrustFall,ReflexLadder,NeonSnake,
   TheHeist,PressureCooker,ChessGame,Draughts,ConnectFour
  ].forEach(function(g){ Reg.add(g); });

  // Demo AFTER Reg is full — games count + Smart Hub need real list
  if (new URLSearchParams(location.search).get('demo') === '1' && window.GL && GL.loadDemoSeed) {
    GL.loadDemoSeed({ silent: true });
  }

  Theme.apply(S.cfg.theme||'');
  if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
  /* Defer audio + canvas BG — main-thread TBT (v5 §3b). */
  var _deferFx = function() {
    try { Snd.init(); } catch (e) {}
    try { BG.init(); } catch (e) {}
  };
  if ('requestIdleCallback' in window) requestIdleCallback(_deferFx, { timeout: 2500 });
  else setTimeout(_deferFx, 800);

  document.addEventListener('touchstart', function(){Snd.wake();}, {once:true,passive:true});
  document.addEventListener('click', function(){Snd.wake();}, {once:true,passive:true});

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
  try { GL._buildFeat(); GL._buildScrolls(); } catch (e) {}
  try { UI.home(); } catch (e) {}
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
  try { window.__APP_READY__ = true; document.documentElement.dataset.appReady = 'true'; } catch (e) {}

  var _idleShell = function() {
    try { UI.dash(); UI.prof(); } catch (e) {}
    try { Meta.check(S.prof); } catch (e) {}
    try { DevSel.init(); } catch (e) {}
    try { GL._buildLib('all'); } catch (e) {}
    /* Never enable slideUpFresh on first session paint — CLS. */
  };
  if ('requestIdleCallback' in window) requestIdleCallback(_idleShell, { timeout: 1800 });
  else setTimeout(_idleShell, 400);

  window.addEventListener('beforeinstallprompt', function(e) {
    e.preventDefault();
    window._installEvt = e;
  });
});




