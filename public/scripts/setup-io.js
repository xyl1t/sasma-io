import { defineQuery, addComponent, createWorld, deleteWorld, resetGlobals } from "/bitecs.js";
import { world, deserialize } from "./world.js";
import {
  getAllEntities,
  removeEntity,
  resetWorld,
  flushRemovedEntities,
  registerComponents,
  DESERIALIZE_MODE,
} from "/bitecs.js";
import { Me } from "/components/Me.js";

export function setupConnection() {
  world.socket = io({
    auth: {
      token: "actualUser",
    },
  });
}

export function setupIOEvents() {
  world.socket.on("welcome", welcome);
  world.socket.on("serverUpdate", serverUpdate);
}

function welcome(_myId) {
  console.log("I was welcomed");
}

function serverUpdate(packet, meId) {
  resetWorld(world);
  resetGlobals();

  const deserializedEntIds = deserialize(world, packet);
}
