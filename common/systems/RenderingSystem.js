import { defineQuery, defineSystem } from "../bitecs.js";

import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";

const query = defineQuery([Position, Sprite]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, images } = world;
  ctx.save();
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const renderAbleEntities = query(world);
  for (const id of renderAbleEntities) {
    ctx.drawImage(
      images[Sprite.texture[id]],
      Position.x[id],
      Position.y[id]
    );
  }
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, 0, 400, 300);
  ctx.restore();

  return world;
});
