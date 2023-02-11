import { defineQuery, defineSystem, addComponent, Not, removeEntity, removeComponent } from "../bitecs.js";
import { Vector, randBetween } from "../util.js";

import { Player } from "../components/Player.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Gun } from "../components/Gun.js";
import { Body } from "../components/Body.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { Layer } from "../components/Layer.js";
import { Velocity } from "../components/Velocity.js";
import { Position } from "../components/Position.js";
import { Input } from "../components/Input.js";
import { Bot } from "../components/Bot.js";
import { Follow } from "../components/Follow.js";
import { addPlayerComponents } from "../serverWorld.js";

const botsQuery = defineQuery([Player, Bot]);
const query = defineQuery([Player, Bot, Input]);

export const botSystem = defineSystem((world) => {
  const bots = botsQuery(world);
  for (const id of bots) {
    if (Player.health[id] <= 0 && !world.gameStarted) {
      // TODO: use addPlayerComponents() from server.js
      addPlayerComponents(world, id);
    } else if (Player.health[id] <= 0 && world.gameStarted) {
      removeEntity(world, id);
    }
  }

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
