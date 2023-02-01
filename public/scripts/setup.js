import { Position } from "/components/Position.js";
import { Velocity } from "/components/Velocity.js";
import { Sprite } from "/components/Sprite.js";
import { Player } from "/components/Player.js";

import { world, deserialize } from "./world.js";
import { setupConnection, setupIOEvents } from "./setup-io.js";
import { setupEvents } from "./setup-events.js";

export async function setup() {
  // NOTE: order is important!
  await setupWorldParameters();
  await loadPlaceholderAsset();
  await setupCanvas();
  await setupEvents();
  await setupConnection();
  await setupIOEvents();
}

async function setupWorldParameters() {
  world.tickRate = 30;
  world.dt = 1 / world.tickRate;
  world.currentTick = 0;
  world.gotInput = false;
  world.mouse = {
    oldX: 0,
    oldY: 0,
    x: 0,
    y: 0,
    oldAngle: 0,
    angle: 0,
    scrollX: 0,
    scrollY: 0,
    leftDown: false,
    rightDown: false,
  };
  world.keyboard = {};
  world.windowWidth = -1;
  world.windowHeight = -1;
  world.resize = () => {
    world.canvas.width = window.innerWidth;
    world.canvas.height = window.innerHeight;
    world.canvas.style.width = window.innerWidth + "px";
    world.canvas.style.height = window.innerHieght + "px";
    world.windowWidth = window.innerWidth;
    world.windowHeight = window.innerHeight;
    if (world.windowWidth > world.windowHeight) {
      world.renderScaleWidth = world.windowWidth / 800;
      world.renderScaleHeight = world.windowHeight / 800;
    }
    else {
      world.renderScaleWidth = world.windowWidth / 800;
      world.renderScaleHeight = world.windowHeight / 800;
    }
  };
  world.assets = []; // the actual images
  world.assetIdMap = {}; // eg `assetIdMap[tank_blue]` gives you `4`
  world.assetPathMap = {}; // eg `assetIdMap[tank_blue]` gives you /assets/tank_blue.png
  world.getAsset = (assetId) => {
    if (world.assets[assetId]) {
      return world.assets[assetId];
    } else {
      return world.placeholderAsset;
    }
  }
  world.colorMap = []; // eg 0 -> blue, 1 -> green, etc
  world.debug = {
    showIds: false,
    showVelocity: false,
    showCollision: false,

  };
}

async function loadPlaceholderAsset() {
  const placeholder = new Image();
  placeholder.src = "/assets/placeholder.png";
  await placeholder.decode();
  world.placeholderAsset = placeholder;
}

async function setupCanvas() {
  const canvas = document.getElementById("canvas");
  world.canvas = canvas;
  world.ctx = world.canvas.getContext("2d");
  world.resize(); // NOTE: set inital canvas size
}
