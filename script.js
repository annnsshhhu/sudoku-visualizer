const N = 9;

let grid = Array.from({ length: N }, () => Array(N).fill(0));
let original = Array.from({ length: N }, () => Array(N).fill(false));
let solving = false;
let stopFlag = false;

// Speed config
const speedDelays = [2000, 800, 300, 200, 80, 25, 0];
const speedLabels = ['Turtle 🐢', 'Very Slow', 'Slow', 'Normal', 'Fast', 'Very Fast', 'Instant'];

const slider = document.getElementById('speedSlider');
const speedLabel = document.getElementById('speedLabel');
slider.addEventListener('input', () => {
    speedLabel.textContent = speedLabels[+slider.value];
});
slider.max = 6;
slider.value = 3;
speedLabel.textContent = speedLabels[3];

function getDelay() {
    return speedDelays[+slider.value];
}

// Create empty grid
function createGrid() {
    const gridDiv = document.getElementById("grid");
    gridDiv.innerHTML = "";

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            let input = document.createElement("input");
            input.classList.add("cell");
            input.maxLength = 1;
            input.addEventListener("input", () => {
                input.value = input.value.replace(/[^1-9]/g, "");
            });
            input.id = `cell-${r}-${c}`;
            gridDiv.appendChild(input);
        }
    }
}

// Load predefined example
function loadExample() {
    if (solving) return;
    const example = [
        [0,0,0,4,0,0,3,0,9],
        [0,0,3,0,1,0,4,2,7],
        [1,7,0,2,0,3,0,0,0],
        [2,0,0,0,7,6,8,5,4],
        [8,0,7,0,2,4,0,9,0],
        [0,0,6,3,0,8,1,0,2],
        [0,0,0,0,8,9,2,6,0],
        [7,8,2,6,4,1,0,0,5],
        [0,1,0,0,0,0,7,0,8]
    ];

    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            let cell = document.getElementById(`cell-${r}-${c}`);
            cell.value = example[r][c] || "";
            cell.className = "cell";
        }
    }
    setStatus('');
}

// Clear grid — works even mid-solve
function clearGrid() {
    stopFlag = true;
    setTimeout(() => {
        solving = false;
        stopFlag = false;
        setBtns(false);
        for (let r = 0; r < N; r++) {
            for (let c = 0; c < N; c++) {
                let cell = document.getElementById(`cell-${r}-${c}`);
                cell.value = "";
                cell.className = "cell";
                grid[r][c] = 0;
                original[r][c] = false;
            }
        }
        setStatus('');
    }, 60);
}

// Stop solving
function stopSolving() {
    stopFlag = true;
    setStatus('Stopped.', 'err');
}

// Status helper
function setStatus(msg, cls = '') {
    const s = document.getElementById('status');
    s.textContent = msg;
    s.className = 'status ' + cls;
}

// Enable/disable buttons
function setBtns(isSolving) {
    document.getElementById('btnSolve').disabled = isSolving;
    document.getElementById('btnStop').disabled = !isSolving;
}

// Read user input into grid
function readGrid() {
    for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
            let val = document.getElementById(`cell-${r}-${c}`).value;
            grid[r][c] = val ? parseInt(val) : 0;
            original[r][c] = grid[r][c] !== 0;
        }
    }
}

// Draw grid state with highlights
function draw(r, c) {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let cell = document.getElementById(`cell-${i}-${j}`);
            const cls = ['cell'];

            if (i === r || j === c) cls.push('highlight');
            if (
                Math.floor(i / 3) === Math.floor(r / 3) &&
                Math.floor(j / 3) === Math.floor(c / 3)
            ) cls.push('box-highlight');

            if (i === r && j === c) cls.push('current');
            else if (original[i][j]) cls.push('original');
            else if (grid[i][j] !== 0) cls.push('filled');

            cell.className = cls.join(' ');
            cell.value = grid[i][j] || '';
        }
    }
}

// Draw final solved state (no highlights)
function drawFinal() {
    for (let i = 0; i < N; i++) {
        for (let j = 0; j < N; j++) {
            let cell = document.getElementById(`cell-${i}-${j}`);
            cell.value = grid[i][j] || '';
            cell.className = 'cell ' + (original[i][j] ? 'original' : 'filled');
        }
    }
}

function sleep(ms) {
    return ms === 0 ? Promise.resolve() : new Promise(resolve => setTimeout(resolve, ms));
}

function isSafe(r, c, num) {
    for (let x = 0; x < N; x++) {
        if (grid[r][x] === num || grid[x][c] === num) return false;
    }
    let sr = r - r % 3;
    let sc = c - c % 3;
    for (let i = 0; i < 3; i++)
        for (let j = 0; j < 3; j++)
            if (grid[sr + i][sc + j] === num) return false;
    return true;
}

async function solve(r, c) {
    if (stopFlag) return false;
    if (r === N - 1 && c === N) return true;
    if (c === N) { r++; c = 0; }
    if (grid[r][c] !== 0) return solve(r, c + 1);

    for (let num = 1; num <= 9; num++) {
        if (stopFlag) return false;
        if (isSafe(r, c, num)) {
            grid[r][c] = num;
            const d = getDelay();
            if (d > 0) { draw(r, c); await sleep(d); }
            if (await solve(r, c + 1)) return true;
            if (stopFlag) return false;
            grid[r][c] = 0;
            if (d > 0) { draw(r, c); await sleep(Math.max(d * 0.75, 20)); }
        }
    }
    return false;
}

async function startSolving() {
    if (solving) return;
    readGrid();
    solving = true;
    stopFlag = false;
    setBtns(true);
    setStatus('Solving…');

    const ok = await solve(0, 0);
    solving = false;
    setBtns(false);

    if (ok && !stopFlag) {
        drawFinal();
        setStatus('Solved!', 'ok');
    } else if (!stopFlag) {
        setStatus('No solution exists.', 'err');
    }
}

// Init
createGrid();