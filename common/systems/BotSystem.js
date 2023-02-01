import { defineQuery, defineSystem, Not } from "../bitecs.js";
import { Vector } from "../util.js";

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
    Input.inputX[id] =
      (Math.sin(world.timeSinceStart / 2 + id * id * 1.39) +
        Math.cos((world.timeSinceStart / 4) * 2 + id) +
        Math.sin(world.timeSinceStart / 4 / 3 + id * 159.91)) /
      3;
    Input.inputY[id] = 1;
    Input.angle[id] =
      Math.sin(world.timeSinceStart / 4 + (id * id) / 10) * Math.PI * 2;
    Input.shooting[id] = Math.random() > 0.999 ? 1 : 0;
  }

  return world;
});
