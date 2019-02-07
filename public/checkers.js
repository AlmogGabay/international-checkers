/* Define the entire tiles array which includes all of the black tiles on the board */
let tiles = [
        undefined,
        document.querySelectorAll(".first"),
        document.querySelectorAll(".second"),
        document.querySelectorAll(".third"),
        document.querySelectorAll(".fourth"),
        document.querySelectorAll(".fifth"),
        document.querySelectorAll(".sixth"),
        document.querySelectorAll(".seventh"),
        document.querySelectorAll(".eighth")
    ],
    printTurn = document.querySelector("#turn"),
    startButton = document.querySelector("#start"),
    turn = "black-pawn", 
    blackPawns = 12, 
    whitePawns = 12, 
    lastSelected,
    setTiles = {
        black: tile => tile.classList.add("black-pawn"),
        white: tile => tile.classList.add("white-pawn")
    }

startButton.addEventListener("click", () => {
    gameStart();
    startButton.style.opacity = "0";
});
startButton.addEventListener("transitionend", function () {this.style.display = "none"});

/* Places all the pawns in their initial position */
function gameStart () { 
    tiles[1].forEach(setTiles.black);
    tiles[2].forEach(setTiles.black);
    tiles[3].forEach(setTiles.black);
    tiles[6].forEach(setTiles.white);
    tiles[7].forEach(setTiles.white);
    tiles[8].forEach(setTiles.white);
    printTurn.textContent = turn;
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < 4; j++) {
            tiles[i][j].row = i;
            tiles[i][j].addEventListener("click", function() { 
                checkMovement(this, i, j);
            });
        }
    }
}

function checkMovement (selectedTile, row, tile) {
    if (selectedTile.classList.contains("suggested-move")) { // if a suggested path is clicked
        if (selectedTile.captured) { // if the clicked tile is a suggested capture
            executeCapture(selectedTile, selectedTile.captured);
        }
        lastSelected.classList.remove(turn);
        selectedTile.classList.add(turn); 
        turn = (turn == "black-pawn") ?  "white-pawn" : "black-pawn"; // switch turns
        printTurn.textContent = turn;
    }
    clearSuggestionsAndCaptures();
    if (selectedTile.classList.contains(turn)) { // if a tile which has a pawn on it is selected
        if (turn == "black-pawn") { // black turn
            if (row%2 == 0) {
                pawnMovementCalculation(row, tile, 1, 1, 1, "black-pawn", "white-pawn");
            }
            else {
                pawnMovementCalculation(row, tile, 1, -1, -1, "black-pawn", "white-pawn"); 
            }
        }
        else { // white turn
            if (row%2 == 0) {
                pawnMovementCalculation(row, tile, -1, 1, 1, "white-pawn", "black-pawn");
            }
            else {
                pawnMovementCalculation(row, tile, -1, -1, -1, "white-pawn", "black-pawn"); 
            }
        }
    }
    lastSelected = selectedTile; // "remembers" the last tile that was selected, this allows to move a capturer to its new position
}

function clearSuggestionsAndCaptures () {
    for (let i = 1; i < tiles.length; i++) {
        for (let j = 0; j < 4; j++) {
            tiles[i][j].classList.remove("suggested-move", "capture");
            delete tiles[i][j].captured;
        }
    }
}

/* r: row, t: tile, rStep: row step, tStep: tile step */
function pawnMovementCalculation (r, t, rStep, tStep, doubleTileStep, friend, foe, captureOccured = false, capturedArr = []) {
    if (tiles[r+rStep] && tiles[r+rStep][t+tStep] && !tiles[r+rStep][t+tStep].classList.contains(friend)) { // if not friend
        if (!tiles[r+rStep][t+tStep].classList.contains(foe)) { // if empty
            if (!captureOccured) {
                tiles[r+rStep][t+tStep].classList.add("suggested-move"); // a step without a capture
            }
        }
        else { // if foe
            if (tiles[r+rStep*2] && tiles[r+rStep*2][t+doubleTileStep] && !tiles[r+rStep*2][t+doubleTileStep].classList.contains(friend) && !tiles[r+rStep*2][t+doubleTileStep].classList.contains(foe)) {
                capturedArr.push(tiles[r+rStep][t+tStep]);
                if (!tiles[r+rStep*2][t+doubleTileStep].captured) {
                    tiles[r+rStep*2][t+doubleTileStep].captured = capturedArr.slice(); // PREVENTS ALIASING!!!   
                }
                tiles[r+rStep*2][t+doubleTileStep].classList.add("suggested-move");
                tiles[r+rStep][t+tStep].classList.add("capture");
                pawnMovementCalculation(r+rStep*2, t+doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, true, capturedArr.slice());
                capturedArr.pop();
            }
        }
    }
    if (tiles[r+rStep] && tiles[r+rStep][t] && !tiles[r+rStep][t].classList.contains(friend)) { // if not friend
        if (!tiles[r+rStep][t].classList.contains(foe)) { // if empty
            if (!captureOccured) {
                tiles[r+rStep][t].classList.add("suggested-move"); // a step without a capture
            }
        }
        else { // if foe
            if (tiles[r+rStep*2] && tiles[r+rStep*2][t-doubleTileStep] && !tiles[r+rStep*2][t-doubleTileStep].classList.contains(friend) && !tiles[r+rStep*2][t-doubleTileStep].classList.contains(foe)) {
                capturedArr.push(tiles[r+rStep][t]);
                if (!tiles[r+rStep*2][t-doubleTileStep].captured) {
                    tiles[r+rStep*2][t-doubleTileStep].captured = capturedArr.slice(); // PREVENTS ALIASING!!!   
                }
                tiles[r+rStep*2][t-doubleTileStep].classList.add("suggested-move");
                tiles[r+rStep][t].classList.add("capture");
                pawnMovementCalculation(r+rStep*2, t-doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, true, capturedArr.slice());
            }
        }
    }
}

function executeCapture (capturer, captured) {
    if (turn == "black-pawn") {
        captured.forEach(captured => {captured.classList.remove("white-pawn"); whitePawns--;}); 
    }
    else {
        captured.forEach(captured => {captured.classList.remove("black-pawn"); blackPawns--;});
    }
}