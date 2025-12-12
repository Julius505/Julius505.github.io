// assets/js/game.js
// Memory-style matching game: dataset generation + dynamic board creation
(function () {
  'use strict';

  // Dataset: at least 12 unique elements (using emoji for simplicity)
  var dataset = [
    '🍎','🚗','🐶','⚽️','🎵','🌟','🍕','📚','🎲','🌈','🛩️','🍀'
  ]; // 12 unique items

  var board = document.getElementById('game-board');
  var newBtn = document.getElementById('new-game');
  var status = document.getElementById('status');
  var bestEl = document.getElementById('best-scores');
  var startBtn = document.getElementById('start-btn');
  var timerEl = document.getElementById('timer');
  var timerInterval = null;
  var secondsElapsed = 0;
  var timerRunning = false;
  var currentMode = 'easy';

  function shuffleArray(arr) {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
    }
    return arr;
  }

  // Build array of pairs from dataset and shuffle
  // pairCount = number of unique items to use (will be duplicated)
  function buildPairs(data, pairCount) {
    var pairs = [];
    // shuffle source dataset and pick first pairCount unique items
    var src = shuffleArray(data.slice());
    var chosen = src.slice(0, pairCount);
    for (var i = 0; i < chosen.length; i++) {
      pairs.push({ id: i + '-a', value: chosen[i] });
      pairs.push({ id: i + '-b', value: chosen[i] });
    }
    return shuffleArray(pairs);
  }

  // Generate board DOM from pairs array
  function generateBoard(pairs, cols) {
    board.innerHTML = ''; // clear
    // set grid columns dynamically
    if (cols && cols > 0) board.style.gridTemplateColumns = 'repeat(' + cols + ', 1fr)';

    pairs.forEach(function (cardData) {
      var card = document.createElement('div');
      card.className = 'card';
      card.setAttribute('data-value', cardData.value);
      card.setAttribute('data-id', cardData.id);

      var inner = document.createElement('div'); inner.className = 'card-inner';
      var front = document.createElement('div'); front.className = 'card-face card-front'; front.textContent = '';
      var back = document.createElement('div'); back.className = 'card-face card-back'; back.textContent = cardData.value;

      inner.appendChild(front);
      inner.appendChild(back);
      card.appendChild(inner);
      board.appendChild(card);
    });
  }

  // Basic game state
  var firstCard = null;
  var lock = false;
  var matches = 0;
  var totalPairs = 0;
  var moves = 0;

  function onCardClick(e) {
    if (lock) return;
    var card = e.currentTarget;
    if (card.classList.contains('flipped')) return;

    card.classList.add('flipped');

    if (!firstCard) {
      firstCard = card;
      return;
    }

    // count move when two cards are revealed
    moves++;

    var v1 = firstCard.getAttribute('data-value');
    var v2 = card.getAttribute('data-value');

    if (v1 === v2) {
      // match
      matches++;
      firstCard = null;
      updateStatus();
      if (matches === totalPairs) showWin();
    } else {
      lock = true;
      setTimeout(function () {
        firstCard.classList.remove('flipped');
        card.classList.remove('flipped');
        firstCard = null;
        lock = false;
      }, 800);
    }
  }

  function attachHandlers() {
    var cards = board.querySelectorAll('.card');
    cards.forEach(function (c) {
      c.removeEventListener('click', onCardClick);
      c.addEventListener('click', onCardClick);
    });
  }

  function startGame() {
    // determine difficulty
    var diff = document.querySelector('input[name="difficulty"]:checked');
    var mode = diff ? diff.value : 'easy';
    currentMode = mode;
    var cols = 4, rows = 3, pairCount = 6;
    if (mode === 'hard') { cols = 6; rows = 4; pairCount = 12; }

    var pairs = buildPairs(dataset, pairCount);
    totalPairs = pairCount;
    matches = 0;
    firstCard = null;
    lock = false;
    moves = 0;
    generateBoard(pairs);
    attachHandlers();
    updateStatus();
    resetTimer();
    updateBestDisplay();
    // hide any existing win overlay
    var existing = document.getElementById('game-win-overlay');
    if (existing) existing.remove();
  }

  function updateStatus() {
    status.textContent = 'Rasti poros: ' + matches + ' / ' + totalPairs + ' — Žingsniai: ' + moves;
  }

  function showWin() {
    status.textContent = 'Sveikinu — rastos visos poros!';
    // stop the timer when the game is won
    stopTimer();
    // check and update best score for current difficulty
    var prevBest = getBest(currentMode);
    var isRecord = false;
    if (moves > 0 && (prevBest === null || moves < prevBest)) {
      setBest(currentMode, moves);
      isRecord = true;
    }
    updateBestDisplay();

    // create and show a prominent win overlay
    if (!document.getElementById('game-win-overlay')) {
      var overlay = document.createElement('div');
      overlay.id = 'game-win-overlay';
      var html = '\n        <div class="game-win-modal">\n          <h2>Laimėjote!</h2>\n          <p>Sveikiname — rastos visos kortelių poros.</p>\n';
      // include elapsed time in modal if available
      if (typeof secondsElapsed === 'number') {
        var t = formatTime(secondsElapsed);
        html += '          <p style="margin:6px 0">Laikas: ' + t + '</p>\n';
      }
      if (isRecord) html += '          <p style="font-weight:700;color:#166534;margin:6px 0">Naujas geriausias rezultatas: ' + moves + ' ėjimai</p>\n';
      html += '          <div class="game-win-actions">\n            <button id="gw-restart" class="btn">Žaisti iš naujo</button>\n          </div>\n        </div>\n      ';
      overlay.innerHTML = html;
      document.body.appendChild(overlay);
      // attach restart handler
      var btn = document.getElementById('gw-restart');
      if (btn) btn.addEventListener('click', function () {
        overlay.remove();
        startGame();
      });
    }
  }

  // --- Timer helpers ---
  function formatTime(sec) {
    var s = parseInt(sec, 10) || 0;
    var mm = Math.floor(s / 60);
    var ss = s % 60;
    return (mm < 10 ? '0' + mm : mm) + ':' + (ss < 10 ? '0' + ss : ss);
  }
  function updateTimerDisplay() {
    if (!timerEl) return;
    timerEl.textContent = 'Laikas: ' + formatTime(secondsElapsed);
  }
  function startTimer() {
    if (timerRunning) return;
    timerRunning = true;
    if (startBtn) startBtn.disabled = true;
    timerInterval = setInterval(function () {
      secondsElapsed += 1;
      updateTimerDisplay();
    }, 1000);
  }
  function stopTimer() {
    if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
    timerRunning = false;
    if (startBtn) startBtn.disabled = false;
  }
  function resetTimer() {
    stopTimer();
    secondsElapsed = 0;
    updateTimerDisplay();
  }

  // localStorage helpers for best scores
  function bestKey(mode) { return 'memory_best_' + mode; }
  function getBest(mode) {
    try { var v = localStorage.getItem(bestKey(mode)); return v === null ? null : parseInt(v, 10); } catch (e) { return null; }
  }
  function setBest(mode, val) { try { localStorage.setItem(bestKey(mode), String(val)); } catch (e) { } }
  function updateBestDisplay() {
    if (!bestEl) return;
    var be = getBest('easy');
    var bh = getBest('hard');
    bestEl.textContent = 'Geriausi rezultatai — Lengvas: ' + (be === null ? '—' : (be + ' ėjimai')) + ' · Sunkus: ' + (bh === null ? '—' : (bh + ' ėjimai'));
  }

  newBtn.addEventListener('click', startGame);
  if (startBtn) startBtn.addEventListener('click', startTimer);

  // Auto-start on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startGame);
  } else startGame();

  // Expose dataset for debugging (optional)
  window._memoryDataset = dataset;
})();
