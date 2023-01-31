import {
  defineQuery,
  defineSystem,
} from "../bitecs.js";

import { Position } from "../components/Position.js";

// QUERIES // Selects all entities that have the following components
const query = defineQuery([Position]);

// SYSTEMS // a function that runs through some entities and modifies their components
export const collisionSystem = defineSystem((world) => {
  const ents = query(world);
  for (const id of ents) {
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
  }
  return world;
});
