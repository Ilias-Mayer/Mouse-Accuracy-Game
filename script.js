let targetSize = 50;
let targetNum = 0;
let targetSpeed = 3;
let score = 0;
let move = true;
let targetMoveIntervals = [];
let targetFadeIntervals = [];
let timeLeft = 30;
let timerInterval;
let gameInterval;
let difficulty = 1000;

const imagePaths = ["images/x.png", "images/y.png", "images/z.png"];
const ploppSound = new Audio("soundeffects/plopp.mp3");
const bgMusic = new Audio("soundeffects/background-music.mp3");
let highscores = [];

/**
 * Klasse zur Verwaltung der Zieleigenschaften
 * Speichert Position, Bewegung und Erscheinungsbild eines Ziels
 */
class Target {
  constructor(xPosition, yPosition, xIncrement, yIncrement, element) {
    this.xPosition = xPosition;
    this.yPosition = yPosition;
    this.xIncrement = xIncrement;
    this.yIncrement = yIncrement;
    this.element = element;
    this.opacity = 1.0;
  }
}

// Erzeugt eine Zufallszahl zwischen Min und Max
function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

// Wählt ein zufälliges Bild aus den verfügbaren Zielbildern aus
function getRandomImage() {
  return imagePaths[Math.floor(Math.random() * imagePaths.length)];
}

//Erstellt ein neues Ziel an einer zufälligen Position
function createTarget() {
  const padding = 30; // Randabstand
  // Zufällige Position innerhalb des sichtbaren Bereichs
  let x = Math.random() * (window.innerWidth - targetSize - padding * 2) + padding;
  let y = Math.random() * (window.innerHeight - targetSize - padding * 2) + padding;
  
  targetNum++; // Zielzähler

  // Erstellt ein neues Zielobjekt mit zufälliger Bewegungsrichtung
  const createdTarget = new Target(
    x, 
    y, 
    getRandomArbitrary(-targetSpeed, targetSpeed),
    getRandomArbitrary(-targetSpeed, targetSpeed),
    `#num${targetNum}` // Setzt die eindeutige ID des Ziel-Elements
  );
  
  // Erstellt das DOM-Element für das Ziel
  const targetElement = document.createElement('img');
  targetElement.id = `num${targetNum}`;
  targetElement.className = 'target';
  targetElement.src = getRandomImage();
  targetElement.style.left = `${x}px`;
  targetElement.style.top = `${y}px`;
  targetElement.style.width = `${targetSize}px`;
  targetElement.style.height = `${targetSize}px`;
  targetElement.style.opacity = createdTarget.opacity;
  targetElement.addEventListener('mousedown', () => addScore(targetElement)); // Event-Listener für Klicks
  
  document.querySelector(".container").appendChild(targetElement); // Fügt das Ziel zum DOM hinzu (child von container)

  // Startet das Verblassen des Ziels alle 50ms
  targetFadeIntervals[targetNum] = setInterval(() => {
    changeTargetOpacity(createdTarget);
  }, 50);

  // Startet die Bewegung des Ziels alle 16ms, wenn die move true ist
  if (move) {
    targetMoveIntervals[targetNum] = setInterval(() => {
      moveTarget(createdTarget);
    }, 16); // Ca. 60 FPS
  }
}

/**
 * Bewegt ein Ziel basierend auf seiner Geschwindigkeit und Richtung
 * Lässt das Ziel von den Rändern abprallen
 * @param {Target} target - Das zu bewegende Zielobjekt
 */
function moveTarget(target) {
  const padding = 10; // Abprall-Randabstand
  const targetElement = document.querySelector(target.element);
  
  if (!targetElement) return; // Abbruch, falls Element nicht mehr existiert

  // Bewegt das Ziel entsprechend seiner Geschwindigkeit
  target.xPosition += target.xIncrement;
  target.yPosition += target.yIncrement;

  // Prüfe und handle Kollisionen mit den Bildschirmrändern
  if (target.xPosition <= padding || target.xPosition >= window.innerWidth - targetSize - padding) {
    target.xIncrement = -target.xIncrement; // horizontaler Abprall
  }
  if (target.yPosition <= padding || target.yPosition >= window.innerHeight - targetSize - padding) {
    target.yIncrement = -target.yIncrement; // vertikaler Abprall
  }

  // Aktualisiert die Position im DOM
  targetElement.style.left = `${target.xPosition}px`;
  targetElement.style.top = `${target.yPosition}px`;
}

/**
 * Startet das Spiel mit den ausgewählten Einstellungen
 * Initialisiert Timer, Zielgenerierung und Audio
 */
function startGame() {
  targetSize = parseInt(document.querySelector('input[name="size"]:checked').value);
  difficulty = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
  timeLeft = parseInt(document.querySelector('input[name="duration"]:checked').value);
  move = document.querySelector('input[name="moving"]:checked').value === 'true';
  targetSpeed = parseInt(document.querySelector('input[name="speed"]:checked').value);

  // Setzt Spielwerte zurück
  score = 0;
  targetNum = 0;
  document.querySelector(".score").textContent = `Hit 0/0 (0%)`;
  document.querySelector(".timer").textContent = timeLeft;
  // Entfernt Einstellungen und zeige Timer an
  document.querySelector(".settings").classList.add("removed");
  document.querySelector(".timer").classList.remove("removed");

  startTimer();
  gameInterval = setInterval(createTarget, difficulty); // Erzeugt Ziele in Intervallen basierend auf der Schwierigkeit


  // Startet Hintergrundmusik
  bgMusic.currentTime = 0; 
  bgMusic.play();
}

/**
 * Stoppt das Spiel, zeigt den Endstand an, entfernt Ziele und stoppt Intervalle
 */
function stopGame() {
  // Stoppt das Spiel und Timer
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  
  // Berechnet und zeigt den finalen Punktestand
  const percentage = targetNum > 0 ? Math.round((score / targetNum) * 100) : 0; // 0 wenn keine Ziele getroffen wurden
  document.querySelector(".score").textContent = `Hit ${score}/${targetNum} (${percentage}%)`;
  
  // Stellt die UI auf den Anfangszustand zurück
  document.querySelector(".settings").classList.remove("removed");
  document.querySelector(".timer").classList.add("removed");

  document.querySelectorAll(".target").forEach(target => target.remove()); // Entfernt alle Ziele
  
  // Stoppt alle Bewegungs- und Verblassungs-Intervalle
  targetMoveIntervals.forEach(interval => clearInterval(interval));
  targetFadeIntervals.forEach(interval => clearInterval(interval));
  
  // Setzt die Arrays für die Intervalle zurück
  targetMoveIntervals = [];
  targetFadeIntervals = [];

  // Stoppt Hintergrundmusik
  bgMusic.pause();
  bgMusic.currentTime = 0;

  handleHighscores(percentage); // Verarbeitet den Highscore
}

/**
 * Erhöht den Punktestand, entfernt das getroffene Ziel, aktualisiert den Score und spielt plopp-Sound ab
 * @param {HTMLElement} element - Das getroffene Zielelement
 */
function addScore(element) {
  score++;
  element.remove();
  updateScore();
  ploppSound.currentTime = 0;
  ploppSound.play();
}

/**
 * Aktualisiert den Punktestand mit aktueller Trefferquote
 */
function updateScore() {
  const percentage = targetNum > 0 ? Math.round((score / targetNum) * 100) : 0;
  document.querySelector(".score").textContent = `Hit ${score}/${targetNum} (${percentage}%)`;
}

/**
 * Verringert die Transparenz eines Ziels über Zeit und entfernt es, wenn es vollständig transparent ist
 * @param {Target} target - Das Zielobjekt, dessen Transparenz geändert werden soll
 */
function changeTargetOpacity(target) {
  const targetElement = document.querySelector(target.element);
  if (!targetElement) return;
  
  // Entfernt das Ziel, wenn es vollständig transparent ist
  if (target.opacity <= 0) {
    clearInterval(targetFadeIntervals[target.element.substring(4)]);
    targetElement.remove();
    updateScore();
    return;
  }
  // Verringert die Transparenz schrittweise
  target.opacity -= 0.01;
  targetElement.style.opacity = target.opacity;
}

/**
 * Startet den Spieltimer und beendet das Spiel nach Ablauf der Zeit
 */
function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    document.querySelector(".timer").textContent = timeLeft; 
    if (timeLeft <= 0) stopGame(); 
  }, 1000); // Aktualisiert jede Sekunde
}

/**
 * Verarbeitet das Spielende, berechnet den finalen Score und fragt nach dem Spielernamen für das Leaderboard
 * @param {number} accuracy - Die Treffergenauigkeit in Prozent
 */
async function handleHighscores(accuracy) {
  // Berechnet den finalen Punktestand mit dem Schwierigkeitsmultiplikator
  const multiplier = calculateDifficultyMultiplier();
  const finalScore = Math.round(score * multiplier);
  
  // Fragt nach dem Spielernamen und zeigt die Spielstatistik an
  const name = prompt(`Game Over!\n
    Raw Score: ${score}\n
    Accuracy: ${accuracy}%\n
    Multiplier: x${multiplier.toFixed(1)}\n
    Final Score: ${finalScore}\n
    Enter your name:`, 'Player');

  // Sendet den Highscore an den Server und lädt die Highscore-Liste neu
  if (name) {
    await submitHighscore(name, finalScore, accuracy);
    await loadHighscores();
  }
}

/**
 * Sendet einen neuen Highscore an den Server --> POST-Request an /api/highscore.php
 * @param {string} name - Name des Spielers
 * @param {number} finalScore - Finaler Punktestand
 * @param {number} accuracy - Treffergenauigkeit in Prozent
 * @returns {Promise} Promise mit der Server-Antwort
 */
async function submitHighscore(name, finalScore, accuracy) {
  try {
    const response = await fetch('api/highscore.php', { 
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.substring(0, 20),
        score: finalScore,
        accuracy: accuracy,
        timestamp: new Date().toISOString()
      })
    });
    return await response.json(); // Gibt die Server-Antwort zurück
  } catch (error) {
    console.error('Error submitting score:', error);
  }
}

/**
 * Lädt die Highscores vom Server
 */
async function loadHighscores() {
  try {
    const response = await fetch('api/highscore.php'); // GET-Request an /api/highscore.php
    const data = await response.json(); // Wandelt die Antwort in JSON um
    highscores = data; // Speichert die Highscores im globalen Array
    updateHighscoreDisplay();
  } catch (error) {
    console.error('Error loading highscores:', error);
  }
}

/**
 * Aktualisiert die Anzeige der Highscores im DOM
 */
function updateHighscoreDisplay() {
  const container = document.querySelector('.highscores-list');
  // Erstellt HTML für jeden Highscore-Eintrag (begrenzt auf Top 10)
  container.innerHTML = highscores.slice(0, 10).map((entry, index) => `
    <div class="highscore-entry">
      <span>${index + 1}. ${entry.name}</span>
      <div class="highscore-details">
        <span class="highscore-score">${entry.score} Pts</span>
        <span class="highscore-accuracy">${entry.accuracy}%</span>
      </div>
    </div>
  `).join('');
}

/**
 * Berechnet den Schwierigkeitsmultiplikator basierend auf den Spieleinstellungen
 * Dieser Multiplikator wird verwendet, um den finalen Score zu berechnen
 * @returns {number} Der berechnete Schwierigkeitsmultiplikator
 */
function calculateDifficultyMultiplier() {
  const size = parseInt(document.querySelector('input[name="size"]:checked').value);
  const speed = parseInt(document.querySelector('input[name="speed"]:checked').value);
  const isMoving = document.querySelector('input[name="moving"]:checked').value === 'true';
  const difficultySetting = parseInt(document.querySelector('input[name="difficulty"]:checked').value);

  const multipliers = { // Multiplikatoren für jede Einstellung
    size: {50: 2.0, 60: 1.5, 70: 1.0},
    speed: {2: 1.0, 4: 1.5, 6: 2.0},
    moving: {true: 1.8, false: 1.0},
    difficulty: {1200: 1.0, 700: 1.5, 400: 2.0}
  };

  return ( // Berechnet den Multiplikator für die Einstellungen
    multipliers.size[size] *
    multipliers.speed[speed] *
    multipliers.moving[isMoving] *
    multipliers.difficulty[difficultySetting]
  );
}

document.querySelector(".button-start").addEventListener("click", startGame); // Event-Listener für Start-Button
// Versteckt/Zeigt die Geschwindigkeitseinstellungen basierend auf der Bewegungseinstellung (moving on/off)
document.querySelector("#moving-off").addEventListener("click", () => { 
  document.querySelectorAll(".speed").forEach(el => el.classList.add("hidden"));
});
document.querySelector("#moving-on").addEventListener("click", () => {
  document.querySelectorAll(".speed").forEach(el => el.classList.remove("hidden"));
});

// Initialisierung beim Laden der Seite
window.addEventListener('load', () => {
  document.querySelector('#target-medium').checked = true;
  document.querySelector('#difficulty-normal').checked = true;
  document.querySelector('#duration-30').checked = true;
  document.querySelector('#moving-on').checked = true;
  document.querySelector('#speed-normal').checked = true;
  loadHighscores();
  ploppSound.volume = 0.3;
  bgMusic.volume = 0.1;
  bgMusic.loop = true; // Endlosschleife für Hintergrundmusik
});