'use strict';
// ═══════════════════════════════════════════════════════════════════
// PRISM OS v4 — PROFESSIONAL SYSTEMS (idle / games-pack — v5 §3d TBT)
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
