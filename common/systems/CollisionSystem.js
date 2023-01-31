import {
  defineQuery,
  defineSystem,
} from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Player } from "../components/Player.js";

// QUERIES // Selects all entities that have the following components
const query = defineQuery([Position]);
const collisionQuery = defineQuery([Position, Player]);

// SYSTEMS // a function that runs through some entities and modifies their components
export const collisionSystem = defineSystem((world) => {
  const ents = collisionQuery(world);
  for (const id of ents) {
    let posX = Position.x[id]
    let posY = Position.y[id]
    let hypotenuse = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2))
    if (hypotenuse >= 400 || hypotenuse <= -400) {
      Position.x[id] = posX * 400 / hypotenuse;
      Position.y[id] = posY * 400 / hypotenuse;
    }
  }
  return world;
});
