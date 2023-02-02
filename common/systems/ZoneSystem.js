import { defineQuery, defineSystem } from "../bitecs.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";

import { Zone } from "../components/Zone.js";

const zoneQuery = defineQuery([Zone,Position]);
const playerQuery = defineQuery([Player]);

export const zoneSystem = defineSystem((world) => {
  const zones = zoneQuery(world);

  for(let zId of zones){
    Zone.size[zId] -= world.dt * world.zoneSpeed;
  }

  return world;
});
