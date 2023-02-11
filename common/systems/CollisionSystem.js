import { defineQuery, defineSystem } from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Player } from "../components/Player.js";
import { Zone } from "../components/Zone.js";
import { Pickup } from "../components/Pickup.js";

const playerQuery = defineQuery([Position, Player]);
const pickupQuery = defineQuery([Position, Pickup]);
const zoneQuery = defineQuery([Zone]);

export const collisionSystem = defineSystem((world) => {
  const players = playerQuery(world);
  const pickup = pickupQuery(world);
  const zones = zoneQuery(world);

  for (const zId of zones) {
    let zoneSize = Zone.size[zId];

    for (const id of players) {
      let posX = Position.x[id];
      let posY = Position.y[id];
      // hypotenuse = distance from center of circle to player
      let hypotenuse = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
      if (hypotenuse >= zoneSize || hypotenuse <= -zoneSize) {
        if (Zone.collision[zId] == 1) {
          Position.x[id] = (posX * zoneSize) / hypotenuse;
          Position.y[id] = (posY * zoneSize) / hypotenuse;
        } else {
          Player.health[id] -= 10 * world.dt;
        }
      }
    }

    for (const id of pickup) {
      let posX = Position.x[id];
      let posY = Position.y[id];
      // hypotenuse = distance from center of circle to player
      let hypotenuse = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
      if (hypotenuse >= zoneSize || hypotenuse <= -zoneSize) {
        if (Zone.collision[zId] == 1) {
          Position.x[id] = (posX * zoneSize) / hypotenuse;
          Position.y[id] = (posY * zoneSize) / hypotenuse;
        } else {
          Player.health[id] -= 10 * world.dt;
        }
      }
    }
  }

  //Collision for outer zone(s)
  return world;
});
