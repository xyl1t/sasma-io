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
  world.tickRate = 60;
  world.dt = 1 / world.tickRate;
  world.currentTick = 0;
  world.imagePaths = [
    "../assets/tank_blue.png",
    "../assets/tank_green.png",
    "../assets/tank_red.png",
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
  const images = [];
  const imagesMap = {};

  const getFileName = (path) => path.split("/").pop().split(".")[0];

  for (const imgPath of world.imagePaths) {
    const img = new Image();
    img.src = imgPath;
    await img.decode(); // wait till image is actually loaded
    images.push(img);
    imagesMap[getFileName(imgPath)] = img; // ehhh, not the best option
  }

  world.images = images;
  world.imagesMap = imagesMap;
}

async function setupCanvas() {
  const canvas = document.getElementById("canvas");
  world.canvas = canvas;
  world.ctx = world.canvas.getContext("2d");
  world.resize(); // NOTE: set inital canvas size
}
