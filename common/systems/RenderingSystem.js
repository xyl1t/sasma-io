import { defineQuery, defineSystem, hasComponent, Not } from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Bot } from "../components/Bot.js";
import { Gun } from "../components/Gun.js";

import { Rotation } from "../components/Rotation.js";
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
const renderableQuery = defineQuery([Position]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  ctx.save();

  // clear screen
  ctx.fillStyle = "lightgray";
  
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  

  // center screen
  ctx.translate(world.windowWidth / 2, world.windowHeight / 2);
  console.log('render scale width: ', world.renderScaleWidth)
  console.log('render scale height: ', world.renderScaleHeight)
  ctx.scale(world.renderScaleWidth, world.renderScaleHeight);
  
  let widthToShow = world.renderScaleWidth >= 1 ? 800 * world.renderScaleWidth : world.windowWidth;
  let heightToShow = world.renderScaleHeight >= 1 ? 800 * world.renderScaleHeight : world.windowHeight;

  ctx.scale(world.renderScaleWidth, world.renderScaleHeight);

  // move to current player
  const meId = meQuery(world)[0];
  ctx.translate(-Position.x[meId], -Position.y[meId]);
  const map = getAsset(assetIdMap["MAP"])
  ctx.drawImage(
    map,
    -map.width / 2,
    -map.height / 2,
    map.width,
    map.height
  );

  const renderables = renderableQuery(world);
  for (const id of renderables) {
    if (hasComponent(world, Player, id)) {
      drawPlayer(world, id);
    }
    if (hasComponent(world, Sprite, id)) {
      drawSprite(world, id);
    }
    if (world.debug.showVelocity && hasComponent(world, Velocity, id)) {
      drawVelocityVectors(world, id);
    }
    if (world.debug.showIds) {
      drawId(world, id);
    }
  }

  // draw circlular border
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, 400, 0, 2 * Math.PI);
  //ctx.arc(canvas.width / 2, canvas.height / 2, 400, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();

  return world;
});

function drawPlayer(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);

  const color = world.colorMap[Player.color[id]];

  // Body
  const tankBody = getAsset(assetIdMap["tank_body_" + color]);
  ctx.save();
  ctx.rotate(Body.angle[id] - Math.PI / 2);
  ctx.translate(-tankBody.width / 2, -tankBody.height / 2);
  ctx.drawImage(tankBody, 0, 0);
  ctx.restore();

  // Barrel
  const tankBarrel = getAsset(assetIdMap["tank_barrel_" + color + "_2"]);
  ctx.save();
  ctx.rotate(Gun.angle[id] - Math.PI / 2);
  ctx.translate(
    -tankBarrel.width / 2,
    -tankBarrel.height / 2 + tankBody.height / 4
  );
  ctx.drawImage(tankBarrel, 0, 0);
  ctx.restore();

  ctx.restore();
}

function drawSprite(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;

  const img = getAsset([Sprite.texture[id]]);
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);
  if (hasComponent(world, Rotation, id)) {
    ctx.rotate(Rotation.angle[id] + Math.PI / 2);
  }
  ctx.translate(-img.width / 2, -img.height / 2);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawVelocityVectors(world, id) {
  const { ctx } = world;
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);
  ctx.strokeStyle = "#f00";
  ctx.beginPath(); // Start a new path
  ctx.moveTo(0, 0); // Move the pen to (30, 50)
  if (hasComponent(world, Body, id)) {
    ctx.lineTo(
      Math.cos(Body.angle[id]) * Velocity.x[id],
      Math.sin(Body.angle[id]) * Velocity.y[id]
    ); // Draw a line to (150, 100)
  } else {
    ctx.lineTo(Velocity.x[id], Velocity.y[id]); // Draw a line to (150, 100)
  }
  ctx.stroke(); // Render the path
  ctx.restore();
}

function drawId(world, id) {
  const { ctx } = world;
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
