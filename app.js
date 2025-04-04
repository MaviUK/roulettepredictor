<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Roulette Prediction Tool</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      padding: 2rem;
      max-width: 800px;
      margin: auto;
    }
    .section {
      background-color: #f3f4f6;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }
    .input-group {
      display: flex;
      gap: 1rem;
      margin-bottom: 1rem;
    }
    input, select, button {
      padding: 0.5rem;
      font-size: 1rem;
    }
    button {
      background-color: #4f46e5;
      color: white;
      border: none;
      border-radius: 4px;
    }
  </style>
</head>
<body>
  <h1>🎯 Roulette Prediction Tool</h1>

  <div class="input-group">
    <input type="number" id="from" placeholder="From" />
    <input type="number" id="to" placeholder="To" />
    <select id="direction">
      <option value="CW">CW</option>
      <option value="CCW">CCW</option>
    </select>
    <button onclick="addSpin()">Add Spin</button>
  </div>

  <div class="section">
    <h2>🔮 Prediction</h2>
    <p id="prediction">Next predicted number: <strong>Not enough data yet</strong></p>
  </div>

  <div class="section">
    <h2>📜 Spin History</h2>
    <div id="history"></div>
  </div>

  <div class="section" style="background-color: #fef3c7;">
    <h2>📉 Streak Stats</h2>
    <p>Max CW Loss Streak: <strong id="cwStreak">0</strong></p>
    <p>Max CCW Loss Streak: <strong id="ccwStreak">0</strong></p>
    <p>Max Combined Loss Streak: <strong id="totalStreak">0</strong></p>
  </div>

  <script>
    const europeanWheel = [
      0, 32, 15, 19, 4, 21, 2, 25, 17, 34, 6, 27, 13, 36, 11, 30, 8, 23,
      10, 5, 24, 16, 33, 1, 20, 14, 31, 9, 22, 18, 29, 7, 28, 12, 35, 3, 26
    ];

    let spins = [];
    let lossStreak = { CW: 0, CCW: 0, total: 0 };
    let maxLoss = { CW: 0, CCW: 0, total: 0 };

    function getIndex(number) {
      return europeanWheel.indexOf(number);
    }

    function calculatePockets(from, to, direction) {
      const fromIndex = getIndex(from);
      const toIndex = getIndex(to);
      return direction === "CW"
        ? (toIndex - fromIndex + europeanWheel.length) % europeanWheel.length
        : (fromIndex - toIndex + europeanWheel.length) % europeanWheel.length;
    }

    function predictNext(history) {
      if (history.length < 5) return null;
      const lastSpin = history[history.length - 1];
      const dir = lastSpin.direction === "CW" ? "CCW" : "CW";
      const relevant = history.filter(s => s.direction === dir).slice(-5);
      if (relevant.length < 5) return null;

      const pocketsList = relevant.map(s => s.pockets).sort((a, b) => a - b).slice(1, 4);
      const avgPockets = Math.round(pocketsList.reduce((a, b) => a + b, 0) / 3);

      const fromIndex = getIndex(lastSpin.to);
      const newIndex = dir === "CW"
        ? (fromIndex + avgPockets) % europeanWheel.length
        : (fromIndex - avgPockets + europeanWheel.length) % europeanWheel.length;

      return europeanWheel[newIndex];
    }

    function addSpin() {
      const from = Number(document.getElementById('from').value);
      const to = Number(document.getElementById('to').value);
      const direction = document.getElementById('direction').value;

      const pockets = calculatePockets(from, to, direction);
      const newSpin = { from, to, direction, pockets };
      const lastPrediction = predictNext(spins);
      const correct = lastPrediction === to;

      if (!correct) {
        lossStreak[direction]++;
        lossStreak.total++;
        maxLoss.CW = Math.max(maxLoss.CW, lossStreak.CW);
        maxLoss.CCW = Math.max(maxLoss.CCW, lossStreak.CCW);
        maxLoss.total = Math.max(maxLoss.total, lossStreak.total);
      } else {
        lossStreak[direction] = 0;
        lossStreak.total = 0;
      }

      spins.push(newSpin);
      const prediction = predictNext(spins);
      document.getElementById('prediction').innerHTML = `Next predicted number: <strong>${prediction ?? "Not enough data yet"}</strong>`;

      const lastSpins = spins.slice(-5).map(spin =>
        `<p><strong>${spin.direction}</strong> | From: ${spin.from} → To: ${spin.to} | Pockets: ${spin.pockets}</p>`
      ).join('');
      document.getElementById('history').innerHTML = lastSpins;

      document.getElementById('cwStreak').textContent = maxLoss.CW;
      document.getElementById('ccwStreak').textContent = maxLoss.CCW;
      document.getElementById('totalStreak').textContent = maxLoss.total;
    }
  </script>
</body>
</html>
