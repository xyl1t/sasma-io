import {
  addComponent,
  addEntity,
  defineSystem,
  hasComponent,
  removeEntity,
} from "../bitecs.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { Bullet } from "../components/Bullet.js";
import { PickupDropper } from "../components/PickupDropper.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Layer } from "../components/Layer.js";
import { Sprite } from "../components/Sprite.js";
import { Pickup } from "../components/Pickup.js";
import { randBetween } from "../util.js";
import { Velocity } from "../components/Velocity.js";
import { CapsuleCollider } from "../components/CapsuleCollider.js";
import { Gun } from "../components/Gun.js";

export const handleCollidingPairsSystem = defineSystem((world) => {
  for (let [id1, id2] of world.collidingPairs) {
    const isBullet1 = hasComponent(world, Bullet, id1);
    const isBullet2 = hasComponent(world, Bullet, id2);
    const isPlayer1 = hasComponent(world, Player, id1);
    const isPlayer2 = hasComponent(world, Player, id2);
    if ((isBullet1 && isPlayer2) || (isPlayer1 && isBullet2)) {
      if (hasComponent(world, Bullet, id2)) {
        [id1, id2] = [id2, id1];
      }
      handleBulletPlayerHit(world, id1, id2);
    }

    const isDropper1 = hasComponent(world, PickupDropper, id1);
    const isDropper2 = hasComponent(world, PickupDropper, id2);
    if ((isBullet1 && isDropper2) || (isDropper1 && isBullet2)) {
      if (hasComponent(world, Bullet, id2)) {
        [id1, id2] = [id2, id1];
      }
      handleBulletDropperHit(world, id1, id2);
    }
  }

  return world;
});

function handleBulletDropperHit(world, bulletId, dropperId) {
  const explosionId = addEntity(world);
  addComponent(world, Position, explosionId);
  Position.x[explosionId] = Position.x[dropperId];
  Position.y[explosionId] = Position.y[dropperId];
  addComponent(world, AnimatedSprite, explosionId);
  let spriteIdxs = [];
  for (let idx = 1; idx <= 5; idx++) {
    spriteIdxs.push(world.assetIdMap["explosionSmoke" + idx]);
  }
  AnimatedSprite.numberOfSprites[explosionId] = spriteIdxs.length;
  AnimatedSprite.sprites[explosionId].set(spriteIdxs);
  AnimatedSprite.interval[explosionId] = 0.05;
  AnimatedSprite.lastTime[explosionId] = 0;
  AnimatedSprite.current[explosionId] = 0;
  addComponent(world, Layer, explosionId);
  Layer.layer[explosionId] = 12;

  const pickupId = addEntity(world);
  addComponent(world, Position, pickupId);
  Position.x[pickupId] = Position.x[dropperId];
  Position.y[pickupId] = Position.y[dropperId];
  addComponent(world, Layer, pickupId);
  Layer.layer[pickupId] = 9;
  addComponent(world, Sprite, pickupId);
  addComponent(world, Velocity, pickupId);
  Velocity.x[pickupId] = randBetween(-100, 100);
  Velocity.y[pickupId] = randBetween(-100, 100);

  let randType =
    world.pickupTypes[parseInt(randBetween(0, world.pickupTypes.length))];

  Sprite.texture[pickupId] = randType;
  addComponent(world, Pickup, pickupId);
  Pickup.type[pickupId] = randType;

  const newBox = addEntity(world);
  addComponent(world, Position, newBox);
  Position.x[newBox] = randomNumber(-1000, 1000);
  Position.y[newBox] = randomNumber(-1000, 1000);
  addComponent(world, Layer, newBox);
  Layer.layer[newBox] = 9;
  addComponent(world, Sprite, newBox);
  addComponent(world, CapsuleCollider, newBox);

  addComponent(world, PickupDropper, newBox);
  Sprite.texture[newBox] = world.assetIdMap.crate_wood;
  CapsuleCollider.radius[newBox] = 4;
  CapsuleCollider.sx[newBox][0] = -10;
  CapsuleCollider.sy[newBox][0] = -10;
  CapsuleCollider.ex[newBox][0] = -10;
  CapsuleCollider.ey[newBox][0] = 10;
  CapsuleCollider.sx[newBox][1] = -10;
  CapsuleCollider.sy[newBox][1] = 10;
  CapsuleCollider.ex[newBox][1] = 10;
  CapsuleCollider.ey[newBox][1] = 10;
  CapsuleCollider.sx[newBox][2] = 10;
  CapsuleCollider.sy[newBox][2] = 10;
  CapsuleCollider.ex[newBox][2] = 10;
  CapsuleCollider.ey[newBox][2] = -10;
  CapsuleCollider.sx[newBox][3] = 10;
  CapsuleCollider.sy[newBox][3] = -10;
  CapsuleCollider.ex[newBox][3] = -10;
  CapsuleCollider.ey[newBox][3] = -10;
  CapsuleCollider.capsuleCount[newBox] = 4;

  removeEntity(world, dropperId);
  removeEntity(world, bulletId);
}

function handleBulletPlayerHit(world, bulletId, playerId) {
  const explosionId = addEntity(world);
  addComponent(world, Position, explosionId);
  Position.x[explosionId] = Position.x[bulletId];
  Position.y[explosionId] = Position.y[bulletId];
  addComponent(world, AnimatedSprite, explosionId);
  let spriteIdxs = [];
  for (let idx = 1; idx <= 5; idx++) {
    spriteIdxs.push(world.assetIdMap["explosionSmoke" + idx]);
  }
  AnimatedSprite.numberOfSprites[explosionId] = spriteIdxs.length;
  AnimatedSprite.sprites[explosionId].set(spriteIdxs);
  AnimatedSprite.interval[explosionId] = 0.05;
  AnimatedSprite.lastTime[explosionId] = 0;
  AnimatedSprite.current[explosionId] = 0;

  if (world.currentWaitingTime <= 0) {
    Player.health[playerId] -= Bullet.damage[bulletId];
    Player.damagedBy[playerId] = Gun.source[Bullet.source[bulletId]];
  }

  removeEntity(world, bulletId);
}

function randomNumber(min, max) {
  return Math.random() * (max - min) + min;
}
