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

const bulletQuery = defineQuery([Not(Body), Position, Velocity]);
const explosionQuery = defineQuery([Not(Body), Position, Not(Velocity)]);

export const explosionSystem = defineSystem((world) => {
  const bulletEntities = bulletQuery(world);
  for (const id of bulletEntities) {

    const length = Math.sqrt(Velocity.x[id] ** 2 + Velocity.y[id] ** 2);

    if (length < 200) { // TODO: export to some constant or to bullet/gun comoponent
      removeEntity(world, id);
      for (let idx=0; idx < 5; idx++){
        const explosionId = addEntity(world);
        addComponent(world, Position, explosionId);
        Position.x[explosionId] = Position.x[id];
        Position.y[explosionId] = Position.y[id];
  
        addComponent(world, Sprite, explosionId);
        Sprite.texture[explosionId] = world.assetIdMap['explosionSmoke' + idx];

        addComponent(world, TimeToLive, explosionId);
        TimeToLive.timeToLive[explosionId] = 0.5;
        TimeToLive.fadeTime[explosionId] = 0.5;
      }
      
    }
  }
});
