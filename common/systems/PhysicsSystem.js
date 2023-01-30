import {
  defineQuery,
  defineSystem,
} from "../bitecs.js";

import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";

// QUERIES // Selects all entities that have the following components
const physicsQuery = defineQuery([Position, Velocity]);

// SYSTEMS // a function that runs through some entities and modifies their components
export const physicsSystem = defineSystem((world) => {
  const physicsEntities = physicsQuery(world);
  for (const id of physicsEntities) {
    // make the player go the other way when hitting a the corners

    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;

    if (Position.x[id] < 0 || Position.x[id] >= 800) {
      Velocity.x[id] *= -1;
    }
    if (Position.y[id] < 0 || Position.y[id] >= 600) {
      Velocity.y[id] *= -1;
    }

    if (Position.x[id] < 0) {
      Position.x[id] = 0;
    }
    if (Position.x[id] >= 800) {
      Position.x[id] = 800-1;
    }
    if (Position.y[id] < 0) {
      Position.y[id] = 0;
    }
    if (Position.y[id] >= 600) {
      Position.y[id] = 600-1;
    }

    Rotation.angle[id] += world.dt;
  }
  return world;
});
