import { defineQuery, defineSystem, Not } from "../bitecs.js";
import { Vector } from "../util.js"

import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Player } from "../components/Player.js";
import { Input } from "../components/Input.js";
import { Me } from "../components/Me.js";
import { Body } from "../components/Body.js";
import { Gun } from "../components/Gun.js";
import { Bot } from "../components/Bot.js";

const query = defineQuery([Player, Bot, Input]);

export const botSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    Input.inputX[id] = Math.sin(world.timeSinceStart/(id+1)/2);
    Input.inputY[id] = Math.cos(world.timeSinceStart/(id+1));
    // console.log(Input.inputX[id]);
    Input.angle[id] = (world.timeSinceStart)/(id+1)*2;
    // console.log(world.timeSinceStart)
    Input.shooting[id] = 0;
  }

  return world;
});
