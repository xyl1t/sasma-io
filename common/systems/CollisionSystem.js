import { defineQuery, defineSystem } from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Player } from "../components/Player.js";

const playerQuery = defineQuery([Position, Player]);

export const collisionSystem = defineSystem((world) => {
  const ents = playerQuery(world);
  for (const id of ents) {
    let posX = Position.x[id];
    let posY = Position.y[id];
    // hypotenuse = distance from center of circle to player
    let hypotenuse = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
    if (hypotenuse >= 1000 || hypotenuse <= -1000) {
      Position.x[id] = (posX * 1000) / hypotenuse;
      Position.y[id] = (posY * 1000) / hypotenuse;
    }
  }
  return world;
});
