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
import { Track } from "../components/Track.js";
import { Layer } from "../components/Layer.js";

// const query = defineQuery([Gun, Position, Not(Bot)]);
const query = defineQuery([Gun, Position]);

export const gunSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    if (Gun.shooting[id] && Gun.reloadTimeLeft[id] <= 0) {
      Gun.reloadTimeLeft[id] = Gun.rateOfFire[id];

      const barrelExplosionId = addEntity(world);
      addComponent(world, TimeToLive, barrelExplosionId);
      TimeToLive.timeToLive[barrelExplosionId] = 0.1;
      TimeToLive.fadeTime[barrelExplosionId] = 0.1;

      addComponent(world, Rotation, barrelExplosionId);
      Rotation.angle[barrelExplosionId] = Gun.angle[id] + Math.PI;

      addComponent(world, Position, barrelExplosionId);
      Position.x[barrelExplosionId] = Math.cos(Gun.angle[id]) * 40;
      Position.y[barrelExplosionId] = Math.sin(Gun.angle[id]) * 40;

      addComponent(world, Sprite, barrelExplosionId);
      Sprite.texture[barrelExplosionId] = world.assetIdMap.shotLarge;

      addComponent(world, Layer, barrelExplosionId);
      Layer.layer[barrelExplosionId] = 13;

      addComponent(world, Track, barrelExplosionId);
      Track.source[barrelExplosionId] = id;

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

      addComponent(world, Layer, bulletId);
      Layer.layer[bulletId] = 11;

      addComponent(world, Bullet, bulletId);
      Bullet.source[bulletId] = id;
      Bullet.damage[bulletId] = Gun.damage[id];
    } else {
      if (Gun.reloadTimeLeft[id] > 0) {
        Gun.reloadTimeLeft[id] -= world.dt;
      }
    }
  }

  return world;
});
