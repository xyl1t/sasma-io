import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  removeComponent,
} from "../bitecs.js";
import { Player } from "../components/Player.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Gun } from "../components/Gun.js";
import { Body } from "../components/Body.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { Layer } from "../components/Layer.js";
import { Velocity } from "../components/Velocity.js";
import { Position } from "../components/Position.js";
import { Input } from "../components/Input.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { Rotation } from "../components/Rotation.js";
import { Sprite } from "../components/Sprite.js";
import { randBetween } from "../util.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { Bot } from "../components/Bot.js";
import { Pickup } from "../components/Pickup.js";

const query = defineQuery([Player]);

export const playerSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    if (Player.health[id] <= 0 && hasComponent(world, Input, id)) {
      // // HACK: if you don't do this it will always add a corpse
      // if (!hasComponent(world, Bot, id)) {
      //   Player.health[id] = 100;
      // }
      const explosionId = addEntity(world);
      const deadBodyId = addEntity(world);
      const deadBarrelId = addEntity(world);
      const craterId = addEntity(world);

      addComponent(world, Position, explosionId);
      Position.x[explosionId] = Position.x[id];
      Position.y[explosionId] = Position.y[id];
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

      addComponent(world, Position, craterId);
      Position.x[craterId] = Position.x[id] + randBetween(-30, 30);
      Position.y[craterId] = Position.y[id] + randBetween(-30, 30);
      addComponent(world, Sprite, craterId);
      Sprite.texture[craterId] = world.assetIdMap.oilSpill_large;
      addComponent(world, Layer, craterId);
      Layer.layer[craterId] = 3;
      addComponent(world, TimeToLive, craterId);
      TimeToLive.timeToLive[craterId] = 30;
      TimeToLive.fadeTime[craterId] = 1;

      addComponent(world, Position, deadBodyId);
      Position.x[deadBodyId] = Position.x[id];
      Position.y[deadBodyId] = Position.y[id];
      addComponent(world, Velocity, deadBodyId);
      addComponent(world, Mass, deadBodyId);
      Mass.value[deadBodyId] = 4;
      addComponent(world, CircleCollider, deadBodyId);
      CircleCollider.radius[deadBodyId] = CircleCollider.radius[id];
      addComponent(world, Sprite, deadBodyId);
      Sprite.texture[deadBodyId] = world.assetIdMap.tank_body_dark;
      addComponent(world, Rotation, deadBodyId);
      Rotation.angle[deadBodyId] = Body.angle[id];
      addComponent(world, Layer, deadBodyId);
      Layer.layer[deadBodyId] = 5;
      addComponent(world, TimeToLive, deadBodyId);
      TimeToLive.timeToLive[deadBodyId] = 20;
      TimeToLive.fadeTime[deadBodyId] = 1;

      addComponent(world, Position, deadBarrelId);
      Position.x[deadBarrelId] = Position.x[id];
      Position.y[deadBarrelId] = Position.y[id];
      addComponent(world, Sprite, deadBarrelId);
      Sprite.texture[deadBarrelId] = world.assetIdMap.tank_barrel_dark_2;
      addComponent(world, Rotation, deadBarrelId);
      Rotation.angle[deadBarrelId] = Gun.angle[id];
      addComponent(world, Velocity, deadBarrelId);
      Velocity.x[deadBarrelId] =
        Math.cos(Body.velocity[id]) * randBetween(-50, -300);
      Velocity.y[deadBarrelId] =
        Math.sin(Body.velocity[id]) * randBetween(-50, -300);
      addComponent(world, Layer, deadBarrelId);
      Layer.layer[deadBarrelId] = 7;
      addComponent(world, TimeToLive, deadBarrelId);
      TimeToLive.timeToLive[deadBarrelId] = 30;
      TimeToLive.fadeTime[deadBarrelId] = 1;

      // add pickup
      const pickupId = addEntity(world);
      addComponent(world, Position, pickupId);
      Position.x[pickupId] = Position.x[id];
      Position.y[pickupId] = Position.y[id];
      addComponent(world, Layer, pickupId);
      Layer.layer[pickupId] = 9;
      addComponent(world, Sprite, pickupId);
      addComponent(world, Velocity, pickupId);
      Velocity.x[pickupId] = randBetween(-300, 300);
      Velocity.y[pickupId] = randBetween(-300, 300);
      const types = [
        world.assetIdMap.pickup_damage,
        world.assetIdMap.pickup_heal,
        world.assetIdMap.pickup_movement,
        world.assetIdMap.pickup_reload,
      ];
      let randType = types[Math.round(randBetween(0, types.length - 1))];
      Sprite.texture[pickupId] = randType;
      addComponent(world, Pickup, pickupId);
      Pickup.type[pickupId] = randType;

      removeComponent(world, Input, id);
      removeComponent(world, CircleCollider, id);
      removeComponent(world, Body, id);
    }
  }

  return world;
});
