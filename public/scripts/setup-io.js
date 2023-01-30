import { defineQuery } from "/bitecs.js";
import { world, deserialize } from "./world.js";
import {
  getAllEntities,
  removeEntity,
  resetWorld,
  flushRemovedEntities,
  registerComponents,
  DESERIALIZE_MODE,
} from "/bitecs.js";
import {Me} from "/components/Me.js"

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

function serverUpdate(packet) {
  // NOTE: Reset the world, if this is not done, entities that were
  // delted/removed in the server won't be reflected on the client

  // WARN: doesn't work properly!!! -> can't add
  // entities back normally
  // resetWorld(world);

  // NOTE: notice the mode is MAP, this is necessary to sync with the server
  const deserializedEntIds = deserialize(world, packet);
  // NOTE: Remove all entities that are no longer in the server
  // eg: player disconnected
  // NOTE: This really hinders performance, this is O(n^2)
  // Maybe do this not every frame but every other frame?
  getAllEntities(world).forEach((eid) => {
    if (!deserializedEntIds.includes(eid)) removeEntity(world, eid);
  });
}
