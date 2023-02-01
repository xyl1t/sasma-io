import { addEntity, addComponent, defineQuery, defineSystem } from "../bitecs.js";
import { Vector } from "../util.js";

import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Player } from "../components/Player.js";
import { Input } from "../components/Input.js";
import { Me } from "../components/Me.js";
import { Body } from "../components/Body.js";
import { Gun } from "../components/Gun.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Sprite } from "../components/Sprite.js";

const query = defineQuery([Player, Input, Position, Velocity, Body, Gun, Acceleration, Force, Mass]);

export const handleInputSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    const inputX = Math.max(-1, Math.min(1, Input.inputX[id]));
    const inputY = Math.max(-1, Math.min(1, Input.inputY[id]));
    const angle = Input.angle[id];
    const shooting = Input.shooting[id];

    Body.movingDirection[id] = 0;
    Body.force[id] = 0;
    if (inputX) {
      Body.angle[id] += Body.rotationSpeed[id] * world.dt * inputX;
    }
    if (inputY) {
      Body.movingDirection[id] = inputY;
      Body.force[id] = Body.power[id] / Mass.value[id] * inputY;
    }

    Gun.angle[id] = angle;
    Gun.shooting[id] = shooting;
  }

  return world;
});
