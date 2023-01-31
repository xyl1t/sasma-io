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

import * as fs from 'fs';

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
} from "../common/bitecs.js";
import { Position } from "../common/components/Position.js";
import { Velocity } from "../common/components/Velocity.js";
import { Sprite } from "../common/components/Sprite.js";
import { Player } from "../common/components/Player.js";
import { Input } from "../common/components/Input.js";
import { Rotation } from "../common/components/Rotation.js";
import { Me } from "../common/components/Me.js";
import { physicsSystem } from "../common/systems/PhysicsSystem.js";
import { serializationConfig } from "../common/components/SerializationConfig.js";
import { handleInputSystem } from "../common/systems/HandleInputSystem.js";
import { Body } from "../common/components/Body.js";
import { Gun } from "../common/components/Gun.js";
import { collisionSystem } from "../common/systems/CollisionSystem.js";
import { botSystem } from "../common/systems/BotSystem.js";
import { Bot } from "../common/components/Bot.js";
import { gunSystem } from "../common/systems/GunSystem.js";

const sockets = {};
let lock = false;

// WORLD //
const world = createWorld();
const serialize = defineSerializer(serializationConfig);
const deserialize = defineDeserializer([Input]);

world.assetIdMap = {};
world.assetPathMap = {};
function loadAssets() {
  const assetFolder = "./public/assets/";
  let id = 0;
  fs.readdirSync(assetFolder).forEach((file) => {
    const filename = file.split(".")[0];
    world.assetIdMap[filename] = id++;
    world.assetPathMap[filename] = "/assets/" + file;
    console.log("loaded asset:", file)
  });
}
loadAssets();

// Add some tanks
for (let i = 0; i < 15; i++) {
  const playerId = addEntity(world);

  addComponent(world, Player, playerId);
  addComponent(world, Position, playerId);
  addComponent(world, Velocity, playerId);
  addComponent(world, Gun, playerId);
  addComponent(world, Body, playerId);
  addComponent(world, Bot, playerId);
  addComponent(world, Input, playerId);

  Position.x[playerId] = randomNumber(-400, 400);
  Position.y[playerId] = randomNumber(-400, 400);
  Gun.rateOfFire[playerId] = 1; // second
  Gun.source[playerId] = playerId;
  Body.power[playerId] = 50 + Math.random() * 200; // ms
  Body.angle[playerId] = Math.random() * Math.PI * 2;
  Body.rotationSpeed[playerId] = Math.PI;
}

// Add some trees
for (let i = 0; i < 15; i++) {
  const treeId = addEntity(world);
  addComponent(world, Position, treeId);
  Position.x[treeId] = randomNumber(-400, 400);
  Position.y[treeId] = randomNumber(-400, 400);
  addComponent(world, Sprite, treeId);
  Sprite.texture[treeId] = world.assetIdMap.treeGreen_large;
}

app.use(express.static("public"));
app.use(express.static("common"));

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (token != "actualUser") socket.disconnect(true);

  const playerId = addEntity(world);
  // console.log(getAllEntities(world))
  addComponent(world, Player, playerId);
  Player.viewDistanceWidth[playerId] = -1; // NOTE: unset so to say
  Player.viewDistanceHeight[playerId] = -1;
  socket.playerId = playerId;
  sockets[playerId] = socket;
  console.log("[io:connection] player connected");
  socket.emit("welcome", world.assetIdMap, world.assetPathMap);

  socket.on("disconnect", () => {
    removeEntity(world, playerId);
    delete sockets[playerId];
    console.log("[io:disconnect] player disconnected");
  });

  socket.on("join", () => {
    addComponent(world, Input, playerId);
    addComponent(world, Position, playerId);
    addComponent(world, Velocity, playerId);
    addComponent(world, Gun, playerId);
    addComponent(world, Body, playerId);
    addComponent(world, Input, playerId);

    Gun.rateOfFire[playerId] = 1; // seconds
    Gun.source[playerId] = playerId;
    Body.power[playerId] = 300;
    Body.rotationSpeed[playerId] = Math.PI;
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
let accumulator = 0;
let currentTick = 0;

let timeBetweenDebugMsg = 1; // one second
let debugTimer = timeBetweenDebugMsg; // don't wait for first output
function serverUpdate() {
  world.oldTime = world.currentTime;
  world.currentTime = Date.now() / 1000;
  const frameTime = world.currentTime - world.oldTime;
  world.timeSinceStart += frameTime;
  accumulator += frameTime;
  debugTimer += frameTime;

  while (accumulator >= dt) {
    handleInputSystem(world);
    gunSystem(world);
    physicsSystem(world);
    collisionSystem(world);
    botSystem(world);

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

setInterval(serverUpdate, dt * 1000);
// setInterval(serverUpdate, 1000);

function sendWorldToSocket(socket) {
  addComponent(world, Me, socket.playerId);
  const packet = serialize(world);
  removeComponent(world, Me, socket.playerId);
  socket.emit("serverUpdate", packet, socket.playerId);
  // console.log(getAllEntities(world));
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
/*

player entities
p1 p2 p3 p4

loop {
  p2
  renderDistence() {
    addComponent(InRange, p2);
    addComponent(InRange, p3);
  }

  inrangequery = createQeury([InRange]);

  inRangeEnts = inrangequery()

  for (ent in inRangeEnts) {
    removeComponent(InRange, ent);
  }

  packet = serialize(inRangeEnts)

  send(packet)

}

 */
