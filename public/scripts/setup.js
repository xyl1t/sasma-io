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
  world.tickRate = 60;
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
  world.joy = {
    joyMove: {
      x: 0,
      y: 0,
      angle: 0,
      bounds: false, //whether the touch moves out of the joystick
    },
    joyAngle: {
      x: 0,
      y: 0,
      angle: 0,
      bounds: false,
    },
  };

  world.windowWidth = -1;
  world.windowHeight = -1;

  world.constWidth = 800;
  world.constHeight = 800;
  world.renderScaleWidth = 1;
  world.renderScaleHeight = 1;

  world.resize = () => {
    world.canvas.width = document.documentElement.clientWidth;
    world.canvas.height = document.documentElement.clientHeight;
    world.canvas.style.width = document.documentElement.clientWidth + "px";
    world.canvas.style.height = window.innerHeight + "px";
    world.windowWidth = document.documentElement.clientWidth;
    world.windowHeight = document.documentElement.clientHeight;

    if (
      document.documentElement.clientWidth >
      document.documentElement.clientHeight
    ) {
      let ratio = document.documentElement.clientHeight / world.constHeight;
      // ratio = Math.max(0.7, ratio);
      world.renderScaleWidth = ratio;
      world.renderScaleHeight = ratio;
    } else {
      let ratio = document.documentElement.clientWidth / world.constWidth;
      // ratio = Math.max(0.7, ratio);
      world.renderScaleWidth = ratio;
      world.renderScaleHeight = ratio;
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
  };
  world.colorMap = []; // eg 0 -> blue, 1 -> green, etc
  world.debug = {
    showIds: false,
    showVelocity: false,
    showColliders: false,
  };

  world.isMobile = false;
  world.dynamicCamera = false;
  world.hasLoaded = false;
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
