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
  await loadImages();
  await setupCanvas();
  await setupEvents();
  await setupConnection();
  await setupIOEvents();
}

async function setupWorldParameters() {
  world.tickRate = 30;
  world.dt = 1 / world.tickRate;
  world.currentTick = 0;
  world.imagePaths = [
    "../assets/tank_blue.png",
    "../assets/tank_green.png",
    "../assets/tank_red.png",
    "../assets/tankBlue_barrel2_outline.png",
    "../assets/tankBody_blue_outline.png",
    "../assets/tankBody_dark_outline.png",
    "../assets/tankBody_green_outline.png",
    "../assets/tankBody_red_outline.png",
    "../assets/tankBody_sand_outline.png",
    "../assets/tankDark_barrel2_outline.png",
    "../assets/tankGreen_barrel2_outline.png",
    "../assets/tankRed_barrel2_outline.png",
    "../assets/tankSand_barrel2_outline.png",
    "../assets/treeGreen_large.png",
  ];
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
  };
}

async function loadImages() {
  const placeholder = new Image();
  placeholder.src = "/assets/placeholder.png";
  await placeholder.decode();
  world.placeholder = placeholder;

  world.getAsset = (assetId) => {
    if (world.assets[assetId]) {
      return world.assets[assetId];
    } else {
      return world.placeholder;
    }
  }

  world.assets = [];
  world.assetIdMap = {};
  world.assetPathMap = {};
}

async function setupCanvas() {
  const canvas = document.getElementById("canvas");
  world.canvas = canvas;
  world.ctx = world.canvas.getContext("2d");
  world.resize(); // NOTE: set inital canvas size
}
