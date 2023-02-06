/*************************************************************************** */
/*                          IO-Game over WebSockets                          */
/*                                                                           */
/*  Marat Isaw, Benjamin Terbul, Justus Arndt, Paul Trattnig, Thomas Fischer */
/*  HTL Villach - Abteilung Informatik - 4AHIF                               */
/*  (c) 2022/23                                                              */
/*************************************************************************** */

import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";
const argv = yargs(hideBin(process.argv)).argv;

import express from "express";
const app = express();
const PORT = argv.port ?? 8080;
import { createServer } from "http";
import { Server } from "socket.io";
const server = createServer(app);
const io = new Server(server);

import * as fs from "fs";

import {
  createWorld,
  addEntity,
  Types,
  defineComponent,
  addComponent,
  removeComponent,
  defineQuery,
  defineSystem,
  defineSerializer,
  defineDeserializer,
  registerComponents,
  removeEntity,
  DESERIALIZE_MODE,
  hasComponent,
  getAllEntities,
  Not,
  pipe,
} from "../common/bitecs.js";
import { Position } from "../common/components/Position.js";
import { Velocity } from "../common/components/Velocity.js";
import { Sprite } from "../common/components/Sprite.js";
import { Player } from "../common/components/Player.js";
import { Input } from "../common/components/Input.js";
import { Rotation } from "../common/components/Rotation.js";
import { Me } from "../common/components/Me.js";
import { movementSystem } from "../common/systems/MovementSystem.js";
import { serializationConfig } from "../common/components/SerializationConfig.js";
import { handleInputSystem } from "../common/systems/HandleInputSystem.js";
import { Body } from "../common/components/Body.js";
import { Gun } from "../common/components/Gun.js";
import { collisionSystem } from "../common/systems/CollisionSystem.js";
import { botSystem } from "../common/systems/BotSystem.js";
import { Bot } from "../common/components/Bot.js";
import { gunSystem } from "../common/systems/GunSystem.js";
import { pickupSystem } from "../common/systems/PickupSystem.js";
import { bulletSystem } from "../common/systems/BulletSystem.js";
import { playerSystem } from "../common/systems/PlayerSystem.js";
import { handleCollidingPairsSystem } from "../common/systems/HandleCollidingPairsSystem.js";
import { Acceleration } from "../common/components/Acceleration.js";
import { Force } from "../common/components/Force.js";
import { Mass } from "../common/components/Mass.js";
import { TimeToLive } from "../common/components/TimeToLive.js";
import { timeToLiveSystem } from "../common/systems/TimeToLiveSystem.js";
import { animatedSpriteSystem } from "../common/systems/AnimatedSpriteSystem.js";
import { CircleCollider } from "../common/components/CircleCollider.js";
import { Visible } from "../common/components/Visible.js";
import { Layer } from "../common/components/Layer.js";
import { CapsuleCollider } from "../common/components/CapsuleCollider.js";
import { Pickup } from "../common/components/Pickup.js";
import { PickupDropper } from "../common/components/PickupDropper.js";
import { zoneSystem } from "../common/systems/ZoneSystem.js";
import { Zone } from "../common/components/Zone.js";
import { Track } from "../common/components/Track.js";
import { Follow } from "../common/components/Follow.js";

const sockets = {};

// WORLD //
const world = createWorld();
const serialize = defineSerializer(serializationConfig);
const visible = defineQuery([Visible]);
const positionQuery = defineQuery([Position, Not(Zone)]);
const realPlayersQuery = defineQuery([Player, Input, Not(Bot)]);

world.assetIdMap = {};
world.assetPathMap = {};
world.colorMap = ["blue", "green", "red", "sand", "dark"];
function loadAssets() {
  const assetFolder = "./public/assets/";
  let id = 0;
  fs.readdirSync(assetFolder).forEach((file) => {
    if (fs.lstatSync(assetFolder + file).isFile()) {
      const filename = file.split(".")[0];
      world.assetIdMap[filename] = id++;
      world.assetPathMap[filename] = "/assets/" + file;
      console.log("loaded asset:", file);
    }
  });
}
loadAssets();

function addPlayerComponents(playerId, width, height, isMobile) {
  addComponent(world, Player, playerId);
  addComponent(world, Position, playerId);
  addComponent(world, Velocity, playerId);
  addComponent(world, Acceleration, playerId);
  addComponent(world, Force, playerId);
  addComponent(world, Mass, playerId);
  addComponent(world, Gun, playerId);
  addComponent(world, Body, playerId);
  addComponent(world, Input, playerId);
  addComponent(world, CircleCollider, playerId);
  addComponent(world, Layer, playerId);

  Layer.layer[playerId] = 10;
  Player.color[playerId] = randomNumber(0, 4);
  Player.health[playerId] = 100;
  Player.viewDistanceWidth[playerId] = width;
  Player.viewDistanceHeight[playerId] = height;
  Player.isMobile[playerId] = isMobile;
  Position.x[playerId] = randomNumber(-4, 4); // TODO: FIXME
  Position.y[playerId] = randomNumber(-4, 4);
  Velocity.x[playerId] = 0;
  Velocity.y[playerId] = 0;
  Gun.rateOfFire[playerId] = 1; // second
  Gun.source[playerId] = playerId;
  Gun.damage[playerId] = 40;
  Body.power[playerId] = 2000; // ms
  Body.angle[playerId] = Math.random() * Math.PI * 2;
  Body.rotationSpeed[playerId] = Math.PI * 6;
  Mass.value[playerId] = 5;
  CircleCollider.radius[playerId] = 21;

  return playerId;
}

//Add Inner-Zone  (fixed start-size at the moment)
const zoneEntity = addEntity(world);
addComponent(world, Zone, zoneEntity);
Zone.size[zoneEntity] = 1600;
Zone.collision[zoneEntity] = 0;
addComponent(world, Layer, zoneEntity);
Layer.layer[zoneEntity] = 99;
addComponent(world, Visible, zoneEntity);
addComponent(world, Position, zoneEntity);

//Add Outter-Zone  (fixed start-size at the moment)
const zoneEntity2 = addEntity(world);
addComponent(world, Zone, zoneEntity2);
Zone.size[zoneEntity2] = 1600;
Zone.collision[zoneEntity2] = 1;
addComponent(world, Layer, zoneEntity2);
Layer.layer[zoneEntity2] = 99;
addComponent(world, Visible, zoneEntity2);
addComponent(world, Position, zoneEntity2);

// Add some tanks
for (let i = 0; i < 10; i++) {
  const playerId = addEntity(world);
  addPlayerComponents(playerId);
  addComponent(world, Bot, playerId);
}

// Add some trees
for (let i = 0; i < 50; i++) {
  const treeId = addEntity(world);
  addComponent(world, Position, treeId);
  Position.x[treeId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  Position.y[treeId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  addComponent(world, Sprite, treeId);
  Sprite.texture[treeId] = world.assetIdMap.tree_green_large;
  addComponent(world, Layer, treeId);
  Layer.layer[treeId] = 15;
}

for (let i = 0; i < 20; i++) {
  const boxId = addEntity(world);
  addComponent(world, Position, boxId);
  Position.x[boxId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  Position.y[boxId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  addComponent(world, Layer, boxId);
  Layer.layer[boxId] = 9;
  addComponent(world, Sprite, boxId);
  Sprite.texture[boxId] = world.assetIdMap.crate_wood;
  addComponent(world, PickupDropper, boxId);
  addSquareCollider(boxId);
}

// Add some boxes
for (let i = 0; i < 50; i++) {
  const boxId = addEntity(world);
  addComponent(world, Position, boxId);
  Position.x[boxId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  Position.y[boxId] = randomNumber(
    -Zone.size[zoneEntity2],
    Zone.size[zoneEntity2]
  );
  addComponent(world, Layer, boxId);
  Layer.layer[boxId] = 9;
  addComponent(world, Sprite, boxId);
  addComponent(world, CapsuleCollider, boxId);

  const type = Math.round(randomNumber(0, 2));
  if (type == 0) {
    Sprite.texture[boxId] = world.assetIdMap.crate_metal;
    addSquareCollider(boxId);
  }
  if (type == 1) {
    Sprite.texture[boxId] = world.assetIdMap.fence_yellow;
    CapsuleCollider.radius[boxId] = 6;
    CapsuleCollider.sx[boxId][0] = -20;
    CapsuleCollider.sy[boxId][0] = 0;
    CapsuleCollider.ex[boxId][0] = 20;
    CapsuleCollider.ey[boxId][0] = 0;
    CapsuleCollider.capsuleCount[boxId] = 1;
  } else if (type == 2) {
    Sprite.texture[boxId] = world.assetIdMap.fence_red;
    CapsuleCollider.radius[boxId] = 6;
    CapsuleCollider.sx[boxId][0] = -20;
    CapsuleCollider.sy[boxId][0] = 0;
    CapsuleCollider.ex[boxId][0] = 20;
    CapsuleCollider.ey[boxId][0] = 0;
    CapsuleCollider.capsuleCount[boxId] = 1;
  }
}

function addSquareCollider(id) {
  addComponent(world, CapsuleCollider, id);
  CapsuleCollider.radius[id] = 4;
  CapsuleCollider.sx[id][0] = -10;
  CapsuleCollider.sy[id][0] = -10;
  CapsuleCollider.ex[id][0] = -10;
  CapsuleCollider.ey[id][0] = 10;
  CapsuleCollider.sx[id][1] = -10;
  CapsuleCollider.sy[id][1] = 10;
  CapsuleCollider.ex[id][1] = 10;
  CapsuleCollider.ey[id][1] = 10;
  CapsuleCollider.sx[id][2] = 10;
  CapsuleCollider.sy[id][2] = 10;
  CapsuleCollider.ex[id][2] = 10;
  CapsuleCollider.ey[id][2] = -10;
  CapsuleCollider.sx[id][3] = 10;
  CapsuleCollider.sy[id][3] = -10;
  CapsuleCollider.ex[id][3] = -10;
  CapsuleCollider.ey[id][3] = -10;
  CapsuleCollider.capsuleCount[id] = 4;
  return id;
}

app.use(express.static("public"));
app.use(express.static("common"));

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (token != "actualUser") socket.disconnect(true);

  const playerId = addEntity(world);
  socket.playerId = playerId;
  sockets[playerId] = socket;
  console.log("[io:connection] player connected");
  socket.emit("welcome", world.assetIdMap, world.assetPathMap, world.colorMap);

  socket.on("disconnect", () => {
    removeEntity(world, playerId);
    delete sockets[playerId];
    console.log("[io:disconnect] player disconnected");
  });

  socket.on("join", (width, height, isMobile) => {
    addPlayerComponents(playerId, width, height, isMobile);
    Body.power[playerId] = 3000;
  });

  socket.on("playerInput", (inputPayload) => {
    for (const key of Object.keys(inputPayload)) {
      Input[key][playerId] = inputPayload[key];
    }
  });
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}/`);
});

const tickRate = 30;
const dt = 1 / tickRate;
world.dt = dt;
world.currentTime = Date.now() / 1000;
world.oldTime = world.currentTime;
world.timeSinceStart = 0;
world.players = [];
world.minPlayers = 2;
world.waitingTime = 5;
world.currentWaitingTime = world.waitingTime;
world.zoneSpeed = 20;
world.gameStarted = false;
let accumulator = 0;
let currentTick = 0;

let timeBetweenDebugMsg = 1; // one second
let debugTimer = timeBetweenDebugMsg; // don't wait for first output
let counter = 0;
function serverUpdate() {
  world.oldTime = world.currentTime;
  world.currentTime = Date.now() / 1000;
  const frameTime = world.currentTime - world.oldTime;
  world.timeSinceStart += frameTime;
  accumulator += frameTime;
  debugTimer += frameTime;

  while (accumulator >= dt) {
    playerSystem(world);
    botSystem(world);
    handleInputSystem(world);
    gunSystem(world);
    movementSystem(world);
    handleCollidingPairsSystem(world);
    collisionSystem(world);
    bulletSystem(world);
    timeToLiveSystem(world);
    pickupSystem(world);
    animatedSpriteSystem(world);
    zoneSystem(world);

    if (world.players.length >= world.minPlayers) {
      world.currentWaitingTime -= world.dt;
    } else {
      world.currentWaitingTime = world.waitingTime;
    }

    if (
      world.currentWaitingTime <= 0 &&
      world.players.length >= world.minPlayers &&
      !world.gameStarted
    ) {
      world.gameStarted = true;
      Zone.size[zoneEntity] = 1200;
    }

    if (world.gameStarted && world.players.length == 1) {
      resetGame();
    }

    // Debug output every second
    if (debugTimer >= timeBetweenDebugMsg) {
      // console.log("...");
      debugTimer -= timeBetweenDebugMsg;
    }

    for (const socket of Object.values(sockets).filter((s) => s.playerId)) {
      sendWorldToSocket(socket);
    }

    accumulator -= dt;
    currentTick++;
  }
}

const botQuery = defineQuery([Bot, Input, Body, CircleCollider]);
const pickupDropperQuery = defineQuery([PickupDropper]);

function resetGame() {
  world.gameStarted = false;
  world.currentWaitingTime = world.waitingTime;
  Zone.size[zoneEntity] = 1200;
  Zone.collision[zoneEntity] = 0;
  Zone.size[zoneEntity2] = 1600;
  Zone.collision[zoneEntity2] = 1;
  let playerQ = defineQuery([Player]);
  let players = playerQ(world);
  for (let id of players) {
    Player.health[id] = 100;
  }

  const bots = botQuery(world);
  if (bots.length < 10) {
    const diff = 10 - bots.length;
    for (let i = 0; i < diff; i++) {
      const playerId = addEntity(world);
      addPlayerComponents(playerId);
      addComponent(world, Bot, playerId);
    }
  }

  const pickupDroppers = pickupDropperQuery(world);
  if (pickupDroppers.length < 20) {
    const diff = 20 - pickupDroppers.length;
    for (let i = 0; i < diff; i++) {
      const boxId = addEntity(world);
      addComponent(world, Position, boxId);
      Position.x[boxId] = randomNumber(
        -Zone.size[zoneEntity2],
        Zone.size[zoneEntity2]
      );
      Position.y[boxId] = randomNumber(
        -Zone.size[zoneEntity2],
        Zone.size[zoneEntity2]
      );
      addComponent(world, Layer, boxId);
      Layer.layer[boxId] = 9;
      addComponent(world, Sprite, boxId);
      Sprite.texture[boxId] = world.assetIdMap.crate_wood;
      addComponent(world, PickupDropper, boxId);
      addSquareCollider(boxId);
    }
  }
}

setInterval(serverUpdate, dt * 1000);
// setInterval(serverUpdate, 1000);

function sendWorldToSocket(socket) {
  addComponent(world, Me, socket.playerId);
  const positionEntities = positionQuery(world);
  for (const id of positionEntities) {
    removeComponent(world, Visible, id);

    if (checkIfEntityVisible(id, socket.playerId)) {
      addComponent(world, Visible, id);
    }
    if (Player.isMobile[socket.playerId] && hasComponent(world, Track, id)) {
      removeComponent(world, Visible, id);
    }
  }

  // const visibleIds = visible(world);
  const visibleEntities = pipe(visible, serialize);
  const packet = visibleEntities(world);
  removeComponent(world, Me, socket.playerId);
  const realPlayers = realPlayersQuery(world);
  world.players = [];
  for (const id of realPlayers) {
    world.players.push(id);
  }
  // console.log(Buffer.byteLength(packet));
  socket.emit(
    "serverUpdate",
    packet,
    world.players,
    parseInt(world.currentWaitingTime),
    world.gameStarted
  );
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}

function checkIfEntityVisible(id, meId) {
  if (!hasComponent(world, Player, meId)) return true;

  const viewWidth = Player.viewDistanceWidth[meId] * 0.6;
  const viewHeight = Player.viewDistanceWidth[meId] * 0.6;
  const meX = Position.x[meId];
  const meY = Position.y[meId];
  let posX = Position.x[id];
  let posY = Position.y[id];
  if (hasComponent(world, Follow, id)) {
    posX += Position.x[Follow.source[id]];
    posY += Position.y[Follow.source[id]];
  }

  return !(
    posX > meX + viewWidth ||
    posY > meY + viewHeight ||
    posX < meX - viewWidth ||
    posY < meY - viewHeight
  );
}
