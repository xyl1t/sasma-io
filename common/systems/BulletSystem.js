import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  Not,
  removeEntity,
} from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Sprite } from "../components/Sprite.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { Bullet } from "../components/Bullet.js";
import { Layer } from "../components/Layer.js";

const bulletQuery = defineQuery([Position, Velocity, Bullet]);

export const bulletSystem = defineSystem((world) => {
  const bulletEntities = bulletQuery(world);
  for (const id of bulletEntities) {
    const length = Math.sqrt(Velocity.x[id] ** 2 + Velocity.y[id] ** 2);

    if (length < 200) {
      // TODO: export to some constant or to bullet/gun comoponent
      const craterId = addEntity(world);
      addComponent(world, Position, craterId);
      Position.x[craterId] = Position.x[id];
      Position.y[craterId] = Position.y[id];
      addComponent(world, Sprite, craterId);
      Sprite.texture[craterId] = world.assetIdMap.oilSpill_large;
      addComponent(world, TimeToLive, craterId);
      TimeToLive.timeToLive[craterId] = 20;
      TimeToLive.fadeTime[craterId] = 1;
      addComponent(world, Layer, craterId);
      Layer.layer[craterId] = 8;

      const explosionId = addEntity(world);
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
      removeEntity(world, id);
    }
  }

  return world;
});
