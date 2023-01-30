import { defineQuery, defineSystem } from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Player } from "../components/Player.js";
import { Input } from "../components/Input.js";
import { Me } from "../components/Me.js";

const query = defineQuery([Me, Player, Input, Position, Velocity]);

export const inputSystem = defineSystem((world) => {
  const entities = query(world);
  const { mouse, keyboard } = world;
  world.gotInput = false;

  // NOTE: Should be just one entity because of the `Me` component
  for (const id of entities) {
    const oldInput = {
      inputY: Input.inputY[id],
      inputX: Input.inputX[id],
      angle: Input.angle[id],
      shooting: Input.shooting[id]
    };

    Input.inputY[id] = 0;
    Input.inputX[id] = 0;
    Input.shooting[id] = 0;

    if (keyboard["w"]) {
      Input.inputY[id] = -1;
    }
    if (keyboard["s"]) {
      Input.inputY[id] = 1;
    }
    if (keyboard["a"]) {
      Input.inputX[id] = -1;
    }
    if (keyboard["d"]) {
      Input.inputX[id] = +1;
    }

    if (mouse.leftDown || mouse.rightDown) {
      Input.shooting[id] = 1;
    }

    if (mouse.angle != mouse.oldAngle) {
      Input.angle[id] = mouse.angle;
    }

    world.gotInput =
      oldInput.inputY != Input.inputY[id] ||
      oldInput.inputX != Input.inputX[id] ||
      oldInput.angle != Input.angle[id] ||
      oldInput.shooting != Input.shooting[id];
  }

  return world;
});
