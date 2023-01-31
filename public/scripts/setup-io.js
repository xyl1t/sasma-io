import { defineQuery, addComponent, createWorld, deleteWorld, resetGlobals } from "/bitecs.js";
import { world, deserialize, queryMe } from "./world.js";
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

  // console.log(getAllEntities(world))
  const deserializedEntIds = deserialize(world, packet, DESERIALIZE_MODE.MAP);
  // const ents = queryMe(world);
  // console.log(getAllEntities(world), deserializedEntIds, ents)
}
