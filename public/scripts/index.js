import { renderingSystem } from "/systems/RenderingSystem.js";
import {
  setup,
} from "./setup.js";

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
    inputSystem(world);

    if (world.gotInput) {
      // console.log(queryMe(world));
      // console.log(deserialize(world, packet, DESERIALIZE_MODE.MAP));
      const me = queryMe(world); // only send myself
      const packet = serialize(me);
      world.socket.emit("playerInput", packet); // TODO: handle in server
    }

    // don't touch this
    accumulator -= world.dt;
    world.currentTick++;
  }

  // TODO: interpolate game states for rendering?
  renderingSystem(world);

  window.requestAnimationFrame(gameloop);
}
