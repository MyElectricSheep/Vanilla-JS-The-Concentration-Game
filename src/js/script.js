/* eslint-disable no-undef */

////////////////////////////
// SELECTED DOM ELEMENTS //
//////////////////////////

const cardsGridContainer = document.querySelector(".cards-grid-container");
const cardsContainer = document.getElementById("cards-container");
const gameOverContainer = document.getElementById("game-over");
const numberOfPictures = document.getElementById("numberOfPictures");
const numberOfLivesContainer = document.getElementById("numberOfLives");
const allCovers = document.getElementsByClassName("front");
const template = document.getElementById("card-template");
const difficultyBtns = document.querySelectorAll("[data-difficulty]");

const jsConfetti = new JSConfetti();

///////////////////////
// GLOBAL VARIABLES //
/////////////////////

let activeSelection = false;
let noClickAllowed = false;
let selectedPictures = [];
const numberOfActivePictures = {
  easy: 12,
  medium: 24,
  hard: 36
};
const numberOfLives = {
  easy: 12,
  medium: 10,
  hard: 8
};
let remainingPictures;
let remainingLives;
let difficulty = "medium";

//////////////////////
// GAME FUNCTIONS  //
////////////////////

/**
 * @function addGlobalEventListener(t,s,c)
 * @param {string} t - An event type (eg: "click")
 * @param {string} s - A CSS selector (eg: ".myClass")
 * @param {function} c - A callback function as the event handler
 * @return {undefined} This function does not return any specific value
 *
 * @example
 *     addGlobalEventListener('click', "div", (e) => { console.log(e.target) })
 */
function addGlobalEventListener(type, selector, callback) {
  document.addEventListener(type, (e) => {
    if (e.target.matches(selector)) callback(e);
  });
}

function clearElement(item) {
  while (item.firstChild) {
    item.removeChild(item.firstChild);
  }
}

function howManyLives() {
  return "❤️".repeat(remainingLives);
}

function handleChangeDifficulty() {
  difficulty = this.dataset.difficulty;
  clearElement(cardsContainer);
  init(numberOfActivePictures[difficulty]);
}

function gameOver() {
  clearElement(cardsContainer);
  cardsGridContainer.classList.add("fullHeight");
  numberOfLivesContainer.textContent = "💔";
  jsConfetti.addConfetti({
    emojis: ["💀", "🪦", "⚰️", "☠️", "⚱️", "😵", "💔"],
    emojiSize: 100,
    confettiNumber: 80
  });
  gameOverContainer.innerHTML = `<img src="./src/img/gameover.png" class="img-fluid" alt="game over">`;
}

function youWin() {
  clearElement(cardsContainer);
  cardsGridContainer.classList.add("fullHeight");
  numberOfLivesContainer.textContent = "🦄";
  jsConfetti.addConfetti({
    emojis: ["🌈", "🦄", "⚡️", "💥", "✨", "💫", "🌸"],
    emojiSize: 100,
    confettiNumber: 80
  });
  gameOverContainer.innerHTML = `<img src="./src/img/youwin.png" class="img-fluid" alt="you win">`;
}

/**
 * @function getShuffledArrayOfRandomNumbers(n)
 * @param {number} [n=10] - A number param (defaults to 10)
 * @return {number[]} - An array of shuffled numbers, eg: [2, 6, 5, 5, 2, 6]
 *
 * The returned array contains n numbers, where each
 * number is found twice at a random position in the array
 *
 * @example
 *     getShuffledArrayOfRandomNumbers(12)
 */
function getShuffledArrayOfRandomNumbers(n = 10) {
  const randomNumbers = [...new Array(n / 2)].map(() =>
    Math.floor(Math.random() * 1000)
  );
  // Not truly random, but hey, for our purpose, works well enough!
  // Better solutions here: https://javascript.info/array-methods#shuffle-an-array
  const shuffledRandomNumbers = [...randomNumbers, ...randomNumbers].sort(
    () => Math.random() - 0.5
  );

  return shuffledRandomNumbers;
}

function flipPicture() {
  if (activeSelection) return;
  activeSelection = true;
  this.previousElementSibling.style.transform = "rotateY(180deg)";
  this.style.opacity = "1";
  this.style.transform = "rotateY(0deg)";
  setTimeout(() => {
    this.previousElementSibling.style.transform = "rotateY(0deg)";
    this.style.opacity = "0";
    this.style.transform = "rotateY(180deg)";
    activeSelection = false;
  }, 1000);
}

function compare() {
  if (noClickAllowed) return;
  noClickAllowed = true;
  setTimeout(() => {
    noClickAllowed = false;
  }, 1000);

  const selected = {
    container: this.parentElement,
    comparisonId: this.firstElementChild.dataset.comparisonId,
    uniqueId: this.firstElementChild.dataset.uniqueId,
    cover: this.previousElementSibling
  };

  if (selectedPictures.find((pic) => pic.uniqueId === selected.uniqueId))
    return;

  selectedPictures.push(selected);
  selected.cover.classList.toggle("selected");

  if (selectedPictures.length === 2) {
    const [pic1, pic2] = selectedPictures;

    if (pic1.comparisonId === pic2.comparisonId) {
      setTimeout(() => {
        pic1.container.remove();
        pic2.container.remove();
        selectedPictures = [];
        if (remainingPictures === 2) {
          youWin();
        } else {
          jsConfetti.addConfetti({
            emojis: ["🌈", "🦄"],
            emojiSize: 100,
            confettiNumber: 20
          });
        }
        activeSelection = false;
        remainingPictures -= 2;
        numberOfPictures.textContent = remainingPictures;
      }, 1000);
    } else {
      selectedPictures = [];
      setTimeout(() => {
        for (let cover of allCovers) {
          cover.classList.remove("selected");
        }
        remainingLives -= 1;
        numberOfLivesContainer.textContent = howManyLives();

        if (!remainingLives) {
          gameOver();
        } else {
          jsConfetti.addConfetti({
            emojis: ["😵", "💔"],
            emojiSize: 100,
            confettiNumber: 20
          });
        }
      }, 1000);
    }
  }
}

async function getImage(num) {
  const data = await fetch(`https://picsum.photos/600/400?image=${num}`)
    .then(async (res) => {
      if (!res.ok) {
        return getImage(num + 1);
      } else {
        return res.blob();
      }
    })
    .then((imageBlob) => {
      const imageObjectURL =
        typeof imageBlob === "object"
          ? URL.createObjectURL(imageBlob)
          : imageBlob;
      return imageObjectURL;
    })
    .catch((e) => {
      console.log(e);
    });
  return data;
}

async function init(n) {
  cardsGridContainer.classList.remove("fullHeight");
  gameOverContainer.innerHTML = "";

  const shuffled = getShuffledArrayOfRandomNumbers(n);

  const pictureDataPromises = shuffled.map(async (num) => await getImage(num));
  const pictureData = await Promise.all(pictureDataPromises);

  shuffled.forEach((num, index) => {
    const element = template.content.cloneNode(true);
    const card = element.querySelector(".back");

    const imgBack = element.querySelector(".picture-back");

    imgBack.src = pictureData[index];
    imgBack.alt = "some random photo";
    imgBack.dataset.comparisonId = num;
    imgBack.dataset.uniqueId = nanoId(); // nanoId is loaded as a previous script;

    card.addEventListener("click", flipPicture);
    card.addEventListener("click", compare);
    cardsContainer.appendChild(element);

    remainingPictures = n;
    remainingLives = numberOfLives[difficulty];
    numberOfPictures.textContent = n;
    numberOfLivesContainer.textContent = howManyLives();
  });
}

difficultyBtns.forEach((btn) =>
  btn.addEventListener("click", handleChangeDifficulty)
);

init(numberOfActivePictures[difficulty]);
