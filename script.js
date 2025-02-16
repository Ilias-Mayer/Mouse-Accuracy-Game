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
ploppSound.volume = 0.3; 

const bgMusic = new Audio("soundeffects/background-music.mp3");
bgMusic.volume = 0.1; 
bgMusic.loop = true; 

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

function getRandomArbitrary(min, max) {
  return Math.random() * (max - min) + min;
}

function getRandomImage() {
  return imagePaths[Math.floor(Math.random() * imagePaths.length)];
}

function createTarget() {
  const padding = 30;
  let x = Math.random() * (window.innerWidth - targetSize - padding * 2) + padding;
  let y = Math.random() * (window.innerHeight - targetSize - padding * 2) + padding;
  
  targetNum++;
  let createdTarget = new Target(
    x, 
    y, 
    getRandomArbitrary(-targetSpeed, targetSpeed), 
    getRandomArbitrary(-targetSpeed, targetSpeed), 
    `#num${targetNum}`
  );
  
  const targetElement = document.createElement('img');
  targetElement.id = `num${targetNum}`;
  targetElement.className = 'target';
  targetElement.src = getRandomImage();
  targetElement.style.left = `${x}px`;
  targetElement.style.top = `${y}px`;
  targetElement.style.width = `${targetSize}px`;
  targetElement.style.height = `${targetSize}px`;
  targetElement.style.opacity = createdTarget.opacity;
  targetElement.addEventListener('mousedown', () => addScore(targetElement));
  
  document.querySelector(".container").appendChild(targetElement);

  targetFadeIntervals[targetNum] = setInterval(() => {
    changeTargetOpacity(createdTarget);
  }, 50);

  if (move) {
    targetMoveIntervals[targetNum] = setInterval(() => {
      moveTarget(createdTarget);
    }, 16);
  }
}

function moveTarget(target) {
  const padding = 20;
  const targetElement = document.querySelector(target.element);
  
  if (!targetElement) return;

  target.xPosition += target.xIncrement;
  target.yPosition += target.yIncrement;

  if (target.xPosition <= padding || target.xPosition >= window.innerWidth - targetSize - padding) {
    target.xIncrement = -target.xIncrement;
  }
  if (target.yPosition <= padding || target.yPosition >= window.innerHeight - targetSize - padding) {
    target.yIncrement = -target.yIncrement;
  }

  targetElement.style.left = `${target.xPosition}px`;
  targetElement.style.top = `${target.yPosition}px`;
}

function startGame() {
  targetSize = parseInt(document.querySelector('input[name="size"]:checked').value);
  difficulty = parseInt(document.querySelector('input[name="difficulty"]:checked').value);
  timeLeft = parseInt(document.querySelector('input[name="duration"]:checked').value);
  move = document.querySelector('input[name="moving"]:checked').value === 'true';
  targetSpeed = parseInt(document.querySelector('input[name="speed"]:checked').value);

  score = 0;
  targetNum = 0;
  document.querySelector(".score").textContent = `Hit 0/0 (0%)`;
  document.querySelector(".timer").textContent = timeLeft;
  document.querySelector(".settings").classList.add("removed");
  document.querySelector(".timer").classList.remove("removed");

  startTimer();
  gameInterval = setInterval(createTarget, difficulty);

  bgMusic.currentTime = 0; 
  bgMusic.play();
}

function stopGame() {
  clearInterval(gameInterval);
  clearInterval(timerInterval);
  
  let percentage = targetNum > 0 ? Math.round((score / targetNum) * 100) : 0;
  document.querySelector(".score").textContent = `Hit ${score}/${targetNum} (${percentage}%)`;
  
  document.querySelector(".settings").classList.remove("removed");
  document.querySelector(".timer").classList.add("removed");

  document.querySelectorAll(".target").forEach(target => target.remove());
  
  targetMoveIntervals.forEach(interval => clearInterval(interval));
  targetFadeIntervals.forEach(interval => clearInterval(interval));
  
  targetMoveIntervals = [];
  targetFadeIntervals = [];

  bgMusic.pause();
  bgMusic.currentTime = 0;
}

function addScore(element) {
  score++;
  element.remove();
  updateScore();

  ploppSound.currentTime = 0;
  ploppSound.play();
}

function updateScore() {
  let percentage = targetNum > 0 ? Math.round((score / targetNum) * 100) : 0;
  document.querySelector(".score").textContent = `Hit ${score}/${targetNum} (${percentage}%)`;
}

function changeTargetOpacity(target) {
  const targetElement = document.querySelector(target.element);
  if (!targetElement) return;
  
  if (target.opacity <= 0) {
    clearInterval(targetFadeIntervals[target.element.substring(4)]);
    targetElement.remove();
    updateScore();
    return;
  }
  target.opacity -= 0.01;
  targetElement.style.opacity = target.opacity;
}

function startTimer() {
  timerInterval = setInterval(() => {
    timeLeft--;
    document.querySelector(".timer").textContent = timeLeft;
    if (timeLeft <= 0) {
      stopGame();
    }
  }, 1000);
}

document.querySelector(".button-start").addEventListener("click", startGame);

document.querySelector("#moving-off").addEventListener("click", () => {
  document.querySelectorAll(".speed").forEach(el => el.classList.add("hidden"));
});

document.querySelector("#moving-on").addEventListener("click", () => {
  document.querySelectorAll(".speed").forEach(el => el.classList.remove("hidden"));
});

window.addEventListener('load', () => {
  document.querySelector('#target-medium').checked = true;
  document.querySelector('#difficulty-normal').checked = true;
  document.querySelector('#duration-30').checked = true;
  document.querySelector('#moving-on').checked = true;
  document.querySelector('#speed-normal').checked = true;
});
