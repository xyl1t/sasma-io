import { defineQuery, defineSystem } from "../bitecs.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";

import { Zone } from "../components/Zone.js";

const zoneQuery = defineQuery([Zone, Position]);
const playerQuery = defineQuery([Player]);

export const zoneSystem = defineSystem((world) => {
  const zones = zoneQuery(world);

  if (world.gameStarted) {
    for (let zId of zones) {
      if (Zone.size[zId] > 1) {
        Zone.size[zId] -= world.dt * Zone.speed[zId];
      }
    }
  }

  return world;
});
