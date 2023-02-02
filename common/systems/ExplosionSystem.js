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
import { Animation } from "../components/Animation.js";
import { Bullet } from "../components/Bullet.js";

const bulletQuery = defineQuery([Position, Velocity, Bullet]);

export const explosionSystem = defineSystem((world) => {
  const bulletEntities = bulletQuery(world);
  for (const id of bulletEntities) {

    const length = Math.sqrt(Velocity.x[id] ** 2 + Velocity.y[id] ** 2);

    if (length < 200) { // TODO: export to some constant or to bullet/gun comoponent
      removeEntity(world, id);
      const explosionId = addEntity(world);
      addComponent(world, Position, explosionId);
      Position.x[explosionId] = Position.x[id];
      Position.y[explosionId] = Position.y[id];

      addComponent(world, Sprite, explosionId);
      Sprite.texture[explosionId] = world.assetIdMap.oilSpill_large;

      addComponent(world, TimeToLive, explosionId);
      TimeToLive.timeToLive[explosionId] = 20;
      TimeToLive.fadeTime[explosionId] = 20;
      
      addComponent(world, Animation, explosionId);
      let spriteIdxs = [];
      for (let idx = 1; idx <= 5; idx ++){
        spriteIdxs.push(world.assetIdMap['explosionSmoke' + idx]);
      }
      Animation.numberOfSprites[explosionId] = spriteIdxs.length;
      Animation.sprites[explosionId].set(spriteIdxs)
      Animation.interval[explosionId] = 0.05;
      Animation.lastTime[explosionId] = 0;
      Animation.current[explosionId] = 0;
    }
  }
});
