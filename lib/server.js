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

import { addPlayerComponents, loadAssets, resetGame, setupWorld, world } from "../common/serverWorld.js"

const sockets = {};

// WORLD //
world.tickRate = 30;
world.dt = 1 / world.tickRate;
world.currentTime = Date.now() / 1000;
world.oldTime = world.currentTime;
world.timeSinceStart = 0;
world.players = [];
world.minPlayers = 2;
world.waitingTime = 10;
world.currentWaitingTime = world.waitingTime;
world.gameStarted = false;
loadAssets();
setupWorld();

const serialize = defineSerializer(serializationConfig);
const visible = defineQuery([Visible]);
const positionQuery = defineQuery([Position, Not(Zone)]);
const realPlayersQuery = defineQuery([Player, Input, Not(Bot)]);
const followQuery = defineQuery([Follow]);

app.use(express.static("public"));
app.use(express.static("common"));

io.on("connection", (socket) => {
  const token = socket.handshake.auth.token;
  if (token != "actualUser") socket.disconnect(true);

  const playerId = addEntity(world);
  socket.playerId = playerId;
  sockets[playerId] = socket;
  console.log("[io:connect] player connected");
  socket.emit("welcome", world.assetIdMap, world.assetPathMap, world.colorMap);

  socket.on("disconnect", () => {
    const followIds = followQuery(world);
    for (const id of followIds) {
      if (Follow.source[id] == playerId) {
        removeComponent(world, Follow, id);
      }
    }
    removeEntity(world, playerId);
    delete sockets[playerId];
    console.log("[io:disconnect] player disconnected");
  });

  socket.on("join", (width, height, isMobile) => {
    addPlayerComponents(world, playerId, width, height, isMobile);
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

  while (accumulator >= world.dt) {
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
      Zone.size[world.boundaryZoneEid] = 2000;
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

    accumulator -= world.dt;
    currentTick++;
  }
}

setInterval(serverUpdate, world.dt * 1000);

function sendWorldToSocket(socket) {
  addComponent(world, Me, socket.playerId);
  const positionEntities = positionQuery(world);
  for (const id of positionEntities) {
    removeComponent(world, Visible, id);

    if (hasComponent(world, Follow, socket.playerId)) {
      if (checkIfEntityVisible(id, Follow.source[socket.playerId])) {
        addComponent(world, Visible, id);
      }
    } else {
      if (checkIfEntityVisible(id, socket.playerId)) {
        addComponent(world, Visible, id);
      }
    }
    if (Player.isMobile[socket.playerId] && hasComponent(world, Track, id)) {
      removeComponent(world, Visible, id);
    }
  }

  const visibleEntities = pipe(visible, serialize);
  const packet = visibleEntities(world);
  removeComponent(world, Me, socket.playerId);
  const realPlayers = realPlayersQuery(world);
  world.players = [];
  for (const id of realPlayers) {
    world.players.push(id);
  }
  // console.log(Buffer.byteLength(packet));
  // console.log(getAllEntities(world));
  socket.emit(
    "serverUpdate",
    packet,
    world.players,
    parseInt(world.currentWaitingTime),
    world.gameStarted
  );
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
