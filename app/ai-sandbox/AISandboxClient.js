'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import NavBar from '../../components/NavBar';

const GRID_WIDTH = 24;
const GRID_HEIGHT = 12;
const TILE_SIZE = 34;

const TILE_TYPES = {
  empty: 'empty',
  grass: 'grass',
  block: 'block',
  lava: 'lava',
  bounce: 'bounce',
  arrowShooter: 'arrowShooter',
  start: 'start',
  finish: 'finish',
};

const TILE_LABELS = [
  { type: TILE_TYPES.block, label: 'Block' },
  { type: TILE_TYPES.lava, label: 'Lava' },
  { type: TILE_TYPES.bounce, label: 'Bounce Pad' },
  { type: TILE_TYPES.arrowShooter, label: 'Arrow Shooter' },
  { type: TILE_TYPES.start, label: 'Start' },
  { type: TILE_TYPES.finish, label: 'Finish' },
  { type: TILE_TYPES.empty, label: 'Erase' },
];

const ACTIONS = [
  { left: false, right: false, jump: false },
  { left: true, right: false, jump: false },
  { left: false, right: true, jump: false },
  { left: false, right: false, jump: true },
  { left: true, right: false, jump: true },
  { left: false, right: true, jump: true },
];

const PHYSICS = {
  gravity: 1900,
  moveSpeed: 260,
  jumpVelocity: -660,
  bounceVelocity: -760,
  maxFallSpeed: 980,
};
const FIXED_FPS = 60;
const FIXED_DT = 1 / FIXED_FPS;
const ACTION_STEP_FRAMES = 7;
const HUMAN_SLOWDOWN = 1;
const HUMAN_STEP_SECONDS = FIXED_DT * HUMAN_SLOWDOWN;
const ARROW_SPEED = 130;
const ARROW_SPAWN_FRAMES = FIXED_FPS * 2;
const EXPLORATION_BONUS = 5;
const SHOOTER_DIRECTIONS = [
  { dx: -1, dy: 0 },
  { dx: 0, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 0, dy: 1 },
];

const getTilePreviewDataUrl = (type) => {
  const svgStart = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 22 22">';
  const svgEnd = '</svg>';
  switch (type) {
    case TILE_TYPES.block:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#7b4f2b"/><rect x="3" y="3" width="16" height="16" rx="3" fill="rgba(255,255,255,0.12)"/>${svgEnd}`;
    case TILE_TYPES.lava:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#ff5a36"/><rect x="3" y="3" width="16" height="16" rx="3" fill="#ffb347"/>${svgEnd}`;
    case TILE_TYPES.bounce:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#7c3aed"/><rect x="4" y="6" width="14" height="10" rx="3" fill="#a78bfa"/><rect x="6" y="10" width="10" height="4" rx="2" fill="#f5f3ff"/>${svgEnd}`;
    case TILE_TYPES.arrowShooter:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#1f2937"/><rect x="4" y="6" width="14" height="10" rx="3" fill="#94a3b8"/><polygon points="15,11 9,7 9,15" fill="#ef4444"/>${svgEnd}`;
    case TILE_TYPES.start:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#7ec8ff"/><rect x="5" y="5" width="12" height="12" rx="3" fill="#1b7fd1"/>${svgEnd}`;
    case TILE_TYPES.finish:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#ffdf6c"/><rect x="8" y="4" width="3" height="14" fill="#d48a00"/><polygon points="11,5 18,8 11,11" fill="#ff6d6d"/>${svgEnd}`;
    case TILE_TYPES.empty:
      return `${svgStart}<rect width="22" height="22" rx="4" fill="#e2e8f0"/><rect x="3" y="3" width="16" height="16" rx="3" fill="none" stroke="#94a3b8" stroke-width="1.2"/>${svgEnd}`;
    default:
      return `${svgStart}${svgEnd}`;
  }
};

const createDefaultGrid = () => {
  const grid = Array.from({ length: GRID_HEIGHT }, () =>
    Array.from({ length: GRID_WIDTH }, () => TILE_TYPES.empty)
  );
  const groundRow = GRID_HEIGHT - 1;
  for (let x = 0; x < GRID_WIDTH; x += 1) {
    grid[groundRow][x] = TILE_TYPES.grass;
  }
  grid[GRID_HEIGHT - 2][1] = TILE_TYPES.start;
  grid[GRID_HEIGHT - 2][GRID_WIDTH - 2] = TILE_TYPES.finish;
  return grid;
};

const cloneGrid = (grid) => grid.map((row) => row.slice());

const findTile = (grid, type) => {
  for (let y = 0; y < grid.length; y += 1) {
    for (let x = 0; x < grid[y].length; x += 1) {
      if (grid[y][x] === type) {
        return { x, y };
      }
    }
  }
  return null;
};

const isSolid = (tile) =>
  tile === TILE_TYPES.grass ||
  tile === TILE_TYPES.block ||
  tile === TILE_TYPES.bounce ||
  tile === TILE_TYPES.arrowShooter;

const isBlocking = (tile) =>
  tile === TILE_TYPES.grass ||
  tile === TILE_TYPES.block ||
  tile === TILE_TYPES.bounce ||
  tile === TILE_TYPES.arrowShooter;

const isHazard = (tile) => tile === TILE_TYPES.lava;

const isFinish = (tile) => tile === TILE_TYPES.finish;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

const worldToTile = (value) => Math.floor(value / TILE_SIZE);

const getTileAt = (grid, x, y) => {
  if (x < 0 || y < 0 || y >= GRID_HEIGHT || x >= GRID_WIDTH) {
    return TILE_TYPES.block;
  }
  return grid[y][x];
};

const getStartPosition = (grid) => {
  const startTile = findTile(grid, TILE_TYPES.start);
  if (!startTile) {
    return { x: TILE_SIZE, y: TILE_SIZE * (GRID_HEIGHT - 2) };
  }
  return {
    x: startTile.x * TILE_SIZE + TILE_SIZE / 2,
    y: startTile.y * TILE_SIZE + TILE_SIZE / 2,
  };
};

const getFinishPosition = (grid) => {
  const finishTile = findTile(grid, TILE_TYPES.finish);
  if (!finishTile) {
    return { x: TILE_SIZE * (GRID_WIDTH - 2), y: TILE_SIZE * (GRID_HEIGHT - 2) };
  }
  return {
    x: finishTile.x * TILE_SIZE + TILE_SIZE / 2,
    y: finishTile.y * TILE_SIZE + TILE_SIZE / 2,
  };
};

const createPlayerState = (grid) => {
  const startTile = findTile(grid, TILE_TYPES.start);
  const width = 20;
  const height = 28;
  const halfH = height / 2;
  const start = startTile
    ? {
        x: startTile.x * TILE_SIZE + TILE_SIZE / 2,
        y: (startTile.y + 1) * TILE_SIZE - halfH,
      }
    : getStartPosition(grid);
  const belowTile = startTile ? getTileAt(grid, startTile.x, startTile.y + 1) : null;
  return {
    x: start.x,
    y: start.y,
    vx: 0,
    vy: 0,
    width,
    height,
    onGround: belowTile ? isBlocking(belowTile) : false,
    reachedFinish: false,
    touchedLava: false,
  };
};

const settlePlayerOnGround = (grid, state) => {
  const next = { ...state };
  const halfH = next.height / 2;
  const halfW = next.width / 2;
  const tileX = worldToTile(next.x);
  let y = worldToTile(next.y);
  for (let yy = y; yy < GRID_HEIGHT; yy += 1) {
    const tile = getTileAt(grid, tileX, yy);
    if (isBlocking(tile)) {
      const tileTop = yy * TILE_SIZE;
      next.y = tileTop - halfH;
      next.vy = 0;
      next.onGround = true;
      return next;
    }
  }
  // If no ground found, clamp to bottom row.
  next.y = (GRID_HEIGHT - 1) * TILE_SIZE - halfH;
  next.vy = 0;
  next.onGround = true;
  return next;
};

const checkOverlap = (grid, box, testFn) => {
  const left = worldToTile(box.x - box.width / 2);
  const right = worldToTile(box.x + box.width / 2);
  const top = worldToTile(box.y - box.height / 2);
  const bottom = worldToTile(box.y + box.height / 2);
  for (let y = top; y <= bottom; y += 1) {
    for (let x = left; x <= right; x += 1) {
      const tile = getTileAt(grid, x, y);
      if (testFn(tile)) {
        return true;
      }
    }
  }
  return false;
};

const stepPhysics = (grid, state, action, dt) => {
  const next = { ...state };
  const accelX = action.left ? -PHYSICS.moveSpeed : action.right ? PHYSICS.moveSpeed : 0;
  next.vx = accelX;

  if (action.jump && next.onGround) {
    next.vy = PHYSICS.jumpVelocity;
    next.onGround = false;
  }

  next.vy = clamp(next.vy + PHYSICS.gravity * dt, -PHYSICS.maxFallSpeed, PHYSICS.maxFallSpeed);

  let nextX = next.x + next.vx * dt;
  let nextY = next.y + next.vy * dt;

  const halfW = next.width / 2;
  const halfH = next.height / 2;

  if (next.vx !== 0) {
    const direction = Math.sign(next.vx);
    const startEdgeX = state.x + direction * halfW;
    const edgeX = nextX + direction * halfW;
    const startTileX = worldToTile(startEdgeX);
    const top = worldToTile(nextY - halfH + 2);
    const bottom = worldToTile(nextY + halfH - 1);
    for (let y = top; y <= bottom; y += 1) {
      const tileX = worldToTile(edgeX);
      const tile = getTileAt(grid, tileX, y);
      if (tileX === startTileX) {
        continue;
      }
      const tileEdge = tileX * TILE_SIZE + (direction < 0 ? TILE_SIZE : 0);
      const crossed =
        direction > 0 ? startEdgeX < tileEdge && edgeX >= tileEdge : startEdgeX > tileEdge && edgeX <= tileEdge;
      if (!crossed) {
        continue;
      }
      if (isBlocking(tile)) {
        nextX = tileEdge - direction * halfW - 0.5;
        next.vx = 0;
        break;
      }
    }
  }

  next.onGround = false;
  if (next.vy >= 0) {
    const footY = nextY + halfH;
    const left = worldToTile(nextX - halfW + 2);
    const right = worldToTile(nextX + halfW - 2);
    const tileY = worldToTile(footY);
    for (let x = left; x <= right; x += 1) {
      const tile = getTileAt(grid, x, tileY);
      if (tile === TILE_TYPES.bounce) {
        const tileTop = tileY * TILE_SIZE;
        if (footY >= tileTop && state.y + halfH <= tileTop + 2) {
          nextY = tileTop - halfH;
          next.vy = PHYSICS.bounceVelocity;
          next.onGround = false;
        }
      } else if (isBlocking(tile)) {
        const tileTop = tileY * TILE_SIZE;
        if (footY >= tileTop && state.y + halfH <= tileTop + 2) {
          nextY = tileTop - halfH;
          next.vy = 0;
          next.onGround = true;
        }
      }
    }
  } else if (next.vy < 0) {
    const headY = nextY - halfH;
    const left = worldToTile(nextX - halfW + 2);
    const right = worldToTile(nextX + halfW - 2);
    const tileY = worldToTile(headY);
    for (let x = left; x <= right; x += 1) {
      const tile = getTileAt(grid, x, tileY);
      if (isBlocking(tile)) {
        const tileBottom = tileY * TILE_SIZE + TILE_SIZE;
        if (headY <= tileBottom) {
          nextY = tileBottom + halfH;
          next.vy = 0;
          break;
        }
      }
    }
  }

  const tryResolvePinch = () => {
    const box = {
      x: nextX,
      y: nextY,
      width: Math.max(2, next.width - 2),
      height: Math.max(2, next.height - 2),
    };
    if (!checkOverlap(grid, box, isSolid)) {
      return;
    }
    const dx = nextX - state.x;
    const dy = nextY - state.y;
    const push = 1;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const dir = dx === 0 ? 1 : Math.sign(dx);
      nextX -= dir * push;
    } else {
      const dir = dy === 0 ? 1 : Math.sign(dy);
      nextY -= dir * push;
    }
    const retryBox = {
      x: nextX,
      y: nextY,
      width: Math.max(2, next.width - 2),
      height: Math.max(2, next.height - 2),
    };
    if (checkOverlap(grid, retryBox, isSolid)) {
      nextX = state.x;
      nextY = state.y;
    }
  };

  tryResolvePinch();

  const resolveWallOverlap = () => {
    const box = {
      x: nextX,
      y: nextY,
      width: Math.max(2, next.width - 2),
      height: Math.max(2, next.height - 2),
    };
    if (!checkOverlap(grid, box, isBlocking)) {
      return;
    }
    const dx = nextX - state.x;
    const dir = dx === 0 ? (next.vx !== 0 ? Math.sign(next.vx) : 1) : Math.sign(dx);
    for (let i = 0; i < 6; i += 1) {
      nextX -= dir * 1;
      const retry = {
        x: nextX,
        y: nextY,
        width: Math.max(2, next.width - 2),
        height: Math.max(2, next.height - 2),
      };
      if (!checkOverlap(grid, retry, isBlocking)) {
        return;
      }
    }
    nextX = state.x;
  };

  resolveWallOverlap();

  next.x = nextX;
  next.y = nextY;

  const box = { x: next.x, y: next.y, width: next.width, height: next.height };
  next.touchedLava = checkOverlap(grid, box, isHazard);
  next.reachedFinish = checkOverlap(grid, box, isFinish);

  return next;
};

// Pathfinding to create intermediate checkpoints
const MAX_JUMP_HEIGHT = 3; // Maximum blocks we can jump
const PATHFINDING_GRID_SIZE = 2; // Use every 2 tiles for pathfinding (coarser grid)

const findPathWithCheckpoints = (grid) => {
  const startTile = findTile(grid, TILE_TYPES.start);
  const finishTile = findTile(grid, TILE_TYPES.finish);
  if (!startTile || !finishTile) return null;

  // Create a coarser grid for pathfinding
  const coarseWidth = Math.ceil(GRID_WIDTH / PATHFINDING_GRID_SIZE);
  const coarseHeight = Math.ceil(GRID_HEIGHT / PATHFINDING_GRID_SIZE);
  
  // Check if a tile is walkable (can stand on it or jump through it)
  const isWalkable = (cx, cy) => {
    const x = cx * PATHFINDING_GRID_SIZE;
    const y = cy * PATHFINDING_GRID_SIZE;
    if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return false;
    
    // Check if there's a solid block at this position or below
    for (let checkY = y; checkY < Math.min(y + MAX_JUMP_HEIGHT + 1, GRID_HEIGHT); checkY += 1) {
      const tile = getTileAt(grid, x, checkY);
      if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
        // Can stand on this
        return true;
      }
    }
    return false;
  };

  // A* pathfinding
  const startCoarse = {
    x: Math.floor(startTile.x / PATHFINDING_GRID_SIZE),
    y: Math.floor(startTile.y / PATHFINDING_GRID_SIZE),
  };
  const finishCoarse = {
    x: Math.floor(finishTile.x / PATHFINDING_GRID_SIZE),
    y: Math.floor(finishTile.y / PATHFINDING_GRID_SIZE),
  };

  const heuristic = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  const getNeighbors = (node) => {
    const neighbors = [];
    const directions = [
      { dx: 0, dy: -1 }, // Up (can jump)
      { dx: 0, dy: 1 },  // Down (can fall)
      { dx: -1, dy: 0 }, // Left
      { dx: 1, dy: 0 },  // Right
      { dx: -1, dy: -1 }, // Up-left
      { dx: 1, dy: -1 },  // Up-right
    ];
    
    for (const dir of directions) {
      const nx = node.x + dir.dx;
      const ny = node.y + dir.dy;
      if (nx >= 0 && nx < coarseWidth && ny >= 0 && ny < coarseHeight) {
        // Check if we can reach this position
        if (dir.dy < 0) {
          // Moving up - check if jump is possible
          const canJump = isWalkable(nx, ny) && 
            (node.y - ny <= MAX_JUMP_HEIGHT);
          if (canJump) neighbors.push({ x: nx, y: ny });
        } else if (dir.dy > 0) {
          // Moving down - can fall if there's ground below
          if (isWalkable(nx, ny)) neighbors.push({ x: nx, y: ny });
        } else {
          // Horizontal - check if walkable
          if (isWalkable(nx, ny)) neighbors.push({ x: nx, y: ny });
        }
      }
    }
    return neighbors;
  };

  const openSet = [startCoarse];
  const cameFrom = new Map();
  const gScore = new Map();
  const fScore = new Map();
  
  const key = (node) => `${node.x},${node.y}`;
  gScore.set(key(startCoarse), 0);
  fScore.set(key(startCoarse), heuristic(startCoarse, finishCoarse));

  while (openSet.length > 0) {
    // Find node with lowest fScore
    let current = openSet[0];
    let currentIndex = 0;
    for (let i = 1; i < openSet.length; i += 1) {
      if (fScore.get(key(openSet[i])) < fScore.get(key(current))) {
        current = openSet[i];
        currentIndex = i;
      }
    }

    if (current.x === finishCoarse.x && current.y === finishCoarse.y) {
      // Reconstruct path
      const path = [];
      let node = current;
      while (node) {
        path.unshift({
          x: node.x * PATHFINDING_GRID_SIZE + PATHFINDING_GRID_SIZE / 2,
          y: node.y * PATHFINDING_GRID_SIZE + PATHFINDING_GRID_SIZE / 2,
        });
        const fromKey = cameFrom.get(key(node));
        node = fromKey ? { x: parseInt(fromKey.split(',')[0]), y: parseInt(fromKey.split(',')[1]) } : null;
      }
      
      // Create checkpoints along the path (every 3-4 path nodes, or at significant turns)
      const checkpoints = [];
      for (let i = 3; i < path.length - 1; i += 3) {
        checkpoints.push({
          x: path[i].x * TILE_SIZE,
          y: path[i].y * TILE_SIZE,
        });
      }
      // Always include finish as final checkpoint
      checkpoints.push({
        x: finishTile.x * TILE_SIZE + TILE_SIZE / 2,
        y: finishTile.y * TILE_SIZE + TILE_SIZE / 2,
      });
      
      return checkpoints;
    }

    openSet.splice(currentIndex, 1);

    for (const neighbor of getNeighbors(current)) {
      const neighborKey = key(neighbor);
      const tentativeGScore = (gScore.get(key(current)) || Infinity) + 1;
      
      if (tentativeGScore < (gScore.get(neighborKey) || Infinity)) {
        cameFrom.set(neighborKey, key(current));
        gScore.set(neighborKey, tentativeGScore);
        fScore.set(neighborKey, tentativeGScore + heuristic(neighbor, finishCoarse));
        
        if (!openSet.some(n => key(n) === neighborKey)) {
          openSet.push(neighbor);
        }
      }
    }
  }

  return null; // No path found
};

// Neural Network for AI agent
// Inputs: player x, y, velocity x, y, distance to finish dx, dy, on ground, nearby obstacles (8 inputs)
// Outputs: left, right, jump (3 outputs)
const NN_INPUT_SIZE = 8;
const NN_HIDDEN_SIZE = 12;
const NN_OUTPUT_SIZE = 3;

const createNeuralNetwork = () => {
  // Weights: input->hidden, hidden->output, biases
  const weights1 = Array.from({ length: NN_HIDDEN_SIZE * NN_INPUT_SIZE }, () => (Math.random() * 2 - 1) * 0.5);
  const weights2 = Array.from({ length: NN_OUTPUT_SIZE * NN_HIDDEN_SIZE }, () => (Math.random() * 2 - 1) * 0.5);
  const bias1 = Array.from({ length: NN_HIDDEN_SIZE }, () => (Math.random() * 2 - 1) * 0.1);
  const bias2 = Array.from({ length: NN_OUTPUT_SIZE }, () => (Math.random() * 2 - 1) * 0.1);
  return { weights1, weights2, bias1, bias2 };
};

const getNNInputs = (state, grid, targetTile) => {
  const tileX = worldToTile(state.x);
  const tileY = worldToTile(state.y);
  // targetTile can be a checkpoint {x, y} in world coordinates or a finish tile {x, y} in tile coordinates
  const targetX = targetTile.x || GRID_WIDTH - 2;
  const targetY = targetTile.y || GRID_HEIGHT - 2;
  // If target is in world coordinates (checkpoint), convert to tile coordinates
  const targetTileX = targetTile.x > GRID_WIDTH ? worldToTile(targetTile.x) : targetX;
  const targetTileY = targetTile.y > GRID_HEIGHT ? worldToTile(targetTile.y) : targetY;
  
  // Normalize inputs to roughly [-1, 1] range
  const normalizedX = (state.x / (GRID_WIDTH * TILE_SIZE)) * 2 - 1;
  const normalizedY = (state.y / (GRID_HEIGHT * TILE_SIZE)) * 2 - 1;
  const normalizedVx = Math.max(-1, Math.min(1, state.vx / 500));
  const normalizedVy = Math.max(-1, Math.min(1, state.vy / 1000));
  const dx = (targetTileX - tileX) / GRID_WIDTH;
  const dy = (targetTileY - tileY) / GRID_HEIGHT;
  
  // Check nearby obstacles (left, right, below)
  const leftBlocked = isBlocking(getTileAt(grid, tileX - 1, tileY)) ? 1 : -1;
  const rightBlocked = isBlocking(getTileAt(grid, tileX + 1, tileY)) ? 1 : -1;
  const belowBlocked = isBlocking(getTileAt(grid, tileX, tileY + 1)) ? 1 : -1;
  
  return [
    normalizedX,
    normalizedY,
    normalizedVx,
    normalizedVy,
    dx,
    dy,
    state.onGround ? 1 : -1,
    (leftBlocked + rightBlocked + belowBlocked) / 3, // Average obstacle proximity
  ];
};

const sigmoid = (x) => 1 / (1 + Math.exp(-Math.max(-10, Math.min(10, x))));

const forwardPass = (nn, inputs) => {
  // Hidden layer
  const hidden = [];
  for (let i = 0; i < NN_HIDDEN_SIZE; i += 1) {
    let sum = nn.bias1[i];
    for (let j = 0; j < NN_INPUT_SIZE; j += 1) {
      sum += inputs[j] * nn.weights1[i * NN_INPUT_SIZE + j];
    }
    hidden.push(sigmoid(sum));
  }
  
  // Output layer
  const outputs = [];
  for (let i = 0; i < NN_OUTPUT_SIZE; i += 1) {
    let sum = nn.bias2[i];
    for (let j = 0; j < NN_HIDDEN_SIZE; j += 1) {
      sum += hidden[j] * nn.weights2[i * NN_HIDDEN_SIZE + j];
    }
    outputs.push(sigmoid(sum));
  }
  
  return outputs;
};

const nnToAction = (outputs) => {
  // Threshold at 0.5 for binary decisions
  return {
    left: outputs[0] > 0.5,
    right: outputs[1] > 0.5,
    jump: outputs[2] > 0.5,
  };
};

const mutateNN = (nn, mutationRate = 0.1) => {
  const newNN = {
    weights1: nn.weights1.slice(),
    weights2: nn.weights2.slice(),
    bias1: nn.bias1.slice(),
    bias2: nn.bias2.slice(),
  };
  
  for (let i = 0; i < newNN.weights1.length; i += 1) {
    if (Math.random() < mutationRate) {
      newNN.weights1[i] += (Math.random() * 2 - 1) * 0.3;
    }
  }
  for (let i = 0; i < newNN.weights2.length; i += 1) {
    if (Math.random() < mutationRate) {
      newNN.weights2[i] += (Math.random() * 2 - 1) * 0.3;
    }
  }
  for (let i = 0; i < newNN.bias1.length; i += 1) {
    if (Math.random() < mutationRate) {
      newNN.bias1[i] += (Math.random() * 2 - 1) * 0.2;
    }
  }
  for (let i = 0; i < newNN.bias2.length; i += 1) {
    if (Math.random() < mutationRate) {
      newNN.bias2[i] += (Math.random() * 2 - 1) * 0.2;
    }
  }
  
  return newNN;
};

const simulateNN = (grid, nn, shooterDirections = {}, horizonSeconds = 6, checkpoints = null) => {
  let state = createPlayerState(grid);
  const finishTile = findTile(grid, TILE_TYPES.finish) || { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 };
  let bestDistance = Infinity;
  let stepsToReach = null;
  let totalFrames = 0;
  let arrowHit = false;
  let explorationScore = 0;
  const visited = new Set();
  let frameCounter = 0;
  let projectiles = [];
  let currentCheckpointIndex = 0;
  let checkpointScore = 0;
  const shooters = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (grid[y][x] === TILE_TYPES.arrowShooter) {
        const key = `${x},${y}`;
        const dirIndex = shooterDirections[key] ?? 0;
        shooters.push({ x, y, dirIndex });
      }
    }
  }

  const maxFrames = Math.floor(horizonSeconds * FIXED_FPS);
  for (let frame = 0; frame < maxFrames; frame += 1) {
    totalFrames += 1;
    
    // Get NN inputs and compute action - use next checkpoint or finish as target
    const currentTarget = (checkpoints && checkpoints.length > 0 && currentCheckpointIndex < checkpoints.length)
      ? checkpoints[currentCheckpointIndex]
      : finishTile;
    const inputs = getNNInputs(state, grid, currentTarget);
    const outputs = forwardPass(nn, inputs);
    const action = nnToAction(outputs);
    
    // Spawn arrows BEFORE physics step
    if (frameCounter % ARROW_SPAWN_FRAMES === 0) {
      shooters.forEach((shooter) => {
        const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
        const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
        const offset = TILE_SIZE / 2 + 2;
        const isHorizontal = dir.dx !== 0;
        projectiles.push({
          x: centerX + dir.dx * offset,
          y: centerY + dir.dy * offset,
          vx: dir.dx * ARROW_SPEED,
          vy: dir.dy * ARROW_SPEED,
          w: isHorizontal ? 12 : 4,
          h: isHorizontal ? 4 : 12,
        });
      });
    }
    
    // Update existing projectiles BEFORE physics
    if (projectiles.length > 0) {
      const updated = [];
      for (let p = 0; p < projectiles.length; p += 1) {
        const arrow = projectiles[p];
        const nextArrow = {
          ...arrow,
          x: arrow.x + arrow.vx * FIXED_DT,
          y: arrow.y + arrow.vy * FIXED_DT,
        };
        const tileX = worldToTile(nextArrow.x);
        const tileY = worldToTile(nextArrow.y);
        const tile = getTileAt(grid, tileX, tileY);
        if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
          continue;
        }
        if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
          continue;
        }
        updated.push(nextArrow);
      }
      projectiles = updated;
    }
    
    // Check arrow collisions BEFORE physics step
    for (let p = 0; p < projectiles.length; p += 1) {
      const arrow = projectiles[p];
      const hit =
        Math.abs(arrow.x - state.x) < (arrow.w + state.width) / 2 &&
        Math.abs(arrow.y - state.y) < (arrow.h + state.height) / 2;
      if (hit) {
        arrowHit = true;
        break;
      }
    }
    
    // Step physics
    state = stepPhysics(grid, state, action, FIXED_DT);
    frameCounter += 1;
    
    const tileX = worldToTile(state.x);
    const tileY = worldToTile(state.y);
    const key = `${tileX},${tileY}`;
    if (!visited.has(key)) {
      visited.add(key);
      explorationScore += EXPLORATION_BONUS;
    }
    
    // Check checkpoint progress
    if (checkpoints && checkpoints.length > 0 && currentCheckpointIndex < checkpoints.length) {
      const checkpoint = checkpoints[currentCheckpointIndex];
      const checkpointTileX = worldToTile(checkpoint.x);
      const checkpointTileY = worldToTile(checkpoint.y);
      const distToCheckpoint = Math.abs(tileX - checkpointTileX) + Math.abs(tileY - checkpointTileY);
      
      // If reached checkpoint (within 1 tile)
      if (distToCheckpoint <= 1) {
        checkpointScore += 50 * (currentCheckpointIndex + 1); // Bonus for each checkpoint
        currentCheckpointIndex += 1;
      }
      
      // Use distance to next checkpoint or finish
      const targetTile = currentCheckpointIndex < checkpoints.length 
        ? { x: worldToTile(checkpoints[currentCheckpointIndex].x), y: worldToTile(checkpoints[currentCheckpointIndex].y) }
        : finishTile;
      const distance = Math.abs(tileX - targetTile.x) + Math.abs(tileY - targetTile.y);
      bestDistance = Math.min(bestDistance, distance);
    } else {
      // No checkpoints, use finish distance
      const distance = Math.abs(tileX - finishTile.x) + Math.abs(tileY - finishTile.y);
      bestDistance = Math.min(bestDistance, distance);
    }
    
    if (state.reachedFinish && stepsToReach === null) {
      stepsToReach = totalFrames;
      break;
    }
    if (state.touchedLava || arrowHit) {
      break;
    }
  }

  const fitness = -bestDistance + explorationScore + checkpointScore;
  return {
    fitness,
    bestDistance,
    reached: stepsToReach !== null,
    stepsToReach,
  };
};

const simulateNNReachOnly = (grid, nn, shooterDirections = {}, horizonSeconds = 6, checkpoints = null) => {
  let state = createPlayerState(grid);
  const finishTile = findTile(grid, TILE_TYPES.finish) || { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 };
  let frameCounter = 0;
  let projectiles = [];
  const shooters = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (grid[y][x] === TILE_TYPES.arrowShooter) {
        const key = `${x},${y}`;
        const dirIndex = shooterDirections[key] ?? 0;
        shooters.push({ x, y, dirIndex });
      }
    }
  }
  
  const maxFrames = Math.floor(horizonSeconds * FIXED_FPS);
  for (let frame = 0; frame < maxFrames; frame += 1) {
    // Get NN inputs and compute action
    const inputs = getNNInputs(state, grid, finishTile);
    const outputs = forwardPass(nn, inputs);
    const action = nnToAction(outputs);
    
    // Spawn arrows BEFORE physics step
    if (frameCounter % ARROW_SPAWN_FRAMES === 0) {
      shooters.forEach((shooter) => {
        const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
        const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
        const offset = TILE_SIZE / 2 + 2;
        const isHorizontal = dir.dx !== 0;
        projectiles.push({
          x: centerX + dir.dx * offset,
          y: centerY + dir.dy * offset,
          vx: dir.dx * ARROW_SPEED,
          vy: dir.dy * ARROW_SPEED,
          w: isHorizontal ? 12 : 4,
          h: isHorizontal ? 4 : 12,
        });
      });
    }
    
    // Update existing projectiles BEFORE physics
    if (projectiles.length > 0) {
      const updated = [];
      for (let p = 0; p < projectiles.length; p += 1) {
        const arrow = projectiles[p];
        const nextArrow = {
          ...arrow,
          x: arrow.x + arrow.vx * FIXED_DT,
          y: arrow.y + arrow.vy * FIXED_DT,
        };
        const tileX = worldToTile(nextArrow.x);
        const tileY = worldToTile(nextArrow.y);
        const tile = getTileAt(grid, tileX, tileY);
        if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
          continue;
        }
        if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
          continue;
        }
        updated.push(nextArrow);
      }
      projectiles = updated;
    }
    
    // Check arrow collisions BEFORE physics step
    for (let p = 0; p < projectiles.length; p += 1) {
      const arrow = projectiles[p];
      const hit =
        Math.abs(arrow.x - state.x) < (arrow.w + state.width) / 2 &&
        Math.abs(arrow.y - state.y) < (arrow.h + state.height) / 2;
      if (hit) {
        return false;
      }
    }
    
    // Step physics
    state = stepPhysics(grid, state, action, FIXED_DT);
    frameCounter += 1;
    
    if (state.reachedFinish) {
      return true;
    }
    if (state.touchedLava) {
      return false;
    }
  }
  return false;
};

const simulateGenome = (grid, genome, shooterDirections = {}, horizonSeconds = 6, checkpoints = null) => {
  let state = createPlayerState(grid);
  const finishTile = findTile(grid, TILE_TYPES.finish) || { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 };
  let bestDistance = Infinity;
  let stepsToReach = null;
  let totalFrames = 0;
  let arrowHit = false;
  let explorationScore = 0;
  const visited = new Set();
  let frameCounter = 0;
  let projectiles = [];
  let currentCheckpointIndex = 0;
  let checkpointScore = 0;
  const shooters = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (grid[y][x] === TILE_TYPES.arrowShooter) {
        const key = `${x},${y}`;
        const dirIndex = shooterDirections[key] ?? 0;
        shooters.push({ x, y, dirIndex });
      }
    }
  }

  const maxActions = Math.min(
    genome.length,
    Math.floor((horizonSeconds * FIXED_FPS) / ACTION_STEP_FRAMES)
  );
  for (let i = 0; i < maxActions; i += 1) {
    const action = ACTIONS[genome[i]];
    const framesThisAction = ACTION_STEP_FRAMES;
    for (let f = 0; f < framesThisAction; f += 1) {
      totalFrames += 1;
      // Spawn arrows BEFORE physics step (matches render loop)
      if (frameCounter % ARROW_SPAWN_FRAMES === 0) {
        shooters.forEach((shooter) => {
          const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
          const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
          const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
          const offset = TILE_SIZE / 2 + 2;
          const isHorizontal = dir.dx !== 0;
          projectiles.push({
            x: centerX + dir.dx * offset,
            y: centerY + dir.dy * offset,
            vx: dir.dx * ARROW_SPEED,
            vy: dir.dy * ARROW_SPEED,
            w: isHorizontal ? 12 : 4,
            h: isHorizontal ? 4 : 12,
          });
        });
      }
      // Update existing projectiles BEFORE physics
      if (projectiles.length > 0) {
        const updated = [];
        for (let p = 0; p < projectiles.length; p += 1) {
          const arrow = projectiles[p];
          const nextArrow = {
            ...arrow,
            x: arrow.x + arrow.vx * FIXED_DT,
            y: arrow.y + arrow.vy * FIXED_DT,
          };
          const tileX = worldToTile(nextArrow.x);
          const tileY = worldToTile(nextArrow.y);
          const tile = getTileAt(grid, tileX, tileY);
          if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
            continue;
          }
          if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
            continue;
          }
          updated.push(nextArrow);
        }
        projectiles = updated;
      }
      // Check arrow collisions BEFORE physics step
      for (let p = 0; p < projectiles.length; p += 1) {
        const arrow = projectiles[p];
        const hit =
          Math.abs(arrow.x - state.x) < (arrow.w + state.width) / 2 &&
          Math.abs(arrow.y - state.y) < (arrow.h + state.height) / 2;
        if (hit) {
          arrowHit = true;
          break;
        }
      }
      // Now step physics
      state = stepPhysics(grid, state, action, FIXED_DT);
      frameCounter += 1;
      const tileX = worldToTile(state.x);
      const tileY = worldToTile(state.y);
      const key = `${tileX},${tileY}`;
      if (!visited.has(key)) {
        visited.add(key);
        explorationScore += EXPLORATION_BONUS;
      }
      
      // Check checkpoint progress
      if (checkpoints && checkpoints.length > 0 && currentCheckpointIndex < checkpoints.length) {
        const checkpoint = checkpoints[currentCheckpointIndex];
        const checkpointTileX = worldToTile(checkpoint.x);
        const checkpointTileY = worldToTile(checkpoint.y);
        const distToCheckpoint = Math.abs(tileX - checkpointTileX) + Math.abs(tileY - checkpointTileY);
        
        // If reached checkpoint (within 1 tile)
        if (distToCheckpoint <= 1) {
          checkpointScore += 50 * (currentCheckpointIndex + 1); // Bonus for each checkpoint
          currentCheckpointIndex += 1;
        }
        
        // Use distance to next checkpoint or finish
        const targetTile = currentCheckpointIndex < checkpoints.length 
          ? { x: worldToTile(checkpoints[currentCheckpointIndex].x), y: worldToTile(checkpoints[currentCheckpointIndex].y) }
          : finishTile;
        const distance = Math.abs(tileX - targetTile.x) + Math.abs(tileY - targetTile.y);
        bestDistance = Math.min(bestDistance, distance);
      } else {
        // No checkpoints, use finish distance
        const distance = Math.abs(tileX - finishTile.x) + Math.abs(tileY - finishTile.y);
        bestDistance = Math.min(bestDistance, distance);
      }
      if (state.reachedFinish && stepsToReach === null) {
        stepsToReach = totalFrames;
        break;
      }
      if (state.touchedLava || arrowHit) {
        break;
      }
    }
    if (stepsToReach !== null || state.touchedLava || arrowHit) {
      break;
    }
  }

  const reached = stepsToReach !== null;
  const fitness = -bestDistance + explorationScore + checkpointScore;
  return { fitness, bestDistance, reached };
};

const simulateReachOnly = (grid, genome, shooterDirections = {}, horizonSeconds = 6, checkpoints = null) => {
  let state = createPlayerState(grid);
  let frameCounter = 0;
  let projectiles = [];
  const shooters = [];
  for (let y = 0; y < GRID_HEIGHT; y += 1) {
    for (let x = 0; x < GRID_WIDTH; x += 1) {
      if (grid[y][x] === TILE_TYPES.arrowShooter) {
        const key = `${x},${y}`;
        const dirIndex = shooterDirections[key] ?? 0;
        shooters.push({ x, y, dirIndex });
      }
    }
  }
  const maxActions = Math.min(
    genome.length,
    Math.floor((horizonSeconds * FIXED_FPS) / ACTION_STEP_FRAMES)
  );
  for (let i = 0; i < maxActions; i += 1) {
    const action = ACTIONS[genome[i]];
    const framesThisAction = ACTION_STEP_FRAMES;
    for (let f = 0; f < framesThisAction; f += 1) {
      // Spawn arrows BEFORE physics step (matches render loop and simulateGenome)
      if (frameCounter % ARROW_SPAWN_FRAMES === 0) {
        shooters.forEach((shooter) => {
          const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
          const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
          const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
          const offset = TILE_SIZE / 2 + 2;
          const isHorizontal = dir.dx !== 0;
          projectiles.push({
            x: centerX + dir.dx * offset,
            y: centerY + dir.dy * offset,
            vx: dir.dx * ARROW_SPEED,
            vy: dir.dy * ARROW_SPEED,
            w: isHorizontal ? 12 : 4,
            h: isHorizontal ? 4 : 12,
          });
        });
      }
      // Update existing projectiles BEFORE physics
      if (projectiles.length > 0) {
        const updated = [];
        for (let p = 0; p < projectiles.length; p += 1) {
          const arrow = projectiles[p];
          const nextArrow = {
            ...arrow,
            x: arrow.x + arrow.vx * FIXED_DT,
            y: arrow.y + arrow.vy * FIXED_DT,
          };
          const tileX = worldToTile(nextArrow.x);
          const tileY = worldToTile(nextArrow.y);
          const tile = getTileAt(grid, tileX, tileY);
          if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
            continue;
          }
          if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
            continue;
          }
          updated.push(nextArrow);
        }
        projectiles = updated;
      }
      // Check arrow collisions BEFORE physics step
      for (let p = 0; p < projectiles.length; p += 1) {
        const arrow = projectiles[p];
        const hit =
          Math.abs(arrow.x - state.x) < (arrow.w + state.width) / 2 &&
          Math.abs(arrow.y - state.y) < (arrow.h + state.height) / 2;
        if (hit) {
          return false;
        }
      }
      // Now step physics
      state = stepPhysics(grid, state, action, FIXED_DT);
      frameCounter += 1;
      if (state.reachedFinish) {
        return true;
      }
      if (state.touchedLava) {
        return false;
      }
    }
  }
  return false;
};

export default function AISandboxClient({ repos }) {
  const [grid, setGrid] = useState(createDefaultGrid);
  const [selectedTile, setSelectedTile] = useState(TILE_TYPES.block);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  const [watchBest, setWatchBest] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [playWarning, setPlayWarning] = useState('');
  const [successBanner, setSuccessBanner] = useState(false);
  const [failureBanner, setFailureBanner] = useState('');
  const [shooterDirections, setShooterDirections] = useState({});
  const [isMobile, setIsMobile] = useState(false);
  const [generationStats, setGenerationStats] = useState({
    generation: 0,
    bestFitness: 0,
    bestDistance: 0,
    reached: false,
    exposedSteps: 5,
    attempts: 0,
  });
  const [bestGenome, setBestGenome] = useState(null);
  const [algorithm, setAlgorithm] = useState('neuralNetwork'); // 'genetic' or 'neuralNetwork'
  const [settings, setSettings] = useState({
    population: 60,
    horizon: 160,
    mutation: 0.08,
    elite: 6,
  });

  const canvasRef = useRef(null);
  const confettiRef = useRef(null);
  const gridRef = useRef(grid);
  const playerRef = useRef(createPlayerState(grid));
  const inputRef = useRef({ left: false, right: false, jumpQueued: false });
  const isPlayingRef = useRef(false);
  const projectilesRef = useRef([]);
  const frameCounterRef = useRef(0);
  const shooterDirectionsRef = useRef(shooterDirections);
  const humanAccumulatorRef = useRef(0);
  const lastFrameTimeRef = useRef(null);
  const trainingRef = useRef({
    running: false,
    generation: 0,
    population: [],
    attempts: 0,
  });
  const watchRef = useRef({
    index: 0,
    elapsed: 0,
  });
  const isMouseDownRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const update = () => setIsDark(media.matches);
    update();
    if (media.addEventListener) {
      media.addEventListener('change', update);
      return () => media.removeEventListener('change', update);
    }
    media.addListener(update);
    return () => media.removeListener(update);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    gridRef.current = grid;
  }, [grid]);

  useEffect(() => {
    shooterDirectionsRef.current = shooterDirections;
  }, [shooterDirections]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    playerRef.current = createPlayerState(gridRef.current);
  }, [grid]);

  // Set default population to 100 for Neural Network
  const prevAlgorithmRef = useRef(algorithm);
  useEffect(() => {
    if (algorithm === 'neuralNetwork' && prevAlgorithmRef.current !== 'neuralNetwork') {
      setSettings((prev) => ({ ...prev, population: prev.population < 100 ? 100 : prev.population }));
    }
    prevAlgorithmRef.current = algorithm;
  }, [algorithm]);

  const resetPlayer = useCallback(() => {
    playerRef.current = createPlayerState(gridRef.current);
  }, []);

  const resetProjectiles = useCallback(() => {
    projectilesRef.current = [];
    frameCounterRef.current = 0;
  }, []);

  const handlePlay = useCallback(() => {
    const start = findTile(gridRef.current, TILE_TYPES.start);
    const finish = findTile(gridRef.current, TILE_TYPES.finish);
    if (!start || !finish) {
      const missing = [];
      if (!start) missing.push('start');
      if (!finish) missing.push('finish');
      setPlayWarning(`Add a ${missing.join(' and ')} tile before playing.`);
      return;
    }
    setPlayWarning('');
    setSuccessBanner(false);
    setShowConfetti(false);
    if (document?.activeElement && typeof document.activeElement.blur === 'function') {
      document.activeElement.blur();
    }
    humanAccumulatorRef.current = 0;
    lastFrameTimeRef.current = null;
    resetProjectiles();
    resetPlayer();
    setWatchBest(false);
    setIsPlaying(true);
  }, [resetPlayer, resetProjectiles]);

  const handleStop = useCallback(() => {
    setIsPlaying(false);
    setWatchBest(false);
    setShowConfetti(false);
    resetProjectiles();
    resetPlayer();
  }, [resetPlayer, resetProjectiles]);

  const startBestReplay = useCallback(
    (genome) => {
      if (!genome) return;
      resetPlayer();
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpQueued = false;
      setIsPlaying(false);
      resetProjectiles(); // This resets frameCounterRef.current to 0
      lastFrameTimeRef.current = null;
      humanAccumulatorRef.current = 0;
      // Clear watchRef - we now use frameCounterRef directly for action timing
      watchRef.current.index = 0;
      watchRef.current.elapsed = 0;
      watchRef.current.frames = 0;
      setBestGenome(genome.slice());
      setWatchBest(true);
    },
    [resetPlayer, resetProjectiles]
  );

  const startBestReplayNN = useCallback(
    (nn) => {
      if (!nn) return;
      resetPlayer();
      inputRef.current.left = false;
      inputRef.current.right = false;
      inputRef.current.jumpQueued = false;
      setIsPlaying(false);
      resetProjectiles(); // This resets frameCounterRef.current to 0
      lastFrameTimeRef.current = null;
      humanAccumulatorRef.current = 0;
      watchRef.current.index = 0;
      watchRef.current.elapsed = 0;
      watchRef.current.frames = 0;
      setBestGenome(nn); // Store NN object
      setWatchBest(true);
    },
    [resetPlayer, resetProjectiles]
  );

  const triggerConfetti = useCallback(() => {
    setShowConfetti(true);
    setSuccessBanner(true);
    window.setTimeout(() => setShowConfetti(false), 8000); // Stay much longer
    window.setTimeout(() => setSuccessBanner(false), 5000);
  }, []);

  const handlePointerEvent = useCallback(
    (event) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = Math.floor(((event.clientX - rect.left) * scaleX) / TILE_SIZE);
      const y = Math.floor(((event.clientY - rect.top) * scaleY) / TILE_SIZE);
      if (x < 0 || x >= GRID_WIDTH || y < 0 || y >= GRID_HEIGHT) return;

      setGrid((prev) => {
        const next = cloneGrid(prev);
        const currentTile = next[y][x];
        const key = `${x},${y}`;
        if (currentTile === TILE_TYPES.arrowShooter && selectedTile !== TILE_TYPES.empty) {
          setShooterDirections((prevDirs) => {
            const currentDir = prevDirs[key] ?? 0;
            return { ...prevDirs, [key]: (currentDir + 1) % SHOOTER_DIRECTIONS.length };
          });
          return next;
        }
        if (selectedTile === TILE_TYPES.start || selectedTile === TILE_TYPES.finish) {
          for (let yy = 0; yy < GRID_HEIGHT; yy += 1) {
            for (let xx = 0; xx < GRID_WIDTH; xx += 1) {
              if (next[yy][xx] === selectedTile) {
                next[yy][xx] = TILE_TYPES.empty;
              }
            }
          }
        }
        if (currentTile === TILE_TYPES.arrowShooter && selectedTile !== TILE_TYPES.arrowShooter) {
          setShooterDirections((prevDirs) => {
            const updated = { ...prevDirs };
            delete updated[key];
            return updated;
          });
        }
        next[y][x] = selectedTile === TILE_TYPES.empty ? TILE_TYPES.empty : selectedTile;
        if (selectedTile === TILE_TYPES.arrowShooter) {
          setShooterDirections((prevDirs) => ({ ...prevDirs, [key]: 0 }));
        }
        return next;
      });
    },
    [selectedTile]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const isMovementKey =
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight' ||
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'KeyA' ||
        event.code === 'KeyD' ||
        event.code === 'KeyW' ||
        event.code === 'KeyS' ||
        event.code === 'Space';
      if (isMovementKey && !isPlayingRef.current) {
        trainingRef.current.running = false;
        setIsTraining(false);
        handlePlay();
      }
      if (
        event.code === 'Space' ||
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight'
      ) {
        event.preventDefault();
      }
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        inputRef.current.left = true;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        inputRef.current.right = true;
      }
      if (event.code === 'Space' || event.code === 'ArrowUp' || event.code === 'KeyW') {
        inputRef.current.jumpQueued = true;
      }
    };
    const handleKeyUp = (event) => {
      if (
        event.code === 'Space' ||
        event.code === 'ArrowUp' ||
        event.code === 'ArrowDown' ||
        event.code === 'ArrowLeft' ||
        event.code === 'ArrowRight'
      ) {
        event.preventDefault();
      }
      if (event.code === 'ArrowLeft' || event.code === 'KeyA') {
        inputRef.current.left = false;
      }
      if (event.code === 'ArrowRight' || event.code === 'KeyD') {
        inputRef.current.right = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handlePlay]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    let animationFrame;

    const render = (time) => {
      if (lastFrameTimeRef.current === null) {
        lastFrameTimeRef.current = time;
      }
      const frameDt = Math.min((time - lastFrameTimeRef.current) / 1000, 0.05);
      lastFrameTimeRef.current = time;
      humanAccumulatorRef.current += frameDt;
      const gridData = gridRef.current;
      let player = playerRef.current;

      if (isPlaying || watchBest) {
        const shooters = [];
        for (let y = 0; y < GRID_HEIGHT; y += 1) {
          for (let x = 0; x < GRID_WIDTH; x += 1) {
            if (gridData[y][x] === TILE_TYPES.arrowShooter) {
              const key = `${x},${y}`;
              const dirIndex = shooterDirectionsRef.current[key] ?? 0;
              shooters.push({ x, y, dirIndex });
            }
          }
        }
        const updatedProjectiles = [...projectilesRef.current];
        
        if (isPlaying) {
          while (humanAccumulatorRef.current >= HUMAN_STEP_SECONDS) {
            // Spawn arrows BEFORE physics step (matches training)
            if (frameCounterRef.current % ARROW_SPAWN_FRAMES === 0) {
              shooters.forEach((shooter) => {
                const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
                const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
                const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
                const offset = TILE_SIZE / 2 + 2;
                const isHorizontal = dir.dx !== 0;
                updatedProjectiles.push({
                  x: centerX + dir.dx * offset,
                  y: centerY + dir.dy * offset,
                  vx: dir.dx * ARROW_SPEED,
                  vy: dir.dy * ARROW_SPEED,
                  w: isHorizontal ? 12 : 4,
                  h: isHorizontal ? 4 : 12,
                });
              });
            }
            // Update existing projectiles BEFORE physics
            for (let p = updatedProjectiles.length - 1; p >= 0; p -= 1) {
              const arrow = updatedProjectiles[p];
              const nextArrow = {
                ...arrow,
                x: arrow.x + arrow.vx * FIXED_DT,
                y: arrow.y + arrow.vy * FIXED_DT,
              };
              const tileX = worldToTile(nextArrow.x);
              const tileY = worldToTile(nextArrow.y);
              const tile = getTileAt(gridData, tileX, tileY);
              if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
                updatedProjectiles.splice(p, 1);
                continue;
              }
              if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
                updatedProjectiles.splice(p, 1);
                continue;
              }
              updatedProjectiles[p] = nextArrow;
            }
            // Check arrow collisions BEFORE physics step
            for (let p = updatedProjectiles.length - 1; p >= 0; p -= 1) {
              const arrow = updatedProjectiles[p];
              const hit =
                Math.abs(arrow.x - player.x) < (arrow.w + player.width) / 2 &&
                Math.abs(arrow.y - player.y) < (arrow.h + player.height) / 2;
              if (hit) {
                setIsPlaying(false);
                setWatchBest(false);
                resetProjectiles();
                player = createPlayerState(gridData);
                updatedProjectiles.length = 0;
                break;
              }
            }
            const action = {
              left: inputRef.current.left,
              right: inputRef.current.right,
              jump: inputRef.current.jumpQueued,
            };
            inputRef.current.jumpQueued = false;
            player = stepPhysics(gridData, player, action, FIXED_DT);
            frameCounterRef.current += 1;
            if (player.touchedLava) {
              resetProjectiles(); // Clear all arrows and reset timer
              updatedProjectiles.length = 0; // Clear arrows from current frame
              player = createPlayerState(gridData);
            }
            if (player.reachedFinish) {
              setIsPlaying(false);
            }
            humanAccumulatorRef.current -= HUMAN_STEP_SECONDS;
          }
        } else if (watchBest && bestGenome) {
          while (humanAccumulatorRef.current >= HUMAN_STEP_SECONDS) {
            // Spawn arrows BEFORE physics step (matches training)
            if (frameCounterRef.current % ARROW_SPAWN_FRAMES === 0) {
              shooters.forEach((shooter) => {
                const dir = SHOOTER_DIRECTIONS[shooter.dirIndex] || SHOOTER_DIRECTIONS[0];
                const centerX = shooter.x * TILE_SIZE + TILE_SIZE / 2;
                const centerY = shooter.y * TILE_SIZE + TILE_SIZE / 2;
                const offset = TILE_SIZE / 2 + 2;
                const isHorizontal = dir.dx !== 0;
                updatedProjectiles.push({
                  x: centerX + dir.dx * offset,
                  y: centerY + dir.dy * offset,
                  vx: dir.dx * ARROW_SPEED,
                  vy: dir.dy * ARROW_SPEED,
                  w: isHorizontal ? 12 : 4,
                  h: isHorizontal ? 4 : 12,
                });
              });
            }
            // Update existing projectiles BEFORE physics
            for (let p = updatedProjectiles.length - 1; p >= 0; p -= 1) {
              const arrow = updatedProjectiles[p];
              const nextArrow = {
                ...arrow,
                x: arrow.x + arrow.vx * FIXED_DT,
                y: arrow.y + arrow.vy * FIXED_DT,
              };
              const tileX = worldToTile(nextArrow.x);
              const tileY = worldToTile(nextArrow.y);
              const tile = getTileAt(gridData, tileX, tileY);
              if (isBlocking(tile) && tile !== TILE_TYPES.arrowShooter) {
                updatedProjectiles.splice(p, 1);
                continue;
              }
              if (nextArrow.x < -20 || nextArrow.x > GRID_WIDTH * TILE_SIZE + 20) {
                updatedProjectiles.splice(p, 1);
                continue;
              }
              updatedProjectiles[p] = nextArrow;
            }
            // Check arrow collisions BEFORE physics step
            for (let p = updatedProjectiles.length - 1; p >= 0; p -= 1) {
              const arrow = updatedProjectiles[p];
              const hit =
                Math.abs(arrow.x - player.x) < (arrow.w + player.width) / 2 &&
                Math.abs(arrow.y - player.y) < (arrow.h + player.height) / 2;
              if (hit) {
                setIsPlaying(false);
                setWatchBest(false);
                resetProjectiles();
                player = createPlayerState(gridData);
                updatedProjectiles.length = 0;
                break;
              }
            }
            // Check if bestGenome is a neural network or action sequence
            let action;
            if (Array.isArray(bestGenome)) {
              // Action sequence (genetic algorithm)
              const actionIndex = Math.floor(frameCounterRef.current / ACTION_STEP_FRAMES);
              const index = Math.min(actionIndex, bestGenome.length - 1);
              action = ACTIONS[bestGenome[index]];
              if (player.touchedLava || player.reachedFinish || actionIndex >= bestGenome.length - 1) {
                if (player.touchedLava) {
                  resetProjectiles(); // Clear all arrows and reset timer
                  updatedProjectiles.length = 0;
                }
                setWatchBest(false);
                break;
              }
            } else {
              // Neural network
              const finishTile = findTile(gridData, TILE_TYPES.finish) || { x: GRID_WIDTH - 2, y: GRID_HEIGHT - 2 };
              const inputs = getNNInputs(player, gridData, finishTile);
              const outputs = forwardPass(bestGenome, inputs);
              action = nnToAction(outputs);
              if (player.touchedLava || player.reachedFinish) {
                if (player.touchedLava) {
                  resetProjectiles(); // Clear all arrows and reset timer
                  updatedProjectiles.length = 0;
                }
                setWatchBest(false);
                break;
              }
            }
            player = stepPhysics(gridData, player, action, FIXED_DT);
            frameCounterRef.current += 1;
            // Reset environment if player dies
            if (player.touchedLava) {
              resetProjectiles(); // Clear all arrows and reset timer
              updatedProjectiles.length = 0; // Clear arrows from current frame
              player = createPlayerState(gridData);
              setWatchBest(false); // Stop replay on death
              break;
            }
            humanAccumulatorRef.current -= HUMAN_STEP_SECONDS;
          }
        }
        projectilesRef.current = updatedProjectiles;
      }
      playerRef.current = player;

      const width = GRID_WIDTH * TILE_SIZE;
      const height = GRID_HEIGHT * TILE_SIZE;
      context.clearRect(0, 0, width, height);

      const skyGradient = context.createLinearGradient(0, 0, 0, height);
      skyGradient.addColorStop(0, '#b6e3ff');
      skyGradient.addColorStop(1, '#e6f7ff');
      context.fillStyle = skyGradient;
      context.fillRect(0, 0, width, height);

      for (let y = 0; y < GRID_HEIGHT; y += 1) {
        for (let x = 0; x < GRID_WIDTH; x += 1) {
          const tile = gridData[y][x];
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;
          if (tile === TILE_TYPES.grass) {
            context.fillStyle = '#4caf50';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#3b8d40';
            context.fillRect(px, py, TILE_SIZE, 6);
          } else if (tile === TILE_TYPES.block) {
            context.fillStyle = '#7b4f2b';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = 'rgba(255,255,255,0.12)';
            context.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          } else if (tile === TILE_TYPES.lava) {
            context.fillStyle = '#ff5a36';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#ffb347';
            context.fillRect(px + 3, py + 3, TILE_SIZE - 6, TILE_SIZE - 6);
          } else if (tile === TILE_TYPES.bounce) {
            context.fillStyle = '#7c3aed';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#a78bfa';
            context.fillRect(px + 4, py + 6, TILE_SIZE - 8, TILE_SIZE - 12);
            context.fillStyle = '#f5f3ff';
            context.fillRect(px + 6, py + 10, TILE_SIZE - 12, 6);
          } else if (tile === TILE_TYPES.arrowShooter) {
            context.fillStyle = '#1f2937';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#94a3b8';
            context.fillRect(px + 4, py + 6, TILE_SIZE - 8, TILE_SIZE - 12);
            const dirIndex = shooterDirectionsRef.current[`${x},${y}`] ?? 0;
            const dir = SHOOTER_DIRECTIONS[dirIndex] || SHOOTER_DIRECTIONS[0];
            const cx = px + TILE_SIZE / 2;
            const cy = py + TILE_SIZE / 2;
            context.fillStyle = '#ef4444';
            context.beginPath();
            context.moveTo(cx + dir.dx * 10, cy + dir.dy * 10);
            context.lineTo(cx + dir.dy * -6, cy + dir.dx * 6);
            context.lineTo(cx + dir.dy * 6, cy + dir.dx * -6);
            context.closePath();
            context.fill();
          } else if (tile === TILE_TYPES.start) {
            context.fillStyle = '#7ec8ff';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#1b7fd1';
            context.fillRect(px + 8, py + 8, TILE_SIZE - 16, TILE_SIZE - 16);
          } else if (tile === TILE_TYPES.finish) {
            context.fillStyle = '#ffdf6c';
            context.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            context.fillStyle = '#d48a00';
            context.fillRect(px + 8, py + 6, 8, TILE_SIZE - 12);
            context.fillStyle = '#ff6d6d';
            context.beginPath();
            context.moveTo(px + 16, py + 6);
            context.lineTo(px + TILE_SIZE - 6, py + 12);
            context.lineTo(px + 16, py + 18);
            context.closePath();
            context.fill();
          }
        }
      }

      context.strokeStyle = 'rgba(0,0,0,0.08)';
      for (let x = 0; x <= GRID_WIDTH; x += 1) {
        context.beginPath();
        context.moveTo(x * TILE_SIZE, 0);
        context.lineTo(x * TILE_SIZE, height);
        context.stroke();
      }
      for (let y = 0; y <= GRID_HEIGHT; y += 1) {
        context.beginPath();
        context.moveTo(0, y * TILE_SIZE);
        context.lineTo(width, y * TILE_SIZE);
        context.stroke();
      }

      const agent = playerRef.current;
      context.fillStyle = '#1f2a44';
      context.beginPath();
      context.arc(agent.x, agent.y, agent.width / 1.6, 0, Math.PI * 2);
      context.fill();
      context.fillStyle = '#7ef0ff';
      context.beginPath();
      context.arc(agent.x + 4, agent.y - 3, 4, 0, Math.PI * 2);
      context.fill();

      projectilesRef.current.forEach((arrow) => {
        context.fillStyle = '#ef4444';
        context.fillRect(arrow.x - arrow.w / 2, arrow.y - arrow.h / 2, arrow.w, arrow.h);
        const isHorizontal = Math.abs(arrow.vx) >= Math.abs(arrow.vy);
        const dir = isHorizontal ? Math.sign(arrow.vx || 1) : Math.sign(arrow.vy || 1);
        context.fillStyle = '#f97316';
        context.beginPath();
        if (isHorizontal) {
          context.moveTo(arrow.x + (arrow.w / 2) * dir, arrow.y);
          context.lineTo(arrow.x + (arrow.w / 2) * dir - 6 * dir, arrow.y - 4);
          context.lineTo(arrow.x + (arrow.w / 2) * dir - 6 * dir, arrow.y + 4);
        } else {
          context.moveTo(arrow.x, arrow.y + (arrow.h / 2) * dir);
          context.lineTo(arrow.x - 4, arrow.y + (arrow.h / 2) * dir - 6 * dir);
          context.lineTo(arrow.x + 4, arrow.y + (arrow.h / 2) * dir - 6 * dir);
        }
        context.closePath();
        context.fill();
      });

      animationFrame = requestAnimationFrame(render);
    };

    animationFrame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrame);
  }, [bestGenome, isPlaying, resetPlayer, watchBest]);

  useEffect(() => {
    if (!showConfetti) return undefined;
    const canvas = confettiRef.current;
    if (!canvas) return undefined;
    const context = canvas.getContext('2d');
    if (!context) return undefined;
    const colors = ['#60a5fa', '#f97316', '#22c55e', '#facc15', '#ec4899', '#a855f7'];
    const width = canvas.width;
    const height = canvas.height;
    const gravity = 600; // Gravity acceleration
    const floorY = height - 10; // Floor position
    const pieces = Array.from({ length: 160 }, () => ({
      x: Math.random() * width,
      y: -20 - Math.random() * height * 0.4,
      radius: 3 + Math.random() * 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vy: 80 + Math.random() * 120, // Initial vertical velocity
      vx: (Math.random() - 0.5) * 60, // Horizontal velocity
      angle: Math.random() * Math.PI * 2,
      angularVelocity: (Math.random() - 0.5) * 8,
      onFloor: false,
    }));

    let lastTime = performance.now();
    let animationFrame;

    const animate = (time) => {
      const dt = Math.min((time - lastTime) / 1000, 0.04);
      lastTime = time;
      context.clearRect(0, 0, width, height);
      pieces.forEach((piece) => {
        if (!piece.onFloor) {
          // Apply gravity
          piece.vy += gravity * dt;
          // Update position
          piece.y += piece.vy * dt;
          piece.x += piece.vx * dt;
          piece.angle += piece.angularVelocity * dt;
          
          // Check floor collision
          if (piece.y + piece.radius >= floorY) {
            piece.y = floorY - piece.radius;
            piece.vy = 0;
            piece.vx *= 0.3; // Friction on floor
            piece.angularVelocity *= 0.5; // Slow rotation on floor
            piece.onFloor = true;
          }
        } else {
          // On floor: slow horizontal drift and rotation
          piece.x += piece.vx * dt;
          piece.vx *= 0.98; // Friction
          piece.angle += piece.angularVelocity * dt;
          piece.angularVelocity *= 0.95;
        }
        
        // Wrap horizontally
        if (piece.x < -piece.radius) piece.x = width + piece.radius;
        if (piece.x > width + piece.radius) piece.x = -piece.radius;
        
        context.save();
        context.translate(piece.x, piece.y);
        context.rotate(piece.angle);
        context.fillStyle = piece.color;
        context.beginPath();
        context.ellipse(0, 0, piece.radius * 1.2, piece.radius, 0, 0, Math.PI * 2);
        context.fill();
        context.restore();
      });
      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [showConfetti]);

  const startTraining = useCallback(() => {
    const finish = findTile(gridRef.current, TILE_TYPES.finish);
    const start = findTile(gridRef.current, TILE_TYPES.start);
    if (!finish || !start) {
      const missing = [];
      if (!start) missing.push('start');
      if (!finish) missing.push('finish');
      setPlayWarning(`Add a ${missing.join(' and ')} tile before training.`);
      return;
    }
    setPlayWarning('');
    resetProjectiles();
    setFailureBanner('');
    setShowConfetti(false);
    setIsTraining(true);
    trainingRef.current.running = true;
    trainingRef.current.generation = 0;
    trainingRef.current.attempts = 0;
    const maxHorizon = Math.min(settings.horizon, 100);
    
    // Compute checkpoints using pathfinding
    const checkpoints = findPathWithCheckpoints(gridRef.current);
    trainingRef.current.checkpoints = checkpoints;

    if (algorithm === 'neuralNetwork') {
      // Neural Network with Genetic Algorithm
      const population = Array.from({ length: settings.population }, () => createNeuralNetwork());
      trainingRef.current.population = population;
      setBestGenome(null);
      setGenerationStats({
        generation: 0,
        bestFitness: 0,
        bestDistance: 0,
        reached: false,
        exposedSteps: 5,
        attempts: 0,
      });

      const runGeneration = () => {
        if (!trainingRef.current.running) return;
        const horizonSeconds = Math.min(settings.horizon / 10, 10); // Convert steps to seconds
        const scores = trainingRef.current.population.map((nn) => ({
          nn,
          ...simulateNN(gridRef.current, nn, shooterDirectionsRef.current, horizonSeconds, trainingRef.current.checkpoints),
        }));
        trainingRef.current.attempts += scores.length;
        scores.sort((a, b) => b.fitness - a.fitness);
        const best = scores[0];
        let fullReached = null;
        for (let i = 0; i < Math.min(scores.length, 12); i += 1) {
          const candidate = scores[i];
          trainingRef.current.attempts += 1; // Count each reach check as an attempt
          if (simulateNNReachOnly(gridRef.current, candidate.nn, shooterDirectionsRef.current, horizonSeconds, trainingRef.current.checkpoints)) {
            fullReached = candidate;
            break;
          }
        }
        setBestGenome(best.nn);
        setGenerationStats({
          generation: trainingRef.current.generation,
          bestFitness: Math.round(best.fitness),
          bestDistance: Math.round(best.bestDistance),
          reached: Boolean(fullReached),
          exposedSteps: Math.floor(horizonSeconds * FIXED_FPS / ACTION_STEP_FRAMES),
          attempts: trainingRef.current.attempts,
        });

        if (fullReached) {
          trainingRef.current.running = false;
          setIsTraining(false);
          setTimeout(() => {
            startBestReplayNN(fullReached.nn);
            triggerConfetti();
          }, 400);
          return;
        }

        const nextPopulation = [];
        const eliteCount = Math.min(settings.elite, scores.length);
        for (let i = 0; i < eliteCount; i += 1) {
          nextPopulation.push(scores[i].nn);
        }
        while (nextPopulation.length < settings.population) {
          const parent = scores[Math.floor(Math.random() * Math.min(scores.length, 16))].nn;
          const child = mutateNN(parent, settings.mutation);
          nextPopulation.push(child);
        }
        trainingRef.current.population = nextPopulation;
        trainingRef.current.generation += 1;

        if (trainingRef.current.generation >= 1000) {
          trainingRef.current.running = false;
          setIsTraining(false);
          setFailureBanner('AI finds this level impossible after 1000 generations.');
          return;
        }

        setTimeout(runGeneration, 0);
      };

      runGeneration();
      return;
    }

    // Genetic Algorithm (original)
    const population = Array.from({ length: settings.population }, () =>
      Array.from({ length: maxHorizon }, () => Math.floor(Math.random() * ACTIONS.length))
    );
    trainingRef.current.population = population;
    setBestGenome(null);
    setGenerationStats({
      generation: 0,
      bestFitness: 0,
      bestDistance: 0,
      reached: false,
      exposedSteps: 5,
      attempts: 0,
    });

    const runGeneration = () => {
      if (!trainingRef.current.running) return;
      const maxHorizon = Math.min(settings.horizon, 100);
      const exposedSteps = Math.min(maxHorizon, 5 + trainingRef.current.generation * 5);
      const scores = trainingRef.current.population.map((genome) => ({
        genome,
        ...simulateGenome(gridRef.current, genome.slice(0, exposedSteps), shooterDirectionsRef.current, undefined, trainingRef.current.checkpoints),
      }));
      trainingRef.current.attempts += scores.length;
      scores.sort((a, b) => b.fitness - a.fitness);
      const best = scores[0];
      const maxCheck = Math.min(scores.length, 12);
      let fullReached = null;
      for (let i = 0; i < maxCheck; i += 1) {
        const candidate = scores[i];
        trainingRef.current.attempts += 1; // Count each reach check as an attempt
        if (simulateReachOnly(gridRef.current, candidate.genome.slice(0, maxHorizon), shooterDirectionsRef.current, undefined, trainingRef.current.checkpoints)) {
          fullReached = candidate;
          break;
        }
      }
      setBestGenome(best.genome.slice());
      setGenerationStats({
        generation: trainingRef.current.generation,
        bestFitness: Math.round(best.fitness),
        bestDistance: Math.round(best.bestDistance),
        reached: Boolean(fullReached),
        exposedSteps,
        attempts: trainingRef.current.attempts,
      });

      if (fullReached) {
        trainingRef.current.running = false;
        setIsTraining(false);
        setTimeout(() => {
          startBestReplay(fullReached.genome);
          triggerConfetti();
        }, 400);
        return;
      }

      const nextPopulation = [];
      const eliteCount = Math.min(settings.elite, scores.length);
      for (let i = 0; i < eliteCount; i += 1) {
        nextPopulation.push(scores[i].genome.slice());
      }
      while (nextPopulation.length < settings.population) {
        const parent = scores[Math.floor(Math.random() * Math.min(scores.length, 16))].genome;
        const child = parent.slice();
        for (let i = 0; i < child.length; i += 1) {
          if (Math.random() < settings.mutation) {
            child[i] = Math.floor(Math.random() * ACTIONS.length);
          }
        }
        nextPopulation.push(child);
      }
      trainingRef.current.population = nextPopulation;
      trainingRef.current.generation += 1;

      if (trainingRef.current.generation >= 1000) {
        trainingRef.current.running = false;
        setIsTraining(false);
        setFailureBanner('AI finds this level impossible after 1000 generations.');
        return;
      }

      setTimeout(runGeneration, 0);
    };

    runGeneration();
  }, [settings, startBestReplay, startBestReplayNN, triggerConfetti, resetProjectiles, algorithm]);

  const stopTraining = useCallback(() => {
    trainingRef.current.running = false;
    setIsTraining(false);
    setShowConfetti(false);
  }, []);

  const handleWatchBest = useCallback(() => {
    if (!bestGenome) return;
    if (Array.isArray(bestGenome)) {
      startBestReplay(bestGenome);
    } else {
      startBestReplayNN(bestGenome);
    }
  }, [bestGenome, startBestReplay, startBestReplayNN]);

  const resetForEdit = useCallback(() => {
    trainingRef.current.running = false;
    setIsTraining(false);
    setIsPlaying(false);
    setWatchBest(false);
    setShowConfetti(false);
    resetProjectiles();
    resetPlayer();
  }, [resetPlayer, resetProjectiles]);

  const theme = useMemo(
    () => ({
      pageBg: isDark ? '#0b1220' : '#ffffff',
      text: isDark ? '#e2e8f0' : '#0f172a',
      subtext: isDark ? '#cbd5f5' : '#475569',
      card: isDark ? '#101a2c' : '#f7f9fc',
      cardStrong: isDark ? '#0b1220' : '#0f172a',
      cardAlt: isDark ? '#0f172a' : '#f8fafc',
      border: isDark ? 'rgba(148, 163, 184, 0.2)' : 'rgba(15, 23, 42, 0.1)',
      buttonDark: isDark ? '#e2e8f0' : '#1f2937',
      buttonDarkText: isDark ? '#0f172a' : '#ffffff',
      buttonNeutral: isDark ? '#1f2937' : '#e5e7eb',
      buttonNeutralText: isDark ? '#e2e8f0' : '#111827',
      accent: isDark ? '#60a5fa' : '#2563eb',
      accentText: '#ffffff',
      warning: '#f97316',
      success: '#10b981',
      danger: '#ef4444',
    }),
    [isDark]
  );

  return (
    <div>
      <NavBar repos={repos} />
      <div
        style={{
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '20px 12px 60px' : '30px 20px 80px',
          background: theme.pageBg,
          color: theme.text,
          borderRadius: isMobile ? '0' : '24px',
        }}
      >
        <h1 style={{ 
          fontSize: isMobile ? '1.8rem' : '2.6rem', 
          marginBottom: '10px', 
          textAlign: 'center',
          padding: isMobile ? '0 10px' : '0',
        }}>
          AI Platformer Sandbox
        </h1>
        <p style={{ textAlign: 'center', color: theme.subtext, maxWidth: '760px', margin: '0 auto 22px' }}>
          Design a level, play it, then challenge the AI to solve it.
        </p>
        <p style={{ textAlign: 'center', color: theme.subtext, fontSize: '0.95rem', margin: '0 auto 20px' }}>
          Best on desktop with a keyboard (WASD/arrow keys).
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            gap: '24px',
            alignItems: 'start',
          }}
        >
          <div
            style={{
              background: theme.pageBg,
              borderRadius: '18px',
              padding: '16px',
              boxShadow: '0 16px 30px rgba(15, 23, 42, 0.12)',
              position: 'relative',
              flex: isMobile ? '1 1 100%' : '1 1 0',
              minWidth: 0,
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <div style={{ 
              display: 'flex', 
              gap: isMobile ? '8px' : '12px', 
              flexWrap: 'wrap', 
              marginBottom: '14px',
            }}>
              <button
                type="button"
                onClick={handlePlay}
                suppressHydrationWarning
                style={{
                  background: theme.buttonDark,
                  color: theme.buttonDarkText,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Play
              </button>
              <button
                type="button"
                onClick={handleStop}
                suppressHydrationWarning
                style={{
                  background: theme.buttonNeutral,
                  color: theme.buttonNeutralText,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Stop / Reset
              </button>
              <button
                type="button"
                onClick={() => {
                  setGrid(createDefaultGrid());
                  setShooterDirections({});
                  resetPlayer();
                }}
                suppressHydrationWarning
                style={{
                  background: theme.warning,
                  color: theme.accentText,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Clear Board
              </button>
              <button
                type="button"
                onClick={handleWatchBest}
                suppressHydrationWarning
                style={{
                  background: theme.accent,
                  color: theme.accentText,
                  border: 'none',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                }}
              >
                Watch Best AI
              </button>
            </div>
            {playWarning && (
              <div
                style={{
                  background: theme.cardAlt,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}
              >
                {playWarning}
              </div>
            )}
            {failureBanner && (
              <div
                style={{
                  background: theme.cardAlt,
                  color: theme.text,
                  border: `1px solid ${theme.border}`,
                  padding: '10px 14px',
                  borderRadius: '10px',
                  marginBottom: '12px',
                }}
              >
                {failureBanner}
              </div>
            )}

            <div style={{ 
              overflowX: 'auto',
              width: '100%',
              maxWidth: '100%',
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
            }}>
              <div style={{ 
                position: 'relative',
                width: '100%',
                maxWidth: isMobile ? '100%' : `${GRID_WIDTH * TILE_SIZE}px`,
                margin: '0 auto',
              }}>
                <canvas
                  ref={canvasRef}
                  width={GRID_WIDTH * TILE_SIZE}
                  height={GRID_HEIGHT * TILE_SIZE}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxWidth: '100%',
                    borderRadius: '12px',
                    border: `1px solid ${theme.border}`,
                    display: 'block',
                  }}
                  onPointerDown={(event) => {
                    if (isPlaying || isTraining) return;
                    isMouseDownRef.current = true;
                    handlePointerEvent(event);
                  }}
                  onPointerMove={(event) => {
                    if (isPlaying || isTraining) return;
                    if (isMouseDownRef.current) {
                      handlePointerEvent(event);
                    }
                  }}
                  onPointerUp={() => {
                    isMouseDownRef.current = false;
                  }}
                  onPointerLeave={() => {
                    isMouseDownRef.current = false;
                  }}
                />
                {showConfetti && (
                  <canvas
                    ref={confettiRef}
                    width={GRID_WIDTH * TILE_SIZE}
                    height={GRID_HEIGHT * TILE_SIZE}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      width: '100%',
                      height: '100%',
                      pointerEvents: 'none',
                      maxWidth: '100%',
                    }}
                  />
                )}
                {successBanner && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '16px',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'rgba(15, 23, 42, 0.85)',
                      color: '#fff',
                      padding: '10px 18px',
                      borderRadius: '999px',
                      fontWeight: 600,
                      letterSpacing: '0.5px',
                      boxShadow: '0 10px 20px rgba(15, 23, 42, 0.35)',
                      backdropFilter: 'blur(6px)',
                    }}
                  >
                    Success after {generationStats.attempts} attempts. Best AI replaying.
                  </div>
                )}
              </div>
            </div>

            <p style={{ marginTop: '12px', color: theme.subtext }}>
              Edit mode: click to paint tiles. Play mode: move with WASD or arrows, jump with space.
            </p>
          </div>

          <div
            style={{
              background: theme.cardAlt,
              borderRadius: '18px',
              padding: '18px',
              boxShadow: '0 10px 24px rgba(15, 23, 42, 0.12)',
              flex: isMobile ? '1 1 100%' : '0 0 300px',
              width: isMobile ? '100%' : '300px',
              minWidth: 0,
            }}
          >
            <h3 style={{ 
              fontSize: isMobile ? '1.1rem' : '1.2rem', 
              marginBottom: '12px' 
            }}>Tile Palette</h3>
            <div style={{ 
              display: 'grid', 
              gap: isMobile ? '6px' : '8px',
              gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : '1fr',
            }}>
              {TILE_LABELS.map((tile) => (
                <button
                  key={tile.type}
                  type="button"
                  onClick={() => {
                    resetForEdit();
                    setSelectedTile(tile.type);
                  }}
                  suppressHydrationWarning
                  style={{
                    background: selectedTile === tile.type ? theme.buttonDark : theme.pageBg,
                    color: selectedTile === tile.type ? theme.buttonDarkText : theme.text,
                    border: `1px solid ${theme.border}`,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    textAlign: 'left',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    cursor: 'pointer',
                  }}
                >
                  <img
                    alt=""
                    aria-hidden="true"
                    src={`data:image/svg+xml;utf8,${encodeURIComponent(getTilePreviewDataUrl(tile.type))}`}
                    width={22}
                    height={22}
                    style={{ display: 'block', borderRadius: '6px', flexShrink: 0 }}
                  />
                  <span>{tile.label}</span>
                </button>
              ))}
            </div>

            <div style={{ marginTop: isMobile ? '16px' : '20px' }}>
              <div style={{ 
                display: 'flex', 
                gap: isMobile ? '6px' : '8px', 
                marginBottom: '12px', 
                flexWrap: 'wrap' 
              }}>
                <button
                  type="button"
                  onClick={() => setAlgorithm('genetic')}
                  suppressHydrationWarning
                  style={{
                    background: algorithm === 'genetic' ? theme.accent : theme.buttonNeutral,
                    color: algorithm === 'genetic' ? theme.accentText : theme.buttonNeutralText,
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Genetic Algorithm
                </button>
                <button
                  type="button"
                  onClick={() => setAlgorithm('neuralNetwork')}
                  suppressHydrationWarning
                  style={{
                    background: algorithm === 'neuralNetwork' ? theme.accent : theme.buttonNeutral,
                    color: algorithm === 'neuralNetwork' ? theme.accentText : theme.buttonNeutralText,
                    border: 'none',
                    padding: '6px 12px',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.9rem',
                  }}
                >
                  Neural Network
                </button>
              </div>
              <h3 style={{ 
                fontSize: isMobile ? '1rem' : '1.1rem', 
                marginBottom: '10px' 
              }}>
                {algorithm === 'genetic' ? 'Genetic Algorithm' : 'Neural Network'}
              </h3>
              <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
                <label style={{ fontSize: '0.9rem', color: theme.subtext }}>
                  Population: {settings.population}
                  <input
                    type="range"
                    min="20"
                    max="120"
                    step="5"
                    value={settings.population}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, population: Number(event.target.value) }))
                    }
                    style={{ width: '100%' }}
                  />
                </label>
                <label style={{ fontSize: '0.9rem', color: theme.subtext }}>
                  Horizon (steps): {settings.horizon}
                  <input
                    type="range"
                    min="80"
                    max="220"
                    step="10"
                    value={settings.horizon}
                    onChange={(event) =>
                      setSettings((prev) => ({ ...prev, horizon: Number(event.target.value) }))
                    }
                    style={{ width: '100%' }}
                  />
                </label>
                {algorithm === 'genetic' && (
                  <label style={{ fontSize: '0.9rem', color: theme.subtext }}>
                    Mutation: {settings.mutation.toFixed(2)}
                    <input
                      type="range"
                      min="0.02"
                      max="0.2"
                      step="0.01"
                      value={settings.mutation}
                      onChange={(event) =>
                        setSettings((prev) => ({ ...prev, mutation: Number(event.target.value) }))
                      }
                      style={{ width: '100%' }}
                    />
                  </label>
                )}
              </div>

              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={startTraining}
                  disabled={isTraining}
                  suppressHydrationWarning
                  style={{
                    background: isTraining ? '#94a3b8' : theme.success,
                    color: theme.accentText,
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: isTraining ? 'not-allowed' : 'pointer',
                  }}
                >
                  Train AI
                </button>
                <button
                  type="button"
                  onClick={stopTraining}
                  disabled={!isTraining}
                  suppressHydrationWarning
                  style={{
                    background: theme.danger,
                    color: theme.accentText,
                    border: 'none',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    cursor: !isTraining ? 'not-allowed' : 'pointer',
                  }}
                >
                  Stop
                </button>
              </div>

              <div style={{ marginTop: '14px', color: theme.text }}>
                <div>Generation: {generationStats.generation}</div>
                <div>Best fitness: {generationStats.bestFitness}</div>
                <div>Best distance: {generationStats.bestDistance}px</div>
                <div>Actions exposed: {generationStats.exposedSteps}</div>
                <div>Attempts: {generationStats.attempts}</div>
                <div>Status: {generationStats.reached ? 'Reached flag' : 'Training'}</div>
              </div>
            </div>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: '24px',
            marginTop: '28px',
          }}
        >
          <div
            style={{
              background: theme.cardStrong,
              borderRadius: '16px',
              padding: isMobile ? '16px 18px' : '20px 24px',
              color: theme.text,
              boxShadow: '0 12px 26px rgba(15, 23, 42, 0.2)',
            }}
          >
            <h2 style={{ 
              fontSize: isMobile ? '1.2rem' : '1.4rem', 
              marginBottom: '12px' 
            }}>How It Works</h2>
            <div style={{ color: theme.subtext, lineHeight: '1.6' }}>
              <p style={{ marginBottom: '12px' }}>
                <strong>Two AI Approaches:</strong> Choose between a Genetic Algorithm that evolves action sequences, or a Neural Network that learns to map game state to actions. Both run entirely in your browser with no server required.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Training Process:</strong> The AI starts with random behavior and gradually improves through evolution. Each generation tests multiple agents, keeps the best performers, and creates variations through mutation. For neural networks, weights are evolved instead of action sequences.
              </p>
              <p style={{ marginBottom: '12px' }}>
                <strong>Fitness & Learning:</strong> The AI is rewarded for getting closer to the finish flag and exploring new areas of the level. For challenging levels with large obstacles, an automatic pathfinding system creates intermediate checkpoints to guide the AI.
              </p>
              <p style={{ marginBottom: 0 }}>
                <strong>Deterministic Physics:</strong> All game physics use fixed timesteps and deterministic calculations, ensuring that the same actions always produce the same results. This makes training reliable and reproducible.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

