import { renderingSystem } from "/systems/RenderingSystem.js";
import { setup } from "./setup.js";

$(async () => {
  await setup();
  gameloop();
});

import { world, serialize, deserialize, queryMe } from "./world.js";
import { inputSystem } from "/systems/InputSystem.js";
import { DESERIALIZE_MODE } from "/bitecs.js";

let oldTime = 0;
let accumulator = 0;
function gameloop(currentTime = 0) {
  currentTime /= 1000; // convert from ms to seconds
  const frameTime = currentTime - oldTime;
  oldTime = currentTime;
  accumulator += frameTime;

  while (accumulator >= world.dt) {
    // NOTE: game logic here (input, client prediction, etc.)
    // gameLogicSomethingSystem(world);
    const inputPayload = getInput();

    if (inputPayload) {
      world.socket.emit("playerInput", inputPayload);
    }

    // don't touch this
    accumulator -= world.dt;
    world.currentTick++;
  }

  // TODO: interpolate game states for rendering?
  renderingSystem(world);

  window.requestAnimationFrame(gameloop);
}

let oldInput = { inputY: 0, inputX: 0, angle: 0, shooting: 0 };
function getInput() {
  const { mouse, keyboard } = world;
  const inputPayload = { ...oldInput };

  inputPayload.inputY = (keyboard["w"] ? -1 : 0)
  inputPayload.inputY += (keyboard["s"] ? 1 : 0)
  inputPayload.inputX = (keyboard["a"] ? -1 : 0)
  inputPayload.inputX += (keyboard["d"] ? 1 : 0)

  inputPayload.shooting = (mouse.leftDown || mouse.rightDown)

  inputPayload.angle = Math.round(mouse.angle*100)/100;

  const gotInput =
    oldInput.inputY != inputPayload.inputY ||
    oldInput.inputX != inputPayload.inputX ||
    oldInput.angle != inputPayload.angle ||
    oldInput.shooting != inputPayload.shooting;

  oldInput = { ...inputPayload };

  if (gotInput) {
    return inputPayload;
  }
}
