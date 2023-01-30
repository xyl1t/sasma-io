import { defineQuery, defineSystem } from "../bitecs.js";
import { Vector } from "../util.js"

import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Player } from "../components/Player.js";
import { Input } from "../components/Input.js";
import { Me } from "../components/Me.js";

const query = defineQuery([Player, Input, Position, Velocity]);

export const handleInputSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    const inputVec = new Vector(Input.inputX[id], Input.inputY[id]);
    inputVec.normalize();

    Velocity.x[id] = 100 * inputVec.x;
    Velocity.y[id] = 100 * inputVec.y;
  }


  return world;
});
