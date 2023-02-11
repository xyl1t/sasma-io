import * as fs from "fs";
import {
  addComponent,
  addEntity,
  createWorld,
  defineQuery,
  removeComponent,
} from "./bitecs.js";
import { randBetween } from "./util.js";

import { Position } from "../common/components/Position.js";
import { Velocity } from "../common/components/Velocity.js";
import { Sprite } from "../common/components/Sprite.js";
import { Player } from "../common/components/Player.js";
import { Input } from "../common/components/Input.js";
import { Rotation } from "../common/components/Rotation.js";
import { Me } from "../common/components/Me.js";
import { Body } from "../common/components/Body.js";
import { Gun } from "../common/components/Gun.js";
import { Bot } from "../common/components/Bot.js";
import { Acceleration } from "../common/components/Acceleration.js";
import { Force } from "../common/components/Force.js";
import { Mass } from "../common/components/Mass.js";
import { TimeToLive } from "../common/components/TimeToLive.js";
import { CircleCollider } from "../common/components/CircleCollider.js";
import { Visible } from "../common/components/Visible.js";
import { Layer } from "../common/components/Layer.js";
import { CapsuleCollider } from "../common/components/CapsuleCollider.js";
import { Pickup } from "../common/components/Pickup.js";
import { PickupDropper } from "../common/components/PickupDropper.js";
import { Zone } from "../common/components/Zone.js";
import { Track } from "../common/components/Track.js";
import { Follow } from "../common/components/Follow.js";

import { collisionSystem } from "../common/systems/CollisionSystem.js";
import { botSystem } from "../common/systems/BotSystem.js";
import { movementSystem } from "../common/systems/MovementSystem.js";
import { serializationConfig } from "../common/components/SerializationConfig.js";
import { handleInputSystem } from "../common/systems/HandleInputSystem.js";
import { gunSystem } from "../common/systems/GunSystem.js";
import { pickupSystem } from "../common/systems/PickupSystem.js";
import { bulletSystem } from "../common/systems/BulletSystem.js";
import { playerSystem } from "../common/systems/PlayerSystem.js";
import { handleCollidingPairsSystem } from "../common/systems/HandleCollidingPairsSystem.js";
import { timeToLiveSystem } from "../common/systems/TimeToLiveSystem.js";
import { animatedSpriteSystem } from "../common/systems/AnimatedSpriteSystem.js";
import { zoneSystem } from "../common/systems/ZoneSystem.js";

export const world = createWorld();
world.nilEid = addEntity(world);
world.damageZoneEid = addEntity(world);
world.boundaryZoneEid = addEntity(world);

const zoneSize = 1600;
const zoneLayer = 999;
const zoneSpeed = 20;

export function setupWorld() {
  // Inner-Zone
  addComponent(world, Zone, world.damageZoneEid);
  addComponent(world, Layer, world.damageZoneEid);
  addComponent(world, Visible, world.damageZoneEid);
  addComponent(world, Position, world.damageZoneEid);
  Zone.size[world.damageZoneEid] = zoneSize;
  Zone.collision[world.damageZoneEid] = 0;
  Zone.speed[world.damageZoneEid] = 20;
  Layer.layer[world.damageZoneEid] = zoneLayer;

  // Outter-Zone
  addComponent(world, Zone, world.boundaryZoneEid);
  addComponent(world, Layer, world.boundaryZoneEid);
  addComponent(world, Visible, world.boundaryZoneEid);
  addComponent(world, Position, world.boundaryZoneEid);
  Zone.size[world.boundaryZoneEid] = zoneSize;
  Zone.collision[world.boundaryZoneEid] = 1;
  Zone.speed[world.boundaryZoneEid] = 20;
  Layer.layer[world.boundaryZoneEid] = zoneLayer;

  addBots(10);
  addForests(30, 5, -zoneSize, zoneSize);
  addObstacles(30);
  addPickupDroppers(20);
}

const playerQuery = defineQuery([Player]);
const botQuery = defineQuery([Bot, Input, Body, CircleCollider]);
const pickupDropperQuery = defineQuery([PickupDropper]);
export function resetGame() {
  world.gameStarted = false;
  world.currentWaitingTime = world.waitingTime;

  Zone.size[world.damageZoneEid] = 1600;
  Zone.size[world.boundaryZoneEid] = 1600;

  let players = playerQuery(world);
  for (let id of players) {
    Player.health[id] = 100;
  }

  const bots = botQuery(world);
  if (bots.length < 10) {
    const diff = 10 - bots.length;
    for (let i = 0; i < diff; i++) {
      const botId = addEntity(world);
      addPlayerComponents(world, botId);
      addComponent(world, Bot, botId);
    }
  }

  const pickupDroppers = pickupDropperQuery(world);
  if (pickupDroppers.length < 20) {
    const diff = 20 - pickupDroppers.length;
    for (let i = 0; i < diff; i++) {
      const boxId = addEntity(world);
      addComponent(world, Position, boxId);
      Position.x[boxId] = randBetween(-1600, 1600);
      Position.y[boxId] = randBetween(-1600, 1600);
      addComponent(world, Layer, boxId);
      Layer.layer[boxId] = 9;
      addComponent(world, Sprite, boxId);
      Sprite.texture[boxId] = world.assetIdMap.crate_wood;
      addComponent(world, PickupDropper, boxId);
      addSquareCollider(boxId);
    }
  }
}


function addObstacles(count) {
  for (let i = 0; i < count; i++) {
    const boxId = addEntity(world);
    addComponent(world, Position, boxId);
    Position.x[boxId] = randBetween(-zoneSize, zoneSize);
    Position.y[boxId] = randBetween(-zoneSize, zoneSize);
    addComponent(world, Layer, boxId);
    Layer.layer[boxId] = 9;
    addComponent(world, Sprite, boxId);
    addComponent(world, CapsuleCollider, boxId);

    const type = Math.round(randBetween(0, 4));
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
    if (type == 3) {
      Sprite.texture[boxId] = world.assetIdMap.fence_yellow;
      CapsuleCollider.radius[boxId] = 6;
      CapsuleCollider.sx[boxId][0] = 0;
      CapsuleCollider.sy[boxId][0] = 20;
      CapsuleCollider.ex[boxId][0] = 0;
      CapsuleCollider.ey[boxId][0] = -20;
      CapsuleCollider.capsuleCount[boxId] = 1;
      addComponent(world, Rotation, boxId);
      Rotation.angle[boxId] = Math.PI;
    } else if (type == 4) {
      Sprite.texture[boxId] = world.assetIdMap.fence_red;
      CapsuleCollider.radius[boxId] = 6;
      CapsuleCollider.sx[boxId][0] = 0;
      CapsuleCollider.sy[boxId][0] = 20;
      CapsuleCollider.ex[boxId][0] = 0;
      CapsuleCollider.ey[boxId][0] = -20;
      CapsuleCollider.capsuleCount[boxId] = 1;
      addComponent(world, Rotation, boxId);
      Rotation.angle[boxId] = Math.PI;
    }
  }
}

function addPickupDroppers(count) {
  for (let i = 0; i < count; i++) {
    const boxId = addEntity(world);
    addComponent(world, Position, boxId);
    Position.x[boxId] = randBetween(-zoneSize, zoneSize);
    Position.y[boxId] = randBetween(-zoneSize, zoneSize);
    addComponent(world, Layer, boxId);
    Layer.layer[boxId] = 9;
    addComponent(world, Sprite, boxId);
    Sprite.texture[boxId] = world.assetIdMap.crate_wood;
    addComponent(world, PickupDropper, boxId);
    addSquareCollider(boxId);
  }
}

function addSquareCollider(id) {
  addComponent(world, CapsuleCollider, id);
  CapsuleCollider.radius[id] = 2;
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

function addForests(count, size, min, max) {
  for (let i = 0; i < count; i++) {
    const forestX = randBetween(min, max);
    const forestY = randBetween(min, max);
    addForest(forestX, forestY, size);
  }
}

function addForest(posX, posY, size = 1, level = 3) {
  if (level <= 0) return;

  for (let i = 0; i < size * (level / 3) ** 10; i++) {
    switch (level) {
      case 3:
        addBigTree(posX, posY);
        break;
      case 2:
        addSmallTree(posX, posY);
        break;
      case 1:
        addTwig(posX, posY);
        break;
    }

    addForest(
      posX + randBetween(-60 * (level / 3), 60 * (level / 3)),
      posY + randBetween(-60 * (level / 3), 60 * (level / 3)),
      size * (level / 3) ** 10,
      level - parseInt(randBetween(1, 3))
    );

    posX += randBetween(-200, 200);
    posY += randBetween(-200, 200);
  }
}

function addBigTree(posX, posY) {
  const treeId = addEntity(world);
  addComponent(world, Position, treeId);
  addComponent(world, Sprite, treeId);
  addComponent(world, Layer, treeId);
  Position.x[treeId] = posX;
  Position.y[treeId] = posY;
  Sprite.texture[treeId] = world.assetIdMap.tree_green_large;
  Layer.layer[treeId] = 20;
}

function addSmallTree(posX, posY) {
  const treeId = addEntity(world);
  addComponent(world, Position, treeId);
  addComponent(world, Sprite, treeId);
  addComponent(world, Layer, treeId);
  Position.x[treeId] = posX;
  Position.y[treeId] = posY;
  Sprite.texture[treeId] = world.assetIdMap.tree_green_small;
  Layer.layer[treeId] = 19;
}

function addTwig(posX, posY) {
  const treeId = addEntity(world);
  addComponent(world, Position, treeId);
  addComponent(world, Sprite, treeId);
  addComponent(world, Layer, treeId);
  Position.x[treeId] = posX;
  Position.y[treeId] = posY;
  Sprite.texture[treeId] = world.assetIdMap.tree_green_twigs;
  Layer.layer[treeId] = 9;
}

function addBot() {
  const botId = addEntity(world);
  addPlayerComponents(world, botId);
  addComponent(world, Bot, botId);
}

function addBots(count) {
  for (let i = 0; i < count; i++) {
    addBot();
  }
}

export function loadAssets() {
  world.assetIdMap = {};
  world.assetPathMap = {};
  world.colorMap = ["blue", "green", "red", "sand", "dark"];

  let id = 0;
  const assetFolder = "./public/assets/";
  fs.readdirSync(assetFolder).forEach((file) => {
    if (fs.lstatSync(assetFolder + file).isFile()) {
      const filename = file.split(".")[0];
      world.assetIdMap[filename] = id++;
      world.assetPathMap[filename] = "/assets/" + file;
      console.log("Asset loaded:", file);
    }
  });

  world.pickupTypes = [
    world.assetIdMap.pickup_damage,
    world.assetIdMap.pickup_heal,
    world.assetIdMap.pickup_movement,
    world.assetIdMap.pickup_reload,
  ];

  // TODO: do this...
  //
  // world.getAsset = (assetId) => {
  //   if (world.assets[assetId]) {
  //     return world.assets[assetId];
  //   } else {
  //     return world.placeholderAsset;
  //   }
  // };
}

export function addPlayerComponents(world, eid, width = 0, height = 0, isMobile = 0) {
  addComponent(world, Player, eid);
  addComponent(world, Position, eid);
  addComponent(world, Velocity, eid);
  addComponent(world, Acceleration, eid);
  addComponent(world, Force, eid);
  addComponent(world, Mass, eid);
  addComponent(world, Gun, eid);
  addComponent(world, Body, eid);
  addComponent(world, Input, eid);
  addComponent(world, CircleCollider, eid);
  addComponent(world, Layer, eid);
  removeComponent(world, Follow, eid);

  Layer.layer[eid] = 10;
  Player.color[eid] = randBetween(0, 4);
  Player.health[eid] = 100;
  Player.viewDistanceWidth[eid] = width;
  Player.viewDistanceHeight[eid] = height;
  Player.isMobile[eid] = isMobile;
  Position.x[eid] = randBetween(-100, 100);
  Position.y[eid] = randBetween(-100, 100);
  Gun.rateOfFire[eid] = 1;
  Gun.source[eid] = eid;
  Gun.damage[eid] = 40;
  Body.power[eid] = 2000;
  Body.angle[eid] = Math.random() * Math.PI * 2;
  Body.rotationSpeed[eid] = Math.PI * 6;
  Mass.value[eid] = 5;
  CircleCollider.radius[eid] = 21;

  return eid;
}
















