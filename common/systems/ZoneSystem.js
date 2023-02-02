import { defineQuery, defineSystem } from "../bitecs.js";

import { Zone } from "../components/Zone.js";

const zoneQuery = defineQuery([Zone]);

export const zoneSystem = defineSystem((world) => {
  Zone.size[zoneQuery(world)[0]] -= world.dt * 10;
  return world;
});
