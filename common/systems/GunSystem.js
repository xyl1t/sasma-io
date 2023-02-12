import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  Not,
} from "../bitecs.js";
import { Bullet } from "../components/Bullet.js";
import { Gun } from "../components/Gun.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { Velocity } from "../components/Velocity.js";
import { Rotation } from "../components/Rotation.js";
import { Bot } from "../components/Bot.js";
import { Player } from "../components/Player.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { Follow } from "../components/Follow.js";
import { Layer } from "../components/Layer.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { PickupEffect } from "../components/PickupEffect.js";

// const query = defineQuery([Gun, Position, Not(Bot)]);
const query = defineQuery([Gun, Position]);

export const gunSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    if (Gun.reloadTimeLeft[id] > 0) {
      Gun.reloadTimeLeft[id] -= world.dt;
    } else if (Gun.shooting[id]) {
      Gun.reloadTimeLeft[id] = Gun.rateOfFire[id];

      addBarrelExplosion(world, id);
      shootBullet(world, id);
    }
  }

  return world;
});

function addBarrelExplosion(world, gunId) {
  const barrelExplosionId = addEntity(world);
  addComponent(world, TimeToLive, barrelExplosionId);
  const barrelExplosionTime = 0.1;
  TimeToLive.timeToLive[barrelExplosionId] = barrelExplosionTime;
  TimeToLive.fadeTime[barrelExplosionId] = barrelExplosionTime;

  addComponent(world, Rotation, barrelExplosionId);
  Rotation.angle[barrelExplosionId] = Gun.angle[gunId] + Math.PI;

  addComponent(world, Position, barrelExplosionId);
  Position.x[barrelExplosionId] = Math.cos(Gun.angle[gunId]) * 40;
  Position.y[barrelExplosionId] = Math.sin(Gun.angle[gunId]) * 40;

  addComponent(world, Sprite, barrelExplosionId);
  Sprite.texture[barrelExplosionId] = world.assetIdMap.shot_3;

  addComponent(world, Layer, barrelExplosionId);
  Layer.layer[barrelExplosionId] = 13;

  addComponent(world, Follow, barrelExplosionId);
  Follow.source[barrelExplosionId] = gunId;
}

function shootBullet(world, gunId) {
  const bulletId = addEntity(world);

  addComponent(world, Position, bulletId);
  Position.x[bulletId] = Position.x[gunId] + Math.cos(Gun.angle[gunId]) * 20;
  Position.y[bulletId] = Position.y[gunId] + Math.sin(Gun.angle[gunId]) * 20;

  addComponent(world, Velocity, bulletId);
  addComponent(world, Acceleration, bulletId);
  addComponent(world, Force, bulletId);
  addComponent(world, Mass, bulletId);
  Mass.value[bulletId] = 1;
  Force.x[bulletId] = Math.cos(Gun.angle[gunId]) * 2000;
  Force.y[bulletId] = Math.sin(Gun.angle[gunId]) * 2000;

  addComponent(world, CircleCollider, bulletId);
  CircleCollider.radius[bulletId] = 5;

  addComponent(world, Sprite, bulletId);
  let spriteId = world.assetIdMap.bullet_dark_1;
  let sourceId = Gun.source[gunId];
  if (hasComponent(world, Player, sourceId)) {
    let spriteName = "bullet_" + world.colorMap[Player.color[sourceId]] + "_1";
    if (hasComponent(world, PickupEffect, sourceId)) {
      if (PickupEffect.type[sourceId] == world.assetIdMap.pickup_damage) {
        spriteName = "bullet_" + world.colorMap[Player.color[sourceId]] + "_2";
        Mass.value[bulletId] *= 5;
        Force.x[bulletId] *= 5;
        Force.y[bulletId] *= 5;
      } else if (
        PickupEffect.type[sourceId] == world.assetIdMap.pickup_reload
      ) {
        spriteName = "bullet_" + world.colorMap[Player.color[sourceId]] + "_3";
      }
    }

    spriteId = world.assetIdMap[spriteName];
  }
  Sprite.texture[bulletId] = spriteId;

  addComponent(world, Layer, bulletId);
  Layer.layer[bulletId] = 11;

  addComponent(world, Bullet, bulletId);
  Bullet.source[bulletId] = gunId;
  Bullet.damage[bulletId] = Gun.damage[gunId];
}
