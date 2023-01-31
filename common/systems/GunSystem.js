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

const query = defineQuery([Gun, Position, Not(Bot)]);

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
      Position.x[bulletId] = Position.x[id];
      Position.y[bulletId] = Position.y[id];

      addComponent(world, Velocity, bulletId);
      Velocity.x[bulletId] = Math.cos(Gun.angle[id]) * 2000; // TODO: add `bulletSpeed` field to gun
      Velocity.y[bulletId] = Math.sin(Gun.angle[id]) * 2000;

      addComponent(world, Rotation, bulletId);
      Rotation.angle[bulletId] = Gun.angle[id];

      addComponent(world, Sprite, bulletId);
      let spriteId = world.assetIdMap.bullet_dark_1;
      let sourceId = Gun.source[id];
      if (hasComponent(world, Player, sourceId)) {
        spriteId = world.assetIdMap["bullet_"+world.colorMap[Player.color[sourceId]]+"_1"];
      }
      Sprite.texture[bulletId] = spriteId;

      addComponent(world, Bullet, bulletId);
      Bullet.source[bulletId] = id;
    }
  }

  return world;
});
