/* PrismCap deferred games — idle-loaded after Home (v5 §3d TBT) */
// ─── V5 NEW GAMES ───
// ═══════════════════════════════════════════════════════════════════
// NEW GAMES v5 — Inspired by big studio game design
// Rockstar (open world feel), EA (sports/simulation depth),
// Sega (arcade energy), Nintendo (pick-up-play polish)
// ═══════════════════════════════════════════════════════════════════

// ── WORD DODGE (D-06 · was Taboo-like Word Assassin) ───────
var WordAssassin = new Game({id:'word',title:'Word Dodge',icon:'🔤',type:'party',cat:'multiplayer',col:PCBrand.h_30d158,mp:true,min:2,max:10,desc:'Describe the word without using blocked words. One slip ends your turn.'});
WordAssassin.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl);
  var wordSets = [
    {word:'BEACH',forbidden:['sand','ocean','swim','wave','sun']},
    {word:'PIZZA',forbidden:['cheese','tomato','dough','italy','slice']},
    {word:'HOSPITAL',forbidden:['doctor','nurse','sick','medicine','bed']},
    {word:'MOUNTAIN',forbidden:['climb','snow','peak','hill','hiking']},
    {word:'BIRTHDAY',forbidden:['cake','candle','party','gift','age']},
    {word:'COFFEE',forbidden:['caffeine','hot','cup','morning','beans']},
    {word:'AIRPORT',forbidden:['plane','fly','travel','gate','passport']},
    {word:'LIBRARY',forbidden:['book','read','quiet','study','shelf']},
    {word:'CONCERT',forbidden:['music','stage','band','crowd','ticket']},
    {word:'WEDDING',forbidden:['ring','love','bride','groom','ceremony']},
    {word:'FOOTBALL',forbidden:['kick','goal','team','pitch','score']},
    {word:'PRISON',forbidden:['jail','crime','bars','guard','lock']},
    {word:'VOLCANO',forbidden:['lava','erupt','fire','magma','hot']},
    {word:'SPACESHIP',forbidden:['rocket','space','astronaut','star','launch']},
    {word:'SUBMARINE',forbidden:['ocean','water','deep','sea','dive']}
  ];
  this.gs = {
    round:1,maxR:pl.length*2,
    sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),
    giver:0,guesserIdx:0,
    words:this.shuf(wordSets),wordIdx:0,
    phase:'give',timeLeft:Difficulty.timer(45),
    forbidden:[],currentWord:'',guessed:0,failed:0
  };
};
WordAssassin.render = function() {
  var gs = this.gs, self = this;
  if (gs.round > gs.maxR) {
    var sc = this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});
    this.done(sc[0].n); this.showWin(sc[0].n, sc); return;
  }
  var giver = this.players[gs.giver % this.players.length];
  var currentWord = gs.words[gs.wordIdx % gs.words.length];
  if (gs.phase === 'reveal') {
    // Show giver their word via pass-and-play
    PP.show(giver.name, giver.av, 'Pass to ' + giver.name,
      '<div style="text-align:center">' +
      '<div style="font-size:2.4rem;font-weight:900;letter-spacing:-.02em;color:var(--green);margin-bottom:16px">' + currentWord.word + '</div>' +
      '<div style="font-size:0.75rem;opacity:.55;margin-bottom:9px">Blocked words — do not say these:</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:7px;justify-content:center">' +
        currentWord.forbidden.map(function(w){return '<div style="background:rgba(255,45,85,.15);border:1px solid rgba(255,45,85,.3);border-radius:10px;padding:5px 13px;font-size:.82rem;font-weight:700;color:var(--red)">'+w+'</div>';}).join('') +
      '</div>' +
      '<div style="margin-top:16px;font-size:.75rem;opacity:.55">Describe it with any other words. Team guesses.</div>' +
      '</div>',
      function() {
        gs.phase = 'play';
        gs.timeLeft = Difficulty.timer(45);
        Nav.go('game'); self.render(); self._startTimer();
      }
    );
    return;
  }
  if (gs.phase === 'play') {
    var pct = (gs.timeLeft / Difficulty.timer(45)) * 100;
    document.getElementById('gbody').innerHTML =
      '<div style="padding:5px 0">' +
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">' +
        '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--green)">' + gs.guessed + '</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Guessed</div></div>' +
        '<div style="text-align:center"><div id="_wt" style="font-size:2rem;font-weight:800;color:' + (gs.timeLeft<=10?'var(--red)':'var(--amber)') + '">' + gs.timeLeft + '</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Seconds</div></div>' +
        '<div style="text-align:center"><div style="font-size:1.6rem;font-weight:800;color:var(--red)">' + gs.failed + '</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Skipped</div></div>' +
      '</div>' +
      '<div style="margin-bottom:16px">' +
        '<div style="font-size:0.75rem;opacity:.55;margin-bottom:4px;text-align:center">Clue giver: ' + giver.av + ' ' + giver.name + '</div>' +
        '<div style="font-size:0.75rem;opacity:.55;margin-bottom:5px;text-align:center">Blocked words:</div>' +
        '<div style="display:flex;flex-wrap:wrap;gap:6px;justify-content:center">' +
          currentWord.forbidden.map(function(w){return '<div style="background:rgba(255,45,85,.13);border:1px solid rgba(255,45,85,.25);border-radius:10px;padding:4px 11px;font-size:.78rem;font-weight:700;color:var(--red)">'+w+'</div>';}).join('') +
        '</div>' +
      '</div>' +
      '<div style="display:flex;gap:9px"><button type="button" class="btn br" style="flex:1;font-size:.85rem" onclick="window._wskip()">Skip / Said blocked</button><button type="button" class="btn bw" style="flex:1;font-size:.85rem" onclick="window._wgot()">Guessed!</button></div>' +
      '<div style="margin-top:9px;text-align:center;font-size:0.75rem;opacity:.35">Round ' + gs.round + '/' + gs.maxR + '</div>' +
      '</div>';

    window._wgot = function() {
      gs.guessed++; gs.sc[giver.id] = (gs.sc[giver.id]||0) + 10;
      gs.wordIdx++; Snd.ok(); Hap.ok(); toast('✅ +10');
      Drama.tick('win'); self._nextWord();
    };
    window._wskip = function() {
      gs.failed++; gs.wordIdx++; Snd.err(); Hap.err();
      Drama.tick('betray'); self._nextWord();
    };
    return;
  }
};
WordAssassin._nextWord = function() {
  var gs = this.gs, self = this;
  clearInterval(this._wt);
  // Next round after showing result briefly
  gs.round++; gs.giver++; gs.guessed = 0; gs.failed = 0; gs.phase = 'reveal';
  if (gs.round > gs.maxR) { Nav.go('game'); this.render(); return; }
  toast('Round ' + gs.round + ' — pass to ' + this.players[gs.giver % this.players.length].name);
  setTimeout(function() { Nav.go('game'); self.render(); }, 400);
};
WordAssassin._startTimer = function() {
  var gs = this.gs, self = this;
  clearInterval(this._wt);
  this._wt = setInterval(function() {
    gs.timeLeft--;
    var el = document.getElementById('_wt');
    if (el) { el.textContent = gs.timeLeft; el.style.color = gs.timeLeft<=10?'var(--red)':'var(--amber)'; }
    if (gs.timeLeft <= 5) { Snd.tick(gs.timeLeft); Hap.m(); }
    if (gs.timeLeft <= 0) { clearInterval(self._wt); toast('⏱️ Time up!'); self._nextWord(); }
  }, 1000);
};

// ── CLUE GRID (D-06 · was Codenames-like; 4×5, Clue giver / Guessers) ───
var DeadDrop = new Game({id:'deadrop',title:'Clue Grid',icon:'▦',type:'party',cat:'multiplayer',col:PCBrand.h_bf5af2,mp:true,min:3,max:8,desc:'4×5 word grid. Clue giver hints; guessers tap words. Avoid the trap.'});
DeadDrop._WORDS = ['ORBIT','MIRROR','LANTERN','RIVER','COPPER','SILK','ANCHOR','PULSE','MEADOW','CIPHER','QUARTZ','EMBER','GLIDER','BREEZE','NEEDLE','CASCADE','HORIZON','PETAL','VOLTAGE','MARBLE','DRIFT','SIGNAL','CRYSTAL','FATHOM','SPARROW','COMPASS','RIPPLE','FORGE','TWILIGHT','CANYON','PRISM','ECHO'];
DeadDrop.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl); Director.init(pl.length);
  var words = this.shuf(DeadDrop._WORDS.slice()).slice(0, 20);
  var roles = [];
  for (var i = 0; i < 7; i++) roles.push('team');
  for (var j = 0; j < 10; j++) roles.push('neutral');
  roles.push('trap');
  roles.push('trap');
  roles = this.shuf(roles);
  var cells = words.map(function(w, idx) {
    return { word: w, role: roles[idx], revealed: false };
  });
  var giverIdx = Math.floor(Math.random() * pl.length);
  this.gs = {
    phase: 'brief',
    cells: cells,
    giverId: pl[giverIdx].id,
    ridx: 0,
    remaining: 7,
    trapsHit: 0,
    sc: pl.reduce(function(o, p) { o[p.id] = 0; return o; }, {}),
    clueText: '',
    clueN: 1
  };
};
DeadDrop.render = function() {
  var gs = this.gs;
  if (gs.phase === 'brief') this._brief();
  else if (gs.phase === 'clue') this._clue();
  else if (gs.phase === 'guess') this._guess();
  else this._result();
};
DeadDrop._gridHtml = function(revealRoles) {
  var gs = this.gs;
  return '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin:10px 0">' +
    gs.cells.map(function(c, i) {
      var bg = 'rgba(255,255,255,.06)';
      var border = 'rgba(255,255,255,.14)';
      var color = PCBrand.h_fff;
      if (c.revealed || revealRoles) {
        if (c.role === 'team') { bg = 'rgba(48,209,88,.22)'; border = 'rgba(48,209,88,.45)'; color = 'var(--green)'; }
        else if (c.role === 'trap') { bg = 'rgba(255,45,85,.2)'; border = 'rgba(255,45,85,.45)'; color = 'var(--red)'; }
        else { bg = 'rgba(255,255,255,.08)'; border = 'rgba(255,255,255,.2)'; color = 'rgba(255,255,255,.55)'; }
      }
      var click = (!revealRoles && !c.revealed && gs.phase === 'guess')
        ? 'onclick="window._cgPick(' + i + ')"'
        : '';
      return '<button type="button" ' + click + ' style="min-height:44px;padding:8px 4px;border-radius:10px;border:1px solid ' + border + ';background:' + bg + ';color:' + color + ';font-size:0.75rem;font-weight:700;cursor:' + (click ? 'pointer' : 'default') + '">' + c.word + '</button>';
    }).join('') +
    '</div>';
};
DeadDrop._brief = function() {
  var gs = this.gs, self = this;
  var p = this.players[gs.ridx];
  if (!p) { gs.phase = 'clue'; Nav.go('game'); this._clue(); return; }
  var isGiver = p.id === gs.giverId;
  Hap.roleReveal(isGiver);
  PP.show(p.name, p.av, 'Pass to ' + p.name,
    '<div style="text-align:center">' +
    '<div style="font-size:1.15rem;font-weight:800;color:' + (isGiver ? 'var(--violet)' : 'var(--cyan)') + ';margin-bottom:10px">' +
      (isGiver ? 'You are the Clue giver' : 'You are a Guesser') +
    '</div>' +
    (isGiver
      ? '<div style="font-size:.75rem;opacity:.55;margin-bottom:8px">Green = your team · Red = trap · Gray = neutral</div>' + self._gridHtml(true) +
        '<div style="font-size:0.75rem;opacity:.55;margin-top:6px">Give one-word clues. Guessers tap words.</div>'
      : '<div style="font-size:.78rem;opacity:.55;line-height:1.45">Listen to the Clue giver. Tap words you think match. Avoid the traps.</div>') +
    '</div>',
    function() { gs.ridx++; Nav.go('game'); self.render(); }
  );
};
DeadDrop._clue = function() {
  var gs = this.gs, self = this;
  var giver = this.players.find(function(p) { return p.id === gs.giverId; });
  GameShell.announceTurn(giver.name);
  document.getElementById('gbody').innerHTML =
    '<div style="padding:6px 0;text-align:center">' +
    '<div style="opacity:.55;font-size:.75rem;margin-bottom:8px">Clue giver: ' + giver.av + ' ' + giver.name + '</div>' +
    '<div style="font-weight:700;margin-bottom:10px">Remaining team words: ' + gs.remaining + '</div>' +
    self._gridHtml(false) +
    '<button type="button" class="btn bw bf" onclick="window._cgClueReady()">Clue given — guessers play</button>' +
    '</div>';
  window._cgClueReady = function() {
    gs.phase = 'guess';
    Nav.go('game');
    self._guess();
  };
};
DeadDrop._guess = function() {
  var gs = this.gs, self = this;
  var guessers = this.players.filter(function(p) { return p.id !== gs.giverId; });
  GameShell.announceTurn(guessers[0] ? guessers[0].name : 'Guessers');
  document.getElementById('gbody').innerHTML =
    '<div style="padding:6px 0;text-align:center">' +
    '<div style="font-weight:700;margin-bottom:6px">Guessers — tap a word</div>' +
    '<div style="opacity:.55;font-size:.75rem;margin-bottom:8px">Team left: ' + gs.remaining + ' · Traps hit: ' + gs.trapsHit + '</div>' +
    self._gridHtml(false) +
    '<button type="button" class="btn bg bf" style="margin-top:8px" onclick="window._cgEndTurn()">End turn</button>' +
    '</div>';
  window._cgPick = function(i) {
    var cell = gs.cells[i];
    if (!cell || cell.revealed) return;
    cell.revealed = true;
    Snd.click(); Hap.l();
    if (cell.role === 'team') {
      gs.remaining--;
      toast('Team word!');
      if (gs.remaining <= 0) { gs.phase = 'result'; gs.won = true; Nav.go('game'); self._result(); return; }
    } else if (cell.role === 'trap') {
      gs.trapsHit++;
      toast('Trap!');
      Snd.err();
      if (gs.trapsHit >= 2) { gs.phase = 'result'; gs.won = false; Nav.go('game'); self._result(); return; }
    } else {
      toast('Neutral');
    }
    Nav.go('game');
    self._guess();
  };
  window._cgEndTurn = function() {
    gs.phase = 'clue';
    Nav.go('game');
    self._clue();
  };
};
DeadDrop._result = function() {
  var gs = this.gs, self = this;
  var giver = this.players.find(function(p) { return p.id === gs.giverId; });
  var winner = gs.won ? 'Guessers' : 'Trap wins';
  document.getElementById('gbody').innerHTML =
    '<div style="text-align:center;padding:18px 8px">' +
    '<div style="font-size:1.5rem;font-weight:800;margin-bottom:8px">' + (gs.won ? 'Grid cleared!' : 'Traps sprung') + '</div>' +
    '<div style="opacity:.55;margin-bottom:14px">Clue giver was ' + giver.av + ' ' + giver.name + '</div>' +
    self._gridHtml(true) +
    '<div style="display:flex;gap:8px;justify-content:center;margin-top:14px">' +
      '<button type="button" class="btn bw" onclick="GL.launch(\'deadrop\')">Play Again</button>' +
      '<button type="button" class="btn bg" onclick="GL.requestLeave()">Exit</button>' +
    '</div></div>';
  self.done(winner);
  if (gs.won) { Snd.ok(); Hap.ok(); } else { Snd.betray(); Hap.err(); }
};

// ── BLITZ DUEL (1v1 reaction) ─────
var BlitzDuel = new Game({id:'blitz',title:'Blitz Duel',icon:'⚡',type:'reflex',cat:'multiplayer',col:PCBrand.h_ff2d55,mp:true,min:2,max:2,desc:'1v1 reaction battles. Best of 5 rounds. Speed wins.'});
BlitzDuel.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,2));
  this.gs = {round:1,maxR:5,wins:[0,0],phase:'ready',players:pl.slice(0,2),reactionTimes:[null,null],countdown:3};
};
BlitzDuel.render = function() {
  var gs = this.gs, self = this;
  if (gs.wins[0] >= 3 || gs.wins[1] >= 3) {
    var winnerIdx = gs.wins[0] >= 3 ? 0 : 1;
    this.done(gs.players[winnerIdx].name);
    this.showWin(gs.players[winnerIdx].name, [{n:gs.players[winnerIdx].name,s:gs.wins[winnerIdx]+' wins'},{n:gs.players[1-winnerIdx].name,s:gs.wins[1-winnerIdx]+' wins'}]);
    return;
  }
  document.getElementById('gbody').innerHTML =
    '<div style="text-align:center;padding:8px 0">' +
    '<div style="display:flex;justify-content:space-around;margin-bottom:20px">' +
      gs.players.map(function(p,i){return '<div style="text-align:center"><div style="font-size:2rem">'+p.av+'</div><div style="font-size:.82rem;font-weight:700;margin-top:4px">'+p.name+'</div><div style="font-size:1.4rem;color:var(--red);font-weight:800;margin-top:2px">' + '⚡'.repeat(gs.wins[i]) + '○'.repeat(3-gs.wins[i]) + '</div></div>';}).join('<div style="font-size:1.2rem;opacity:.3;align-self:center">VS</div>') +
    '</div>' +
    '<div style="margin-bottom:20px;font-size:.75rem;opacity:.38">Round ' + gs.round + ' / ' + gs.maxR + '</div>' +
    '<div id="_bd-arena" style="height:200px;background:rgba(255,45,85,.05);border:1px solid rgba(255,45,85,.12);border-radius:16px;display:flex;align-items:center;justify-content:center;cursor:pointer;font-size:1rem;font-weight:700;opacity:.38">GET READY</div>' +
    '<div style="margin-top:14px;font-size:.75rem;opacity:.35">Both players tap the arena at the same time when it turns green</div>' +
    '<button type="button" class="btn bw" style="margin-top:14px" onclick="window._bdstart()">▶ Start Round ' + gs.round + '</button>' +
    '</div>';

  window._bdstart = function() {
    var arena = document.getElementById('_bd-arena');
    if (!arena) return;
    gs.reactionTimes = [null, null];
    arena.textContent = '...';
    arena.style.background = 'rgba(255,45,85,.08)';
    // Random delay 1.5-4s
    var delay = 1500 + Math.random() * 2500;
    var go = false;
    var t0;
    setTimeout(function() {
      go = true; t0 = Date.now();
      arena.style.background = 'rgba(48,209,88,.3)';
      arena.style.borderColor = 'rgba(48,209,88,.6)';
      arena.style.boxShadow = '0 0 30px rgba(48,209,88,.4)';
      arena.textContent = 'TAP NOW!';
      arena.style.color = 'var(--green)';
      arena.style.fontSize = '1.4rem';
      arena.style.opacity = '1';
      Snd.ok(); Hap.heavy();
      // Timeout if nobody taps
      setTimeout(function() {
        if (gs.reactionTimes[0]===null && gs.reactionTimes[1]===null) {
          toast('Nobody tapped! Redoing...');
          Nav.go('game'); self.render();
        }
      }, 3000);
    }, delay);

    var tapCount = 0;
    arena.addEventListener('touchstart', function(e) {
      e.preventDefault();
      if (!go) { arena.textContent = '⚡ Too early!'; arena.style.color='var(--red)'; return; }
      if (tapCount >= 2) return;
      var rt = Date.now() - t0;
      gs.reactionTimes[tapCount] = rt;
      tapCount++;
      arena.textContent = tapCount === 1 ? 'Player 2 — TAP!' : '...';
      if (tapCount === 2) {
        // Both tapped — determine winner
        var winner = gs.reactionTimes[0] < gs.reactionTimes[1] ? 0 : 1;
        gs.wins[winner]++;
        gs.round++;
        arena.textContent = gs.players[winner].name + ' wins! (' + gs.reactionTimes[winner] + 'ms vs ' + gs.reactionTimes[1-winner] + 'ms)';
        arena.style.background = 'rgba(255,214,10,.15)';
        arena.style.color = 'var(--amber)';
        Snd.ok(); Hap.ok();
        setTimeout(function() { Nav.go('game'); self.render(); }, 2200);
      }
    }, {passive:false});
  };
};

// ── PIXEL PAINTER (creative solo — Nintendo Mario Paint vibe) ────────
var PixelPainter = new Game({id:'pixel',title:'Pixel Painter',icon:'🎨',type:'puzzle',cat:'solo',col:PCBrand.h_ff6b00,mp:false,min:1,max:1,desc:'Draw pixel art. Solve color challenges. Create masterpieces.'});
PixelPainter.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,1));
  var sz = 12;
  this.gs = {
    sz:sz,
    grid:Array(sz*sz).fill(PCBrand.h_111),
    color:PCBrand.h_ff2d55,
    palette:[PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_ffd60a,PCBrand.h_30d158,PCBrand.h_00d4ff,PCBrand.h_bf5af2,PCBrand.h_fff,PCBrand.h_000,PCBrand.h_333,PCBrand.h_64d2ff,PCBrand.h_ff375f,PCBrand.h_888],
    challenge:null,score:0,mode:'free',strokes:0
  };
};
PixelPainter.render = function() {
  var gs = this.gs, self = this;
  var sz = gs.sz, cellSz = Math.min(26, Math.floor((Math.min(window.innerWidth,480)-32)/sz));
  var gridHTML = '<div style="display:grid;grid-template-columns:repeat('+sz+','+cellSz+'px);gap:0;border:1px solid rgba(255,255,255,.12);border-radius:6px;overflow:hidden;touch-action:none" id="_pg">';
  for (var i=0;i<sz*sz;i++) {
    gridHTML += '<div data-i="'+i+'" style="width:'+cellSz+'px;height:'+cellSz+'px;background:'+gs.grid[i]+';cursor:crosshair" ontouchstart="window._pp('+i+')" ontouchmove="window._ppm(event)"></div>';
  }
  gridHTML += '</div>';

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px">' +
      '<div style="font-size:.75rem;opacity:.38">Strokes: '+gs.strokes+'</div>' +
      '<div style="font-size:.75rem;font-weight:700">🎨 Pixel Painter</div>' +
      '<div style="display:flex;gap:6px"><button type="button" onclick="window._pclear()" style="padding:5px 10px;background:rgba(255,255,255,.07);border:1px solid var(--border);border-radius:8px;font-size:0.75rem;cursor:pointer">Clear</button><button type="button" onclick="window._psave()" style="padding:5px 10px;background:rgba(0,212,255,.15);border:1px solid rgba(0,212,255,.3);border-radius:8px;font-size:0.75rem;cursor:pointer">Save</button></div>' +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:12px">' + gridHTML + '</div>' +
    '<div style="margin-bottom:10px">' +
      '<div style="font-size: 0.75rem;opacity:.35;text-transform:uppercase;margin-bottom:6px">Color palette</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:5px">' +
        gs.palette.map(function(c){return '<div onclick="window._pcolor(\''+c+'\',this)" style="width:32px;height:32px;border-radius:8px;background:'+c+';cursor:pointer;border:3px solid '+(gs.color===c?PCBrand.h_fff:'transparent')+';transition:border-color .15s"></div>';}).join('') +
        '<div style="width:32px;height:32px;border-radius:8px;cursor:pointer;border:2px dashed rgba(255,255,255,.3);display:flex;align-items:center;justify-content:center;font-size:1rem" onclick="window._perase()">⬜</div>' +
      '</div>' +
    '</div>' +
    '<div style="font-size: 0.75rem;opacity:.3;text-align:center">Tap or drag to paint · Tap color to select</div>' +
    '</div>';

  var painting = false;
  window._pp = function(i) {
    gs.grid[i] = gs.color; gs.strokes++;
    var cell = document.querySelector('[data-i="'+i+'"]');
    if (cell) cell.style.background = gs.color;
    Hap.l();
  };
  window._ppm = function(e) {
    e.preventDefault();
    var touch = e.touches[0];
    var el = document.elementFromPoint(touch.clientX, touch.clientY);
    if (el && el.getAttribute('data-i') !== null) {
      var i = parseInt(el.getAttribute('data-i'));
      gs.grid[i] = gs.color;
      el.style.background = gs.color;
    }
  };
  window._pcolor = function(c, el) {
    gs.color = c; Snd.click();
    document.querySelectorAll('[data-i]').forEach(function(){});
    Nav.go('game'); self.render();
  };
  window._perase = function() { gs.color = PCBrand.h_111; Snd.click(); Nav.go('game'); self.render(); };
  window._pclear = function() { gs.grid = Array(sz*sz).fill(PCBrand.h_111); gs.strokes = 0; Nav.go('game'); self.render(); toast('Canvas cleared'); };
  window._psave = function() {
    // Save to localStorage as small compressed string
    try {
      localStorage.setItem('po5_art', JSON.stringify({grid:gs.grid,ts:Date.now()}));
      toast('🎨 Artwork saved!'); Snd.ok(); Hap.ok();
      XP.add(Math.min(50, gs.strokes), Difficulty.xpMult());
    } catch(e) { toast('Could not save'); }
  };
};

// ── SURVIVAL ARENA (Roguelike solo — Sega/EA dungeon crawler vibe) ───
var SurvivalArena = new Game({id:'arena',title:'Survival Arena',icon:'🏟️',type:'survival',cat:'solo',col:PCBrand.h_ff2d55,mp:false,min:1,max:1,desc:'Wave-based survival. Choose upgrades. Push as far as you can.'});
SurvivalArena.setup = function(pl) {
  Game.prototype.setup.call(this, pl.slice(0,1));
  this.gs = {
    wave:1,hp:Difficulty.lives(100),maxHp:Difficulty.lives(100),
    atk:10,def:5,gold:0,xpg:0,
    sc:0,phase:'wave',
    upgrades:[],
    enemies:[],log:[],streak:0
  };
  this._genWave();
};
SurvivalArena._genWave = function() {
  var gs = this.gs, w = gs.wave;
  var types = [
    {name:'Scout',icon:'👤',hp:10+w*3,atk:3+w,reward:5+w,xp:5},
    {name:'Soldier',icon:'💂',hp:20+w*5,atk:6+w*2,reward:10+w*2,xp:10},
    {name:'Brute',icon:'👹',hp:40+w*8,atk:12+w*3,reward:20+w*3,xp:20},
    {name:'Boss',icon:'💀',hp:100+w*20,atk:20+w*5,reward:50+w*5,xp:50}
  ];
  var count = Math.min(3, 1+Math.floor(w/3));
  gs.enemies = Array.from({length:count}, function(_,i) {
    var t = i===count-1&&w%5===0 ? types[3] : types[Math.min(Math.floor(w/2),2)];
    return Object.assign({},t,{curHp:t.hp,id:i});
  });
};
SurvivalArena.render = function() {
  var gs = this.gs, self = this;
  if (gs.hp <= 0) {
    XP.add(gs.sc, Difficulty.xpMult()); self.done(null);
    document.getElementById('gbody').innerHTML =
      '<div style="text-align:center;padding:30px 0">' +
      '<div style="font-size:3.4rem;margin-bottom:5px">🏟️</div>' +
      '<div style="font-size:1.7rem;font-weight:800;color:var(--red)">Wave ' + (gs.wave-1) + '</div>' +
      '<div style="font-size:1.3rem;font-weight:800;margin-top:4px">' + gs.sc + ' pts</div>' +
      '<div style="opacity:.38;margin-bottom:20px">Survived ' + (gs.wave-1) + ' waves</div>' +
      '<div style="display:flex;gap:8px;justify-content:center"><button type="button" class="btn ba" style="--acc:var(--red);--glow:rgba(255,45,85,.28)" id="_arag">Play Again</button><button type="button" class="btn bg" onclick="GL.exitGame()">Exit</button></div>' +
      '</div>';
    document.getElementById('_arag').onclick = function(){GL.launch('arena');};
    Snd.err(); return;
  }
  if (gs.phase === 'upgrade') { this._showUpgrade(); return; }

  var hpPct = (gs.hp/gs.maxHp)*100;
  var enemyHTML = gs.enemies.filter(function(e){return e.curHp>0;}).map(function(e) {
    var ePct = (e.curHp/e.hp)*100;
    return '<div style="padding:10px;background:rgba(255,45,85,.08);border:1px solid rgba(255,45,85,.18);border-radius:12px;margin-bottom:7px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:5px"><span style="font-size:.82rem;font-weight:700">'+e.icon+' '+e.name+'</span><span style="font-size:0.75rem;color:var(--red)">ATK '+e.atk+'</span></div>' +
      '<div style="height:6px;background:rgba(255,255,255,.08);border-radius:3px;overflow:hidden"><div style="height:100%;width:'+ePct+'%;background:var(--red);border-radius:3px;transition:width .3s"></div></div>' +
      '<div style="font-size: 0.75rem;opacity:.38;margin-top:3px">'+e.curHp+'/'+e.hp+' HP</div>' +
    '</div>';
  }).join('');

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="display:flex;justify-content:space-between;margin-bottom:12px">' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--amber)">'+gs.wave+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Wave</div></div>' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800">'+gs.sc+'</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Score</div></div>' +
      '<div style="text-align:center"><div style="font-size:1.5rem;font-weight:800;color:var(--amber)">'+gs.gold+'💰</div><div style="font-size: 0.75rem;opacity:.32;text-transform:uppercase">Gold</div></div>' +
    '</div>' +
    '<div style="margin-bottom:12px">' +
      '<div style="display:flex;justify-content:space-between;margin-bottom:3px;font-size:0.75rem"><span>❤️ HP</span><span style="font-weight:700;color:'+(hpPct>50?'var(--green)':'var(--red)')+'">'+gs.hp+'/'+gs.maxHp+'</span></div>' +
      '<div style="height:8px;background:rgba(255,255,255,.08);border-radius:4px;overflow:hidden"><div style="height:100%;width:'+hpPct+'%;background:'+(hpPct>50?'var(--green)':'var(--red)')+';border-radius:4px;transition:width .3s"></div></div>' +
    '</div>' +
    '<div style="font-size: 0.75rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:8px">Wave '+gs.wave+' Enemies</div>' +
    enemyHTML +
    '<div style="display:flex;gap:8px;margin-top:12px">' +
      '<button type="button" class="btn bg" style="flex:1" onclick="window._ardef()">🛡️ Defend<br><span style="font-size: 0.75rem;opacity:.55">Take ½ dmg</span></button>' +
      '<button type="button" class="btn ba" style="flex:1;--acc:var(--red);--glow:rgba(255,45,85,.28)" onclick="window._aratt()">⚔️ Attack<br><span style="font-size: 0.75rem;opacity:.55">ATK '+gs.atk+'</span></button>' +
      '<button type="button" class="btn bg" style="flex:1" onclick="window._arspec()">✨ Special<br><span style="font-size: 0.75rem;opacity:.55">AOE burst</span></button>' +
    '</div>' +
    (gs.log.length?'<div style="margin-top:10px;font-size:0.75rem;opacity:.4">'+gs.log[gs.log.length-1]+'</div>':'') +
    '</div>';

  window._aratt = function() { self._combat(gs.atk, false); };
  window._ardef = function() { self._combat(Math.floor(gs.atk*0.5), true); };
  window._arspec = function() { self._combat(gs.atk * 2, false, true); };
};
SurvivalArena._combat = function(dmg, defending, aoe) {
  var gs = this.gs, self = this;
  var living = gs.enemies.filter(function(e){return e.curHp>0;});
  if (!living.length) { this._nextWave(); return; }
  // Deal damage
  if (aoe) {
    living.forEach(function(e){e.curHp=Math.max(0,e.curHp-Math.floor(dmg*0.6));});
    gs.log.push('✨ AOE! Hit all enemies for '+Math.floor(dmg*0.6)+' each');
  } else {
    var target = living[0];
    target.curHp = Math.max(0, target.curHp - dmg);
    if (target.curHp <= 0) {
      gs.sc += target.reward; gs.gold += target.reward;
      gs.xpg += target.xp;
      gs.log.push('⚔️ Defeated '+target.icon+' '+target.name+'! +'+target.reward+' gold');
      Snd.ok(); Hap.ok();
    } else {
      gs.log.push('⚔️ Hit '+target.name+' for '+dmg+' ('+target.curHp+' HP left)');
    }
  }
  // Enemy attacks back
  living.filter(function(e){return e.curHp>0;}).forEach(function(e) {
    var eDmg = defending ? Math.floor(e.atk*0.5) : e.atk;
    eDmg = Math.max(1, eDmg - gs.def);
    gs.hp = Math.max(0, gs.hp - eDmg);
  });
  Snd.reflex(50); Hap.m();
  // Check wave clear
  if (gs.enemies.every(function(e){return e.curHp<=0;})) {
    gs.sc += gs.wave * 10;
    gs.log.push('🏆 Wave '+gs.wave+' cleared! +'+gs.wave*10+' bonus');
    Snd.lvlup(); Hap.ok();
    gs.phase = 'upgrade'; gs.wave++;
  }
  Nav.go('game'); this.render();
};
SurvivalArena._showUpgrade = function() {
  var gs = this.gs, self = this;
  var upgrades = [
    {id:'hp',name:'Heal +25 HP',icon:'❤️',cost:15,fn:function(){gs.hp=Math.min(gs.maxHp,gs.hp+25);}},
    {id:'atk',name:'Attack +5',icon:'⚔️',cost:20,fn:function(){gs.atk+=5;}},
    {id:'def',name:'Defense +3',icon:'🛡️',cost:15,fn:function(){gs.def+=3;}},
    {id:'maxhp',name:'Max HP +30',icon:'💪',cost:25,fn:function(){gs.maxHp+=30;gs.hp+=30;}},
    {id:'gold',name:'Skip (keep gold)',icon:'💰',cost:0,fn:function(){}}
  ];
  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="text-align:center;margin-bottom:14px">' +
      '<div style="font-size:1.6rem;font-weight:800;color:var(--amber)">Wave ' + (gs.wave-1) + ' Complete!</div>' +
      '<div style="opacity:.38;font-size:.78rem;margin-top:4px">'+gs.gold+'💰 gold · Choose an upgrade</div>' +
    '</div>' +
    upgrades.map(function(u){
      var canAfford = gs.gold >= u.cost;
      return '<div onclick="'+(canAfford?'window._arUpg(\''+u.id+'\')':'')+'\" style="padding:13px 14px;border-radius:13px;border:1px solid '+(canAfford?'rgba(255,255,255,.15)':'rgba(255,255,255,.06)')+';background:rgba(255,255,255,'+(canAfford?'.06':'.02')+');margin-bottom:7px;cursor:'+(canAfford?'pointer':'default')+';opacity:'+(canAfford?'1':'.4')+';display:flex;align-items:center;gap:11px"><div style="font-size:1.5rem">'+u.icon+'</div><div style="flex:1"><div style="font-weight:700;font-size:.88rem">'+u.name+'</div></div><div style="font-size:.75rem;color:var(--amber);font-weight:700">'+(u.cost>0?u.cost+'💰':'Free')+'</div></div>';
    }).join('') +
    '</div>';
  var upMap = {};
  upgrades.forEach(function(u){upMap[u.id]=u;});
  window._arUpg = function(id) {
    var u = upMap[id];
    if (!u || gs.gold < u.cost) return;
    gs.gold -= u.cost; u.fn();
    gs.upgrades.push(id);
    gs.phase = 'wave'; self._genWave();
    Nav.go('game'); self.render();
    toast(u.icon+' '+u.name);
  };
};
SurvivalArena._nextWave = function() {
  this.gs.phase = 'upgrade';
  this.gs.wave++;
  Nav.go('game'); this.render();
};

// ── MIND MELD (Telepathy party game — Nintendo party vibe) ──────────
var MindMeld = new Game({id:'meld',title:'Think Alike',icon:'🧠',type:'party',cat:'multiplayer',col:PCBrand.h_00d4ff,mp:true,min:2,max:10,desc:'Think the same thought. The more players agree, the more you score.'});
MindMeld.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  Drama.reset(pl);
  var prompts = [
    'A color','An animal','A country','A sport','A fruit','A number 1-10',
    'A movie','A superpower','A food','A type of weather','A planet','A car brand',
    'A body part','A school subject','A type of music','An occupation','A season',
    'A famous person (living)','A TV show','A Pokemon type'
  ];
  this.gs = {
    round:1,maxR:pl.length*2,
    sc:pl.reduce(function(o,p){o[p.id]=0;return o;},{}),
    prompt:prompts[Math.floor(Math.random()*prompts.length)],
    prompts:this.shuf(prompts),promptIdx:0,
    answers:{},pidx:0,phase:'answer'
  };
};
MindMeld.render = function() {
  var gs = this.gs, self = this;
  if (gs.round > gs.maxR) {
    var sc = this.players.map(function(p){return{n:p.name,s:gs.sc[p.id]||0};}).sort(function(a,b){return b.s-a.s;});
    this.done(sc[0].n); this.showWin(sc[0].n, sc); return;
  }
  if (gs.phase === 'answer') this._answer();
  else this._reveal();
};
MindMeld._answer = function() {
  var gs = this.gs, self = this;
  var player = this.players[gs.pidx % this.players.length];
  if (gs.pidx >= this.players.length) { gs.phase = 'reveal'; Nav.go('game'); this._reveal(); return; }
  var sec = '<div style="text-align:center">' +
    '<div style="font-size:2rem;margin-bottom:12px">🧠</div>' +
    '<div style="font-size: 0.75rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:6px">Round '+gs.round+'/'+gs.maxR+'</div>' +
    '<div style="font-size:1.2rem;font-weight:800;margin-bottom:5px">' + gs.prompt + '</div>' +
    '<div style="opacity:.38;font-size:.75rem;margin-bottom:16px">Think of the first thing that comes to mind</div>' +
    '<input id="_mma" autocorrect="off" placeholder="Your answer..." style="width:100%;padding:13px;border-radius:12px;border:1px solid rgba(255,255,255,.15);background:rgba(255,255,255,.07);font-size:1rem;font-weight:700;color:'+PCBrand.h_fff+';text-align:center;margin-bottom:13px" onkeydown="if(event.key===\'Enter\')window._mmsubmit()">' +
    '<button type="button" class="btn bw bf" onclick="window._mmsubmit()">Submit →</button>' +
    '</div>';
  PP.show(player.name, player.av, 'Mind Meld', sec, function() { Nav.go('game'); self.render(); });
  window._mmsubmit = function() {
    var val = (document.getElementById('_mma')||{}).value || '';
    if (!val.trim()) return;
    gs.answers[player.id] = val.trim().toLowerCase();
    gs.pidx++; PP.done(); Nav.go('game'); self.render();
  };
};
MindMeld._reveal = function() {
  var gs = this.gs, self = this;
  // Count matching answers
  var counts = {};
  Object.values(gs.answers).forEach(function(a){counts[a]=(counts[a]||0)+1;});
  var maxMatch = Math.max.apply(null, Object.values(counts));
  var winners = Object.keys(counts).filter(function(a){return counts[a]===maxMatch;});
  // Award points
  this.players.forEach(function(p) {
    var ans = gs.answers[p.id];
    if (ans && winners.includes(ans)) {
      var pts = counts[ans] * 10;
      gs.sc[p.id] = (gs.sc[p.id]||0) + pts;
    }
  });
  Drama.tick(maxMatch > 1 ? 'win' : 'betray');

  document.getElementById('gbody').innerHTML =
    '<div style="padding:5px 0">' +
    '<div style="text-align:center;margin-bottom:14px">' +
      '<div style="font-size: 0.75rem;opacity:.35;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">The prompt was</div>' +
      '<div style="font-size:1.2rem;font-weight:800">' + gs.prompt + '</div>' +
    '</div>' +
    '<div style="margin-bottom:14px">' +
      this.players.map(function(p){
        var ans = gs.answers[p.id] || '(no answer)';
        var matches = counts[ans] || 0;
        var isWinner = matches === maxMatch;
        return '<div style="display:flex;align-items:center;gap:10px;padding:10px;border-radius:11px;background:'+(isWinner?'rgba(0,212,255,.08)':'rgba(255,255,255,.03)')+';border:1px solid '+(isWinner?'rgba(0,212,255,.25)':'var(--border)')+';margin-bottom:6px"><div>'+p.av+'</div><div style="flex:1"><div style="font-weight:700;font-size:.86rem">'+p.name+'</div><div style="font-size:1rem;font-weight:800;margin-top:2px;color:'+(isWinner?'var(--cyan)':'var(--dim)')+'">'+ans+'</div></div>'+(isWinner?'<div style="font-size:.75rem;color:var(--cyan);font-weight:700">+'+( matches*10)+'</div>':'')+'</div>';
      }).join('') +
    '</div>' +
    (maxMatch>1?'<div style="text-align:center;padding:10px;background:rgba(0,212,255,.08);border-radius:11px;margin-bottom:12px;font-size:.86rem;color:var(--cyan);font-weight:700">🧠 '+maxMatch+' players thought the same!</div>':'<div style="text-align:center;opacity:.38;margin-bottom:12px;font-size:.82rem">No matches this round...</div>') +
    '<button type="button" class="btn bw bf" onclick="window._mmnext()">Next Round →</button>' +
    '</div>';

  window._mmnext = function() {
    gs.round++; gs.answers={}; gs.pidx=0; gs.phase='answer';
    gs.prompt = gs.prompts[gs.promptIdx++ % gs.prompts.length];
    Nav.go('game'); self.render();
  };
};


// ─── V5 SYSTEMS ───
// ═══════════════════════════════════════════════════════════════════
// V5 SYSTEMS: Orientation, Progress Bar, Polish, UX
// ═══════════════════════════════════════════════════════════════════

// ── ORIENTATION MANAGER ──────────────────────────────────────────
var OrientMgr = {
  current: 'portrait',
  init: function() {
    var self = this;
    // Show orientation button on iPad
    var isIPad = (DevSel&&DevSel.device==='ipad') || window.innerWidth >= 768;
    var btn = document.getElementById('orient-btn');
    if (btn && isIPad) btn.classList.add('show');
    window.addEventListener('orientationchange', function() {
      setTimeout(function() { self._update(); }, 300);
    });
    window.addEventListener('resize', function() { self._update(); });
    this._update();
  },
  _update: function() {
    var isLandscape = window.innerWidth > window.innerHeight;
    this.current = isLandscape ? 'landscape' : 'portrait';
    var btn = document.getElementById('orient-btn');
    if (btn) btn.textContent = isLandscape ? '⟳' : '⟲';
    document.body.setAttribute('data-orient', this.current);
    // Update nav for landscape iPad
    if (DevSel && DevSel.device === 'ipad') {
      var nav = document.getElementById('nav');
      if (nav) nav.setAttribute('data-landscape', isLandscape ? '1' : '0');
    }
  },
  toggle: function() {
    if (screen.orientation && screen.orientation.lock) {
      var target = this.current === 'portrait' ? 'landscape' : 'portrait';
      screen.orientation.lock(target).catch(function() {
        toast('Rotate your device manually');
      });
    } else {
      toast('Rotate your device to change orientation');
    }
    Snd.click(); Hap.l();
  }
};

// ── GAME PROGRESS BAR ─────────────────────────────────────────────
var ProgressBar = {
  set: function(pct, col) {
    var fill = document.getElementById('game-progress-fill');
    if (!fill) return;
    fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
    fill.style.background = col || 'var(--acc)';
  },
  clear: function() { this.set(0); }
};

// ── ACHIEVEMENT POPUP (better than toast) ─────────────────────────
var AchPopup = {
  _t: null,
  show: function(icon, title, xp) {
    var el = document.getElementById('ach-popup');
    if (!el) return;
    el.innerHTML =
      '<div style="font-size:2rem">' + icon + '</div>' +
      '<div style="flex:1"><div style="font-weight:800;font-size:.9rem">' + title + '</div>' +
        '<div style="font-size:0.75rem;opacity:.5;margin-top:1px">Achievement unlocked</div></div>' +
      '<div style="color:var(--amber);font-weight:700;font-size:.82rem">+' + xp + ' XP</div>';
    el.classList.add('show');
    clearTimeout(this._t);
    Snd.lvlup(); Hap.ok();
    this._t = setTimeout(function() {
      var e2 = document.getElementById('ach-popup');
      if (e2) e2.classList.remove('show');
    }, 3200);
  }
};

// Override Ach.unlock to use popup
// Ach.unlock handled in final patch

// ── HAPTIC BOUNCE on all card taps ────────────────────────────────
document.addEventListener('touchstart', function(e) {
  var target = e.target.closest('.mcard,.lcard,.btn,.vopt,.pchip');
  if (target && !target.classList.contains('tapped')) {
    target.classList.add('tapped');
    setTimeout(function() { target.classList.remove('tapped'); }, 250);
  }
}, {passive: true});

// Nav.go enhanced inline in v5_full_js

// ── GAME COUNT BADGE ──────────────────────────────────────────────
function updateGameCountBadge() {
  var tried = JSON.parse(localStorage.getItem('po5t') || '[]');
  var total = Reg.list.length;
  var pct = Math.round(tried.length / total * 100);
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = total + ' games · ' + tried.length + ' played · ' + pct + '% explored';
}

// ── SMART WELCOME BACK MESSAGE ────────────────────────────────────
function getWelcomeBack() {
  var hour = new Date().getHours();
  var name = S.prof.name || 'Operative';
  var greetings = {
    morning: ['Good morning, ' + name + '.', 'Rise and game, ' + name + '.', 'Early session, ' + name + '?'],
    afternoon: ['Afternoon, ' + name + '.', 'Good afternoon, ' + name + '.', 'Back for more, ' + name + '?'],
    evening: ['Good evening, ' + name + '.', 'Evening session incoming.', 'Night mode engaged, ' + name + '.'],
    night: ['Late night gaming, ' + name + '.', 'Burning the midnight oil.', 'The night owls are here.']
  };
  var timeKey = hour < 6 ? 'night' : hour < 12 ? 'morning' : hour < 18 ? 'afternoon' : 'evening';
  var pool = greetings[timeKey];
  return pool[Math.floor(Math.random() * pool.length)];
}

// UI.home enhanced in v5_full_js

// ── FIX: exitGame also clears word game timer ─────────────────────
var _origExitV5 = GL.exitGame.bind(GL);
GL.exitGame = function() {
  if (S.game) {
    // Clear all possible timers
    var g = S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_snki'].forEach(function(k){
      if (g[k]) { clearInterval(g[k]); clearTimeout(g[k]); g[k] = null; }
    });
  }
  Drama.state.tension = 0;
  Drama._updateBanner();
  Mutators.active = [];
  ProgressBar.clear();
  releaseWakeLock();
  Bus.emit('game:end', {});
  // Restore nav
  var nav = document.getElementById('nav');
  if (nav) nav.className = '';
  // Clear game screen
  S.game = null;
  Nav.go('home');
};

// ── FIX: Register new V5 games ───────────────────────────────────
// (added to boot below via override)
var _v5Games = [WordAssassin, DeadDrop, BlitzDuel, PixelPainter, SurvivalArena, MindMeld];

// ── V5 BOOT (runs after main boot) ───────────────────────────────
function _prismRegisterV5Now() {
  try {
    _v5Games.forEach(function(g) {
      if (g && g.id && typeof Reg !== 'undefined' && !Reg.get(g.id)) Reg.add(g);
    });
    if (typeof GL !== 'undefined') {
      if (GL._buildLib) GL._buildLib('all');
      if (GL._buildScrolls) GL._buildScrolls();
    }
    if (typeof updateGameCountBadge === 'function') updateGameCountBadge();
    if (typeof OrientMgr !== 'undefined' && OrientMgr.init) OrientMgr.init();
    var lc = document.getElementById('lib-count');
    if (lc && typeof Reg !== 'undefined') lc.textContent = Reg.list.length + ' games · Fully offline';
  } catch (e) {}
}
if (document.readyState === 'complete') {
  setTimeout(_prismRegisterV5Now, 0);
} else {
  window.addEventListener('load', function() { setTimeout(_prismRegisterV5Now, 200); });
}

// ── BACK BUTTON / ESCAPE IMPROVEMENTS ────────────────────────────
// Override browser back button
window.addEventListener('popstate', function(e) {
  if (S.cur === 'game') {
    GL.exitGame();
  } else if (document.getElementById('ov').className === 'open') {
    Modal.close();
  }
});
// Push a state so back button works
if (window.history && window.history.pushState) {
  window.history.pushState({page:'prism'}, 'PrismCap', '');
}

// ── CSP META for cleaner browser behavior ─────────────────────────
// (Already added via HTML patch)

// ── BETTER ERROR BOUNDARY ─────────────────────────────────────────
window.addEventListener('error', function(e) {
  // Only show if it's our code, not browser extensions
  if (e.filename && e.filename.includes('PrismCap')) {
    console.error('PrismCap Error:', e.message, 'at line', e.lineno);
    // Graceful recovery - go home
    if (S && S.cur === 'game') {
      toast('⚠️ Something went wrong — returning home');
      setTimeout(function() { if(GL) GL.exitGame(); }, 1500);
    }
  }
});

// ── INSTALL PROMPT in Profile ─────────────────────────────────────
window.addEventListener('beforeinstallprompt', function(e) {
  e.preventDefault();
  window._installEvt = e;
  // Add install button to profile screen
  var prof = document.getElementById('profile-screen');
  if (prof && !document.getElementById('_install-btn')) {
    var btn = document.createElement('div');
    btn.id = '_install-btn';
    btn.style.cssText = 'margin:0 15px 12px;padding:12px 15px;background:rgba(100,210,255,.08);border:1px solid rgba(100,210,255,.2);border-radius:14px;cursor:pointer;display:flex;align-items:center;gap:10px';
    btn.innerHTML = '<span style="font-size:1.5rem">📱</span><div style="flex:1"><div style="font-weight:700;font-size:.86rem">Install PrismCap</div><div style="font-size:0.75rem;opacity:.4;margin-top:1px">Add to home screen for best experience</div></div><div style="font-size:0.75rem;color:var(--cyan);font-weight:700">Install</div>';
    btn.onclick = function() {
      if (window._installEvt) {
        window._installEvt.prompt();
        window._installEvt.userChoice.then(function(r) {
          if (r.outcome === 'accepted') { toast('✅ PrismCap installed!'); btn.remove(); }
        });
      }
    };
    // Insert before first child after header
    var header = prof.querySelector('[style*="flex-direction:column"]');
    if (header && header.parentNode) header.parentNode.insertBefore(btn, header.nextSibling);
  }
});



// ─── V5 FULL JS ───
// ═══════════════════════════════════════════════════════════════════
// PRISM OS v5 — FULL JS EXPANSION
// All new systems, games, fixes, bots, themes, gender, search
// ═══════════════════════════════════════════════════════════════════

// ── DEVICE MODEL SYSTEM ──────────────────────────────────────────
var DeviceModels = {
  configs: {
    ip16pro: {family:'iphone',sat:59,sab:34,w:393,cssClass:'iphone-di',label:'iPhone 16 Pro'},
    ip15:    {family:'iphone',sat:59,sab:34,w:390,cssClass:'iphone-di',label:'iPhone 15'},
    ip13:    {family:'iphone',sat:47,sab:34,w:390,cssClass:'iphone-notch',label:'iPhone 13'},
    ipse:    {family:'iphone',sat:20,sab:0, w:375,cssClass:'iphone-se',label:'iPhone SE'},
    ipadpro: {family:'ipad', sat:24,sab:20,w:834,cssClass:'ipad-pro',label:'iPad Pro'},
    ipadair: {family:'ipad', sat:20,sab:20,w:820,cssClass:'ipad-air',label:'iPad Air'},
    mac:     {family:'mac',  sat:0, sab:0, w:1440,cssClass:'mac',label:'Mac'}
  },
  apply: function(model) {
    var cfg = this.configs[model];
    if (!cfg) return;
    // Set CSS vars for this exact device
    document.documentElement.style.setProperty('--sat', cfg.sat + 'px');
    document.documentElement.style.setProperty('--sab', cfg.sab + 'px');
    document.body.setAttribute('data-device-model', model);
    document.body.setAttribute('data-device', cfg.family);
    document.body.classList.remove('iphone-di','iphone-notch','iphone-se','ipad-pro','ipad-air','mac');
    document.body.classList.add(cfg.cssClass);
    // Show orientation button on iPad
    var ob = document.getElementById('orient-btn');
    if (ob) ob.className = cfg.family === 'ipad' ? 'show' : '';
  }
};

// Patch DevSel to use DeviceModels
var _origDevSelPick = DevSel.pick.bind(DevSel);
DevSel.pick = function(dev) {
  this.device = dev;
  // Map model to family for backward compat
  var models = DeviceModels.configs;
  var cfg = models[dev] || models.ip15;
  var family = cfg ? cfg.family : dev;
  this.device = family; // store family for layout
  localStorage.setItem(this._k, dev); // store model
  DeviceModels.apply(dev);
  this._applyLayout(family);
  this._hide();
  Hap.ok(); Snd.ok();
  var label = cfg ? cfg.label : dev;
  toast('✅ Optimized for ' + label);
};
// On init, restore saved model
var _origDevSelInit = DevSel.init.bind(DevSel);
DevSel.init = function() {
  var saved = localStorage.getItem(this._k);
  if (saved && DeviceModels.configs[saved]) {
    this.device = DeviceModels.configs[saved].family;
    DeviceModels.apply(saved);
    this._applyLayout(this.device);
    this._hide();
    return;
  }
  // Auto-detect from UA
  var ua = navigator.userAgent;
  var w = window.innerWidth;
  if (/iPad/.test(ua) || (w >= 768 && /Macintosh/.test(ua) && 'ontouchend' in document)) {
    this.device = 'ipad';
    var el = document.getElementById('device-sel');
    if (el) el.style.display = 'flex';
    animLogo('dcan');
  } else if (/iPhone/.test(ua)) {
    this.device = 'iphone';
    var el2 = document.getElementById('device-sel');
    if (el2) el2.style.display = 'flex';
    animLogo('dcan');
  } else {
    DeviceModels.apply('mac');
    this._applyLayout('mac');
    this._hide();
  }
};

// ── ORIENTATION MANAGER ──────────────────────────────────────────
var OrientMgr = {
  current: 'portrait',
  init: function() {
    var self = this;
    window.addEventListener('orientationchange', function() {
      setTimeout(function() { self._update(); }, 300);
    });
    window.addEventListener('resize', function() { self._update(); }, {passive:true});
    this._update();
  },
  _update: function() {
    var isL = window.innerWidth > window.innerHeight;
    this.current = isL ? 'landscape' : 'portrait';
    document.body.setAttribute('data-orient', this.current);
    var btn = document.getElementById('orient-btn');
    if (btn) btn.textContent = isL ? '⟲' : '⟳';
  },
  toggle: function() {
    if (screen.orientation && screen.orientation.lock) {
      var t = this.current === 'portrait' ? 'landscape' : 'portrait';
      screen.orientation.lock(t).catch(function() { toast('Rotate your device to switch'); });
    } else {
      toast('Rotate your device to switch');
    }
    Snd.click(); Hap.l();
  }
};

// ── AI BOT SYSTEM ────────────────────────────────────────────────
var Bot = {
  names: ['🤖 ARIA','🔥 BLAZE','🌊 WAVE','⚡ ZEUS','🎭 ECHO','👾 GLITCH','🌙 LUNA','🐺 WOLF'],
  difficulties: {easy:0.3, normal:0.6, hard:0.9},
  
  createPlayer: function(name, diff) {
    var n = name || this.names[Math.floor(Math.random()*this.names.length)];
    return {
      id: 'bot_' + Date.now(),
      name: n,
      av: n.split(' ')[0],
      col: PCBrand.h_888,
      local: false,
      isBot: true,
      difficulty: diff || 'normal',
      skill: this.difficulties[diff || 'normal']
    };
  },
  
  supports: function(gameId) {
    return BOT_BOARD_GAMES.indexOf(gameId) > -1 || BOT_FILL_GAMES.indexOf(gameId) > -1;
  },
  fillTo: function(target, diff) {
    var out = [];
    for (var i = 0; i < target; i++) {
      if (i === 0) {
        out.push({id:'p1',name:S.prof.name||'Player 1',av:S.prof.av||'😎',col:PCBrand.h_64d2ff,local:true});
      } else {
        var b = this.createPlayer(null, diff || (typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal'));
        b.id = 'p' + (i + 1);
        out.push(b);
      }
    }
    return out;
  },
  vote: function(players, suspect) {
    var pool = players.filter(function(p){return !p.elim && p.id;});
    if (!pool.length) pool = players.slice();
    if (suspect && Math.random() < 0.55) {
      var sus = pool.filter(function(p){return (p.sus||0) > 0;});
      if (sus.length) return sus.sort(function(a,b){return (b.sus||0)-(a.sus||0);})[0];
    }
    var humans = pool.filter(function(p){return !p.isBot;});
    var pickFrom = humans.length ? humans : pool;
    return pickFrom[Math.floor(Math.random()*pickFrom.length)];
  },
  pickRandom: function(items) {
    if (!items || !items.length) return null;
    return items[Math.floor(Math.random()*items.length)];
  },
  autoAct: function(game, player, choices, cb) {
    if (!player || !player.isBot) return;
    var delay = 500 + Math.floor(Math.random()*700);
    setTimeout(function() {
      if (!S.game || S.game.id !== game.id) return;
      var pick = Bot.pickRandom(choices);
      if (pick && cb) cb(pick);
    }, delay);
  },
  
  // Bot chess move (random legal move)
  chessMove: function(board, color) {
    var moves = [];
    for (var r=0;r<8;r++) {
      for (var c=0;c<8;c++) {
        if (board[r][c] && board[r][c][0]===color) {
          var vm = ChessGame._validMoves(board,r,c);
          vm.forEach(function(m){moves.push({from:[r,c],to:m});});
        }
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  },
  
  // Bot draughts move
  draughtsMove: function(board, color) {
    var moves = [];
    for (var r=0;r<8;r++) {
      for (var c=0;c<8;c++) {
        if (board[r][c] && board[r][c].col===color) {
          var m = Draughts._getMoves(board,r,c);
          var all = m.jumps.concat(m.moves);
          all.forEach(function(mv){moves.push({r:r,c:c,move:mv});});
        }
      }
    }
    if (!moves.length) return null;
    return moves[Math.floor(Math.random()*moves.length)];
  },
  
  // Bot connect four - tries to block/win
  c4Move: function(board, myMark, oppMark) {
    // Try to win first
    for (var c=0;c<7;c++) {
      var testBoard = board.map(function(r){return r.slice();});
      var row = ConnectFour._drop(testBoard, c, myMark);
      if (row >= 0 && ConnectFour._check(testBoard, row, c)) return c;
    }
    // Block opponent
    for (var c2=0;c2<7;c2++) {
      var testBoard2 = board.map(function(r){return r.slice();});
      var row2 = ConnectFour._drop(testBoard2, c2, oppMark);
      if (row2 >= 0 && ConnectFour._check(testBoard2, row2, c2)) return c2;
    }
    // Random
    var valid = [];
    for (var c3=0;c3<7;c3++) { if (board[0][c3]===null) valid.push(c3); }
    return valid[Math.floor(Math.random()*valid.length)];
  },
  
  // Bot tic-tac-toe
  tttMove: function(board, myMark, oppMark) {
    var lines=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    // Win
    for (var i=0;i<lines.length;i++) {
      var l=lines[i], vals=l.map(function(x){return board[x];});
      if (vals.filter(function(v){return v===myMark;}).length===2&&vals.includes(null))
        return l[vals.indexOf(null)];
    }
    // Block
    for (var i2=0;i2<lines.length;i2++) {
      var l2=lines[i2], vals2=l2.map(function(x){return board[x];});
      if (vals2.filter(function(v){return v===oppMark;}).length===2&&vals2.includes(null))
        return l2[vals2.indexOf(null)];
    }
    // Center, then corners, then random
    if (!board[4]) return 4;
    var corners=[0,2,6,8];
    for (var ci=0;ci<corners.length;ci++) { if (!board[corners[ci]]) return corners[ci]; }
    var empty=[]; board.forEach(function(v,i){if(!v)empty.push(i);});
    return empty[Math.floor(Math.random()*empty.length)];
  }
};

// Enhance TicTacToe with bot support (game lives in js/games/example-game.js)
window._patchTTTBot = function() {
  var TicTacToe = Reg.get('ttt');
  if (!TicTacToe || TicTacToe._botPatched) return;
  TicTacToe._botPatched = true;
  TicTacToe._botTurn = function() {
    var gs = this.gs, self = this;
    var marks = ['X','O'];
    var curMark = marks[gs.turn];
    var oppMark = marks[1-gs.turn];
    var curPlayer = gs.players[gs.turn];
    if (!curPlayer.isBot) return;
    setTimeout(function() {
      if (self._check(gs.board)) return;
      var move = Bot.tttMove(gs.board, curMark, oppMark);
      if (move === undefined || move === null) return;
      gs.board[move] = curMark;
      Snd.click(); Hap.l();
      var result = self._check(gs.board);
      if (result) {
        if (!result.draw) { self.done(curPlayer.name); Snd.ok(); Hap.ok(); }
        else { self.done(null); }
      } else { gs.turn = 1-gs.turn; }
      Nav.go('game'); self.render();
    }, 600);
  };
  var _origTTTRender = TicTacToe.render.bind(TicTacToe);
  TicTacToe.render = function() {
    _origTTTRender();
    var gs = this.gs;
    if (gs && !this._check(gs.board) && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
      this._botTurn();
    }
  };
};

// Enhance ConnectFour with bot
ConnectFour._botTurn = function() {
  var gs = this.gs, self = this;
  var marks=['A','B'];
  var curMark=marks[gs.turn], oppMark=marks[1-gs.turn];
  if (!gs.players[gs.turn] || !gs.players[gs.turn].isBot) return;
  setTimeout(function() {
    var col = Bot.c4Move(gs.board, curMark, oppMark);
    if (col === null || col === undefined) return;
    var row = ConnectFour._drop(gs.board, col, curMark);
    if (row < 0) return;
    Snd.click(); Hap.l();
    if (ConnectFour._check(gs.board, row, col)) {
      self.done(gs.players[gs.turn].name);
      Nav.go('game');
      self.showWin(gs.players[gs.turn].name, [{n:gs.players[gs.turn].name,s:'4 in a row!'},{n:gs.players[1-gs.turn].name,s:'Defeated'}]);
      return;
    }
    gs.turn = 1-gs.turn;
    Nav.go('game'); self.render();
  }, 700);
};
var _origC4Render = ConnectFour.render.bind(ConnectFour);
ConnectFour.render = function() {
  _origC4Render();
  var gs = this.gs;
  if (gs && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
    this._botTurn();
  }
};

// Enhance Chess with bot
ChessGame._botTurn = function() {
  var gs = this.gs, self = this;
  var curCol = gs.turn===0?'w':'b';
  if (!gs.players[gs.turn] || !gs.players[gs.turn].isBot) return;
  setTimeout(function() {
    var move = Bot.chessMove(gs.board, curCol);
    if (!move) { self.done(gs.players[1-gs.turn].name); self.showWin(gs.players[1-gs.turn].name); return; }
    var from=move.from, to=move.to;
    var captured=gs.board[to[0]][to[1]];
    if(captured){if(captured[0]==='w')gs.captured.w.push(ChessGame._pieces[captured]);else gs.captured.b.push(ChessGame._pieces[captured]);}
    gs.board[to[0]][to[1]]=gs.board[from[0]][from[1]];
    gs.board[from[0]][from[1]]=null;
    if(gs.board[to[0]][to[1]]==='wP'&&to[0]===0)gs.board[to[0]][to[1]]='wQ';
    if(gs.board[to[0]][to[1]]==='bP'&&to[0]===7)gs.board[to[0]][to[1]]='bQ';
    gs.turn=1-gs.turn;
    Snd.click(); Hap.l();
    Nav.go('game'); self.render();
  }, 800);
};
var _origChessRender = ChessGame.render.bind(ChessGame);
ChessGame.render = function() {
  _origChessRender();
  if (this.gs && this.gs.players && this.gs.players[this.gs.turn] && this.gs.players[this.gs.turn].isBot) {
    this._botTurn();
  }
};

// ── EXPANDED THEME SYSTEM with Girly + Colorful themes ───────────
Theme.list = [
  {id:'',        nm:'Minimal',       i:'⬛', bg:[PCBrand.h_000,PCBrand.h_111], acc:PCBrand.h_fff},
  {id:'t-pink',  nm:'Cotton Candy',  i:'🩷', bg:[PCBrand.h_1a0012,PCBrand.h_2d0020], acc:PCBrand.h_ff69b4, girl:true},
  {id:'t-purple',nm:'Lavender',      i:'💜', bg:[PCBrand.h_0d0018,PCBrand.h_1a002e], acc:PCBrand.h_bf5af2, girl:true},
  {id:'t-rose',  nm:'Rose Gold',     i:'🌹', bg:[PCBrand.h_1a0808,PCBrand.h_2d1515], acc:PCBrand.h_ffb6c1, girl:true},
  {id:'t-uni',   nm:'Unicorn',       i:'🦄', bg:[PCBrand.h_0d0020,PCBrand.h_001a0d], acc:PCBrand.h_ff85d3, girl:true},
  {id:'t-cyber', nm:'Cyberpunk',     i:'🟢', bg:[PCBrand.h_001a0e,PCBrand.h_003320], acc:PCBrand.h_00ff88, req:'theme_cyber'},
  {id:'t-neon',  nm:'Neon',          i:'🟣', bg:[PCBrand.h_0d001a,PCBrand.h_1a0033], acc:PCBrand.h_ff00ff},
  {id:'t-term',  nm:'Terminal',      i:'💻', bg:[PCBrand.h_000500,PCBrand.h_001400], acc:PCBrand.h_00ff00},
  {id:'t-horror',nm:'Horror',        i:'🔴', bg:[PCBrand.h_050000,PCBrand.h_200000], acc:PCBrand.h_ff0000, req:'theme_horror'},
  {id:'t-space', nm:'Deep Space',    i:'🔵', bg:[PCBrand.h_00000d,PCBrand.h_00001a], acc:PCBrand.h_4488ff},
  {id:'t-gold',  nm:'Gold',          i:'🟡', bg:[PCBrand.h_0a0800,PCBrand.h_1a1400], acc:PCBrand.h_ffd700, req:'theme_gold'},
  {id:'t-synth', nm:'Synthwave',     i:'🩷', bg:[PCBrand.h_0d0010,PCBrand.h_1a0020], acc:PCBrand.h_ff6ec7, req:'theme_synth'},
  {id:'t-mid',   nm:'Midnight',      i:'🔮', bg:[PCBrand.h_05050f,PCBrand.h_0a0a1e], acc:PCBrand.h_8888ff},
  {id:'t-red',   nm:'Red Alert',     i:'🚨', bg:[PCBrand.h_0f0000,PCBrand.h_1f0000], acc:PCBrand.h_ff2d55},
  {id:'t-galaxy',nm:'Galaxy',        i:'🌌', bg:[PCBrand.h_000010,PCBrand.h_00002a], acc:PCBrand.h_7b68ee},
  {id:'t-sunset',nm:'Sunset',        i:'🌅', bg:[PCBrand.h_1a0800,PCBrand.h_2a1000], acc:PCBrand.h_ff8c00, girl:true},
  {id:'t-mint',  nm:'Mint',          i:'🌿', bg:[PCBrand.h_001a10,PCBrand.h_002a18], acc:PCBrand.h_98ff98, girl:true},
  {id:'t-glitch',nm:'GLITCH',        i:'👾', bg:[PCBrand.h_000,PCBrand.h_001a1a], acc:PCBrand.h_00ffff, req:'theme_glitch', legendary:true}
];

// Add theme CSS for new themes
var newThemeCSS = `
body.t-pink{--acc:'+PCBrand.h_ff69b4+';--glow:rgba(255,105,180,.28)}
body.t-purple{--acc:'+PCBrand.h_bf5af2+';--glow:rgba(191,90,242,.28)}
body.t-rose{--acc:'+PCBrand.h_ffb6c1+';--glow:rgba(255,182,193,.28)}
body.t-uni{--acc:'+PCBrand.h_ff85d3+';--glow:rgba(255,133,211,.28)}
body.t-galaxy{--acc:'+PCBrand.h_7b68ee+';--glow:rgba(123,104,238,.28)}
body.t-sunset{--acc:'+PCBrand.h_ff8c00+';--glow:rgba(255,140,0,.28)}
body.t-mint{--acc:'+PCBrand.h_98ff98+';--glow:rgba(152,255,152,.28)}
body.t-pink #bg,body.t-rose #bg,body.t-uni #bg{filter:hue-rotate(300deg)}
body.t-galaxy #bg{filter:hue-rotate(200deg)}
`;
var styleTag = document.createElement('style');
styleTag.textContent = newThemeCSS;
document.head.appendChild(styleTag);

// Theme build override to show girl-recommended themes
var _origThemeBuild = Theme.build.bind(Theme);
Theme.build = function(el) {
  if (!el) return;
  el.innerHTML = '';
  var self = this;
  var gender = S.prof.gender || 'skip';
  this.list.forEach(function(th) {
    var locked = th.req && !Meta.isUnlocked(th.req);
    var d = document.createElement('div');
    d.className = 'ttile' + (S.cfg.theme===th.id?' act':'') + (locked?' locked-tile':'');
    d.style.background = 'linear-gradient(135deg,' + th.bg[0] + ',' + th.bg[1] + ')';
    d.style.opacity = locked ? '0.38' : '1';
    var isRecommended = (gender==='girl'||gender==='other') && th.girl;
    d.innerHTML = '<div style="height:100%;display:flex;flex-direction:column;justify-content:space-between;padding:8px 9px">' +
      '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:4px">' +
        '<div class="ttile-icon">' + (locked?'🔒':th.i) + '</div>' +
        (isRecommended?'<div style="font-size: 0.75rem;background:rgba(255,182,193,.3);border-radius:4px;padding:1px 5px;color:'+PCBrand.h_ffb6c1+';font-weight:700;white-space:nowrap">✨</div>':'') +
      '</div>' +
      '<div class="ttile-name">' + (th.legendary?'★ ':'') + th.nm + '</div>' +
      '</div>';
    d.onclick = function() {
      if (locked) { toast('🔒 Unlock via XP'); return; }
      self.apply(th.id);
      el.querySelectorAll('.ttile').forEach(function(x){x.classList.remove('act');});
      d.classList.add('act');
      Hap.m(); toast('Theme: ' + th.nm);
    };
    el.appendChild(d);
  });
};

// ── GENDER-AWARE WELCOME COMPLETION ──────────────────────────────
W.setGender = function(g, el) {
  S.prof.gender = g;
  document.querySelectorAll('#ws2 .pchip').forEach(function(e){ e.classList.remove('on'); });
  if (el) el.classList.add('on');
  Hap.l();
};

// Patch W.next to handle new steps
var _origWNext = W.next.bind(W);
W.next = function() {
  if (this._step===1) {
    var nm=(document.getElementById('wname').value||'').trim();
    if(!nm){toast('Enter your name! ✨');return;}
    S.prof.name=nm;
  }
  var maxStep = 4;
  if (this._step>=maxStep) { this._scan(); return; }
  // Handle renamed step IDs
  var nextStep = this._step + 1;
  // Step 4 is ws4r (renamed from ws4 to avoid conflict with scan)
  document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});
  var el = document.getElementById('ws'+nextStep) || document.getElementById('ws'+nextStep+'r');
  if (el) el.classList.add('active');
  this._step = nextStep;
  var dots=document.querySelectorAll('.wprogdot');
  dots.forEach(function(d,i){d.className='wprogdot'+(i<nextStep?' on':'');});
  Snd.click();
};

// Override W._goStep for new step count
W._goStep = function(n) {
  document.querySelectorAll('.wstep').forEach(function(s){s.classList.remove('active');});
  var el = document.getElementById('ws'+n) || document.getElementById('ws'+n+'r');
  if (el) el.classList.add('active');
  this._step = n;
  var dots=document.querySelectorAll('.wprogdot');
  dots.forEach(function(d,i){d.className='wprogdot'+(i<n?' on':'');});
  Snd.click();
};

// Update scan step to use ws5
W._scan = function() {
  var self=this;
  this._goStep(5);
  var msgs=['Analyzing playstyle...','Building operator profile...','Calibrating betrayal index...','Selecting themes for you...','⚡ Profile ready!'];
  var bar=document.getElementById('wscan-bar');
  var msg=document.getElementById('wscan-msg');
  var icon=document.getElementById('wscan-icon');
  var result=document.getElementById('wscan-result');
  var gender=S.prof.gender||'skip';
  var prs=Persona.types[{deception:'deceptive',strategy:'strategic',reflex:'aggressive',chaos:'chaotic',party:'survivor',creative:'survivor'}[self._style||'chaos']||'survivor'];
  // Suggest theme based on gender
  var suggestedTheme = gender==='girl'||gender==='other' ? 't-pink' : '';
  var i=0;
  var iv=setInterval(function(){
    if(msg)msg.textContent=msgs[i]||'';
    if(bar)bar.style.width=((i+1)/msgs.length*100)+'%';
    i++;
    if(i>=msgs.length){
      clearInterval(iv);
      if(icon)icon.textContent=prs?prs.icon:'🔰';
      if(result){
        result.style.opacity='1';
        result.innerHTML='<div style="font-size:1.2rem;font-weight:800;margin-bottom:4px">'+(prs?prs.label:'Operative')+'</div>' +
          (suggestedTheme?'<div style="font-size:.78rem;color:'+PCBrand.h_ffb6c1+';margin-bottom:10px">✨ Pink theme pre-selected for you!</div>':'') +
          '<div style="opacity:.38;font-size:.75rem;margin-bottom:16px">Starting rank: Rookie</div>' +
          '<button type="button" class="btn bw bf" style="max-width:240px" onclick="W.showGamePicker()">Pick your first game →</button>';
      }
      // Pre-apply suggested theme
      if(suggestedTheme){Theme.apply(suggestedTheme);}
      Hap.ok();
    }
  },400);
};

W.suggestGames = function() {
  var style = S.prof.style || this._style || 'chaos';
  var typeMap = {
    deception: ['deduction', 'bluffing'],
    strategy: ['strategy'],
    reflex: ['reflex'],
    chaos: ['party', 'survival'],
    party: ['party'],
    creative: ['puzzle', 'memory']
  };
  var types = typeMap[style] || ['party'];
  var picks = Reg.list.filter(function(g) { return types.indexOf(g.type) >= 0; });
  if (picks.length < 3) {
    var seen = {};
    picks.forEach(function(g) { seen[g.id] = 1; });
    Reg.list.forEach(function(g) {
      if (!seen[g.id] && picks.length < 6) { picks.push(g); seen[g.id] = 1; }
    });
  }
  return picks.slice(0, 6);
};

W.renderGamePicker = function() {
  var grid = document.getElementById('wgame-grid');
  if (!grid) return;
  var games = this.suggestGames();
  grid.innerHTML = games.map(function(g) {
    return '<div class="lcard" style="background:' + g.col + '12;border:1px solid ' + g.col + '28;cursor:pointer;padding:10px" onclick="W.pickFirstGame(\'' + g.id + '\')">' +
      '<div style="font-size:1.5rem;margin-bottom:4px">' + g.icon + '</div>' +
      '<div style="font-size:.78rem;font-weight:800;line-height:1.2">' + g.title + '</div>' +
      '<div style="font-size: 0.75rem;opacity:.4;margin-top:2px;text-transform:uppercase;letter-spacing:.06em">' + g.type + '</div></div>';
  }).join('');
};

W.showGamePicker = function() {
  this.renderGamePicker();
  this._goStep(6);
};

W.pickFirstGame = function(id) {
  this.finish();
  setTimeout(function() { if (typeof GL !== 'undefined' && GL.launch) GL.launch(id); }, 480);
};

W.skipGamePicker = function() {
  this.finish();
  setTimeout(function() { Nav.go('library'); }, 300);
};

// ── GAME SEARCH ──────────────────────────────────────────────────
GL.search = function(query) {
  var q = query.toLowerCase().trim();
  if (!q) { this._buildLib('all'); return; }
  var results = Reg.list.filter(function(g) {
    return g.title.toLowerCase().includes(q) ||
           g.type.toLowerCase().includes(q) ||
           g.desc.toLowerCase().includes(q) ||
           (g.cat&&g.cat.toLowerCase().includes(q));
  });
  var grid = document.getElementById('lib');
  if (!grid) return;
  var lc = document.getElementById('lib-count');
  if (lc) lc.textContent = results.length + ' results';
  if (!results.length) {
    grid.innerHTML = '<div style="text-align:center;padding:30px;opacity:.3;font-size:.9rem;grid-column:1/-1">No games found for "' + query + '"</div>';
    return;
  }
  grid.innerHTML = results.map(function(g){
    return '<div class="lcard" style="background:'+g.col+'12;border:1px solid '+g.col+'28" onclick="GL.launch(\''+g.id+'\')"><div><div style="font-size:1.8rem;margin-bottom:5px">'+g.icon+'</div><div style="font-size:.88rem;font-weight:800;line-height:1.2">'+g.title+'</div><div style="font-size:0.75rem;opacity:.4;margin-top:2px;letter-spacing:.02em">'+g.type+'</div></div><div><div style="display:inline-flex;align-items:center;gap:3px;background:rgba(255,255,255,.07);border-radius:100px;padding:3px 8px;font-size:0.75rem;font-weight:700;margin-top:5px">'+(g.mp?'👥 '+g.min+'-'+g.max+'p':'🎮 Solo')+'</div></div></div>';
  }).join('');
};

// ── HIGH SCORES / RECORDS SYSTEM ─────────────────────────────────
var Records = {
  _k: 'po5_records',
  data: {},
  load: function() {
    try { this.data = JSON.parse(localStorage.getItem(this._k)||'{}'); } catch(e) {}
  },
  save: function() {
    try { localStorage.setItem(this._k, JSON.stringify(this.data)); } catch(e) {}
  },
  update: function(gameId, score, meta) {
    if (!this.data[gameId] || score > this.data[gameId].score) {
      var isNew = !!this.data[gameId];
      this.data[gameId] = {score:score, ts:Date.now(), meta:meta||{}};
      this.save();
      if (isNew) { toast('🏆 NEW RECORD! ' + score + ' pts'); Snd.lvlup(); Hap.ok(); }
      return true;
    }
    return false;
  },
  get: function(gameId) { return this.data[gameId] || null; },
  getAll: function() { return this.data; },
  buildTable: function(el) {
    if (!el) return;
    var entries = Object.entries(this.data);
    if (!entries.length) { el.innerHTML='<div style="opacity:.25;text-align:center;padding:20px;font-size:.84rem">No records yet! Play some games 🎮</div>'; return; }
    el.innerHTML = entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,15).map(function(e,i){
      var g = Reg.get(e[0]);
      return '<div style="display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
        '<div style="width:22px;text-align:center;font-size:.75rem;font-weight:800;color:' + (i===0?'var(--amber)':i===1?'var(--dim)':i===2?PCBrand.h_cd7f32:'var(--dim)') + '">' + (i<3?['🥇','🥈','🥉'][i]:i+1) + '</div>' +
        '<div style="font-size:1.2rem">' + (g?g.icon:'🎮') + '</div>' +
        '<div style="flex:1"><div style="font-weight:700;font-size:.82rem">' + (g?g.title:e[0]) + '</div></div>' +
        '<div style="font-size:1rem;font-weight:800;color:var(--amber)">' + e[1].score + '</div>' +
      '</div>';
    }).join('');
  }
};

// Hook Records into game done
var _origGameDone = Game.prototype.done;
Game.prototype.done = function(winner) {
  _origGameDone.call(this, winner);
  // Record high scores for solo games
  if (!this.mp && this.gs) {
    var sc = this.gs.sc || this.gs.score || 0;
    if (sc > 0) Records.update(this.id, sc, {lvl:this.gs.lvl||1});
  }
};

// ── HIGH SCORES IN DASHBOARD ──────────────────────────────────────
var _origUIDash = UI.dash.bind(UI);
UI.dash = function() {
  _origUIDash();
  // Build records table
  var rl = document.getElementById('records-list');
  if (rl) Records.buildTable(rl);
};

// ── PROGRESS BAR SYSTEM ───────────────────────────────────────────
var ProgressBar = {
  set: function(pct, col) {
    var fill = document.getElementById('game-progress-fill');
    if (!fill) return;
    fill.style.width = Math.min(100,Math.max(0,pct))+'%';
    fill.style.background = col||'var(--acc)';
    fill.style.boxShadow = '0 0 8px '+(col||'var(--acc)');
  },
  clear: function() { var f=document.getElementById('game-progress-fill');if(f){f.style.width='0%';} }
};

// ── ACHIEVEMENT POPUP ─────────────────────────────────────────────
var AchPopup = {
  _t: null,
  show: function(icon, title, xp) {
    var el = document.getElementById('ach-popup');
    if (!el) { toast('🏆 '+title+'! +'+xp+' XP'); return; }
    el.innerHTML = '<div style="font-size:1.8rem">'+icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.88rem">'+title+'</div><div style="font-size: 0.75rem;opacity:.5;margin-top:1px">Achievement unlocked! 🎉</div></div><div style="color:var(--amber);font-weight:800;font-size:.85rem">+'+xp+'</div>';
    el.classList.add('show');
    clearTimeout(this._t);
    Snd.lvlup(); Hap.ok();
    this._t = setTimeout(function(){var e2=document.getElementById('ach-popup');if(e2)e2.classList.remove('show');},3200);
  }
};
// Ach.unlock patched below

// ── BOT SETUP IN GAME LAUNCHER (solo → large groups) ───────────────
var _origGLsetup = GL._setup.bind(GL);
GL._setup = function(game) {
  var self = this;
  var avs = ['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
  var cols = [PCBrand.h_ff2d55,PCBrand.h_ff6b00,PCBrand.h_bf5af2,PCBrand.h_00d4ff,PCBrand.h_30d158,PCBrand.h_ffd60a,PCBrand.h_64d2ff,PCBrand.h_ff375f];
  var pc = game.min;
  var players = Array.from({length: pc}, function(_, i) {
    return {id:'p'+(i+1), name:i===0?(S.prof.name||'Player 1'):'Player '+(i+1), av:avs[i%avs.length], col:cols[i%cols.length], local:i===0};
  });
  var supportsBots = Bot.supports(game.id);

  function syncPlayers() {
    while (players.length < pc) {
      var n = players.length + 1;
      players.push({id:'p'+n, name:'Player '+n, av:avs[(n-1)%avs.length], col:cols[(n-1)%cols.length], local:false});
    }
    if (players.length > pc) players.length = pc;
    players.forEach(function(p, j) { p.id = 'p' + (j + 1); });
  }

  var render = function() {
    syncPlayers();
    var presets = [
      {n:1, label:'Solo', show: game.min <= 1},
      {n:2, label:'Duo', show: game.min <= 2 && game.max >= 2},
      {n:4, label:'Party 4', show: game.max >= 4},
      {n:6, label:'Party 6', show: game.max >= 6},
      {n:10, label:'Full 10', show: game.max >= 10},
      {n:game.max, label:'Max '+game.max, show: game.max > 2}
    ].filter(function(p, i, arr) {
      return p.show && p.n >= game.min && p.n <= game.max && arr.findIndex(function(x){return x.n===p.n;}) === i;
    });

    Modal.open(
      '<div>' +
      '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
        '<div style="font-size:2rem">'+game.icon+'</div>' +
        '<div><div style="font-size:1rem;font-weight:800">'+game.title+'</div><div style="font-size:.73rem;opacity:.38">'+game.desc+'</div></div>' +
      '</div>' +
      (supportsBots ?
        '<div onclick="Difficulty.pick(function(){Modal.close();setTimeout(render,280);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
          '<span style="font-size:1.2rem">'+Difficulty.get().icon+'</span>' +
          '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">'+Difficulty.get().label+'</div><div style="font-size: 0.75rem;opacity:.38">'+Difficulty.get().desc+'</div></div>' +
          '<div style="font-size: 0.75rem;opacity:.4">Change ›</div>' +
        '</div>' : '') +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
        '<div style="font-size: 0.75rem;opacity:.32;letter-spacing:.09em;text-transform:uppercase">Players</div>' +
        '<div style="font-size: 0.75rem;opacity:.35">'+game.min+'–'+game.max+' allowed</div>' +
      '</div>' +
      '<div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;padding:10px 12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:12px">' +
        '<button type="button" class="btn bg bsm" style="width:36px;padding:8px 0" onclick="window._dec()"'+(pc<=game.min?' disabled style="opacity:.35"':'')+'>−</button>' +
        '<div style="flex:1;text-align:center"><div style="font-size:1.4rem;font-weight:800">'+pc+'</div><div style="font-size:0.75rem;opacity:.35">of '+game.max+'</div></div>' +
        '<button type="button" class="btn bg bsm" style="width:36px;padding:8px 0" onclick="window._inc()"'+(pc>=game.max?' disabled style="opacity:.35"':'')+'>+</button>' +
      '</div>' +
      (presets.length ?
        '<div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:10px">'+presets.map(function(p){
          return '<button type="button" class="btn bg bsm" style="padding:6px 10px;font-size:0.75rem'+(pc===p.n?';border-color:var(--cyan)':'')+'" onclick="window._preset('+p.n+')">'+p.label+'</button>';
        }).join('')+'</div>' : '') +
      '<div id="_pl">'+players.map(function(p,i){
        return '<div class="pchip" style="align-items:center"><div style="width:30px;height:30px;border-radius:50%;background:'+p.col+'1c;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0">'+(p.isBot?'🤖':p.av)+'</div>' +
          (p.isBot ?
            '<div style="flex:1;font-size:.84rem;font-weight:600;opacity:.7">'+p.name+'</div><div onclick="window._rp('+i+')" style="opacity:.4;cursor:pointer;padding:4px">✕</div>' :
            '<input class="pinp" placeholder="Player '+(i+1)+'" value="'+p.name+'" onchange="window._pn('+i+',this.value)" oninput="window._pn('+i+',this.value)">'+(i>0?'<div onclick="window._rp('+i+')" style="opacity:.22;cursor:pointer;padding:4px">✕</div>':'')+''
          )+'</div>';
      }).join('')+'</div>' +
      '<div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:6px">' +
        (pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._ap()">+ Human</button>':'') +
        (supportsBots&&pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._ab()">🤖 Add Bot</button>':'') +
        (supportsBots&&pc<game.max?'<button type="button" class="btn bg" style="flex:1;font-size:.8rem;padding:10px" onclick="window._fill()">🤖 Fill Bots</button>':'') +
      '</div>' +
      (Mutators.active.length?'<div style="display:flex;flex-wrap:wrap;gap:4px;margin:8px 0">'+Mutators.active.map(function(m){return'<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:2px 8px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('')+'</div>':'') +
      '<div style="display:flex;gap:7px;margin-top:10px">' +
        '<button type="button" class="btn bg" style="padding:11px 14px" onclick="window._smut()">⚙️</button>' +
        '<button type="button" class="btn bg" style="padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){Modal.close();setTimeout(render,280);});},280)">📖</button>' +
        '<button type="button" class="btn bw" style="flex:1" onclick="window._sg()">▶ Start ('+pc+'p)</button>' +
      '</div></div>'
    );
    window._pn = function(i,v){players[i].name=v||'Player '+(i+1);};
    window._inc = function(){if(pc>=game.max)return;pc++;render();};
    window._dec = function(){if(pc<=game.min)return;pc--;render();};
    window._preset = function(n){pc=Math.max(game.min,Math.min(game.max,n));render();};
    window._ap = function(){if(pc>=game.max)return;pc++;render();};
    window._ab = function(){if(pc>=game.max)return;pc++;var b=Bot.createPlayer(null,Difficulty.current);b.id='p'+pc;players[pc-1]=b;render();};
    window._fill = function(){
      var diff = typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal';
      players = Bot.fillTo(pc, diff);
      render();
    };
    window._rp = function(i){if(pc<=game.min){toast('Min '+game.min+' players');return;}players.splice(i,1);pc--;render();};
    window._sg = function(){Modal.close();setTimeout(function(){Tutorial.show(game,function(){Cinematic.show(game,players,function(){self._start(game,players);});});},270);};
    window._smut = function(){Modal.close();setTimeout(function(){Mutators.showPicker(function(){render();});},270);};
  };
  render();
};

// ── SOLO GAME LAUNCHER with difficulty + bot context ─────────────
var _origGLlaunch = GL.launch.bind(GL);
GL.launch = function(id) {
  var game=Reg.get(id);
  if(!game){toast('Game not found');return;}
  Snd.click();Hap.m();
  if(game.mp){this._setup(game);return;}
  var self=this;
  var players=[{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_64d2ff,local:true}];
  var rec=Records.get(id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:11px;margin-bottom:12px">' +
      '<div style="font-size:2.2rem">'+game.icon+'</div>' +
      '<div><div style="font-size:1rem;font-weight:800">'+game.title+'</div><div style="font-size:.73rem;opacity:.38">'+game.desc+'</div></div>' +
    '</div>' +
    (rec?'<div style="padding:10px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.2);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px"><div style="font-size:1.2rem">🏆</div><div><div style="font-size:0.75rem;opacity:.38">Your best</div><div style="font-weight:800;font-size:.88rem;color:var(--amber)">'+rec.score+' pts</div></div></div>':'') +
    '<div onclick="Difficulty.pick(function(){Modal.close();GL.launch(\''+id+'\');})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:11px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
      '<span style="font-size:1.2rem">'+Difficulty.get().icon+'</span>' +
      '<div style="flex:1"><div style="font-size:.8rem;font-weight:700">'+Difficulty.get().label+'</div><div style="font-size: 0.75rem;opacity:.38">'+Difficulty.get().desc+'</div></div>' +
      '<div style="font-size: 0.75rem;opacity:.4">Change ›</div>' +
    '</div>' +
    '<div style="display:flex;gap:7px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:11px 14px" onclick="Modal.close();setTimeout(function(){Tutorial.show(game,function(){GL.launch(\''+id+'\');});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1" onclick="window._ssg()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window._ssg=function(){Modal.close();setTimeout(function(){Tutorial.show(game,function(){Cinematic.show(game,players,function(){self._start(game,players);});});},270);};
};

// ── EXIT GAME CLEANUP (comprehensive) ────────────────────────────
GL.exitGame = function() {
  if(S.game){
    var g=S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_bd','_bdInt'].forEach(function(k){
      try{clearInterval(g[k]);clearTimeout(g[k]);g[k]=null;}catch(e){}
    });
  }
  Drama.state.tension=0;Drama._updateBanner();
  Mutators.active=[];
  ProgressBar.clear();
  if(typeof releaseWakeLock==='function')releaseWakeLock();
  Bus.emit('game:end',{});
  var nav=document.getElementById('nav');if(nav)nav.className='';
  S.game=null;
  Nav.go('home');
};

// ── HIGH SCORES SECTION IN DASHBOARD ─────────────────────────────
// Inject records section into dashboard HTML after achievements
var dashObserver = new MutationObserver(function() {
  var achl = document.getElementById('achl');
  if (achl && !document.getElementById('records-list')) {
    var recDiv = document.createElement('div');
    recDiv.style.cssText = 'padding:0 15px;margin-top:14px';
    recDiv.innerHTML = '<div class="sec" style="margin-bottom:9px">🏆 High Scores</div><div id="records-list"></div>';
    achl.parentNode.parentNode.appendChild(recDiv);
    dashObserver.disconnect();
  }
});

// UI.home consolidated below

// ── NEW GAMES REGISTRATION ────────────────────────────────────────
// Register v5 games when they exist
function registerV5Games() {
  var v5list = [
    typeof WordAssassin!=='undefined'?WordAssassin:null,
    typeof DeadDrop!=='undefined'?DeadDrop:null,
    typeof BlitzDuel!=='undefined'?BlitzDuel:null,
    typeof PixelPainter!=='undefined'?PixelPainter:null,
    typeof SurvivalArena!=='undefined'?SurvivalArena:null,
    typeof MindMeld!=='undefined'?MindMeld:null
  ].filter(Boolean);
  v5list.forEach(function(g){if(!Reg.get(g.id))Reg.add(g);});
  GL._buildLib('all');
  GL._buildScrolls();
  var lc=document.getElementById('lib-count');
  if(lc)lc.textContent=Reg.list.length+' games · Fully offline';
}

// ── SINGLE INIT (on load) ─────────────────────────────────────────
window.addEventListener('load', function() {
  Records.load();
  OrientMgr.init();
  // Register records in dashboard section
  setTimeout(function(){
    dashObserver.observe(document.body,{childList:true,subtree:true});
    registerV5Games();
    // Apply saved theme
    if(S.cfg.theme)Theme.apply(S.cfg.theme);
    // Gender-aware avatar suggestions
    var gender=S.prof.gender||'skip';
    if(W.init){
      var girlAvs=['🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🌙','💅'];
      var boyAvs=['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🤖','💀','🎭','🔥'];
      var allAvs=['😎','🦊','🐺','🦁','🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀'];
      W._avList = gender==='girl'?girlAvs:gender==='boy'?boyAvs:allAvs;
    }
  }, 500);

  // Back button via history API
  if(window.history&&window.history.pushState){
    window.history.pushState({page:'prism'},'PrismCap','');
    window.addEventListener('popstate',function(){
      if(S.cur==='game')GL.exitGame();
      else if(document.getElementById('ov')&&document.getElementById('ov').className==='open')Modal.close();
    });
  }

  // Wake lock
  function requestWakeLock(){if('wakeLock' in navigator){navigator.wakeLock.request('screen').then(function(wl){window._wl=wl;}).catch(function(){});}}
  window.requestWakeLock=requestWakeLock;
  window.releaseWakeLock=function(){if(window._wl){window._wl.release().catch(function(){});window._wl=null;}};
});

// ── W.init OVERRIDE for gender-aware avatars ──────────────────────
var _origWInit=W.init.bind(W);
W.init=function(){
  var avs=this._avList||['😎','🦊','🐺','🦁','🐯','🦅','🐲','👾','🌸','💖','🌺','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀'];
  var c=document.getElementById('wavs');if(!c)return;
  var self=this;
  c.innerHTML=avs.map(function(a){return'<div onclick="W._selAv(\''+a+'\',this)" style="width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid '+(a===self._av?PCBrand.h_fff:'transparent')+';display:flex;align-items:center;justify-content:center;font-size:1.25rem;cursor:pointer">'+a+'</div>';}).join('');
};




// ═══════════════════════════════════════════════════════════════════
// CLEAN V5 ENHANCEMENTS (single, non-recursive)
// ═══════════════════════════════════════════════════════════════════

// ── CLEAN Nav.go ENHANCEMENT ─────────────────────────────────────
// Patches Nav.go ONCE with progress bar + scroll to top
// Nav.go clean override is in v6 section;

// ── CLEAN UI.home ENHANCEMENT ────────────────────────────────────
// Patches UI.home ONCE with greeting + recommended + badge
(function() {
  var _baseHome = UI.home.bind(UI);
  UI.home = function() {
    _baseHome();
    if (typeof GL !== 'undefined' && GL._buildScrolls) GL._buildScrolls();
    // Greeting
    var h = new Date().getHours();
    var n = S.prof.name || 'Player';
    var g = [
      h<6  ? '🌙 Night owl mode, '+n+'!' :
      h<12 ? '☀️ Morning, '+n+'! Ready to play?' :
      h<18 ? '👋 Hey '+n+'! Back for more?' :
             '🎮 Game night, '+n+'! Let us play!'
    ][0];
    var gr = document.getElementById('home-greeting');
    if (gr) gr.textContent = g;
    // Game count badge
    if (typeof Reg !== 'undefined') {
      var lc = document.getElementById('lib-count');
      if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
    }
    // Recommended game
    if (typeof buildRecommended === 'function') setTimeout(buildRecommended, 200);
    // Records update
    if (typeof Records !== 'undefined' && typeof Records.load === 'function') Records.load();
    if (window.Rec && typeof Rec.render === 'function') Rec.render();
  };
})();

// ── CLEAN GL.exitGame ─────────────────────────────────────────────
GL.exitGame = function() {
  if (S.game) {
    var g = S.game;
    ['_ft','_rt2','_dt','_qi','_rl','_si','_pti','_snki','_ifi','_ck','_wt','_pci','_bdInt'].forEach(function(k) {
      try { clearInterval(g[k]); clearTimeout(g[k]); g[k] = null; } catch(e) {}
    });
  }
  if (typeof Drama !== 'undefined') { Drama.state.tension = 0; Drama._updateBanner(); }
  if (typeof Mutators !== 'undefined') Mutators.active = [];
  if (typeof ProgressBar !== 'undefined') ProgressBar.clear();
  if (typeof releaseWakeLock === 'function') releaseWakeLock();
  Bus.emit('game:end', {});
  var nav = document.getElementById('nav');
  if (nav) nav.className = '';
  var tb = document.getElementById('tension-bar');
  if (tb) tb.style.display = 'none';
  S.game = null;
  Nav.go('home');
};

// ── CLEAN HIGH SCORES IN DASHBOARD ───────────────────────────────
var _baseUIDash = UI.dash.bind(UI);
UI.dash = function() {
  _baseUIDash();
  var rl = document.getElementById('records-list');
  if (rl && typeof Records !== 'undefined') Records.buildTable(rl);
};

// ── CLEAN GAME START (no auto-suspend) ───────────────────────────
GL._start = function(game, players) {
  S.game = game;
  game.setup(players);
  if (typeof Mutators !== 'undefined') Mutators.apply();
  Nav.go('game');
  var gt = document.getElementById('gtitle');
  if (gt) gt.textContent = game.title;
  var gb = document.getElementById('gbody');
  if (gb) {
    gb.style.setProperty('--acc', game.col);
    gb.style.setProperty('--glow', game.col + '3a');
  }
  // Enable hint button
  var hb = document.getElementById('ghint-btn');
  if (hb) {
    var hasHints = typeof Hints !== 'undefined' && Hints._db && Hints._db[game.id] && Hints._db[game.id].length > 0;
    hb.style.display = hasHints ? 'flex' : 'none';
  }
  game.render();
  Snd.reveal();
  if (typeof requestWakeLock === 'function') requestWakeLock();
  Bus.emit('game:start', {game: game});
  // NO auto-suspend here - removed, it caused game interruptions
};



// ─── V5 FINAL PATCH ───
// ═══════════════════════════════════════════════════════════════════
// V5 FINAL PATCH - Device Models, Clean DevSel, All fixes
// ═══════════════════════════════════════════════════════════════════

// ── COMPREHENSIVE DEVICE MODEL DATABASE ──────────────────────────
var DeviceModels = {
  models: {
    iphone: [
      // iPhone 16 series
      {id:'ip16pm', label:'iPhone 16 Pro Max',   note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip16p',  label:'iPhone 16 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip16pm2',label:'iPhone 16 Plus',       note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip16',   label:'iPhone 16',            note:'Dynamic Island · 390×844',  sat:59, sab:34, w:390, di:true},
      // iPhone 15 series
      {id:'ip15pm', label:'iPhone 15 Pro Max',    note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip15p',  label:'iPhone 15 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip15pl', label:'iPhone 15 Plus',       note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip15',   label:'iPhone 15',            note:'Dynamic Island · 390×844',  sat:59, sab:34, w:390, di:true},
      // iPhone 14 series
      {id:'ip14pm', label:'iPhone 14 Pro Max',    note:'Dynamic Island · 430×932',  sat:59, sab:34, w:430, di:true},
      {id:'ip14p',  label:'iPhone 14 Pro',        note:'Dynamic Island · 393×852',  sat:59, sab:34, w:393, di:true},
      {id:'ip14pl', label:'iPhone 14 Plus',       note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip14',   label:'iPhone 14',            note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 13 series
      {id:'ip13pm', label:'iPhone 13 Pro Max',    note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip13p',  label:'iPhone 13 Pro',        note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      {id:'ip13',   label:'iPhone 13 / mini',     note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 12 series
      {id:'ip12pm', label:'iPhone 12 Pro Max',    note:'Notch · 428×926',           sat:47, sab:34, w:428, di:false},
      {id:'ip12p',  label:'iPhone 12 Pro',        note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      {id:'ip12',   label:'iPhone 12 / mini',     note:'Notch · 390×844',           sat:47, sab:34, w:390, di:false},
      // iPhone 11 / X series
      {id:'ip11pm', label:'iPhone 11 Pro Max',    note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ip11p',  label:'iPhone 11 Pro / XS',   note:'Notch · 375×812',           sat:44, sab:34, w:375, di:false},
      {id:'ip11',   label:'iPhone 11 / XR',       note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ipxsm',  label:'iPhone XS Max',        note:'Notch · 414×896',           sat:44, sab:34, w:414, di:false},
      {id:'ipxs',   label:'iPhone XS / X',        note:'Notch · 375×812',           sat:44, sab:34, w:375, di:false},
      // Older
      {id:'ipse3',  label:'iPhone SE (3rd/2nd gen)', note:'No notch · 375×667',    sat:20, sab:0,  w:375, di:false},
      {id:'ip8',    label:'iPhone 8 / 7 / 6',     note:'No notch · 375×667',       sat:20, sab:0,  w:375, di:false},
    ],
    ipad: [
      {id:'ipadp13',label:'iPad Pro 13"',         note:'M4 · Face ID · No home btn', sat:24, sab:20, w:1032},
      {id:'ipadp11',label:'iPad Pro 11"',         note:'M4 · Face ID · No home btn', sat:24, sab:20, w:834},
      {id:'ipada5', label:'iPad Air 13" / 11"',   note:'M2 · Touch ID top button',   sat:24, sab:20, w:834},
      {id:'ipadm',  label:'iPad mini 7',          note:'Touch ID · 744×1133',         sat:20, sab:20, w:744},
      {id:'ipad',   label:'iPad (10th gen)',       note:'USB-C · 820×1180',            sat:20, sab:20, w:820},
      {id:'ipad9',  label:'iPad (9th gen)',        note:'Home button · 810×1080',      sat:20, sab:0,  w:810},
    ],
    mac: [
      {id:'macbook',label:'MacBook / Mac',         note:'Full browser experience',     sat:0,  sab:0,  w:1440},
    ]
  },

  apply: function(modelId) {
    var all = this.models.iphone.concat(this.models.ipad).concat(this.models.mac);
    var m = all.find(function(x){return x.id===modelId;});
    if (!m) {
      // Try to find by family prefix
      if (modelId === 'iphone') m = this.models.iphone[0];
      else if (modelId === 'ipad') m = this.models.ipad[0];
      else m = this.models.mac[0];
    }
    if (!m) return;
    // Apply safe areas
    document.documentElement.style.setProperty('--sat', m.sat + 'px');
    document.documentElement.style.setProperty('--sab', m.sab + 'px');
    // Device class
    document.body.removeAttribute('data-device-model');
    document.body.setAttribute('data-device-model', modelId);
    var family = m.w >= 768 ? (m.w >= 1000 ? 'mac' : 'ipad') : 'iphone';
    document.body.setAttribute('data-device', family);
    // Orientation button
    var ob = document.getElementById('orient-btn');
    if (ob) ob.className = family === 'ipad' ? 'show' : '';
    // Dynamic Island class
    if (m.di) {
      document.body.classList.add('has-di');
    } else {
      document.body.classList.remove('has-di');
    }
    return m;
  }
};

// ── DEVICE SELECTION LOGIC ────────────────────────────────────────
// Override DevSel completely
DevSel._models = DeviceModels.models;
DevSel._showModels = function(family) {
  document.getElementById('ds-step1').style.display = 'none';
  document.getElementById('ds-step2').style.display = 'block';
  var titleEl = document.getElementById('ds-model-title');
  if (titleEl) titleEl.textContent = family.charAt(0).toUpperCase() + family.slice(1) + ' Models';
  var modelsEl = document.getElementById('ds-models');
  if (!modelsEl) return;
  var list = this._models[family] || [];
  modelsEl.innerHTML = list.map(function(m) {
    return '<button type="button" onclick="DevSel.pickModel(\'' + m.id + '\')" class="_dbtn" style="padding:12px 14px">' +
      '<div style="flex:1">' +
        '<div style="font-weight:700;font-size:.88rem">' + m.label + '</div>' +
        '<div style="font-size: 0.75rem;opacity:.4;margin-top:1px">' + m.note + '</div>' +
      '</div>' +
      (m.di ? '<div style="font-size: 0.75rem;background:rgba(0,212,255,.15);color:var(--cyan);border-radius:100px;padding:2px 7px;font-weight:700;white-space:nowrap">Dynamic Island</div>' : '') +
    '</button>';
  }).join('');
};

DevSel._backToFamily = function() {
  document.getElementById('ds-step2').style.display = 'none';
  document.getElementById('ds-step1').style.display = 'block';
};

DevSel.pickModel = function(modelId) {
  var m = DeviceModels.apply(modelId);
  localStorage.setItem(this._k, modelId);
  var family = document.body.getAttribute('data-device');
  this.device = family;
  this._applyLayout(family);
  this._hide();
  Hap.ok(); Snd.ok();
  toast('✅ Optimized for ' + (m ? m.label : modelId));
};

// Init DevSel properly
var _baseDevSelInit = DevSel.init.bind(DevSel);
DevSel.init = function() {
  var saved = localStorage.getItem(this._k);
  if (saved) {
    DeviceModels.apply(saved);
    var family = document.body.getAttribute('data-device') || 'iphone';
    this.device = family;
    this._applyLayout(family);
    this._hide();
    return;
  }
  // Show picker - try to auto-select family
  var ua = navigator.userAgent;
  if (/iPad/.test(ua) || (window.innerWidth >= 768 && /Macintosh/.test(ua) && 'ontouchend' in document)) {
    // Pre-show iPad models
    setTimeout(function() { DevSel._showModels('ipad'); }, 300);
  } else if (/iPhone/.test(ua)) {
    setTimeout(function() { DevSel._showModels('iphone'); }, 300);
  }
  var el = document.getElementById('device-sel');
  if (el) el.style.display = 'flex';
  animLogo('dcan');
};

// Add "Change Device" to settings
var _origGLtogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  if (key === 'device') {
    toast('Layout follows your screen size automatically');
    return;
  }
  _origGLtogSet(key, el);
};

// ── PROFILE SCREEN: Add device change button ──────────────────────
setTimeout(function() {
  var settingsDiv = document.querySelector('.glass[style*="border-radius:15px"]');
  if (settingsDiv && !document.getElementById('_devchange')) {
    var row = document.createElement('div');
    row.className = 'srow';
    row.style.borderBottom = '1px solid rgba(255,255,255,.05)';
    row.innerHTML = '<span style="font-size:.84rem;font-weight:600">📱 Change Device Model</span><button type="button" class="btn bg bsm srow-action" onclick="GL.togSet(\'device\',this)">Change</button>';
    settingsDiv.insertBefore(row, settingsDiv.firstChild);
  }
}, 1800);

// ── ORIENTATION MANAGER (clean, no duplicate) ─────────────────────
if (typeof OrientMgr === 'undefined') {
  var OrientMgr = {
    current: 'portrait',
    init: function() {
      var self = this;
      window.addEventListener('orientationchange', function(){setTimeout(function(){self._update();},300);});
      window.addEventListener('resize', function(){self._update();}, {passive:true});
      this._update();
    },
    _update: function() {
      var isL = window.innerWidth > window.innerHeight;
      this.current = isL ? 'landscape' : 'portrait';
      document.body.setAttribute('data-orient', this.current);
      var btn = document.getElementById('orient-btn');
      if (btn) btn.textContent = isL ? '⟲' : '⟳';
    },
    toggle: function() {
      if (screen.orientation && screen.orientation.lock) {
        var t = this.current === 'portrait' ? 'landscape' : 'portrait';
        screen.orientation.lock(t).catch(function(){ toast('Rotate your device to switch'); });
      } else { toast('Rotate your device to switch'); }
      Snd.click(); Hap.l();
    }
  };
}

// ── PROGRESS BAR (clean, no duplicate) ───────────────────────────
if (typeof ProgressBar === 'undefined') {
  var ProgressBar = {
    set: function(pct, col) {
      var f = document.getElementById('game-progress-fill');
      if (!f) return;
      f.style.width = Math.min(100,Math.max(0,pct))+'%';
      f.style.background = col||'var(--acc)';
    },
    clear: function() { var f=document.getElementById('game-progress-fill');if(f)f.style.width='0%'; }
  };
}

// ── ACHIEVEMENT POPUP (clean, no duplicate) ───────────────────────
if (typeof AchPopup === 'undefined') {
  var AchPopup = {_t:null,show:function(icon,title,xp){var el=document.getElementById('ach-popup');if(!el){toast('🏆 '+title+'! +'+xp+' XP');return;}el.innerHTML='<div style="font-size:1.8rem">'+icon+'</div><div style="flex:1"><div style="font-weight:800;font-size:.88rem">'+title+'</div><div style="font-size: 0.75rem;opacity:.5;margin-top:1px">Achievement! 🎉</div></div><div style="color:var(--amber);font-weight:800">+'+xp+'</div>';el.classList.add('show');clearTimeout(this._t);Snd.lvlup();Hap.ok();this._t=setTimeout(function(){var e=document.getElementById('ach-popup');if(e)e.classList.remove('show');},3200);}};
}
// Override Ach.unlock once  
if (!Ach._v5patched) {
  var _baseAchUnlock=Ach.unlock.bind(Ach);
  Ach.unlock=function(id){if(S.ach.includes(id))return;var a=this.all.find(function(x){return x.id===id;});if(!a)return;S.ach.push(id);AchPopup.show(a.i,a.n,a.xp);XP.add(a.xp);Save.save();};
  Ach._v5patched=true;
}

// ── RECORDS SYSTEM (clean, no duplicate) ─────────────────────────
if (typeof Records === 'undefined') {
  var Records = {
    _k:'po5_records', data:{},
    load:function(){try{this.data=JSON.parse(localStorage.getItem(this._k)||'{}');}catch(e){}},
    save:function(){try{localStorage.setItem(this._k,JSON.stringify(this.data));}catch(e){}},
    update:function(gameId,score,meta){if(!this.data[gameId]||score>this.data[gameId].score){var isNew=!!this.data[gameId];this.data[gameId]={score:score,ts:Date.now(),meta:meta||{}};this.save();if(isNew){toast('🏆 NEW RECORD! '+score+' pts');Snd.lvlup();Hap.ok();}return true;}return false;},
    get:function(id){return this.data[id]||null;},
    buildTable:function(el){if(!el)return;var entries=Object.entries(this.data);if(!entries.length){el.innerHTML='<div style="opacity:.25;text-align:center;padding:18px;font-size:.82rem">No records yet! Play some solo games 🎮</div>';return;}el.innerHTML=entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,12).map(function(e,i){var g=Reg.get(e[0]);return'<div style="display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)"><div style="width:22px;text-align:center;font-size:.75rem;font-weight:800;color:'+(i===0?'var(--amber)':i===1?PCBrand.h_c0c0c0:i===2?PCBrand.h_cd7f32:'var(--dim)')+'">'+(i<3?['🥇','🥈','🥉'][i]:i+1)+'</div><div style="font-size:1.2rem">'+(g?g.icon:'🎮')+'</div><div style="flex:1"><div style="font-weight:700;font-size:.82rem">'+(g?g.title:e[0])+'</div></div><div style="font-size:1rem;font-weight:800;color:var(--amber)">'+e[1].score+'</div></div>';}).join('');}
  };
  Records.load();
}

// ── V5 GAMES REGISTRATION ─────────────────────────────────────────
setTimeout(function() {
  var v5games = [
    typeof WordAssassin!=='undefined'?WordAssassin:null,
    typeof DeadDrop!=='undefined'?DeadDrop:null,
    typeof BlitzDuel!=='undefined'?BlitzDuel:null,
    typeof PixelPainter!=='undefined'?PixelPainter:null,
    typeof SurvivalArena!=='undefined'?SurvivalArena:null,
    typeof MindMeld!=='undefined'?MindMeld:null
  ].filter(Boolean);
  v5games.forEach(function(g){if(Reg&&!Reg.get(g.id))Reg.add(g);});
  if(typeof GL!=='undefined'){GL._buildLib('all');GL._buildScrolls();}
  if(typeof OrientMgr!=='undefined')OrientMgr.init();
  var lc=document.getElementById('lib-count');
  if(lc&&typeof Reg!=='undefined')lc.textContent=Reg.list.length+' games · Fully offline';
  // Build records in dash
  var rl=document.getElementById('records-list');
  if(rl&&typeof Records!=='undefined')Records.buildTable(rl);
}, 600);

// ── BOOT: Wake lock + history API + keyboard ──────────────────────
window.addEventListener('load', function() {
  // Wake lock
  function reqWL(){if('wakeLock' in navigator){navigator.wakeLock.request('screen').then(function(wl){window._wl=wl;}).catch(function(){});}}
  window.requestWakeLock=reqWL;
  window.releaseWakeLock=function(){if(window._wl){window._wl.release().catch(function(){});window._wl=null;}};

  // Keyboard: Escape exits game
  document.addEventListener('keydown', function(e) {
    if (e.key==='Escape') {
      if (S.cur==='game') { GL.exitGame(); e.preventDefault(); }
      else if (document.getElementById('ov')&&document.getElementById('ov').className==='open') { Modal.close(); e.preventDefault(); }
    }
    if (S.cur==='game'&&S.game) {
      // Maze arrows
      if (S.game.id==='maze'&&window._mv){var d={ArrowUp:'u',ArrowDown:'d',ArrowLeft:'l',ArrowRight:'r'}[e.key];if(d){window._mv(d);e.preventDefault();}}
      // Snake arrows
      if (S.game.id==='snake'&&S.game.gs){var gs=S.game.gs;if(e.key==='ArrowUp'&&gs.dir.y!==1)gs.ndir={x:0,y:-1};else if(e.key==='ArrowDown'&&gs.dir.y!==-1)gs.ndir={x:0,y:1};else if(e.key==='ArrowLeft'&&gs.dir.x!==1)gs.ndir={x:-1,y:0};else if(e.key==='ArrowRight'&&gs.dir.x!==-1)gs.ndir={x:1,y:0};}
    }
  });

  // History API for browser back button
  if(window.history&&window.history.pushState){
    window.history.pushState({p:'prism'},'PrismCap','');
    window.addEventListener('popstate',function(){
      if(S.cur==='game')GL.exitGame();
      else if(document.getElementById('ov')&&document.getElementById('ov').className==='open')Modal.close();
    });
  }
});



// ─── V6 FIXES ───
// ═══════════════════════════════════════════════════════════════════
// V6 JS FIXES - Notifications toggle, solo bots, DI, clean UX
// ═══════════════════════════════════════════════════════════════════

// ── 1. NOTIFICATION SETTINGS ─────────────────────────────────────
// Add notif toggle to S.cfg
if (typeof S.cfg.notif === 'undefined') S.cfg.notif = true;

// ── 2. NOTIFICATION TOGGLE IN SETTINGS HTML ──────────────────────
// (toast + settings rows patched once below — see §14)

// ── 3. SOLO + BOT LAUNCH for all games ───────────────────────────
// Override GL.launch to give 3 options: Solo, vs Bot, Multiplayer
var _v6Launch = function(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();

  // Pure solo games - go straight to difficulty picker
  if (!game.mp) {
    _v6SoloLaunch(game);
    return;
  }

  // Board/strategy games that support bots - show 3-way choice
  var supportsBots = Bot.supports(game.id);

  if (supportsBots) {
    _v6ModeSelect(game);
    return;
  }

  // Pure MP games - show multiplayer setup
  GL._setup(game);
};

function _v6SoloLaunch(game) {
  var self = GL;
  var players = [{id:'p1', name: S.prof.name||'Player', av: S.prof.av||'🎮', col:PCBrand.h_c77dff, local:true}];
  var rec = typeof Records !== 'undefined' ? Records.get(game.id) : null;

  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.5rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1.05rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.73rem;opacity:.38;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:10px 13px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:13px;margin-bottom:12px;display:flex;align-items:center;gap:9px"><div style="font-size:1.3rem">🏆</div><div><div style="font-size: 0.75rem;opacity:.38">Your best score</div><div style="font-weight:800;font-size:.92rem;color:var(--amber)">' + rec.score + ' pts</div></div></div>' : '') +
    '<div onclick="typeof Difficulty!==\'undefined\'&&Difficulty.pick(function(){Modal.close();_v6Launch(\'' + game.id + '\');})" style="padding:11px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:13px;margin-bottom:14px;display:flex;align-items:center;gap:10px;cursor:pointer">' +
      '<span style="font-size:1.3rem">' + (typeof Difficulty!=='undefined'?Difficulty.get().icon:'🟡') + '</span>' +
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + (typeof Difficulty!=='undefined'?Difficulty.get().label:'Normal') + '</div><div style="font-size: 0.75rem;opacity:.38">Tap to change</div></div>' +
      '<span style="opacity:.3;font-size:.82rem">›</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 15px" onclick="Modal.close();setTimeout(function(){typeof Tutorial!==\'undefined\'&&Tutorial.show(game,function(){_v6Launch(\'' + game.id + '\');});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1;font-size:.95rem;padding:14px" onclick="window.__soloGo()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window.__soloGo = function() {
    Modal.close();
    setTimeout(function() {
      typeof Tutorial !== 'undefined'
        ? Tutorial.show(game, function() { Cinematic.show(game, players, function() { GL._start(game, players); }); })
        : GL._start(game, players);
    }, 270);
  };
}

function _v6ModeSelect(game) {
  var self = GL;
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:16px">' +
      '<div style="font-size:2.5rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1.05rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:.73rem;opacity:.38;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    '<div style="font-size: 0.75rem;opacity:.3;text-transform:uppercase;letter-spacing:.1em;margin-bottom:10px">How do you want to play?</div>' +
    '<div style="display:flex;flex-direction:column;gap:9px">' +
      '<button type="button" onclick="window.__playMode(\'solo\')" style="padding:16px;border-radius:17px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.05);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.3);display:flex;align-items:center;justify-content:center;font-size:1.3rem">🎮</div>' +
        '<div style="text-align:left"><div style="font-weight:800">Play Solo</div><div style="font-size:0.75rem;opacity:.45;margin-top:2px">Just you, no time pressure</div></div>' +
      '</button>' +
      '<button type="button" onclick="window.__playMode(\'bot\')" style="padding:16px;border-radius:17px;border:1px solid rgba(199,125,255,.25);background:rgba(199,125,255,.08);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(199,125,255,.2);border:1px solid rgba(199,125,255,.4);display:flex;align-items:center;justify-content:center;font-size:1.3rem">🤖</div>' +
        '<div style="text-align:left"><div style="font-weight:800">vs Bot</div><div style="font-size:0.75rem;opacity:.45;margin-top:2px">Challenge the AI · Solo device</div></div>' +
      '</button>' +
      '<button type="button" onclick="window.__playMode(\'multi\')" style="padding:16px;border-radius:17px;border:1px solid rgba(255,45,120,.25);background:rgba(255,45,120,.08);color:'+PCBrand.h_fff+';font:700 .92rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:13px;transition:all .18s">' +
        '<div style="width:42px;height:42px;border-radius:50%;background:rgba(255,45,120,.2);border:1px solid rgba(255,45,120,.4);display:flex;align-items:center;justify-content:center;font-size:1.3rem">👥</div>' +
        '<div style="text-align:left"><div style="font-weight:800">Pass & Play</div><div style="font-size:0.75rem;opacity:.45;margin-top:2px">'+game.min+'–'+game.max+' players · Pass the device</div></div>' +
      '</button>' +
    '</div></div>'
  );

  window.__playMode = function(mode) {
    Modal.close();
    setTimeout(function() {
      if (mode === 'solo') {
        // Single player, one person
        var players = [{id:'p1',name:S.prof.name||'Player',av:S.prof.av||'🎮',col:PCBrand.h_c77dff,local:true}];
        Cinematic.show(game, players, function() { GL._start(game, players); });
      } else if (mode === 'bot') {
        var players = [
          {id:'p1',name:S.prof.name||'Player',av:S.prof.av||'😎',col:PCBrand.h_c77dff,local:true},
          {id:'bot1',name:'🤖 AI',av:'🤖',col:PCBrand.h_ff2d78,local:false,isBot:true,difficulty:typeof Difficulty!=='undefined'?Difficulty.current:'normal'}
        ];
        Cinematic.show(game, players, function() { GL._start(game, players); });
      } else {
        GL._setup(game);
      }
    }, 280);
  };
}

// Override GL.launch with v6 version
GL.launch = _v6Launch;

// ── 4. CLEAN CINEMATIC (no slow scan messages) ────────────────────
Cinematic.show = function(game, players, cb) {
  if (/[?&]e2e=1(?:&|$)/.test(location.search)) { if (cb) cb(); return; }
  var ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:999;background:'+PCBrand.h_000+';display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:26px;transition:opacity .45s ease';
  var mutStr = typeof Mutators !== 'undefined' && Mutators.active.length ?
    '<div style="display:flex;flex-wrap:wrap;gap:5px;justify-content:center;margin-bottom:14px">' +
    Mutators.active.map(function(m){return '<div style="background:'+m.col+'22;border:1px solid '+m.col+'44;border-radius:100px;padding:3px 10px;font-size: 0.75rem;font-weight:700">'+m.icon+' '+m.name+'</div>';}).join('') +
    '</div>' : '';
  ov.innerHTML =
    '<div style="font-size:3.5rem;margin-bottom:10px;animation:bounceIn .5s ease">' + game.icon + '</div>' +
    '<div style="font-size:1.6rem;font-weight:900;letter-spacing:-.03em;color:' + game.col + ';margin-bottom:5px">' + game.title + '</div>' +
    '<div style="opacity:.38;font-size:.82rem;margin-bottom:18px">' + game.desc + '</div>' +
    mutStr +
    '<div style="display:flex;flex-wrap:wrap;justify-content:center;gap:6px">' +
    players.map(function(p){return '<div style="background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);border-radius:100px;padding:5px 13px;font-size:.78rem;font-weight:700">' + p.av + ' ' + p.name + (p.isBot?' 🤖':'') + '</div>';}).join('') +
    '</div>';
  document.body.appendChild(ov);
  if (typeof Announcer !== 'undefined') Announcer.gameStart(game.title, players.length);
  // Fast: 1.2s then go
  setTimeout(function() {
    ov.style.opacity = '0';
    setTimeout(function() {
      if (ov.parentNode) ov.parentNode.removeChild(ov);
      if (cb) cb();
    }, 450);
  }, 1200);
};

// ── 5. DYNAMIC ISLAND: Detect and handle properly ────────────────
(function() {
  // Get the real safe area at runtime
  var testEl = document.createElement('div');
  testEl.style.cssText = 'position:fixed;top:env(safe-area-inset-top,0px);width:1px;height:1px;pointer-events:none;opacity:0';
  document.body.appendChild(testEl);
  setTimeout(function() {
    var realTop = parseInt(window.getComputedStyle(testEl).top) || 59;
    document.body.removeChild(testEl);
    // iPhone 16 Pro Max DI = 59px, set it
    var sat = Math.max(realTop, 59);
    document.documentElement.style.setProperty('--sat', sat + 'px');
    // If DI detected (59px+), add class for extra padding
    if (sat >= 59) document.body.classList.add('has-di');
  }, 100);
})();

// ── 6. BACKGROUND PARTICLE COLORS (more vibrant) ─────────────────
// Override BG init to use more colors and faster particles
var _origBGinit = BG.init.bind(BG);
if (!BG._v6patched) {
  BG._v6patched = true;
  // The particles already exist - update their colors
  setTimeout(function() {
    // Inject more vibrant particle colors via CSS animation override
    var s = document.createElement('style');
    s.textContent = '@keyframes bgPulse{0%,100%{opacity:.14}50%{opacity:.28}}';
    document.head.appendChild(s);
  }, 500);
}

// ── 7. HOME SCREEN: Colorful section headers ──────────────────────
setTimeout(function() {
  // Make MP and Solo headers pop
  document.querySelectorAll('.shdr .sec').forEach(function(el, i) {
    var colors = [PCBrand.h_ff2d78,PCBrand.h_c77dff,PCBrand.h_00e5ff,PCBrand.h_00e676,PCBrand.h_ffd60a];
    el.style.background = 'linear-gradient(90deg,' + colors[i%colors.length] + ',' + colors[(i+1)%colors.length] + ')';
    el.style.webkitBackgroundClip = 'text';
    el.style.webkitTextFillColor = 'transparent';
    el.style.backgroundClip = 'text';
  });
}, 2500);

// ── 8. GAME CARDS: shadow owned by css/components.css (.lcard) ────
// (removed post-build inline boxShadow that overrode the designed cascade)

// ── 9. MINI CELEBRATIONS on win ──────────────────────────────────
function celebrate() {
  if (!S.cfg.notif || S.cfg.lowPower || S.cfg.perfMode === 'eco') return;
  var colors = [PCBrand.h_ff2d78,PCBrand.h_ffd60a,PCBrand.h_00e676,PCBrand.h_c77dff,PCBrand.h_00e5ff];
  var count = S.cfg.bg ? 12 : 8;
  for (var i = 0; i < count; i++) {
    (function(idx) {
      setTimeout(function() {
        var dot = document.createElement('div');
        var c = colors[Math.floor(Math.random()*colors.length)];
        var x = 20 + Math.random() * 60;
        dot.style.cssText = 'position:fixed;left:' + x + 'vw;top:70%;width:8px;height:8px;border-radius:50%;background:' + c + ';pointer-events:none;z-index:9999;transition:all 1.2s ease;box-shadow:0 0 6px ' + c;
        document.body.appendChild(dot);
        setTimeout(function() {
          dot.style.transform = 'translateY(-' + (100+Math.random()*200) + 'px)';
          dot.style.opacity = '0';
        }, 20);
        setTimeout(function() { if (dot.parentNode) dot.parentNode.removeChild(dot); }, 1300);
      }, idx * 60);
    })(i);
  }
}
window.celebrate = celebrate;

// Hook win to celebration
var _origShowWin = Game.prototype.showWin;
Game.prototype.showWin = function(winner, scores, extra) {
  _origShowWin.call(this, winner, scores, extra);
  setTimeout(celebrate, 300);
};

// ── 10. FIX: NavBar active glow updates live ──────────────────────
// Nav.go enhanced in v7 patch below

// ── 11. HOME SCREEN: Better featured card ───────────────────────
var _origBuildFeat = GL._buildFeat.bind(GL);
GL._buildFeat = function() {
  var gs = Reg.list;
  if (!gs.length) return;
  var f = gs[Math.floor(Math.random()*Math.min(gs.length, 10))];
  S.feat = f;
  var featBg = document.getElementById('feat-bg');
  if (featBg) {
    featBg.style.background = 'linear-gradient(135deg,' + f.col + '44,' + f.col + '14,transparent)';
    featBg.style.backdropFilter = 'blur(2px)';
  }
  function set(id,v){var el=document.getElementById(id);if(el)el.textContent=v;}
  set('feat-title', f.title);
  set('feat-type', f.type.toUpperCase());
  set('feat-desc', f.desc);
  set('feat-icon', f.icon);
  var badge = document.getElementById('feat-badge');
  if (badge) {
    badge.textContent = f.mp ? 'Multiplayer' : 'Solo';
    badge.className = 'text-caption';
    badge.style.background = f.col + '33';
    badge.style.color = f.col;
    badge.style.border = '1px solid ' + f.col + '55';
  }
};

// ── 12. NOTIF SETTING: save/load ────────────────────────────────
var _baseTogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  S.cfg[key] = !S.cfg[key];
  if (el) el.className = 'tog' + (S.cfg[key] ? ' on' : '');
  Save.save();
  Snd.click();
  if (key === 'notif') {
    toast(S.cfg.notif ? '🔔 Notifications ON' : '🔕 Notifications OFF');
  }
  if (key === 'largeTap' && typeof PrismPerf !== 'undefined') {
    PrismPerf.apply();
    toast(S.cfg.largeTap ? '👆 Larger tap targets ON' : '👆 Larger tap targets OFF');
  }
};



// ═══ V7 PATCH ═══
// ═══════════════════════════════════════════════════════════════════
// PRISM OS v7 PATCH — Ludo, Snakes & Ladders, Music, Friends,
// Device picker, Bots for all board games, Visual polish
// Injected ONCE into v6 base. No duplicates.
// ═══════════════════════════════════════════════════════════════════

// ── 1. SUSPEND AUTO-SAVE FIX (no toast interruption) ────────────
// Already fixed in v6, guard here too
if (GL._ck) { clearTimeout(GL._ck); GL._ck = null; }

// ── 2. DEVICE MODEL SYSTEM (full 31 iPhone models) ──────────────
var DeviceDB = {
  iphone: [
    {id:'ip16pm',l:'iPhone 16 Pro Max',    n:'Dynamic Island · 6.9"',sat:62,sab:34,di:true},
    {id:'ip16p', l:'iPhone 16 Pro',         n:'Dynamic Island · 6.3"',sat:62,sab:34,di:true},
    {id:'ip16pl',l:'iPhone 16 Plus',        n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip16',  l:'iPhone 16',             n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip15pm',l:'iPhone 15 Pro Max',     n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip15p', l:'iPhone 15 Pro',         n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip15pl',l:'iPhone 15 Plus',        n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip15',  l:'iPhone 15',             n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip14pm',l:'iPhone 14 Pro Max',     n:'Dynamic Island · 6.7"',sat:59,sab:34,di:true},
    {id:'ip14p', l:'iPhone 14 Pro',         n:'Dynamic Island · 6.1"',sat:59,sab:34,di:true},
    {id:'ip14pl',l:'iPhone 14 Plus',        n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip14',  l:'iPhone 14',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13pm',l:'iPhone 13 Pro Max',     n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip13p', l:'iPhone 13 Pro',         n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13',  l:'iPhone 13',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip13m', l:'iPhone 13 mini',        n:'Notch · 5.4"',          sat:50,sab:34,di:false},
    {id:'ip12pm',l:'iPhone 12 Pro Max',     n:'Notch · 6.7"',          sat:47,sab:34,di:false},
    {id:'ip12p', l:'iPhone 12 Pro',         n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip12',  l:'iPhone 12',             n:'Notch · 6.1"',          sat:47,sab:34,di:false},
    {id:'ip12m', l:'iPhone 12 mini',        n:'Notch · 5.4"',          sat:50,sab:34,di:false},
    {id:'ip11pm',l:'iPhone 11 Pro Max',     n:'Notch · 6.5"',          sat:44,sab:34,di:false},
    {id:'ip11p', l:'iPhone 11 Pro',         n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ip11',  l:'iPhone 11',             n:'Notch · 6.1"',          sat:44,sab:34,di:false},
    {id:'ipxsm', l:'iPhone XS Max',         n:'Notch · 6.5"',          sat:44,sab:34,di:false},
    {id:'ipxs',  l:'iPhone XS',             n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ipx',   l:'iPhone X',              n:'Notch · 5.8"',          sat:44,sab:34,di:false},
    {id:'ipxr',  l:'iPhone XR',             n:'Notch · 6.1"',          sat:44,sab:34,di:false},
    {id:'ipse3', l:'iPhone SE (3rd gen)',    n:'No notch · 4.7"',       sat:20,sab:0, di:false},
    {id:'ipse2', l:'iPhone SE (2nd gen)',    n:'No notch · 4.7"',       sat:20,sab:0, di:false},
    {id:'ip8p',  l:'iPhone 8 Plus',         n:'No notch · 5.5"',       sat:20,sab:0, di:false},
    {id:'ip8',   l:'iPhone 8 / 7 / 6s',    n:'No notch · 4.7"',       sat:20,sab:0, di:false}
  ],
  ipad: [
    {id:'ipadp13',l:'iPad Pro 13"',n:'Face ID · M4',          sat:24,sab:20},
    {id:'ipadp11',l:'iPad Pro 11"',n:'Face ID · M4',          sat:24,sab:20},
    {id:'ipada13',l:'iPad Air 13"',n:'Touch ID top · M2',    sat:24,sab:20},
    {id:'ipada11',l:'iPad Air 11"',n:'Touch ID top · M2',    sat:24,sab:20},
    {id:'ipadm',  l:'iPad mini 7', n:'Touch ID top',         sat:20,sab:20},
    {id:'ipad10', l:'iPad (10th)', n:'USB-C · 820pt wide',   sat:20,sab:20},
    {id:'ipad9',  l:'iPad (9th)',  n:'Home button',           sat:20,sab:0}
  ],
  mac: [
    {id:'mac',l:'Mac / Browser',n:'Desktop experience',sat:0,sab:0}
  ]
};

// Patch DevSel with full 2-step model picker
DevSel._db = DeviceDB;
DevSel._showModels = function(family) {
  document.getElementById('ds-step1').style.display = 'none';
  var s2 = document.getElementById('ds-step2');
  s2.style.display = 'block';
  var title = document.getElementById('ds-model-title');
  if (title) title.textContent = {iphone:'iPhone',ipad:'iPad',mac:'Mac / Browser'}[family] || family;
  var list = document.getElementById('ds-models');
  if (!list) return;
  var models = this._db[family] || [];
  list.innerHTML = models.map(function(m) {
    return '<button type="button" onclick="DevSel.pickModel(\'' + m.id + '\')" style="width:100%;padding:13px 15px;border-radius:14px;border:1px solid rgba(255,255,255,.09);background:rgba(255,255,255,.04);color:'+PCBrand.h_fff+';font:600 .86rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:11px;text-align:left;margin-bottom:7px;-webkit-tap-highlight-color:transparent">' +
      (m.di ? '<div style="width:8px;height:8px;border-radius:50%;background:var(--p5);box-shadow:0 0 5px var(--p5);flex-shrink:0"></div>' : '<div style="width:8px;height:8px;border-radius:50%;background:rgba(255,255,255,.15);flex-shrink:0"></div>') +
      '<div style="flex:1"><div style="font-weight:700">' + m.l + '</div><div style="font-size: 0.75rem;opacity:.38;margin-top:1px">' + m.n + '</div></div>' +
      (m.di ? '<span style="font-size: 0.75rem;background:rgba(0,229,255,.15);color:var(--p5);border-radius:100px;padding:2px 7px;font-weight:700;white-space:nowrap">DI</span>' : '') +
      '</button>';
  }).join('');
};

DevSel._backToFamily = function() {
  document.getElementById('ds-step2').style.display = 'none';
  document.getElementById('ds-step1').style.display = 'flex';
};

DevSel._familyFor = function(modelId) {
  if (modelId === 'mac' || modelId === 'macbook') return 'mac';
  if (DeviceDB.ipad.some(function(x) { return x.id === modelId; })) return 'ipad';
  return 'iphone';
};

DevSel._normalizeSaved = function(saved) {
  if (!saved) return null;
  if (saved === 'macbook') return 'mac';
  if (saved === 'mac' || saved === 'iphone' || saved === 'ipad') return saved;
  var all = DeviceDB.iphone.concat(DeviceDB.ipad).concat(DeviceDB.mac);
  if (all.some(function(m) { return m.id === saved; })) return saved;
  return null;
};

DevSel._revealWelcome = function() {
  if (localStorage.getItem('po5s')) return;
  var w = document.getElementById('welcome');
  if (!w) return;
  w.classList.remove('out');
  w.classList.add('ready');
  w.style.display = 'flex';
  w.style.opacity = '1';
  w.style.pointerEvents = 'auto';
};

DevSel.pickModel = function(modelId, silent) {
  if (modelId === 'macbook') modelId = 'mac';
  var all = DeviceDB.iphone.concat(DeviceDB.ipad).concat(DeviceDB.mac);
  var m = all.find(function(x) { return x.id === modelId; });
  if (!m) {
    if (modelId === 'iphone') m = DeviceDB.iphone[0];
    else if (modelId === 'ipad') m = DeviceDB.ipad[0];
    else if (modelId === 'mac') m = DeviceDB.mac[0];
    if (!m) return;
    modelId = m.id;
  }
  document.documentElement.style.setProperty('--sat', m.sat + 'px');
  document.documentElement.style.setProperty('--sab', m.sab + 'px');
  document.body.setAttribute('data-model', modelId);
  var family = DevSel._familyFor(modelId);
  document.body.setAttribute('data-device', family);
  DevSel.device = family;
  DevSel._applyLayout(family);
  if (m.di) document.body.classList.add('has-di');
  else document.body.classList.remove('has-di');
  var ob = document.getElementById('orient-btn');
  if (ob) ob.className = family === 'ipad' ? 'show' : '';
  localStorage.setItem(DevSel._k, modelId);
  S.cfg.device = modelId;
  Save.save();
  if (!silent) {
    DevSel._hide();
    Hap.ok(); Snd.ok();
    toast('✅ Optimized for ' + m.l);
  } else {
    var el = document.getElementById('device-sel');
    if (el) el.style.display = 'none';
  }
  DevSel._revealWelcome();
};

DevSel.init = function() {
  // PRSM-P1-01 / P-PRSM-1 — skip device gate; auto layout by width; ignore stored preference
  var w = window.innerWidth || 390;
  var family = w >= 1024 ? 'mac' : (w >= 768 ? 'ipad' : 'iphone');
  var el = document.getElementById('device-sel');
  if (el) { el.style.display = 'none'; el.setAttribute('aria-hidden', 'true'); }
  this.device = family;
  document.body.setAttribute('data-device', family);
  if (typeof this._applyLayout === 'function') this._applyLayout(family);
  // Keep stored preference untouched (unused)
  this._revealWelcome();
};

// ── 3. BACKGROUND MUSIC (Web Audio, no files) ────────────────────
var Music = (function() {
  var ctx = null, playing = false, track = '', _ivs = [];
  var TRACKS = {
    menu:  { tempo:82,  scale:[261,294,330,392,440,392],    bass:[130,146,165,130] },
    tense: { tempo:128, scale:[220,233,247,262,247,233],    bass:[110,117,123,110] },
    party: { tempo:120, scale:[392,440,494,523,494,440],    bass:[196,220,246,220] },
    epic:  { tempo:96,  scale:[329,370,415,466,415,370],    bass:[164,185,207,185] },
    board: { tempo:88,  scale:[349,392,440,392,330,392],    bass:[174,196,220,196] }
  };

  function initCtx() {
    if (!ctx) {
      try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch(e) {}
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
  }

  function stopAll() {
    _ivs.forEach(function(iv) { clearInterval(iv); });
    _ivs = [];
    playing = false; track = '';
    var ind = document.getElementById('music-ind');
    if (ind) { ind.textContent = '🔇'; ind.className = ''; }
  }

  function play(name) {
    if (!S.cfg.music) { stopAll(); return; }
    if (track === name && playing) return;
    stopAll();
    initCtx();
    if (!ctx) return;
    var t = TRACKS[name] || TRACKS.menu;
    var beatMs = Math.round(60000 / t.tempo);
    var noteIdx = 0, bassIdx = 0;

    var noteIv = setInterval(function() {
      if (!S.cfg.music) { stopAll(); return; }
      try {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'triangle';
        o.frequency.value = t.scale[noteIdx % t.scale.length];
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatMs / 1100);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + beatMs / 1000);
        noteIdx++;
      } catch(e) {}
    }, beatMs);

    var bassIv = setInterval(function() {
      if (!S.cfg.music) return;
      try {
        var o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine';
        o.frequency.value = t.bass[bassIdx % t.bass.length];
        g.gain.setValueAtTime(0, ctx.currentTime);
        g.gain.linearRampToValueAtTime(0.038, ctx.currentTime + 0.04);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + beatMs * 2 / 1000);
        o.connect(g); g.connect(ctx.destination);
        o.start(); o.stop(ctx.currentTime + beatMs * 2 / 1000);
        bassIdx++;
      } catch(e) {}
    }, beatMs * 2);

    _ivs = [noteIv, bassIv];
    playing = true; track = name;
    var ind = document.getElementById('music-ind');
    if (ind) { ind.textContent = '🎵'; ind.className = 'playing'; }
  }

  function toggle() {
    S.cfg.music = !S.cfg.music;
    var tog = document.getElementById('tmus');
    if (tog) tog.className = 'tog' + (S.cfg.music ? ' on' : '');
    Save.save();
    if (S.cfg.music) play(track || 'menu');
    else stopAll();
    toast(S.cfg.music ? '🎵 Music ON' : '🔇 Music OFF');
  }

  return { play: play, stop: stopAll, toggle: toggle };
})();

// Music indicator click
(function() {
  var mi = document.getElementById('music-ind');
  if (mi) mi.onclick = function() { Music.toggle(); };
})();

// ── 4. CONFETTI (physics-based) ───────────────────────────────────
function confetti() {
  var container = document.getElementById('confetti-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'confetti-container';
    container.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;overflow:hidden';
    document.body.appendChild(container);
  }
  var cols = [PCBrand.h_ff2d78,PCBrand.h_ffd60a,PCBrand.h_00e676,PCBrand.h_c77dff,PCBrand.h_00e5ff,PCBrand.h_ff6b00,PCBrand.h_ff85c2,PCBrand.h_aeea00];
  for (var i = 0; i < 40; i++) {
    (function(idx) {
      setTimeout(function() {
        var d = document.createElement('div');
        var col = cols[Math.floor(Math.random() * cols.length)];
        var sz = 6 + Math.random() * 8;
        var xStart = 10 + Math.random() * 80;
        d.style.cssText = 'position:absolute;bottom:20%;left:' + xStart + '%;width:' + sz + 'px;height:' + sz + 'px;background:' + col + ';border-radius:' + (Math.random() > 0.5 ? '50%' : '2px') + ';box-shadow:0 0 4px ' + col + ';pointer-events:none';
        container.appendChild(d);
        var startTime = Date.now();
        var vx = (Math.random() - 0.5) * 6;
        var vy = -(8 + Math.random() * 10);
        var gravity = 0.3;
        var rot = Math.random() * 360;
        var rotV = (Math.random() - 0.5) * 12;
        function step() {
          var elapsed = (Date.now() - startTime) / 16;
          vy += gravity;
          var x = parseFloat(d.style.left) + vx * 0.06;
          var y = parseFloat(d.style.bottom || 20) - vy * 0.15;
          rot += rotV;
          d.style.left = x + '%';
          d.style.bottom = y + '%';
          d.style.transform = 'rotate(' + rot + 'deg)';
          d.style.opacity = String(Math.max(0, 1 - elapsed / 60));
          if (elapsed < 60 && y > -10) requestAnimationFrame(step);
          else if (d.parentNode) d.parentNode.removeChild(d);
        }
        requestAnimationFrame(step);
      }, idx * 45);
    })(i);
  }
}
window.confetti = confetti;

// Float XP label
function floatXP(amount, x, y) {
  if (!amount) return;
  var d = document.createElement('div');
  d.style.cssText = 'position:fixed;left:' + (x || window.innerWidth / 2) + 'px;top:' + (y || window.innerHeight * 0.4) + 'px;font-size:1.1rem;font-weight:900;color:'+PCBrand.h_ffd60a+';pointer-events:none;z-index:9999;text-shadow:0 0 12px rgba(255,214,10,.7);transform:translate(-50%,-50%)';
  d.textContent = '+' + amount + ' XP';
  document.body.appendChild(d);
  var start = null;
  requestAnimationFrame(function step(ts) {
    if (!start) start = ts;
    var p = (ts - start) / 900;
    d.style.transform = 'translate(-50%,' + (p * -80 - 50) + '%)';
    d.style.opacity = String(Math.max(0, 1 - p));
    if (p < 1) requestAnimationFrame(step);
    else if (d.parentNode) d.parentNode.removeChild(d);
  });
}
window.floatXP = floatXP;

// Patch XP.add to show float
var _baseXPadd = XP.add.bind(XP);
XP.add = function(n, mult) {
  var total = Math.round(n * (mult || 1));
  _baseXPadd(n, mult);
  if (total > 0) floatXP(total);
};

// ── 5. FRIENDS SYSTEM ─────────────────────────────────────────────
var Friends = {
  _k: 'po7_friends',
  list: [],
  load: function() { try { this.list = JSON.parse(localStorage.getItem(this._k) || '[]'); } catch(e) { this.list = []; } },
  save: function() { try { localStorage.setItem(this._k, JSON.stringify(this.list)); } catch(e) {} },
  add: function() {
    var self = this;
    var avs = ['😎','🦊','🐺','🦁','🐯','🌸','💖','🦋','🌟','✨','🎀','🩷','🌈','🦄','🤖','💀','🔥','⚡'];
    var selAv = avs[0];
    Modal.open(
      '<div><div style="font-size:1rem;font-weight:800;margin-bottom:3px">👥 Add Friend</div>' +
      '<div style="font-size:.74rem;opacity:.35;margin-bottom:12px">Track games, wins & rivalries</div>' +
      '<input id="_fn" placeholder="Friend\'s name..." autocorrect="off" style="width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.12);background:rgba(255,255,255,.07);font-size:.9rem;font-weight:600;color:'+PCBrand.h_fff+';margin-bottom:11px">' +
      '<div style="font-size: 0.75rem;opacity:.28;text-transform:uppercase;letter-spacing:.1em;margin-bottom:7px">Avatar</div>' +
      '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:13px">' +
      avs.map(function(a) { return '<div onclick="window._fav(\'' + a + '\',this)" style="width:36px;height:36px;border-radius:10px;background:rgba(255,255,255,.07);border:2px solid transparent;display:flex;align-items:center;justify-content:center;font-size:1.2rem;cursor:pointer">' + a + '</div>'; }).join('') +
      '</div>' +
      '<button type="button" class="btn bw bf" onclick="window._fadd()">Add ✓</button></div>'
    );
    window._fav = function(a, el) {
      selAv = a;
      document.querySelectorAll('[onclick^="window._fav"]').forEach(function(e) { e.style.borderColor = 'transparent'; });
      el.style.borderColor = 'var(--acc)';
    };
    window._fadd = function() {
      var nm = ((document.getElementById('_fn') || {}).value || '').trim();
      if (!nm) { toast('Enter a name!'); return; }
      self.list.push({ id: 'f' + Date.now(), name: nm, av: selAv, games: 0, wins: 0, betrayals: 0, hist: [] });
      self.save(); Modal.close();
      toast('👥 ' + nm + ' added!'); Snd.ok(); Hap.ok();
    };
  },
  record: function(friendName, iWon, gameTitle) {
    var f = this.list.find(function(x) { return x.name === friendName; });
    if (!f) return;
    f.games++; if (iWon) f.wins++;
    f.hist.unshift({ g: gameTitle, w: iWon, dt: new Date().toLocaleDateString() });
    if (f.hist.length > 20) f.hist = f.hist.slice(0, 20);
    this.save();
  },
  buildList: function(el) {
    if (!el) return;
    if (!this.list.length) {
      el.innerHTML = '<div style="text-align:center;padding:18px;opacity:.22;font-size:.82rem">No friends added yet.<br>Add friends to track rivalries! 👥</div>';
      return;
    }
    el.innerHTML = this.list.map(function(f) {
      var wr = f.games > 0 ? Math.round(f.wins / f.games * 100) : 0;
      return '<div style="display:flex;align-items:center;gap:10px;padding:11px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08);border-radius:14px;margin-bottom:7px">' +
        '<div style="font-size:1.75rem">' + f.av + '</div>' +
        '<div style="flex:1"><div style="font-weight:800;font-size:.88rem">' + f.name + '</div>' +
        '<div style="font-size: 0.75rem;opacity:.38;margin-top:1px">' + f.games + ' games · ' + wr + '% wins' + (f.betrayals ? ' · ' + f.betrayals + '× betrayed 🗡️' : '') + '</div></div>' +
        '<div style="text-align:right"><div style="font-size:1.25rem;font-weight:900;color:var(--p3)">' + wr + '%</div><div style="font-size: 0.75rem;opacity:.28">win rate</div></div>' +
        '</div>';
    }).join('');
  }
};
Friends.load();

// Add Friends list to dashboard and Add Friend button to profile settings
(function patchDashAndProfile() {
  // Friends in dashboard
  var dash = document.getElementById('dashboard-screen');
  if (dash) {
    var fl = document.createElement('div');
    fl.style.cssText = 'padding:0 15px;margin-top:13px';
    fl.innerHTML = '<div class="sec" style="margin-bottom:9px">👥 Friends</div><div id="friends-list"></div>';
    // Insert before achievements
    var achlDiv = dash.querySelector('[id="achl"]');
    if (achlDiv && achlDiv.parentNode) {
      dash.appendChild(fl);
    }
  }
  // High scores in dashboard
  if (dash && !document.getElementById('records-list')) {
    var rl = document.createElement('div');
    rl.style.cssText = 'padding:0 15px;margin-top:13px;margin-bottom:8px';
    rl.innerHTML = '<div class="sec" style="margin-bottom:9px">🏆 High Scores</div><div id="records-list"></div>';
    dash.appendChild(rl);
  }
})();

// ── 6. RECORDS SYSTEM ─────────────────────────────────────────────
var Records = {
  _k: 'po7_rec', data: {},
  load: function() { try { this.data = JSON.parse(localStorage.getItem(this._k) || '{}'); } catch(e) {} },
  save: function() { try { localStorage.setItem(this._k, JSON.stringify(this.data)); } catch(e) {} },
  update: function(gameId, score) {
    if (!score) return false;
    var isNew = !!this.data[gameId];
    if (!this.data[gameId] || score > this.data[gameId].score) {
      this.data[gameId] = { score: score, ts: Date.now() };
      this.save();
      if (isNew) { toast('🏆 NEW RECORD! ' + score); Snd.lvlup(); Hap.blast(); }
      return true;
    }
    return false;
  },
  get: function(id) { return this.data[id] || null; },
  buildTable: function(el) {
    if (!el) return;
    var entries = Object.entries(this.data);
    if (!entries.length) {
      el.innerHTML = '<div style="text-align:center;padding:16px;opacity:.22;font-size:.82rem">No records yet — play some solo games! 🎮</div>';
      return;
    }
    el.innerHTML = entries.sort(function(a,b){return b[1].score-a[1].score;}).slice(0,12).map(function(e,i){
      var g = Reg.get(e[0]);
      return '<div style="display:flex;align-items:center;gap:9px;padding:9px 0;border-bottom:1px solid rgba(255,255,255,.05)">' +
        '<div style="width:24px;text-align:center;font-weight:800;font-size:.8rem;color:' + (i===0?PCBrand.h_ffd60a:i===1?PCBrand.h_c0c0c0:i===2?PCBrand.h_cd7f32:'rgba(255,255,255,.28)') + '">' + (i<3?['🥇','🥈','🥉'][i]:i+1) + '</div>' +
        '<div style="font-size:1.2rem">' + (g?g.icon:'🎮') + '</div>' +
        '<div style="flex:1;font-weight:700;font-size:.82rem">' + (g?g.title:e[0]) + '</div>' +
        '<div style="font-size:1rem;font-weight:900;color:'+PCBrand.h_ffd60a+'">' + e[1].score + '</div>' +
        '</div>';
    }).join('');
  }
};
Records.load();

// Patch Game.done to update records for solo games
var _baseDone = Game.prototype.done;
Game.prototype.done = function(winner) {
  _baseDone.call(this, winner);
  if (!this.mp && this.gs) {
    var sc = this.gs.sc || this.gs.score || 0;
    if (sc > 0) Records.update(this.id, sc);
  }
};

// ── 7. PATCH UI.dash to include friends + records ─────────────────
var _baseDash = UI.dash.bind(UI);
UI.dash = function() {
  _baseDash();
  var fl = document.getElementById('friends-list');
  if (fl) Friends.buildList(fl);
  var rl = document.getElementById('records-list');
  if (rl) Records.buildTable(rl);
};

// ── 8. MUSIC in Nav.go ────────────────────────────────────────────
var _baseNavGo = Nav.go.bind(Nav);
Nav.go = function(scr) {
  _baseNavGo(scr);
  // Scroll to top
  var el = document.getElementById(scr + '-screen');
  if (el) el.scrollTop = 0;
  // Music
  if (S.cfg.music) {
    var trk = 'menu';
    if (scr === 'game' && S.game) {
      trk = S.game.cat === 'board' ? 'board' : (S.game.mp ? 'tense' : 'party');
    }
    Music.play(trk);
  }
  // Progress bar
  var fill = document.getElementById('game-progress-fill');
  if (fill) {
    if (scr === 'game' && S.game && S.game.gs) {
      var g = S.game.gs, pct = 0;
      if (g.round && g.maxR) pct = (g.round / g.maxR) * 100;
      else if (g.lvl) pct = Math.min(88, (g.lvl / 20) * 100);
      fill.style.width = pct + '%';
      fill.style.background = (S.game && S.game.col) || 'var(--acc)';
    } else { fill.style.width = '0%'; }
  }
  // Dashboard updates
  if (scr === 'dashboard') { var rl = document.getElementById('records-list'); if (rl) Records.buildTable(rl); }
};

// ── 9. PATCH GL.launch for 3-way mode picker (ALL board games) ────
var _baseGLlaunch = GL.launch.bind(GL);
GL.launch = function(id) {
  var game = Reg.get(id);
  if (!game) { toast('Game not found'); return; }
  Snd.click(); Hap.m();
  var self = this;
  if (BOT_BOARD_GAMES.indexOf(game.id) > -1) {
    this._v7ModePicker(game); return;
  }
  if (!game.mp) { this._v7SoloLaunch(game); return; }
  this._setup(game);
};

GL._v7ModePicker = function(game) {
  var self = this;
  var rec = Records.get(game.id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.3rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:0.75rem;opacity:.35;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:9px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size: 0.75rem;opacity:.35">Your best</div><div style="font-weight:800;font-size:.86rem;color:'+PCBrand.h_ffd60a+'">' + rec.score + ' pts</div></div></div>' : '') +
    '<div style="font-size: 0.75rem;opacity:.28;text-transform:uppercase;letter-spacing:.1em;margin-bottom:9px">How to play?</div>' +
    '<div style="display:flex;flex-direction:column;gap:8px">' +
      '<button type="button" onclick="window.__v7pm(\'solo\')" style="padding:15px;border-radius:16px;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.05);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(0,229,255,.15);border:1px solid rgba(0,229,255,.28);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🎮</div>' +
        '<div><div style="font-weight:800">Play Solo</div><div style="font-size:0.75rem;opacity:.4;margin-top:1px">Just you, no opponent</div></div></button>' +
      '<button type="button" onclick="window.__v7pm(\'bot\')" style="padding:15px;border-radius:16px;border:1px solid rgba(199,125,255,.22);background:rgba(199,125,255,.07);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(199,125,255,.18);border:1px solid rgba(199,125,255,.35);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">🤖</div>' +
        '<div><div style="font-weight:800">vs Bot / AI</div><div style="font-size:0.75rem;opacity:.4;margin-top:1px">Challenge the AI on one device</div></div></button>' +
      '<button type="button" onclick="window.__v7pm(\'multi\')" style="padding:15px;border-radius:16px;border:1px solid rgba(255,45,120,.22);background:rgba(255,45,120,.07);color:'+PCBrand.h_fff+';font:700 .9rem -apple-system,sans-serif;cursor:pointer;display:flex;align-items:center;gap:12px;text-align:left;-webkit-tap-highlight-color:transparent">' +
        '<div style="width:40px;height:40px;border-radius:50%;background:rgba(255,45,120,.18);border:1px solid rgba(255,45,120,.35);display:flex;align-items:center;justify-content:center;font-size:1.2rem;flex-shrink:0">👥</div>' +
        '<div><div style="font-weight:800">Pass & Play</div><div style="font-size:0.75rem;opacity:.4;margin-top:1px">'+game.min+'–'+game.max+' players, pass the device</div></div></button>' +
    '</div></div>'
  );
  window.__v7pm = function(mode) {
    Modal.close();
    setTimeout(function() {
      var pl;
      if (mode === 'solo') {
        pl = [{ id:'p1', name:S.prof.name||'Player', av:S.prof.av||'😎', col:PCBrand.h_c77dff, local:true }];
        Cinematic.show(game, pl, function() { self._start(game, pl); });
      } else if (mode === 'bot') {
        pl = [
          { id:'p1', name:S.prof.name||'Player', av:S.prof.av||'😎', col:PCBrand.h_c77dff, local:true },
          Bot.createPlayer(null, typeof Difficulty !== 'undefined' ? Difficulty.current : 'normal')
        ];
        Cinematic.show(game, pl, function() { self._start(game, pl); });
      } else {
        self._setup(game);
      }
    }, 280);
  };
};

GL._v7SoloLaunch = function(game) {
  var self = this;
  var players = [{ id:'p1', name:S.prof.name||'Player', av:S.prof.av||'🎮', col:PCBrand.h_c77dff, local:true }];
  var rec = Records.get(game.id);
  Modal.open(
    '<div>' +
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">' +
      '<div style="font-size:2.3rem">' + game.icon + '</div>' +
      '<div><div style="font-size:1rem;font-weight:800">' + game.title + '</div>' +
      '<div style="font-size:0.75rem;opacity:.35;margin-top:2px">' + game.desc + '</div></div>' +
    '</div>' +
    (rec ? '<div style="padding:9px 12px;background:rgba(255,214,10,.08);border:1px solid rgba(255,214,10,.18);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:8px"><span style="font-size:1.1rem">🏆</span><div><div style="font-size: 0.75rem;opacity:.35">Your best</div><div style="font-weight:800;font-size:.86rem;color:'+PCBrand.h_ffd60a+'">' + rec.score + ' pts</div></div></div>' : '') +
    '<div onclick="typeof Difficulty!==\'undefined\'&&Difficulty.pick(function(){Modal.close();GL._v7SoloLaunch(game);})" style="padding:10px 13px;background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);border-radius:12px;margin-bottom:12px;display:flex;align-items:center;gap:9px;cursor:pointer">' +
      '<span style="font-size:1.2rem">' + (typeof Difficulty !== 'undefined' ? Difficulty.get().icon : '🟡') + '</span>' +
      '<div style="flex:1"><div style="font-size:.82rem;font-weight:700">' + (typeof Difficulty !== 'undefined' ? Difficulty.get().label : 'Normal') + '</div><div style="font-size: 0.75rem;opacity:.35">Tap to change</div></div>' +
      '<span style="opacity:.28;font-size:.82rem">›</span>' +
    '</div>' +
    '<div style="display:flex;gap:8px">' +
      '<button type="button" class="btn bg" style="flex:0 0 auto;padding:12px 14px" onclick="Modal.close();setTimeout(function(){typeof Tutorial!==\'undefined\'&&Tutorial.show(game,function(){GL._v7SoloLaunch(game);});},280)">📖</button>' +
      '<button type="button" class="btn bw" style="flex:1;font-size:.95rem" onclick="window.__sgo()">▶ Play Now!</button>' +
    '</div></div>'
  );
  window.__sgo = function() {
    Modal.close();
    setTimeout(function() {
      Cinematic.show(game, players, function() { self._start(game, players); });
    }, 270);
  };
};

// Win screen override for confetti
var _baseShowWin = Game.prototype.showWin;
Game.prototype.showWin = function(winner, scores, extra) {
  _baseShowWin.call(this, winner, scores, extra);
  setTimeout(confetti, 200);
};

// ── 10. LUDO GAME ─────────────────────────────────────────────────
var Ludo = new Game({
  id:'ludo',title:'Ludo',icon:'🎲',type:'board',cat:'multiplayer',
  col:PCBrand.h_ffd60a,mp:true,min:1,max:6,
  desc:'Classic Ludo! Tap to roll, race to home. 1-6 players + bots.'
});

Ludo._COLS = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff,PCBrand.h_c77dff,PCBrand.h_ff6b00];
Ludo._NAMES = ['Red','Green','Yellow','Blue','Purple','Orange'];
Ludo._EMOJIS = ['🔴','🟢','🟡','🔵','🟣','🟠'];

Ludo.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  var self = this;
  this.gs = {
    players: pl.map(function(p, i) {
      return {
        id: p.id, name: p.name, av: p.av,
        col: Ludo._COLS[i % 6], emoji: Ludo._EMOJIS[i % 6],
        colorName: Ludo._NAMES[i % 6],
        pieces: [{ pos:-1, home:false }, { pos:-1, home:false }, { pos:-1, home:false }, { pos:-1, home:false }],
        isBot: p.isBot || false
      };
    }),
    turn: 0, dice: 0, phase: 'roll', movable: [], winner: null, log: [], sixStreak: 0
  };
};

Ludo.render = function() {
  var gs = this.gs, self = this;
  if (gs.winner) {
    this.done(gs.winner.name);
    this.showWin(gs.winner.name, gs.players.map(function(p) {
      return { n:p.name, s:p.pieces.filter(function(pc){return pc.home;}).length+'/4 home' };
    }));
    return;
  }
  var cur = gs.players[gs.turn % gs.players.length];
  var boardSz = Math.min(window.innerWidth - 28, 360);
  var cell = Math.floor(boardSz / 15);
  boardSz = cell * 15;

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x">' +
    gs.players.map(function(p, i) {
      var active = i === gs.turn % gs.players.length;
      var inHome = p.pieces.filter(function(pc) { return pc.home; }).length;
      return '<div style="flex-shrink:0;text-align:center;padding:7px 10px;border-radius:13px;background:' + (active ? p.col + '28' : 'rgba(255,255,255,.04)') + ';border:2px solid ' + (active ? p.col : 'transparent') + '">' +
        '<div style="font-size:.95rem">' + p.emoji + '</div>' +
        '<div style="font-size:0.75rem;font-weight:700;margin-top:2px">' + p.colorName + '</div>' +
        '<div style="font-size: 0.75rem;opacity:.45">' + inHome + '/4</div>' +
        (p.isBot ? '<div style="font-size: 0.75rem;color:var(--p5);font-weight:700">BOT</div>' : '') +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:11px">' +
      '<div style="position:relative;width:' + boardSz + 'px;height:' + boardSz + 'px">' +
      self._renderSVG(boardSz, cell) +
      '</div>' +
    '</div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between;gap:12px">' +
      '<div style="flex:1">' +
        '<div style="font-weight:800;font-size:.9rem">' + cur.emoji + ' ' + cur.name + '</div>' +
        '<div style="font-size:0.75rem;opacity:.38;margin-top:1px">' + cur.colorName + (gs.phase === 'roll' ? ' · Tap dice to roll' : ' · Tap a piece') + '</div>' +
        (gs.log.length ? '<div style="font-size: 0.75rem;opacity:.32;margin-top:3px">' + gs.log[gs.log.length-1] + '</div>' : '') +
      '</div>' +
      '<div class="dice" id="ldice" onclick="window._lroll()" style="opacity:' + (gs.phase === 'roll' && !cur.isBot ? '1' : '0.5') + '">' +
        (gs.dice ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice] : '🎲') +
      '</div>' +
    '</div></div>';

  window._lroll = function() { if (gs.phase === 'roll' && !cur.isBot) self._roll(); };
  window._lmove = function(playerIdx, pieceIdx) { self._movePiece(playerIdx, pieceIdx); };
  if (cur.isBot && gs.phase === 'roll') {
    setTimeout(function() { if (S.game === self && gs.phase === 'roll') self._roll(); }, 900);
  }
};

Ludo._renderSVG = function(sz, cell) {
  var gs = this.gs, self = this;
  var html = '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '" style="border-radius:12px;overflow:hidden;cursor:pointer">';
  // Background
  html += '<rect width="' + sz + '" height="' + sz + '" fill=PCBrand.h_1a1a2e/>';
  // Quadrant colors: TL=Red, TR=Green, BL=Yellow, BR=Blue
  var qcols = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff];
  var qpos = [{x:0,y:0},{x:cell*9,y:0},{x:0,y:cell*9},{x:cell*9,y:cell*9}];
  qpos.forEach(function(q, i) {
    html += '<rect x="' + q.x + '" y="' + q.y + '" width="' + (cell*6) + '" height="' + (cell*6) + '" fill="' + qcols[i] + '" opacity=".2" rx="6"/>';
    var cx = q.x + cell * 3, cy = q.y + cell * 3;
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (cell*2) + '" fill="' + qcols[i] + '" opacity=".3"/>';
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + (cell*1.4) + '" fill="rgba(0,0,0,.4)"/>';
  });
  // Grid lines
  for (var i = 0; i <= 15; i++) {
    html += '<line x1="' + (i*cell) + '" y1="0" x2="' + (i*cell) + '" y2="' + sz + '" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
    html += '<line x1="0" y1="' + (i*cell) + '" x2="' + sz + '" y2="' + (i*cell) + '" stroke="rgba(255,255,255,.05)" stroke-width="1"/>';
  }
  // Center home
  var mid = sz / 2;
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*2.5) + ',' + (mid-cell*3) + ' ' + (mid+cell*2.5) + ',' + (mid-cell*3) + '" fill=PCBrand.h_ff2d78 opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid+cell*3) + ',' + (mid-cell*2.5) + ' ' + (mid+cell*3) + ',' + (mid+cell*2.5) + '" fill=PCBrand.h_00e676 opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*2.5) + ',' + (mid+cell*3) + ' ' + (mid+cell*2.5) + ',' + (mid+cell*3) + '" fill=PCBrand.h_ffd60a opacity=".5"/>';
  html += '<polygon points="' + mid + ',' + mid + ' ' + (mid-cell*3) + ',' + (mid-cell*2.5) + ' ' + (mid-cell*3) + ',' + (mid+cell*2.5) + '" fill=PCBrand.h_00e5ff opacity=".5"/>';
  // Safe cell markers (star)
  var safeGrids = [{x:2,y:6},{x:6,y:2},{x:8,y:12},{x:12,y:8}];
  safeGrids.forEach(function(p) {
    html += '<text x="' + (p.x*cell+cell/2) + '" y="' + (p.y*cell+cell/2+4) + '" text-anchor="middle" font-size="' + Math.round(cell*.65) + '">⭐</text>';
  });
  // Draw pieces
  gs.players.forEach(function(p, pi) {
    p.pieces.forEach(function(pc, pci) {
      if (pc.home) return;
      var pos;
      if (pc.pos === -1) {
        // In home base
        var bases = [{x:1,y:1},{x:9,y:1},{x:1,y:9},{x:9,y:9}];
        var b = bases[Math.min(pi, 3)];
        var ox = pci % 2, oy = Math.floor(pci / 2);
        pos = { x:(b.x+ox)*cell+cell/2, y:(b.y+oy)*cell+cell/2 };
      } else {
        pos = self._trackXY(pc.pos, pi, cell);
      }
      var r = Math.round(cell * .34);
      var isMovable = gs.movable.indexOf(pci) > -1 && pi === gs.turn % gs.players.length;
      // Glow for movable
      if (isMovable) {
        html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + (r+4) + '" fill="' + p.col + '" opacity=".35"><animate attributeName="r" values="' + (r+4) + ';' + (r+8) + ';' + (r+4) + '" dur="0.8s" repeatCount="indefinite"/></circle>';
      }
      html += '<circle cx="' + pos.x + '" cy="' + pos.y + '" r="' + r + '" fill="' + p.col + '" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';
      html += '<text x="' + pos.x + '" y="' + (pos.y+4) + '" text-anchor="middle" font-size="' + Math.round(r*.9) + '">' + p.emoji + '</text>';
      if (isMovable) {
        html += '<rect x="' + (pos.x-r-6) + '" y="' + (pos.y-r-6) + '" width="' + (r*2+12) + '" height="' + (r*2+12) + '" fill="transparent" onclick="window._lmove(' + pi + ',' + pci + ')" style="cursor:pointer"/>';
      }
    });
  });
  html += '</svg>';
  return html;
};

// 52-step outer track positions (grid coords)
Ludo._TRACK = [
  {x:6,y:13},{x:6,y:12},{x:6,y:11},{x:6,y:10},{x:6,y:9},{x:5,y:8},
  {x:4,y:8},{x:3,y:8},{x:2,y:8},{x:1,y:8},{x:0,y:8},{x:0,y:7},
  {x:0,y:6},{x:1,y:6},{x:2,y:6},{x:3,y:6},{x:4,y:6},{x:5,y:6},
  {x:6,y:5},{x:6,y:4},{x:6,y:3},{x:6,y:2},{x:6,y:1},{x:6,y:0},
  {x:7,y:0},{x:8,y:0},{x:8,y:1},{x:8,y:2},{x:8,y:3},{x:8,y:4},
  {x:8,y:5},{x:9,y:6},{x:10,y:6},{x:11,y:6},{x:12,y:6},{x:13,y:6},
  {x:14,y:6},{x:14,y:7},{x:14,y:8},{x:13,y:8},{x:12,y:8},{x:11,y:8},
  {x:10,y:8},{x:9,y:8},{x:8,y:9},{x:8,y:10},{x:8,y:11},{x:8,y:12},
  {x:8,y:13},{x:8,y:14},{x:7,y:14},{x:6,y:14}
];
Ludo._STARTS = [0, 13, 26, 39]; // track entry per color
Ludo._SAFE   = [0, 8, 13, 21, 26, 34, 39, 47];

Ludo._trackXY = function(step, colorIdx, cell) {
  var offset = Ludo._STARTS[Math.min(colorIdx, 3)] || 0;
  var idx = (step + offset) % 52;
  var t = Ludo._TRACK[idx] || {x:7, y:7};
  return { x: t.x * cell + cell / 2, y: t.y * cell + cell / 2 };
};

Ludo._roll = function() {
  var gs = this.gs, self = this;
  if (gs.phase !== 'roll') return;
  var d = document.getElementById('ldice');
  if (d) d.classList.add('rolling');
  Snd.dice(); Hap.dice();
  setTimeout(function() {
    gs.dice = Math.floor(Math.random() * 6) + 1;
    if (d) { d.classList.remove('rolling'); d.textContent = ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice]; }
    var cur = gs.players[gs.turn % gs.players.length];
    gs.movable = [];
    cur.pieces.forEach(function(pc, i) {
      if (pc.home) return;
      if (pc.pos === -1 && gs.dice === 6) gs.movable.push(i);
      if (pc.pos >= 0) gs.movable.push(i);
    });
    if (!gs.movable.length) {
      gs.log.push(cur.colorName + ' rolled ' + gs.dice + ' — no moves');
      setTimeout(function() { self._next(); }, 1100);
    } else if (gs.movable.length === 1) {
      gs.phase = 'move';
      setTimeout(function() { self._movePiece(gs.turn % gs.players.length, gs.movable[0]); }, 400);
    } else {
      gs.phase = 'move';
      if (cur.isBot) {
        setTimeout(function() {
          var pick = gs.movable[Math.floor(Math.random() * gs.movable.length)];
          self._movePiece(gs.turn % gs.players.length, pick);
        }, 700);
      } else {
        toast(cur.colorName + ' rolled ' + gs.dice + '! Tap a piece');
        Nav.go('game'); self.render();
      }
    }
    if (gs.dice === 6) gs.sixStreak++;
    else gs.sixStreak = 0;
  }, 520);
};

Ludo._movePiece = function(playerIdx, pieceIdx) {
  var gs = this.gs, self = this;
  var p = gs.players[playerIdx], pc = p.pieces[pieceIdx];
  if (pc.pos === -1 && gs.dice === 6) {
    pc.pos = 0;
    gs.log.push(p.colorName + ' enters the board!');
    Snd.coin(); Hap.ok();
  } else if (pc.pos >= 0) {
    pc.pos += gs.dice;
    if (pc.pos >= 56) {
      pc.pos = 56; pc.home = true;
      gs.log.push(p.colorName + ' reached HOME! 🏠');
      Snd.win(); Hap.blast();
      var homeCount = p.pieces.filter(function(x) { return x.home; }).length;
      toast(p.emoji + ' ' + homeCount + '/4 home!');
    } else {
      // Check knock
      var myXY = self._trackXY(pc.pos, playerIdx, 1);
      gs.players.forEach(function(op, oi) {
        if (oi === playerIdx) return;
        op.pieces.forEach(function(opc) {
          if (opc.home || opc.pos < 0) return;
          var opXY = self._trackXY(opc.pos, oi, 1);
          if (Math.abs(opXY.x - myXY.x) < 0.1 && Math.abs(opXY.y - myXY.y) < 0.1) {
            var isSafe = Ludo._SAFE.indexOf(opc.pos) > -1;
            if (!isSafe) {
              opc.pos = -1;
              gs.log.push(p.colorName + ' knocked ' + op.colorName + ' back!');
              toast('💥 ' + p.emoji + ' knocked ' + op.emoji + ' back!');
              Snd.blast(); Hap.blast();
            }
          }
        });
      });
    }
  }
  // Check win
  if (p.pieces.every(function(pc) { return pc.home; })) {
    gs.winner = p;
    Ach.unlock('ludo1');
    Nav.go('game'); self.render(); return;
  }
  // Six = another turn (max 3)
  if (gs.dice === 6 && gs.sixStreak < 3) {
    gs.phase = 'roll';
    if (!p.isBot) toast('🎲 Six! Roll again!');
    Nav.go('game'); self.render();
    if (p.isBot) setTimeout(function() { self._roll(); }, 800);
  } else {
    gs.sixStreak = 0;
    self._next();
  }
};

Ludo._next = function() {
  var gs = this.gs;
  gs.turn++; gs.phase = 'roll'; gs.movable = []; gs.dice = 0;
  Nav.go('game'); this.render();
};

// Expose handlers
window._lroll = function() { if (S.game && S.game.id === 'ludo') S.game._roll(); };
window._lmove = function(pi, pci) { if (S.game && S.game.id === 'ludo') S.game._movePiece(pi, pci); };

// ── 11. SNAKES & LADDERS ─────────────────────────────────────────
var SnakesLadders = new Game({
  id:'snl',title:'Snakes & Ladders',icon:'🐍',type:'board',cat:'multiplayer',
  col:PCBrand.h_00e676,mp:true,min:1,max:6,
  desc:'Classic board game! Climb ladders, dodge snakes. 1-6 players + bots.'
});

SnakesLadders._SNAKES  = {16:6, 47:26, 49:11, 56:53, 62:19, 64:60, 87:24, 93:73, 95:75, 99:78};
SnakesLadders._LADDERS = {4:14, 9:31, 20:38, 28:84, 40:59, 51:67, 63:81, 71:91};
SnakesLadders._COLS    = [PCBrand.h_ff2d78,PCBrand.h_00e676,PCBrand.h_ffd60a,PCBrand.h_00e5ff,PCBrand.h_c77dff,PCBrand.h_ff6b00];
SnakesLadders._EMOJIS  = ['🔴','🟢','🟡','🔵','🟣','🟠'];

SnakesLadders.setup = function(pl) {
  Game.prototype.setup.call(this, pl);
  this.gs = {
    players: pl.map(function(p, i) {
      return { id:p.id, name:p.name, av:p.av, col:SnakesLadders._COLS[i%6], emoji:SnakesLadders._EMOJIS[i%6], pos:0, isBot:p.isBot||false };
    }),
    turn:0, dice:0, phase:'roll', winner:null, log:[]
  };
};

SnakesLadders._cellPos = function(n, cell) {
  var row = Math.floor((n-1) / 10);
  var col = (n-1) % 10;
  if (row % 2 === 1) col = 9 - col;
  return { x: col * cell, y: (9 - row) * cell };
};

SnakesLadders.render = function() {
  var gs = this.gs, self = this;
  if (gs.winner) {
    this.done(gs.winner.name);
    this.showWin(gs.winner.name, gs.players.map(function(p) { return { n:p.name, s:'pos '+p.pos }; }));
    Ach.unlock('snl1');
    return;
  }
  var cur = gs.players[gs.turn % gs.players.length];
  var sz = Math.min(window.innerWidth - 28, 340);
  var cell = Math.floor(sz / 10); sz = cell * 10;

  document.getElementById('gbody').innerHTML =
    '<div style="padding:4px 0">' +
    '<div style="display:flex;gap:5px;overflow-x:auto;margin-bottom:10px;touch-action:pan-x">' +
    gs.players.map(function(p, i) {
      var active = i === gs.turn % gs.players.length;
      return '<div style="flex-shrink:0;text-align:center;padding:7px 10px;border-radius:13px;background:' + (active?p.col+'28':'rgba(255,255,255,.04)') + ';border:2px solid ' + (active?p.col:'transparent') + '">' +
        '<div style="font-size:.95rem">' + p.emoji + '</div>' +
        '<div style="font-size:0.75rem;font-weight:700;margin-top:2px">' + p.name.slice(0,6) + '</div>' +
        '<div style="font-size: 0.75rem;opacity:.45">' + p.pos + '</div>' +
        (p.isBot ? '<div style="font-size: 0.75rem;color:var(--p5);font-weight:700">BOT</div>' : '') +
      '</div>';
    }).join('') +
    '</div>' +
    '<div style="display:flex;justify-content:center;margin-bottom:11px">' +
    '<svg width="' + sz + '" height="' + sz + '" viewBox="0 0 ' + sz + ' ' + sz + '" style="border-radius:12px">' +
    self._buildSVG(sz, cell, gs) +
    '</svg></div>' +
    '<div style="display:flex;align-items:center;justify-content:space-between">' +
      '<div style="flex:1">' +
        '<div style="font-weight:800;font-size:.9rem">' + cur.emoji + ' ' + cur.name + '</div>' +
        '<div style="font-size:0.75rem;opacity:.38">' + (gs.phase==='roll'?'Tap the dice to roll':'') + '</div>' +
        (gs.log.length ? '<div style="font-size: 0.75rem;opacity:.32;margin-top:3px">' + gs.log[gs.log.length-1] + '</div>' : '') +
      '</div>' +
      '<div class="dice" id="snldice" onclick="window._snlroll()" style="opacity:' + (gs.phase==='roll'&&!cur.isBot?'1':'0.5') + '">' +
        (gs.dice ? ['','⚀','⚁','⚂','⚃','⚄','⚅'][gs.dice] : '🎲') +
      '</div>' +
    '</div></div>';

  window._snlroll = function() { if (gs.phase === 'roll' && !cur.isBot) self._roll(); };
  if (cur.isBot && gs.phase === 'roll') {
    setTimeout(function() { if (S.game === self) self._roll(); }, 850);
  }
};

SnakesLadders._buildSVG = function(sz, cell, gs) {
  var self = this;
  var html = '<rect width="' + sz + '" height="' + sz + '" fill=PCBrand.h_1a1a2e/>';
  for (var n = 1; n <= 100; n++) {
    var p = this._cellPos(n, cell);
    var isSnake = this._SNAKES[n], isLadder = this._LADDERS[n];
    var bg = isSnake ? 'rgba(255,45,85,.22)' : isLadder ? 'rgba(0,230,118,.22)' : ((n % 2 === 0) ? 'rgba(255,255,255,.04)' : 'rgba(255,255,255,.02)');
    html += '<rect x="' + (p.x+.5) + '" y="' + (p.y+.5) + '" width="' + (cell-1) + '" height="' + (cell-1) + '" fill="' + bg + '" rx="2"/>';
    html += '<text x="' + (p.x+3) + '" y="' + (p.y+10) + '" font-size="' + Math.round(cell*.26) + '" fill="rgba(255,255,255,.28)" font-family="system-ui">' + n + '</text>';
    if (isSnake) html += '<text x="' + (p.x+cell/2) + '" y="' + (p.y+cell/2+5) + '" text-anchor="middle" font-size="' + Math.round(cell*.48) + '">🐍</text>';
    if (isLadder) html += '<text x="' + (p.x+cell/2) + '" y="' + (p.y+cell/2+5) + '" text-anchor="middle" font-size="' + Math.round(cell*.48) + '">🪜</text>';
  }
  // Snake lines
  Object.entries(this._SNAKES).forEach(function(e) {
    var f = self._cellPos(parseInt(e[0]), cell), t = self._cellPos(parseInt(e[1]), cell);
    html += '<line x1="' + (f.x+cell/2) + '" y1="' + (f.y+cell/2) + '" x2="' + (t.x+cell/2) + '" y2="' + (t.y+cell/2) + '" stroke=PCBrand.h_ff2d55 stroke-width="1.5" opacity=".35" stroke-dasharray="3"/>';
  });
  // Ladder lines
  Object.entries(this._LADDERS).forEach(function(e) {
    var f = self._cellPos(parseInt(e[0]), cell), t = self._cellPos(parseInt(e[1]), cell);
    html += '<line x1="' + (f.x+cell/2) + '" y1="' + (f.y+cell/2) + '" x2="' + (t.x+cell/2) + '" y2="' + (t.y+cell/2) + '" stroke=PCBrand.h_00e676 stroke-width="1.5" opacity=".35"/>';
  });
  // Pieces
  gs.players.forEach(function(p, pi) {
    if (p.pos === 0) return;
    var pos = self._cellPos(p.pos, cell);
    var ox = (pi % 2) * (cell * 0.28), oy = Math.floor(pi / 2) * (cell * 0.28);
    var cx = pos.x + cell/2 + ox - cell*0.14, cy = pos.y + cell/2 + oy - cell*0.14;
    html += '<circle cx="' + cx + '" cy="' + cy + '" r="' + Math.round(cell*.26) + '" fill="' + p.col + '" stroke="rgba(0,0,0,.35)" stroke-width="2"/>';
    html += '<text x="' + cx + '" y="' + (cy+4) + '" text-anchor="middle" font-size="' + Math.round(cell*.24) + '">' + p.emoji + '</text>';
  });
  return html;
};

SnakesLadders._roll = function() {
  var gs = this.gs, self = this;
  if (gs.phase !== 'roll') return;
  var d = document.getElementById('snldice');
  if (d) d.classList.add('rolling');
  Snd.dice(); Hap.dice();
  setTimeout(function() {
    var roll = Math.floor(Math.random() * 6) + 1;
    gs.dice = roll;
    if (d) { d.classList.remove('rolling'); d.textContent = ['','⚀','⚁','⚂','⚃','⚄','⚅'][roll]; }
    var cur = gs.players[gs.turn % gs.players.length];
    var newPos = cur.pos + roll;
    if (newPos > 100) {
      gs.log.push(cur.name + ' needs exact — rolled ' + roll);
      setTimeout(function() { self._next(); }, 900);
      Nav.go('game'); self.render(); return;
    }
    cur.pos = newPos;
    var landed = false;
    // Snake
    if (self._SNAKES[newPos]) {
      var to = self._SNAKES[newPos];
      setTimeout(function() {
        cur.pos = to;
        gs.log.push('🐍 ' + cur.name + ' bitten! ' + newPos + '→' + to);
        toast('🐍 Snake! ' + cur.emoji + ' back to ' + to);
        Snd.err(); Hap.err();
        setTimeout(function() { self._next(); }, 700);
        Nav.go('game'); self.render();
      }, 400);
      landed = true;
    }
    // Ladder
    if (!landed && self._LADDERS[newPos]) {
      var to2 = self._LADDERS[newPos];
      setTimeout(function() {
        cur.pos = to2;
        gs.log.push('🪜 ' + cur.name + ' climbed! ' + newPos + '→' + to2);
        toast('🪜 Ladder! ' + cur.emoji + ' up to ' + to2);
        Snd.coin(); Hap.ok();
        if (to2 >= 100) { gs.winner = cur; Nav.go('game'); self.render(); return; }
        setTimeout(function() { self._next(); }, 700);
        Nav.go('game'); self.render();
      }, 400);
      landed = true;
    }
    if (!landed) {
      gs.log.push(cur.name + ' rolled ' + roll + ' → ' + newPos);
      if (newPos === 100) { gs.winner = cur; confetti(); Snd.win(); Nav.go('game'); self.render(); return; }
      if (roll === 6) {
        gs.phase = 'roll'; gs.dice = 0;
        Nav.go('game'); self.render();
        if (!cur.isBot) toast('🎲 Six! Roll again!');
        else setTimeout(function() { self._roll(); }, 700);
      } else {
        setTimeout(function() { self._next(); }, 500);
        Nav.go('game'); self.render();
      }
    }
  }, 520);
};

SnakesLadders._next = function() {
  var gs = this.gs;
  gs.turn++; gs.phase = 'roll'; gs.dice = 0;
  Nav.go('game'); this.render();
};

window._snlroll = function() { if (S.game && S.game.id === 'snl') S.game._roll(); };

// ── 12. BOT FOR CHESS (already in v6, patch Draughts too) ─────────
if (typeof Draughts !== 'undefined' && !Draughts._botPatched) {
  Draughts._botPatched = true;
  var _origDraughtsRender = Draughts.render.bind(Draughts);
  Draughts.render = function() {
    _origDraughtsRender();
    var gs = this.gs;
    if (gs && gs.players && gs.players[gs.turn] && gs.players[gs.turn].isBot) {
      var self = this;
      setTimeout(function() {
        if (!S.game || S.game.id !== 'draughts') return;
        var curCol = gs.turn === 0 ? 'w' : 'b';
        var moves = [];
        for (var r = 0; r < 8; r++) for (var c = 0; c < 8; c++) {
          if (gs.board[r][c] && gs.board[r][c].col === curCol) {
            var m = Draughts._getMoves(gs.board, r, c);
            m.jumps.concat(m.moves).forEach(function(mv) { moves.push({r:r,c:c,move:mv}); });
          }
        }
        if (!moves.length) return;
        var pick = moves[Math.floor(Math.random() * moves.length)];
        if (window._dc) window._dc(pick.r, pick.c);
        setTimeout(function() {
          var pm = pick.move;
          if (window._dc) window._dc(pm[0], pm[1]);
        }, 400);
      }, 800);
    }
  };
}

// ── 13. REGISTER NEW GAMES ────────────────────────────────────────
setTimeout(function() {
  if (typeof Reg !== 'undefined') {
    [Ludo, SnakesLadders].forEach(function(g) {
      if (!Reg.get(g.id)) Reg.add(g);
    });
    // Rebuild UI
    if (typeof GL !== 'undefined') {
      GL._buildScrolls ? GL._buildScrolls() : null;
      GL._buildLib ? GL._buildLib('all') : null;
      GL._buildFeat ? GL._buildFeat() : null;
    }
    // Keep demo/stats games count = live registry
    if (S.prof && (S.prof.games !== Reg.list.length) && (S.prof.name === 'Demo Operative' || /[?&]demo=1(?:&|$)/.test(location.search))) {
      S.prof.games = Reg.list.length;
      Save.save();
    }
    // Update count
    var lc = document.getElementById('lib-count');
    if (lc) lc.textContent = Reg.list.length + ' games · Fully offline';
    // Add board row to home
    var br = document.getElementById('board-row');
    if (br && GL._buildScrollRow) {
      GL._buildScrollRow('board-row', Reg.board ? Reg.board() : []);
    }
    if (typeof UI !== 'undefined' && UI.home) UI.home();
  }
}, 800);

// ── 14. NOTIFICATION TOGGLE IN SETTINGS ──────────────────────────
setTimeout(function() {
  var settingsGlass = _profileSettingsGlass();
  if (settingsGlass && !document.getElementById('_nrow')) {
    var row = document.createElement('div');
    row.className = 'srow'; row.id = '_nrow';
    row.innerHTML = '<span style="font-size:.84rem;font-weight:600">🔔 Notifications</span><div class="tog ' + (S.cfg.notif ? 'on' : '') + '" id="tnotif" onclick="GL.togSet(\'notif\',this)"></div>';
    var rows = settingsGlass.querySelectorAll('.srow');
    if (rows.length) settingsGlass.insertBefore(row, rows[rows.length-1]);
    // Add music toggle
    var mrow = document.createElement('div');
    mrow.className = 'srow'; mrow.id = '_mrow';
    mrow.innerHTML = '<span style="font-size:.84rem;font-weight:600">🎵 Background Music</span><div class="tog ' + (S.cfg.music ? 'on' : '') + '" id="tmus" onclick="GL.togSet(\'music\',this)"></div>';
    settingsGlass.insertBefore(mrow, rows[rows.length-1]);
    var erow = document.createElement('div');
    erow.className = 'srow'; erow.id = '_erow';
    erow.innerHTML = '<span style="font-size:.84rem;font-weight:600">⚡ Eco / Low Power</span><div class="tog ' + (S.cfg.lowPower ? 'on' : '') + '" id="teco" onclick="window.__togEco(this)"></div>';
    settingsGlass.insertBefore(erow, mrow);
    var brow = document.createElement('div');
    brow.className = 'srow'; brow.id = '_brow';
    brow.innerHTML = '<span style="font-size:.84rem;font-weight:600">✨ Background Effects</span><div class="tog ' + (S.cfg.bg ? 'on' : '') + '" id="tbg2" onclick="GL.togSet(\'bg\',this)"></div>';
    settingsGlass.insertBefore(brow, erow);
    // Add friends button
    var frow = document.createElement('div');
    frow.className = 'srow'; frow.style.borderBottom = 'none';
    frow.innerHTML = '<span style="font-size:.84rem;font-weight:600">👥 Add Friend</span><button type="button" class="btn bg bsm srow-action" style="color:var(--p6)" onclick="Friends.add()">+ Add</button>';
    settingsGlass.appendChild(frow);
    // Device gate removed (P-PRSM-1) — no Change Device row
  }
}, 2500);

// DevSel.show — no-op (device gate removed)
DevSel.show = function() {
  toast('Layout follows your screen size automatically');
};

window.__togEco = function(el) {
  S.cfg.lowPower = !S.cfg.lowPower;
  S.cfg.perfMode = S.cfg.lowPower ? 'eco' : 'balanced';
  if (S.cfg.lowPower) S.cfg.bg = false;
  if (el) el.className = 'tog' + (S.cfg.lowPower ? ' on' : '');
  var bg2 = document.getElementById('tbg2'), bg0 = document.getElementById('tbg');
  if (bg2) bg2.className = 'tog' + (S.cfg.bg ? ' on' : '');
  if (bg0) bg0.className = 'tog' + (S.cfg.bg ? ' on' : '');
  if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
  Save.save(); Snd.click();
  toast(S.cfg.lowPower ? '⚡ Eco mode ON' : '⚡ Eco mode OFF');
};

// ── 15. GL.togSet for music ───────────────────────────────────────
var _baseTogSet = GL.togSet.bind(GL);
GL.togSet = function(key, el) {
  if (key === 'music') { Music.toggle(); return; }
  if (key === 'notif') {
    S.cfg.notif = !S.cfg.notif;
    if (el) el.className = 'tog' + (S.cfg.notif ? ' on' : '');
    Save.save(); Snd.click();
    toast(S.cfg.notif ? '🔔 Notifications ON' : '🔕 Notifications OFF');
    return;
  }
  _baseTogSet(key, el);
};

// Override toast to respect notif setting (closure — never reuse global _baseToast)
(function () {
  var baseToast = window.toast;
  window.toast = function (msg, dur, dir) {
    var isCritical = msg && (String(msg).includes('❌') || String(msg).includes('Error') || String(msg).includes('Win'));
    if (!S.cfg.notif && !isCritical && !dir) return;
    baseToast(msg, dur, dir);
  };
})();

function _profileSettingsGlass() {
  var panels = document.querySelectorAll('#profile-screen .glass');
  for (var i = 0; i < panels.length; i++) {
    if (panels[i].querySelector('.srow')) return panels[i];
  }
  return null;
}

// ── 16. ADDITIONAL CSS TWEAKS (css/app-runtime.css) ──


// ── 17. BOARD ROW IN HOME SCREEN ─────────────────────────────────
setTimeout(function() {
  // Add board games row to home if not there
  var homeScreen = document.getElementById('home-screen');
  if (homeScreen && !document.getElementById('board-row')) {
    var shdr = document.createElement('div');
    shdr.className = 'shdr';
    shdr.style.marginTop = '5px';
    shdr.innerHTML = '<div class="sec">🎲 Board Games</div><div style="font-size:0.75rem;opacity:.25;cursor:pointer" onclick="GL.filter(\'board\',null)">See All</div>';
    var row = document.createElement('div');
    row.id = 'board-row';
    row.className = 'hscroll';
    homeScreen.appendChild(shdr);
    homeScreen.appendChild(row);
  }
}, 1200);

// ── 18. ORIENT MANAGER ────────────────────────────────────────────
if (typeof OrientMgr === 'undefined') {
  var OrientMgr = {
    current: 'portrait',
    init: function() {
      var self = this;
      window.addEventListener('orientationchange', function() { setTimeout(function() { self._update(); }, 300); });
      this._update();
    },
    _update: function() {
      var isL = window.innerWidth > window.innerHeight;
      this.current = isL ? 'landscape' : 'portrait';
      document.body.setAttribute('data-orient', this.current);
      var btn = document.getElementById('orient-btn');
      if (btn) btn.textContent = isL ? '⟲' : '⟳';
    },
    toggle: function() {
      if (screen.orientation && screen.orientation.lock) {
        screen.orientation.lock(this.current === 'portrait' ? 'landscape' : 'portrait').catch(function() { toast('Rotate your device to switch'); });
      } else { toast('Rotate your device to switch'); }
      Snd.click(); Hap.l();
    }
  };
}

// Run orient init
OrientMgr.init();

// ── 19. CORE STABILITY + PWA + PROGRESSION LAYER (single-file safe) ──
(function(){
  if (window.__prismCorePatched) return;
  window.__prismCorePatched = true;

  var K = {
    main: 'po5',
    backup: 'po5_backup',
    prog: 'po5_prog_v1',
    recents: 'po5_recent_v1',
    favs: 'po5_favs_v1'
  };

  function jget(key, fallback){
    try{
      var raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : fallback;
    }catch(e){
      return fallback;
    }
  }
  function jset(key, val){
    try{ localStorage.setItem(key, JSON.stringify(val)); }catch(e){}
  }

  // Save hardening to mitigate storage corruption.
  if (window.Save && typeof Save.save === 'function' && typeof Save.load === 'function') {
    var _save0 = Save.save.bind(Save);
    var _load0 = Save.load.bind(Save);
    Save.save = function(){
      _save0();
      try{
        var raw = localStorage.getItem(K.main);
        if (raw) localStorage.setItem(K.backup, raw);
      }catch(e){}
    };
    Save.load = function(){
      _load0();
      try{
        var mainRaw = localStorage.getItem(K.main);
        var parsed = mainRaw ? JSON.parse(mainRaw) : null;
        if (!parsed || typeof parsed !== 'object') throw new Error('bad save');
      }catch(e){
        try{
          var bk = localStorage.getItem(K.backup);
          if (bk) {
            localStorage.setItem(K.main, bk);
            _load0();
            toast('Recovered save from backup');
          }
        }catch(_e){}
      }
      if (S && S.cfg) {
        if (typeof S.cfg.lowPower !== 'boolean') S.cfg.lowPower = true;
        if (!S.cfg.perfMode) S.cfg.perfMode = 'eco';
        if (typeof S.cfg.music !== 'boolean') S.cfg.music = false;
        if (typeof S.cfg.bg !== 'boolean') S.cfg.bg = false;
        if (typeof PrismPerf !== 'undefined') PrismPerf.apply();
      }
    };
  }

  // Progressive profile systems (XP streaks, daily rewards, trophies, stats).
  var Prog = {
    data: {
      xp: 0,
      rank: 'Rookie',
      streak: 0,
      lastDaily: '',
      lastClaimDate: '',
      dailyClaimed: false,
      sessions: 0,
      playTimeMs: 0,
      gamesById: {},
      trophies: [],
      badges: []
    },
    ranks: [
      { name:'Rookie', min:0 },
      { name:'Bronze', min:300 },
      { name:'Silver', min:900 },
      { name:'Gold', min:1800 },
      { name:'Platinum', min:3200 },
      { name:'Neon Elite', min:5200 }
    ],
    load: function(){
      var d = jget(K.prog, null);
      if (d && typeof d === 'object') Object.assign(this.data, d);
      this._rollDay();
      this._syncRank();
    },
    save: function(){ jset(K.prog, this.data); },
    _today: function(){ return new Date().toISOString().slice(0,10); },
    _rollDay: function(){
      var t = this._today();
      if (this.data.lastDaily === t) return;
      var prev = this.data.lastDaily;
      if (prev) {
        if (!this.data.dailyClaimed) this.data.streak = 0;
        else {
          var prevD = new Date(prev + 'T12:00:00');
          var todayD = new Date(t + 'T12:00:00');
          var gap = Math.round((todayD - prevD) / 86400000);
          if (gap > 1) this.data.streak = 0;
        }
      }
      this.data.lastDaily = t;
      this.data.dailyClaimed = false;
    },
    _syncRank: function(){
      var r = this.ranks[0].name;
      for (var i=0;i<this.ranks.length;i++){
        if (this.data.xp >= this.ranks[i].min) r = this.ranks[i].name;
      }
      this.data.rank = r;
    },
    addXP: function(n, reason){
      n = Math.max(0, n|0);
      if (!n) return;
      this.data.xp += n;
      this._syncRank();
      this.unlockByProgress();
      this.save();
      if (window.toast) toast('+'+n+' XP' + (reason ? ' · '+reason : ''));
    },
    markPlayed: function(gameId){
      if (!gameId) return;
      this.data.gamesById[gameId] = (this.data.gamesById[gameId] || 0) + 1;
      this.save();
    },
    unlockByProgress: function(){
      if (this.data.xp >= 1000 && this.data.trophies.indexOf('xp1000') === -1) {
        this.data.trophies.push('xp1000');
        if (window.toast) toast('🏆 Trophy Unlocked: XP Surge');
      }
      if (this.data.streak >= 7 && this.data.badges.indexOf('streak7') === -1) {
        this.data.badges.push('streak7');
        if (window.toast) toast('🎖️ Badge Unlocked: 7-Day Streak');
      }
    },
    claimDaily: function(){
      this._rollDay();
      var t = this._today();
      if (this.data.dailyClaimed) { toast('Daily reward already claimed'); return; }
      var y = new Date();
      y.setDate(y.getDate() - 1);
      var yStr = y.toISOString().slice(0,10);
      if (this.data.lastClaimDate === yStr) this.data.streak = (this.data.streak || 0) + 1;
      else if (this.data.lastClaimDate !== t) this.data.streak = Math.max(1, this.data.streak || 1);
      this.data.dailyClaimed = true;
      this.data.lastClaimDate = t;
      var reward = 40 + Math.min(120, Math.max(0, this.data.streak - 1) * 5);
      this.addXP(reward, 'Daily Reward');
      this.save();
      if (window.Snd && Snd.ok) Snd.ok();
      if (window.Hap && Hap.ok) Hap.ok();
    }
  };
  Prog.load();

  // Recently played + favorites + recommendations.
  var Rec = {
    recent: jget(K.recents, []),
    favs: jget(K.favs, []),
    addRecent: function(game){
      if (!game || !game.id) return;
      this.recent = this.recent.filter(function(x){ return x.id !== game.id; });
      this.recent.unshift({ id:game.id, title:game.title, icon:game.icon, col:game.col, ts:Date.now() });
      if (this.recent.length > 10) this.recent.length = 10;
      jset(K.recents, this.recent);
    },
    toggleFav: function(game){
      if (!game || !game.id) return;
      var i = this.favs.indexOf(game.id);
      if (i === -1) this.favs.push(game.id);
      else this.favs.splice(i,1);
      jset(K.favs, this.favs);
      toast(i === -1 ? 'Added to favorites' : 'Removed from favorites');
      this.render();
    },
    isFav: function(id){ return this.favs.indexOf(id) > -1; },
    topRecs: function(){
      var gb = Prog.data.gamesById || {};
      var keys = Object.keys(gb).sort(function(a,b){ return gb[b]-gb[a]; }).slice(0,3);
      var out = [];
      keys.forEach(function(id){
        if (window.Reg && Reg.get) {
          var g = Reg.get(id);
          if (g) out.push(g);
        }
      });
      if (!out.length && window.Reg && Reg.list && Reg.list.length) out = Reg.list.slice(0,3);
      return out;
    },
    ensureHost: function(){
      var home = document.getElementById('home-screen');
      if (!home) return null;
      var host = document.getElementById('smart-hub');
      if (!host) {
        host = document.createElement('div');
        host.id = 'smart-hub';
        host.className = 'glass';
        host.style.cssText = 'margin:10px 15px 12px;padding:12px;border-radius:16px';
        home.insertBefore(host, home.children[2] || null);
      }
      return host;
    },
    render: function(){
      var host = this.ensureHost();
      if (!host) return;
      var recents = this.recent.slice(0,4);
      var recentIds = {}; recents.forEach(function(x){ recentIds[x.id]=1; });
      var recs = this.topRecs().filter(function(g){ return g && !recentIds[g.id]; });
      if (!recs.length) recs = this.topRecs().filter(function(g){ return g && !recentIds[g.id]; }).slice(0,2);
      if (!recs.length) recs = (window.Reg && Reg.list ? Reg.list : []).filter(function(g){ return g && !recentIds[g.id]; }).slice(0,2);
      var lvl = (typeof XP !== 'undefined') ? XP.lvl((S.prof && S.prof.xp) || 0) : ((S.prof && S.prof.lvl) || 1);
      var rank = (typeof XP !== 'undefined' && XP.rank) ? XP.rank(lvl) : (Prog.data.rank || 'Rookie');
      var xpShow = (S.prof && typeof S.prof.xp === 'number') ? S.prof.xp : (Prog.data.xp || 0);
      host.innerHTML =
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:8px">' +
          '<div class="sec">Smart Hub</div>' +
          '<button type="button" class="btn bg bsm" style="padding:6px 10px;'+(Prog.data.dailyClaimed?'opacity:.45':'')+'" onclick="window.__claimDaily()">'+(Prog.data.dailyClaimed?'✓ Daily':'🎁 Daily')+'</button>' +
        '</div>' +
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">' +
          '<div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">' +
            '<div style="font-size:0.75rem;opacity:.45;text-transform:uppercase;letter-spacing:.08em">Rank</div>' +
            '<div style="font-weight:800;margin-top:4px">' + rank + '</div>' +
            '<div style="font-size:0.75rem;opacity:.45;margin-top:2px">LV' + lvl + ' · ' + xpShow + ' XP</div>' +
          '</div>' +
          '<div style="padding:10px;border-radius:12px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.08)">' +
            '<div style="font-size:0.75rem;opacity:.45;text-transform:uppercase;letter-spacing:.08em">Streak</div>' +
            '<div style="font-weight:800;margin-top:4px">' + Prog.data.streak + ' days</div>' +
            '<div style="font-size:0.75rem;opacity:.45;margin-top:2px">' + (Prog.data.dailyClaimed ? 'Claimed today' : 'Reward ready') + '</div>' +
          '</div>' +
        '</div>' +
        '<div style="font-size: 0.75rem;opacity:.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Recently Played</div>' +
        '<div style="display:flex;gap:7px;overflow-x:auto;margin-bottom:8px">' +
          (recents.length ? recents.map(function(x){
            return '<button type="button" class="btn bg bsm" style="padding:8px 10px;white-space:nowrap" onclick="GL.launch(\''+x.id+'\')">'+x.icon+' '+x.title+'</button>';
          }).join('') : '<div style="font-size:.75rem;opacity:.35">No recent games yet.</div>') +
        '</div>' +
        '<div style="font-size: 0.75rem;opacity:.45;margin-bottom:4px;text-transform:uppercase;letter-spacing:.08em">Recommended</div>' +
        (function(){
          var next = (Meta.unlockables || []).find(function(u){ return !Meta.isUnlocked(u.id); });
          var hint = next ? '<div style="font-size:0.75rem;opacity:.38;margin-bottom:8px;line-height:1.45">Next unlock: <strong style="opacity:.85">'+next.icon+' '+next.name+'</strong> · '+Meta.getProgress(next.id)+'%</div>' : '';
          return hint;
        })() +
        '<div style="display:flex;gap:7px;overflow-x:auto">' +
          (recs.length ? recs.map(function(g){
            var star = Rec.isFav(g.id) ? '★' : '☆';
            return '<div style="display:flex;gap:4px;align-items:center">' +
              '<button type="button" class="btn bg bsm" style="padding:8px 10px;white-space:nowrap" onclick="GL.launch(\''+g.id+'\')">'+g.icon+' '+g.title+'</button>' +
              '<button type="button" class="btn bg bsm fav-btn" aria-label="Favorite '+g.title+'" onclick="window.__fav(\''+g.id+'\')">'+star+'</button>' +
            '</div>';
          }).join('') : '<div style="font-size:.75rem;opacity:.35">Play a few games for picks.</div>') +
        '</div>';
    }
  };
  window.__fav = function(id){ if (window.Reg && Reg.get) Rec.toggleFav(Reg.get(id)); };
  window.__claimDaily = function(){ Prog.claimDaily(); Rec.render(); };

  // Launch tracking hook.
  if (window.GL && typeof GL.launch === 'function') {
    var _launch = GL.launch.bind(GL);
    GL.launch = function(id){
      var g = (window.Reg && Reg.get) ? Reg.get(id) : null;
      if (g) {
        Rec.addRecent(g);
        Prog.markPlayed(g.id);
        Prog.addXP(5, 'Game Launch');
      }
      _launch(id);
      setTimeout(function(){ Rec.render(); }, 50);
    };
  }

  // Lightweight FPS monitor + auto low-power fallback.
  var Perf = {
    frames: 0,
    last: performance.now(),
    fps: 60,
    lowFPSStreak: 0,
    tick: function(ts){
      this.frames++;
      var dt = ts - this.last;
      if (dt >= 1000) {
        this.fps = Math.round((this.frames * 1000) / dt);
        this.frames = 0;
        this.last = ts;
        var hud = document.getElementById('perf-hud');
        if (hud) hud.textContent = this.fps + ' FPS · ' + (S.cfg.perfMode || 'balanced');
        if (this.fps < 45) this.lowFPSStreak++; else this.lowFPSStreak = 0;
        if (this.lowFPSStreak >= 5 && !S.cfg.lowPower) {
          S.cfg.lowPower = true;
          S.cfg.bg = false;
          S.cfg.perfMode = 'eco';
          if (window.PrismPerf) PrismPerf.apply();
          if (window.toast) toast('Auto switched to Eco mode');
          if (window.Save && Save.save) Save.save();
        }
      }
      requestAnimationFrame(this.tick.bind(this));
    },
    init: function(){
      if (window.PrismPerf && PrismPerf.isDebug() && !document.getElementById('perf-hud')) {
        var el = document.createElement('div');
        el.id = 'perf-hud';
        el.style.cssText = 'position:fixed;left:10px;top:calc(var(--sat) + 8px);z-index:260;font:700 .62rem/1.2 ui-monospace,Menlo,monospace;padding:6px 8px;border-radius:10px;background:rgba(0,0,0,.55);border:1px solid rgba(255,255,255,.14);opacity:.78;backdrop-filter:blur(14px)';
        el.textContent = '60 FPS · ' + (S.cfg.perfMode || 'eco');
        document.body.appendChild(el);
      }
      if (!this._started) { this._started = true; requestAnimationFrame(this.tick.bind(this)); }
    }
  };

  // PWA manifest + install + service worker bootstrap (single-file compatible).
  var PWA = {
    deferred: null,
    addManifest: function(){
      try{
        var m = {
          name: 'PrismCap',
          short_name: 'PrismCap',
          start_url: './',
          display: 'standalone',
          background_color: PCBrand.h_000000,
          theme_color: PCBrand.h_000000,
          orientation: 'any',
          icons: [
            { src: this._svgIcon(PCBrand.h_0a0a0f,PCBrand.h_c77dff), sizes:'192x192', type:'image/svg+xml', purpose:'any maskable' },
            { src: this._svgIcon(PCBrand.h_000000,PCBrand.h_00e5ff), sizes:'512x512', type:'image/svg+xml', purpose:'any maskable' }
          ]
        };
        var blob = new Blob([JSON.stringify(m)], {type:'application/manifest+json'});
        var url = URL.createObjectURL(blob);
        var l = document.createElement('link');
        l.rel = 'manifest';
        l.href = url;
        document.head.appendChild(l);
      }catch(e){}
    },
    _svgIcon: function(bg, fg){
      var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" rx="110" fill="'+bg+'"/><circle cx="256" cy="256" r="146" fill="none" stroke="'+fg+'" stroke-width="28"/><circle cx="256" cy="256" r="46" fill="'+fg+'"/></svg>';
      return 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(svg);
    },
    bindInstall: function(){
      var self = this;
      window.addEventListener('beforeinstallprompt', function(e){
        e.preventDefault();
        self.deferred = e;
        self.showInstallUI(true);
      }, { passive:false });
      window.addEventListener('appinstalled', function(){
        self.showInstallUI(false);
        toast('PrismCap installed');
      });
    },
    showInstallUI: function(show){
      var b = document.getElementById('install-btn');
      if (!b && show) {
        b = document.createElement('button');
        b.id = 'install-btn';
        b.className = 'btn bg bsm';
        b.style.cssText = 'position:fixed;right:10px;top:calc(var(--sat) + 8px);z-index:260;padding:8px 10px';
        b.textContent = 'Install';
        b.onclick = this.install.bind(this);
        document.body.appendChild(b);
      }
      if (b) b.style.display = show ? 'inline-flex' : 'none';
    },
    install: async function(){
      if (!this.deferred) return toast('Install not available yet');
      try{
        await this.deferred.prompt();
        this.deferred = null;
        this.showInstallUI(false);
      }catch(e){}
    },
    registerSW: function(){
      if (!('serviceWorker' in navigator)) return;
      navigator.serviceWorker.register('./sw.js?v=465').catch(function(){});
    }
  };

  // App lifecycle tuning to reduce battery drain.
  document.addEventListener('visibilitychange', function(){
    if (document.hidden) {
      if (window.releaseWakeLock) try{ window.releaseWakeLock(); }catch(e){}
    } else if (S && S.cur === 'game') {
      if (window.requestWakeLock) try{ window.requestWakeLock(); }catch(e){}
    }
  }, {passive:true});

  // Keyboard usability.
  window.addEventListener('keydown', function(e){
    if (e.key === 'Escape' && window.GL && GL.requestLeave && S && S.cur === 'game') GL.requestLeave();
    if ((e.key === 'Enter' || e.key === ' ') && document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('ni')) {
      document.activeElement.click();
    }
  });

  // Boot
  window.Prog = Prog;
  window.Rec = Rec;
  PWA.bindInstall();
  PWA.registerSW();
  Perf.init();
  Prog.data.sessions = (Prog.data.sessions || 0) + 1;
  Prog.save();
  // Defer hub paint until Save/demo ran (DOMContentLoaded) + scrolls exist
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function(){ setTimeout(function(){ Rec.render(); }, 50); });
  } else {
    setTimeout(function(){ Rec.render(); }, 50);
  }
})();


