import {
  defineQuery,
  defineSystem,
} from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";

// QUERIES // Selects all entities that have the following components
const physicsQuery = defineQuery([Position, Velocity]);

// SYSTEMS // a function that runs through some entities and modifies their components
export const physicsSystem = defineSystem((world) => {
  const physicsEntities = physicsQuery(world);
  for (const id of physicsEntities) {
    // make the player go the other way when hitting a the corners
    if (Position.x[id] < 0 || Position.x[id] >= 400) {
      Velocity.x[id] *= -1;
    }
    if (Position.y[id] < 0 || Position.y[id] >= 300) {
      Velocity.y[id] *= -1;
    }

    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;
  }
  return world;
});
