import { defineQuery, defineSystem, Not } from "../bitecs.js";

import { Rotation } from "../components/Rotation.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";

const spriteQuery = defineQuery([Not(Player), Position, Sprite]);
const playerQuery = defineQuery([Player, Position, Rotation]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, images, imagesMap } = world;
  ctx.save();
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const playerEnts = playerQuery(world);
  for (const id of playerEnts) {
    ctx.save();
      ctx.translate(Position.x[id], Position.y[id]);
      ctx.save();
        ctx.translate(
          -imagesMap.tankBody_blue_outline.width / 2,
          -imagesMap.tankBody_blue_outline.height / 2
        );
        ctx.drawImage(imagesMap.tankBody_blue_outline, 0, 0);
      ctx.restore();

      ctx.save();
        ctx.rotate(Rotation.angle[id] - Math.PI/2);
        ctx.translate(
          -imagesMap.tankBlue_barrel2_outline.width / 2,
          -imagesMap.tankBlue_barrel2_outline.height / 2 + imagesMap.tankBody_blue_outline.height / 4
        );
        ctx.drawImage(imagesMap.tankBlue_barrel2_outline, 0, 0);
      ctx.restore();
    ctx.restore();
  }

  const renderAbleEntities = spriteQuery(world);
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
