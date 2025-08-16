// script.js

// -----------------------------
// DATA: 16 mini categories × 4 words = 64 tiles
// -----------------------------
const categories = [
  ["Oak", "Maple", "Pine", "Birch"],                           // 0
  ["Rose", "Tulip", "Daisy", "Orchid"],                        // 1
  ["Basil", "Thyme", "Mint", "Rosemary"],                      // 2
  ["Fern", "Ivy", "Moss", "Bamboo"],                           // 3
  ["Espresso", "Latte", "EarlGrey", "Matcha"],                 // 4
  ["Cola", "Lemonade", "RootBeer", "GingerAle"],               // 5
  ["Vodka", "Whiskey", "Rum", "Tequila"],                      // 6
  ["Orange", "Apple", "Cranberry", "Grape"],                   // 7
  ["Mango", "Banana", "Strawberry", "Kiwi"],                   // 8
  ["Carrot", "Broccoli", "Spinach", "BrusselSprouts"],         // 9
  ["Brownie", "Cake", "Cookie", "Pie"],                        // 10
  ["Rice", "Quinoa", "Baguette", "Pita"],                      // 11
  ["Blackhawks", "RedWings", "Capitals", "Penguins"],          // 12
  ["Lakers", "Celtics", "Bulls", "Warriors"],                  // 13
  ["Patriots", "Cowboys", "Packers", "Steelers"],              // 14
  ["Yankees", "RedSox", "Dodgers", "Cubs"]                     // 15
];

const miniNames = [
  "Trees", "Flowers", "Herbs", "Plants",
  "Coffees & Teas", "Soft Drinks", "Alcoholic Drinks", "Juices",
  "Fruits", "Vegetables", "Desserts", "Grains & Breads",
  "NHL Teams", "NBA Teams", "NFL Teams", "MLB Teams"
];

const superGroups = [
  { name: "Botanical",   indices: [0, 1, 2, 3] },
  { name: "Beverages",   indices: [4, 5, 6, 7] },
  { name: "Foods",       indices: [8, 9,10,11] },
  { name: "Sports Teams",indices: [12,13,14,15] }
];

// -----------------------------
// ELEMENTS
// -----------------------------
const board = document.getElementById("game-board");
const guessBtn = document.getElementById("guess-btn");
const deselectBtn = document.getElementById("deselect-btn");
const shuffleBtn = document.getElementById("shuffle-btn");
const superGroupControls = document.getElementById("super-group-controls");
const superGuessBtn = document.getElementById("super-guess-btn");
const superDeselectBtn = document.getElementById("super-deselect-btn");
const superShuffleBtn = document.getElementById("super-shuffle-btn");
const incorrectCounter = document.getElementById("incorrect-counter");

// -----------------------------
// STATE
// -----------------------------
let selectedTiles = [];
let incorrectGuesses = 0;
let mergedCategories = []; // mini category indices solved
let gamePhase = "micro";   // "micro" | "super"

// -----------------------------
// INIT
// -----------------------------
createBoard();
incorrectCounter.textContent = incorrectGuesses;

// -----------------------------
// BOARD CREATION (8×8 micro phase)
// -----------------------------
function createBoard(){
  const wordList = shuffleArray(categories.flat());

  wordList.forEach((word, idx) => {
    const tile = document.createElement("div");
    tile.className = "tile";
    tile.textContent = word;
    tile.dataset.word = word;

    const microIndex = findMicroIndex(word);
    tile.dataset.microIndex = String(microIndex);

    // keep row/col solely for mini merge placement
    const row = Math.floor(idx / 8) + 1;
    const col = (idx % 8) + 1;
    tile.dataset.row = String(row);
    tile.dataset.col = String(col);

    // place in grid explicitly to avoid reflow issues as we remove tiles
    tile.style.gridRowStart = row;
    tile.style.gridColumnStart = col;

    tile.addEventListener("click", () => toggleTile(tile));
    board.appendChild(tile);
  });
}

// -----------------------------
// TILE SELECT/DESELECT (micro)
// -----------------------------
function toggleTile(tile){
  if (tile.classList.contains("merged") || gamePhase === "super") return;

  if (tile.classList.contains("selected")){
    tile.classList.remove("selected");
    selectedTiles = selectedTiles.filter(t => t !== tile);
  } else if (selectedTiles.length < 4){
    tile.classList.add("selected");
    selectedTiles.push(tile);
  }
}

// -----------------------------
// GUESS MINI-CATEGORY
// -----------------------------
guessBtn.addEventListener("click", checkGroup);
function checkGroup(){
  if (selectedTiles.length !== 4){
    alert("Select 4 tiles before guessing!");
    return;
  }

  const microIndices = selectedTiles.map(t => parseInt(t.dataset.microIndex, 10));
  const firstIndex = microIndices[0];
  const correct = microIndices.every(i => i === firstIndex);

  if (correct && !mergedCategories.includes(firstIndex)){
    animateMerge(firstIndex);
    // if all 16 mini categories merged, move to super phase
    if (mergedCategories.length === categories.length){
      startSuperGroupPhase();
    }
  } else {
    incorrectGuesses++;
    incorrectCounter.textContent = String(incorrectGuesses);
    selectedTiles.forEach(t => t.classList.remove("selected"));
    if (mergedCategories.includes(firstIndex)){
      alert("This mini category is already solved!");
    }
  }
  selectedTiles = [];
}

// -----------------------------
// MERGE 4 MINI TILES INTO 1 MINI TILE
// -----------------------------
function animateMerge(microIndex){
  const tilesToMerge = selectedTiles.slice();
  const firstTile = tilesToMerge[0];
  const row = parseInt(firstTile.dataset.row, 10);
  const col = parseInt(firstTile.dataset.col, 10);

  const merged = document.createElement("div");
  merged.className = "tile merged";
  merged.textContent = miniNames[microIndex];
  merged.dataset.microIndex = String(microIndex);
  merged.style.gridRowStart = row;
  merged.style.gridColumnStart = col;

  tilesToMerge.forEach(t => t.remove());
  board.appendChild(merged);

  mergedCategories.push(microIndex);
}

// -----------------------------
// TRANSITION TO SUPER (MEGA) PHASE
// -----------------------------
function startSuperGroupPhase(){
  gamePhase = "super";
  // hide micro controls, show super controls
  guessBtn.style.display = "none";
  deselectBtn.style.display = "none";
  shuffleBtn.style.display = "none";
  superGroupControls.style.display = "flex";

  // clear selection and rebuild board as 4×4 auto grid
  selectedTiles = [];
  board.innerHTML = "";
  board.classList.add("super-phase");

  const mergedTiles = miniNames.map((name, idx) => ({ name, microIndex: idx }));
  shuffleArray(mergedTiles).forEach((tile) => {
    const newTile = document.createElement("div");
    newTile.className = "tile merged";
    newTile.textContent = tile.name;
    newTile.dataset.microIndex = String(tile.microIndex);
    newTile.addEventListener("click", () => toggleSuperTile(newTile));
    board.appendChild(newTile); // auto-placed by CSS grid
  });
}

// -----------------------------
// SELECT/DESELECT IN SUPER PHASE
// -----------------------------
function toggleSuperTile(tile){
  if (tile.classList.contains("super-merged")) return;

  if (tile.classList.contains("selected")){
    tile.classList.remove("selected");
    selectedTiles = selectedTiles.filter(t => t !== tile);
  } else if (selectedTiles.length < 4){
    tile.classList.add("selected");
    selectedTiles.push(tile);
  }
}

// -----------------------------
// GUESS SUPER-GROUP
// -----------------------------
superGuessBtn.addEventListener("click", checkSuperGroup);
function checkSuperGroup(){
  if (selectedTiles.length !== 4){
    alert("Select 4 categories for a super-group!");
    return;
  }

  const microIndices = selectedTiles.map(t => parseInt(t.dataset.microIndex, 10));
  const superGroup = superGroups.find(sg =>
    sg.indices.length === 4 && microIndices.every(i => sg.indices.includes(i))
  );

  if (superGroup){
    // remove selected four mini category tiles
    selectedTiles.forEach(t => t.remove());

    // add a full-row spanning tile (auto-placed)
    const superTile = document.createElement("div");
    superTile.className = "tile super-merged";
    superTile.textContent = superGroup.name;
    superTile.style.backgroundColor = getSuperColor(superGroup.name);
    board.appendChild(superTile);

    // win condition: 4 super-merged tiles present
    if (document.querySelectorAll(".tile.super-merged").length === 4){
      alert("Congratulations! You've solved all super-groups!");
    }
  } else {
    incorrectGuesses++;
    incorrectCounter.textContent = String(incorrectGuesses);
    selectedTiles.forEach(t => t.classList.remove("selected"));
  }
  selectedTiles = [];
}

// -----------------------------
// BUTTONS: Deselect & Shuffle (both phases)
// -----------------------------
deselectBtn.addEventListener("click", () => clearSelections());
superDeselectBtn.addEventListener("click", () => clearSelections());

function clearSelections(){
  document.querySelectorAll(".tile.selected").forEach(t => t.classList.remove("selected"));
  selectedTiles = [];
}

shuffleBtn.addEventListener("click", () => shuffleRemaining());
superShuffleBtn.addEventListener("click", () => shuffleRemaining());

function shuffleRemaining(){
  if (gamePhase === "micro"){
    // collect non-merged tiles and their positions
    const tiles = Array.from(board.querySelectorAll(".tile:not(.merged)"));
    const positions = tiles.map(t => ({
      row: t.style.gridRowStart,
      col: t.style.gridColumnStart
    }));
    // shuffle tiles and reassign saved positions
    const shuffled = shuffleArray(tiles.slice());
    shuffled.forEach((tile, i) => {
      tile.style.gridRowStart = positions[i].row;
      tile.style.gridColumnStart = positions[i].col;
      board.appendChild(tile); // re-append to reflect order
    });
  } else {
    // super phase: reflow any non super-merged tiles
    const minis = Array.from(board.querySelectorAll(".tile.merged:not(.super-merged)"));
    shuffleArray(minis).forEach(t => board.appendChild(t));
  }
}

// -----------------------------
// SUPER-GROUP COLORS
// -----------------------------
function getSuperColor(superName){
  const superColors = {
    "Botanical":    "#FFFF99", // Yellow
    "Beverages":    "#99FF99", // Green
    "Foods":        "#99CCFF", // Blue
    "Sports Teams": "#CC99FF"  // Purple
  };
  return superColors[superName] || "#888";
}

// -----------------------------
// UTILS
// -----------------------------
function shuffleArray(array){
  for (let i = array.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function findMicroIndex(word){
  for (let i = 0; i < categories.length; i++){
    if (categories[i].includes(word)) return i;
  }
  return 0;
}
