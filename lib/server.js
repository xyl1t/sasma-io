/*************************************************************************** */
/*                          IO-Game over WebSockets                          */
/*                                                                           */
/*  Marat Isaw, Benjamin Terbul, Justus Arndt, Paul Trattnig, Thomas Fischer */
/*  HTL Villach - Abteilung Informatik - 4AHIF                               */
/*  (c) 2022/23                                                              */
/*************************************************************************** */

/*
 TODO:
 - welcome event emit, join, respawn
 - player input
*/

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
} from "../common/bitecs.js";
import { Position } from "../common/components/Position.js";
import { Velocity } from "../common/components/Velocity.js";
import { Sprite } from "../common/components/Sprite.js";
import { Player } from "../common/components/Player.js";
import { Input } from "../common/components/Input.js";
import { Me } from "../common/components/Me.js";
import { physicsSystem } from "../common/systems/PhysicsSystem.js";
import { serializationConfig } from "../common/components/SerializationConfig.js";
import { handleInputSystem } from "../common/systems/HandleInputSystem.js";

const sockets = {};
let lock = false;

// WORLD //
const world = createWorld();
const serialize = defineSerializer(serializationConfig);
const deserialize = defineDeserializer([Input]);

// Add some tanks
for (let i = 0; i < 15; i++) {
  const playerId = addEntity(world);

  addComponent(world, Player, playerId);
  addComponent(world, Position, playerId);
  addComponent(world, Velocity, playerId);
  addComponent(world, Sprite, playerId);

  Position.x[playerId] = Math.random() * 400;
  Position.y[playerId] = Math.random() * 300;
  Velocity.x[playerId] = Math.random() * 100 - 50;
  Velocity.y[playerId] = Math.random() * 100 - 50;
  Sprite.texture[playerId] = Math.round(Math.random());
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
  socket.emit("welcome", playerId);

  socket.on("disconnect", () => {
    removeEntity(world, playerId);
    delete sockets[playerId];
    console.log("[io:disconnect] player disconnected");
  });

  socket.on("join", () => {
    addComponent(world, Player, playerId);
    addComponent(world, Input, playerId);
    addComponent(world, Position, playerId);
    addComponent(world, Velocity, playerId);
    addComponent(world, Sprite, playerId);

    Player.viewDistanceWidth[playerId] = -1; // NOTE: unset so to say
    Player.viewDistanceHeight[playerId] = -1;
    Position.x[playerId] = Math.random() * 400;
    Position.y[playerId] = Math.random() * 300;
    Velocity.x[playerId] = Math.random() * 100 - 50;
    Velocity.y[playerId] = Math.random() * 100 - 50;
    Sprite.texture[playerId] = 2;
    Input.inputX[playerId] = 0;
    Input.inputY[playerId] = 0;
    Input.angle[playerId] = 0;
    Input.shooting[playerId] = 0;
  });

  socket.on("playerInput", (packet) => {
    function toArrayBuffer(buf) {
      const ab = new ArrayBuffer(buf.length);
      const view = new Uint8Array(ab);
      for (let i = 0; i < buf.length; ++i) {
        view[i] = buf[i];
      }
      return ab;
    }
    const p = toArrayBuffer(packet);

    const desEids = deserialize(world, p);
    // console.log(desEids);
    // console.log(Input.angle[desEids[0]]);


    // const queryMe = defineQuery([Me]);
    // 
    // const packet = serialize(queryMe(world));
    //
    // const desIds = deserialize(world, packet, DESERIALIZE_MODE.MAP);
  })
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}/`);
});

const tickRate = 60;
const dt = 1 / tickRate;
world.dt = dt;
let currentTime = Date.now() / 1000;
let oldTime = currentTime;
let accumulator = 0;
let currentTick = 0;

let timeBetweenDebugMsg = 1; // one second
let debugTimer = timeBetweenDebugMsg; // don't wait for first output
function serverUpdate() {
  oldTime = currentTime;
  currentTime = Date.now() / 1000;
  const frameTime = currentTime - oldTime;
  accumulator += frameTime;
  debugTimer += frameTime;

  while (accumulator >= dt) {
    handleInputSystem(world);
    physicsSystem(world);

    // Debug output every second
    if (debugTimer >= timeBetweenDebugMsg) {
      // console.log(Position.x[0], Position.y[0]);
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

function sendWorldToSocket(socket) {
  addComponent(world, Me, socket.playerId);
  const packet = serialize(world);
  // NOTE: don't do remove the component after emitting, it will crash!
  // The reason is that by the time you emit the packet, a player might
  // disconnect and thus the the entity will be removed from the world,
  // and then you try to remove the componenet from the removed entity,
  // which will lead to a crash
  removeComponent(world, Me, socket.playerId);
  socket.emit("serverUpdate", packet);
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
