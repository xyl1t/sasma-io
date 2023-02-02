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

// const query = defineQuery([Gun, Position, Not(Bot)]);
const query = defineQuery([Gun, Position]);

export const gunSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    if (
      Gun.shooting[id] &&
      Gun.lastTimeFired[id] + Gun.rateOfFire[id] < world.timeSinceStart
    ) {
      Gun.lastTimeFired[id] = world.timeSinceStart;
      const bulletId = addEntity(world);

      addComponent(world, Position, bulletId);
      Position.x[bulletId] = Position.x[id] + Math.cos(Gun.angle[id]) * 10;
      Position.y[bulletId] = Position.y[id] + Math.sin(Gun.angle[id]) * 10;

      addComponent(world, Velocity, bulletId);
      addComponent(world, Acceleration, bulletId);
      addComponent(world, Force, bulletId);
      addComponent(world, Mass, bulletId);
      Mass.value[bulletId] = 1; // TODO: add `bulletSpeed` field to gun
      Force.x[bulletId] = Math.cos(Gun.angle[id]) * 100000; // TODO: add `bulletSpeed` field to gun
      Force.y[bulletId] = Math.sin(Gun.angle[id]) * 100000;

      addComponent(world, CircleCollider, bulletId);
      CircleCollider.radius[bulletId] = 5;

      addComponent(world, Sprite, bulletId);
      let spriteId = world.assetIdMap.bullet_dark_1;
      let sourceId = Gun.source[id];
      if (hasComponent(world, Player, sourceId)) {
        spriteId =
          world.assetIdMap[
            "bullet_" + world.colorMap[Player.color[sourceId]] + "_1"
          ];
      }
      Sprite.texture[bulletId] = spriteId;

      addComponent(world, Bullet, bulletId);
      Bullet.source[bulletId] = id;
    }
  }

  return world;
});
