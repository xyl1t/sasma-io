import { defineQuery, defineSystem, hasComponent, Not } from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Bot } from "../components/Bot.js";
import { Gun } from "../components/Gun.js";

import { Input } from "../components/Input.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { Velocity } from "../components/Velocity.js";
import { Me } from "/components/Me.js";

const spriteQuery = defineQuery([Position, Sprite]);
const playerQuery = defineQuery([Player, Position, Velocity]);
const entities = defineQuery([Position]);
const meQuery = defineQuery([Me]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, images, imagesMap } = world;
  ctx.save();
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.translate(world.windowWidth / 2, world.windowHeight / 2);

  const meId = meQuery(world)[0];
  ctx.translate(-Position.x[meId], -Position.y[meId]);

  // NOTE: Draw players
  const playerEnts = playerQuery(world);
  for (const id of playerEnts) {
    drawPlayer(world, id);
  }

  // NOTE: Draw basic sprites
  const sprites = spriteQuery(world);
  for (const id of sprites) {
    const img = images[Sprite.texture[id]];
    ctx.drawImage(img, Position.x[id] - img.width / 2, Position.y[id] - img.height /2);
  }

  const allDrawAbles = entities(world);
  for (const id of allDrawAbles) {
    ctx.save();
    ctx.translate(Position.x[id], Position.y[id]);
    ctx.fillStyle = "#fff";
    ctx.fillRect(
      -ctx.measureText(id).width / 2 - 2,
      -10 + 0,
      ctx.measureText(id).width + 4,
      12
    );
    ctx.fillStyle = "#000";
    ctx.fillText(id, -ctx.measureText(id).width / 2, 0);
    ctx.restore();
  }

  ctx.strokeStyle = "black";
  ctx.strokeRect(0, 0, 800, 600);

  ctx.restore();

  return world;
});

function drawPlayer(world, id) {
  const { canvas, ctx, images, imagesMap } = world;
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);
  ctx.save();
  ctx.rotate(Body.angle[id] - Math.PI / 2);
  ctx.translate(
    -imagesMap.tankBody_blue_outline.width / 2,
    -imagesMap.tankBody_blue_outline.height / 2
  );
  if (hasComponent(world, Bot, id)) {
    ctx.drawImage(imagesMap.tankBody_red_outline, 0, 0);
  } else {
    ctx.drawImage(imagesMap.tankBody_blue_outline, 0, 0);
  }
  ctx.restore();

  ctx.save();
  ctx.rotate(Gun.angle[id] - Math.PI / 2);
  ctx.translate(
    -imagesMap.tankBlue_barrel2_outline.width / 2,
    -imagesMap.tankBlue_barrel2_outline.height / 2 +
      imagesMap.tankBody_blue_outline.height / 4
  );
  if (hasComponent(world, Bot, id)) {
    ctx.drawImage(imagesMap.tankRed_barrel2_outline, 0, 0);
  } else {
    ctx.drawImage(imagesMap.tankBlue_barrel2_outline, 0, 0);
  }
  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "#f00";
  ctx.beginPath(); // Start a new path
  ctx.moveTo(0, 0); // Move the pen to (30, 50)
  ctx.lineTo(
    Math.cos(Body.angle[id]) * Velocity.x[id],
    Math.sin(Body.angle[id]) * Velocity.y[id]
  ); // Draw a line to (150, 100)
  ctx.stroke(); // Render the path
  ctx.restore();

  ctx.restore();
}
