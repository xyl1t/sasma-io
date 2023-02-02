import { defineQuery, defineSystem } from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Player } from "../components/Player.js";
import { Zone } from "../components/Zone.js";

const playerQuery = defineQuery([Position, Player]);
const zoneQuery = defineQuery([Zone]);

export const collisionSystem = defineSystem((world) => {
  const ents = playerQuery(world);
  const zones = zoneQuery(world);
  for (const id of ents) {
    let posX = Position.x[id];
    let posY = Position.y[id];
    // hypotenuse = distance from center of circle to player
    let hypotenuse = Math.sqrt(Math.pow(posX, 2) + Math.pow(posY, 2));
    for(const zId of zones){
        let zoneSize = Zone.size[zId];
        if (hypotenuse >= zoneSize || hypotenuse <= -zoneSize) {
          if(Zone.collision[zId] == 1){
            Position.x[id] = (posX * zoneSize) / hypotenuse;
            Position.y[id] = (posY * zoneSize) / hypotenuse;
          }else{
           //damage
          }
        }
    }
  }
  //Collision for outer zone(s)
  return world;
});
