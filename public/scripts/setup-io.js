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

async function welcome(assetIdMap, assetPathMap) {
  console.log("I was welcomed");
  world.assetIdMap = assetIdMap;
  world.assetPathMap = assetPathMap;
  for (const path of Object.values(world.assetPathMap)) {
    const img = new Image();
    img.src = path;
    await img.decode();
    world.assets.push(img);
    console.log(path)
  }
}

function serverUpdate(packet, meId) {
  resetWorld(world);
  resetGlobals();

  deserialize(world, packet, DESERIALIZE_MODE.MAP);
  // console.log(getAllEntities(world))
  // const deserializedEntIds = deserialize(world, packet, DESERIALIZE_MODE.MAP);
  // const ents = queryMe(world);
  // console.log(getAllEntities(world), deserializedEntIds, ents)
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
