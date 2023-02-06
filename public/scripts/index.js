import { renderingSystem } from "/systems/RenderingSystem.js";
import { setup } from "./setup.js";
import { hasComponent } from "/bitecs.js";
import { Body } from "/components/Body.js";

$(async () => {
  await setup();
  gameloop();
});

import { world, serialize, deserialize, queryMe } from "./world.js";
import { DESERIALIZE_MODE } from "/bitecs.js";
import { Input } from "/components/Input.js";
import { defineQuery, enterQuery, exitQuery } from "/bitecs.js";

const inputQuery = defineQuery([Input]);
const enteredInputQuery = enterQuery(inputQuery);
const exitInputQuery = exitQuery(inputQuery);

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

  if (world.gameStarted) {
    $("#btnJoin").attr("disabled", true);
    $("#txtNotice").css("visibility", "visible");
  } else {
    if (!hasComponent(world, Input, queryMe(world)[0])) {
      $("#startPageContainer").css("display", "block");
      $("#gameContainer").css("filter", "brightness(30%)");
    } else {
      $("#startPageContainer").css("display", "none");
      $("#gameContainer").css("filter", "none");
    }
    $("#btnJoin").attr("disabled", false);
    $("#txtNotice").css("visibility", "hidden");
  }

  window.requestAnimationFrame(gameloop);
}

let oldInput = { inputY: 0, inputX: 0, angle: 0, shooting: 0 };
function getInput() {
  const { mouse, keyboard, joy } = world;
  const inputPayload = { ...oldInput };

  inputPayload.inputY = keyboard["w"] ? 1 : 0;
  inputPayload.inputY += keyboard["s"] ? -1 : 0;
  inputPayload.inputX = keyboard["a"] ? -1 : 0;
  inputPayload.inputX += keyboard["d"] ? 1 : 0;

  inputPayload.shooting = mouse.leftDown || mouse.rightDown;

  const meId = queryMe(world)[0];

  inputPayload.angle = Math.round(mouse.angle * 100) / 100;

  if (joy.joyAngle.angle) {
    inputPayload.angle = joy["joyAngle"].angle;
    inputPayload.shooting = joy["joyAngle"].bounds;
  }

  if (joy.joyMove.x || joy.joyMove.y) {
    inputPayload.inputX = joy["joyMove"].x;
    inputPayload.inputY = joy["joyMove"].y;
  }

  if (inputPayload.inputY < -0.3) {
    inputPayload.inputX *= -1;
  }

  if (world.dynamicCamera && hasComponent(world, Body, meId)) {
    inputPayload.angle += Body.angle[meId] + Math.PI / 2;
  }

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
