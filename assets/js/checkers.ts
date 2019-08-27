  /**********************/
 /*VARIABLE DEFINITIONS*/
/**********************/

const qS = (selector: string): HTMLElement => document.querySelector(selector);
const qSA = (selector: string): NodeListOf<HTMLElement> => document.querySelectorAll(selector);

interface TileElement extends HTMLElement {
    whitePawn?: boolean,
    blackPawn?: boolean,
    king?: boolean,
    stepped?: boolean
}

const loading: HTMLDivElement = qS('#loading') as HTMLDivElement;
const coverContainer: HTMLDivElement = qS('#cover-flex-container') as HTMLDivElement;
const cover: HTMLDivElement = qS('#cover') as HTMLDivElement;
const rules: HTMLDivElement = qS('#rules') as HTMLDivElement;
const playButton: HTMLDivElement = qS('#play-button') as HTMLDivElement;
const newGameButton: HTMLDivElement = qS('#newgame-button') as HTMLDivElement;
const board: HTMLDivElement = qS('#board') as HTMLDivElement;
const knights: NodeListOf<HTMLImageElement> = qSA('.knight') as NodeListOf<HTMLImageElement>;
const tiles: NodeListOf<TileElement>[] = [
    null, 
    qSA('.first'), 
    qSA('.second'), 
    qSA('.third'), 
    qSA('.fourth'), 
    qSA('.fifth'), 
    qSA('.sixth'), 
    qSA('.seventh'), 
    qSA('.eighth')
];
    
let turn: 'white-pawn' | 'black-pawn';
let whitePawns: number;
let blackPawns: number;
let lastSelected: TileElement;
let paths: TileElement[][] = [];


  /**********************/
 /*FUNCTION DEFINITIONS*/
/**********************/

const gameStart = (): void => {
    [turn, whitePawns, blackPawns, lastSelected] = ['white-pawn', 12, 12, null];
    knights[0].style.opacity = '1';
    knights[1].style.opacity = '0.3';
    tiles.forEach(row => row && clearTiles(row)); // tiles[0] is null
    fillPawns();
};

/* Places all the pawns in their initial position */
const fillPawns = (): void => {
    tiles.forEach((row, rowIndex) => {
        if (rowIndex >= 1 && rowIndex <= 3) {
            row.forEach((tile: TileElement) => setPawn('white-pawn', tile));
        } else if (rowIndex >= 6 && rowIndex <= 8) {
            row.forEach((tile: TileElement) => setPawn('black-pawn', tile));
        }
    });
    tiles.forEach((row, rowIndex) =>
        row && row.forEach((tile: TileElement, tileIndex: number) =>
            tile.addEventListener('click', () => checkChosenPath(tile, rowIndex, tileIndex))
        )
    );
};

const setPawn = (pawnColor: 'white-pawn' | 'black-pawn', tile: TileElement): void => {
    tile.classList.add(pawnColor);
    tile[pawnColor == 'white-pawn' ? 'whitePawn' : 'blackPawn'] = true
};

/* Clears all previous pawns */
const clearTiles = (tilesRow: NodeListOf<TileElement> | TileElement[]): void => {
    tilesRow.forEach((tile: TileElement) => { 
        tile.classList.remove('white-pawn', 'black-pawn', 'white-king', 'black-king'); 
        delete tile.whitePawn; 
        delete tile.blackPawn; 
        delete tile.king;
    });
};

const checkChosenPath = (selectedTile: TileElement, row: number, tile: number): void => {
    if (selectedTile.classList.contains('suggested-move-' + turn)) { // if a suggested path is taken (a pawn can move only to a suggested path)
        if (paths[0].length > 1) { // if the pressed tile is a suggested capture path
            const chosenPath: TileElement[] = paths.filter((path: TileElement[]) => [...path].includes(selectedTile)).flat();
            executeStep(chosenPath);
        }
        if (turn == 'white-pawn') { // white turn
            if (lastSelected.king || row == 8) { // if the previously selected pawn is a king or is about to become one
                delete lastSelected.king; // since selectedTile and lastSelected might be the same (diamond capture scenario), this line has to be here and not outside the big 'if' statement in line 92
                selectedTile.classList.add('white-king');
                selectedTile.king = true;   
            } else {
                selectedTile.classList.add('white-pawn');
            }
            if (selectedTile != lastSelected) { // this makes sure that a pawn does not disappear after performing a diamond capture
                lastSelected.classList.remove('white-pawn', 'white-king');
                delete lastSelected.whitePawn;  
            }
            selectedTile.whitePawn = true;
        } else { // black turn
            if (lastSelected.king || row == 1) {
                delete lastSelected.king;
                selectedTile.classList.add('black-king');
                selectedTile.king = true;
            } else {
                selectedTile.classList.add('black-pawn');
            }
            if (selectedTile != lastSelected) {
                lastSelected.classList.remove('black-pawn', 'black-king');
                delete lastSelected.blackPawn;   
            }
            selectedTile.blackPawn = true;
        }
        if (!checkGameOver()) {
            switchTurns();
        }
    }
    clearPaths(null, lastSelected);
    if (selectedTile[turn == 'white-pawn' ? 'whitePawn' : 'blackPawn'] && !checkGameOver()) { // if a current turn pawn is selected (checkGameOver prevents the issue when the final move is clicked twice and shows suggestions even after the game is over)
        selectedTile.classList.add('pressed-pawn');
        handlePaths(selectedTile, row, tile);
    }
    lastSelected = selectedTile; // 'remembers' the last tile that was selected, this allows a capturer to move to its new position
};

const handlePaths = (selectedTile: TileElement, row: number, tile: number): void => {
    if (turn == 'white-pawn') { // white turn
        (row % 2 == 0) ? 
        paths = findPaths(row, tile, 1, 1, 1, 'whitePawn', 'blackPawn', selectedTile) : 
        paths = findPaths(row, tile, 1, -1, -1, 'whitePawn', 'blackPawn', selectedTile);
    } else { // black turn
        (row % 2 == 0) ? 
        paths = findPaths(row, tile, -1, 1, 1, 'blackPawn', 'whitePawn', selectedTile) : 
        paths = findPaths(row, tile, -1, -1, -1, 'blackPawn', 'whitePawn', selectedTile);   
    }

    paths.forEach(path => path.forEach((tile, ind) => {
        if (ind == path.length - 1) {
            tile.classList.add('suggested-move-' + turn);
        }
        else if (ind % 2 == 0) {
            tile.classList.add('capture');
        } else {
            tile.classList.add('intermediate-capture');
        }
    }));
};

const clearPaths = (chosenPath: TileElement[], lastSelected?: TileElement): void => {
    paths.forEach(path => path.forEach(tile => {
        tile.classList.remove(
            'intermediate-capture', 
            'capture',
            'suggested-move-white-pawn', 
            'suggested-move-black-pawn',
        );
        delete tile.stepped;
    }));
    if (chosenPath) {
        chosenPath.forEach(tile => {
            tile.classList.remove(
                'white-pawn',
                'black-pawn',
                'white-king',
                'black-king'
            );
            delete tile.whitePawn;
            delete tile.blackPawn;
            delete tile.king;
        });
    }
    paths = [];
    if (lastSelected) {
        lastSelected.classList.remove('pressed-pawn');
        delete lastSelected.stepped;
    }
};

/* A backtracking recursion that finds all of the possible paths */
const findPaths = (
    row: number,
    tile: number, 
    rStep: number, 
    tStep: number, 
    doubleTileStep: number, 
    friend: 'whitePawn' | 'blackPawn', 
    foe: 'whitePawn' | 'blackPawn',
    originalPawn: TileElement,
    captureOccured: boolean = false, 
    path: TileElement[] = []
): TileElement[][] => {
    const pathsArr: TileElement[][] = [];
    tiles[row][tile].stepped = true;
    
    /* FORWARD MOVEMENT */
    if (tiles[row+rStep] && tiles[row+rStep][tile+tStep] && !tiles[row+rStep][tile+tStep][friend]) { // if not friend
        if (!tiles[row+rStep][tile+tStep][foe]) { // if empty
            if (!captureOccured) { // a step without a capture
                pathsArr.push([ ...path, tiles[row+rStep][tile+tStep] ]);
            }
        } else if (tiles[row+rStep*2] && tiles[row+rStep*2][tile+doubleTileStep]) { // if jump tile exists
            if ( // if jump tile is empty AND hasn't been stepped on OR if jump tile is the pressed pawn AND at least 5 tiles have been passed through 
                !tiles[row+rStep*2][tile+doubleTileStep][friend] && !tiles[row+rStep*2][tile+doubleTileStep][foe] && !tiles[row+rStep*2][tile+doubleTileStep].stepped 
                || tiles[row+rStep*2][tile+doubleTileStep] == originalPawn && path.length >= 5
            ) {
                pathsArr.push(...findPaths(row+rStep*2, tile+doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, originalPawn, true, [ ...path, tiles[row+rStep][tile+tStep], tiles[row+rStep*2][tile+doubleTileStep] ]));
            }
        }
    }
    
    if (tiles[row+rStep] && tiles[row+rStep][tile] && !tiles[row+rStep][tile][friend]) {
        if (!tiles[row+rStep][tile][foe]) {
            if (!captureOccured) {
                pathsArr.push([ ...path, tiles[row+rStep][tile] ]);
            }
        } else if (tiles[row+rStep*2] && tiles[row+rStep*2][tile-doubleTileStep]) {
            if (
                !tiles[row+rStep*2][tile-doubleTileStep][friend] && !tiles[row+rStep*2][tile-doubleTileStep][foe] && !tiles[row+rStep*2][tile-doubleTileStep].stepped || 
                tiles[row+rStep*2][tile-doubleTileStep] == originalPawn && path.length >= 5
            ) {
                pathsArr.push(...findPaths(row+rStep*2, tile-doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, originalPawn, true, [ ...path, tiles[row+rStep][tile], tiles[row+rStep*2][tile-doubleTileStep] ]));
            }
        }
    }
    
    /* BACKWARD MOVEMENT */
    if (tiles[row-rStep] && tiles[row-rStep][tile+tStep] && !tiles[row-rStep][tile+tStep][friend]) { 
        if (tiles[row-rStep][tile+tStep][foe]) {
            if (tiles[row-rStep*2] && tiles[row-rStep*2][tile+doubleTileStep]) { 
                if (
                    !tiles[row-rStep*2][tile+doubleTileStep][friend] && !tiles[row-rStep*2][tile+doubleTileStep][foe] && !tiles[row-rStep*2][tile+doubleTileStep].stepped 
                    || tiles[row-rStep*2][tile+doubleTileStep] == originalPawn && path.length >= 5
                ) {
                    pathsArr.push(...findPaths(row-rStep*2, tile+doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, originalPawn, true, [ ...path, tiles[row-rStep][tile+tStep], tiles[row-rStep*2][tile+doubleTileStep] ]));
                }
            }
        } else if (originalPawn.king && !captureOccured) {
            pathsArr.push([ ...path, tiles[row-rStep][tile+tStep] ]); // only a king is allowed to move backwards without a capture
        }
    }
    
    if (tiles[row-rStep] && tiles[row-rStep][tile] && !tiles[row-rStep][tile][friend]) { 
        if (tiles[row-rStep][tile][foe]) {
            if (tiles[row-rStep*2] && tiles[row-rStep*2][tile-doubleTileStep]) {
                if (
                    !tiles[row-rStep*2][tile-doubleTileStep][friend] && !tiles[row-rStep*2][tile-doubleTileStep][foe] && !tiles[row-rStep*2][tile-doubleTileStep].stepped
                    || tiles[row-rStep*2][tile-doubleTileStep] == originalPawn && path.length >= 5
                ) {
                    pathsArr.push(...findPaths(row-rStep*2, tile-doubleTileStep, rStep, tStep, doubleTileStep, friend, foe, originalPawn, true, [ ...path, tiles[row-rStep][tile], tiles[row-rStep*2][tile-doubleTileStep] ]));
                }
            }
        } else if (originalPawn.king && !captureOccured) {
            pathsArr.push([ ...path, tiles[row-rStep][tile] ]);
        }
    }

    if (pathsArr.length > 0) {
        return pathsArr.sort((a, b) => b.length - a.length).filter(path => path.length == pathsArr[0].length);
    }
    return [[...path]];
};

const executeStep = (chosenPath: TileElement[]): void => {
    turn == 'white-pawn' ? blackPawns -= chosenPath.length / 2 : whitePawns -= chosenPath.length / 2;
    clearPaths(chosenPath);
};

const switchTurns = (): void => {
    if (turn == 'white-pawn') {
        turn = 'black-pawn';
        knights[0].style.opacity = '0.3';
        knights[1].style.opacity = '1';
    } else {
        turn = 'white-pawn';
        knights[0].style.opacity = '1';
        knights[1].style.opacity = '0.3';
    }
};

const checkGameOver = (): boolean => {
    if (whitePawns == 0 || blackPawns == 0) {
        coverContainer.style.display = 'flex';
        cover.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
        board.style.filter = 'blur(8px)';
        newGameButton.style.display = 'inline-block';
        return true;
    }
    return false;
};


  /*****************/
 /*EVENT LISTENERS*/
/*****************/

window.addEventListener('DOMContentLoaded', () => { 
    setTimeout(() => loading.style.opacity = '0', 500);
    loading.addEventListener('transitionend', () => document.body.removeChild(loading));
});

knights.forEach((knight: HTMLImageElement) => knight.addEventListener('click', 
    () => {
        if (confirm('Restart the game?')) {
            gameStart();
        }
    })
);

playButton.addEventListener('click', () => { 
    cover.addEventListener('transitionend', () => coverContainer.style.display = 'none'); // prevents the 'no cover on first launch' issue
    playButton.style.display = 'none';
    rules.style.display = 'none'; 
    cover.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    board.style.filter = 'none';
    gameStart(); 
});

newGameButton.addEventListener('click', () => { 
    newGameButton.style.display = 'none'; 
    cover.style.backgroundColor = 'rgba(255, 255, 255, 0)';
    board.style.filter = 'none';
    gameStart(); 
});