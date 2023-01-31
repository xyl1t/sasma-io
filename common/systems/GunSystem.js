import { addComponent, addEntity, defineQuery, defineSystem } from "../bitecs.js";
import { Bullet } from "../components/Bullet.js";
import { Gun } from "../components/Gun.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { Velocity } from "../components/Velocity.js";
import { Rotation } from "../components/Rotation.js";

const query = defineQuery([Gun, Position]);

export const gunSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    // TODO: handle rate of fire
    if (Gun.shooting[id]) {
      const bulletId = addEntity(world);

      addComponent(world, Position, bulletId);
      Position.x[bulletId] = Position.x[id];
      Position.y[bulletId] = Position.y[id];

      addComponent(world, Velocity, bulletId);
      Velocity.x[bulletId] = Math.cos(Gun.angle[id]) * 1000; // TODO: add `bulletSpeed` field to gun
      Velocity.y[bulletId] = Math.sin(Gun.angle[id]) * 1000;

      addComponent(world, Rotation, bulletId);
      Rotation.angle[bulletId] = Gun.angle[id]; // TODO: add `bulletSpeed` field to gun

      addComponent(world, Sprite, bulletId);
      Sprite.texture[bulletId] = world.assetIdMap.bulletDark1_outline;

      addComponent(world, Bullet, bulletId);
      Bullet.source[bulletId] = id;
    }
  }

  return world;
});
