const grid = document.getElementById("grid");
const size = 15; // 15x15
let turn = 0; // 0 = blue, 1 = red

// Crée la grille
for (let i = 0; i < size * size; i++) {
  const cell = document.createElement("div");
  cell.classList.add("cell");
  cell.dataset.index = i;
  cell.addEventListener("click", handleClick);
  grid.appendChild(cell);
}

function handleClick(event) {
  const cell = event.target;
  if (cell.style.backgroundColor) return; // empêche recoloration

  cell.style.backgroundColor = turn === 0 ? "blue" : "red";
  turn = 1 - turn; // alterne le tour
}
