import { defineQuery, defineSystem, hasComponent, Not } from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Bot } from "../components/Bot.js";
import { Gun } from "../components/Gun.js";

import { Rotation } from "../components/Rotation.js";
import { Input } from "../components/Input.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { Velocity } from "../components/Velocity.js";
import { CapsuleCollider } from "../components/CapsuleCollider.js";
import { Me } from "../components/Me.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { Track } from "../components/Track.js";
import { Layer } from "../components/Layer.js";

const meQuery = defineQuery([Me]);
const noLayerQuery = defineQuery([Position, Not(Layer)]);
const layerQuery = defineQuery([Position, Layer]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  ctx.save();

  // clear screen
  ctx.fillStyle = "lightgray";

  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // center screen
  ctx.translate(world.windowWidth / 2, world.windowHeight / 2);
  ctx.scale(world.renderScaleWidth, world.renderScaleHeight);

  // move to current player
  const meId = meQuery(world)[0];
  let meX = 0;
  let meY = 0;
  if (hasComponent(world, Position, meId)) {
    meX = Position.x[meId];
    meY = Position.y[meId];
  }
  const map = getAsset(assetIdMap["MAP"]);

  if (world.dynamicCamera) {
    ctx.rotate(-Body.angle[meId] - Math.PI / 2);
    const max = Math.max(world.windowWidth, world.windowHeight);
    const diagnoal = Math.sqrt(2) * max;
    ctx.drawImage(
      map,
      meX + map.width / 2 - diagnoal / world.renderScaleWidth / 2,
      meY + map.height / 2 - diagnoal / world.renderScaleWidth / 2,
      diagnoal / world.renderScaleWidth,
      diagnoal / world.renderScaleWidth,

      -diagnoal / 2 / world.renderScaleWidth,
      -diagnoal / 2 / world.renderScaleWidth,
      diagnoal / world.renderScaleWidth,
      diagnoal / world.renderScaleWidth
    );
  } else {
    ctx.drawImage(
      map,
      meX + map.width / 2 - world.windowWidth / world.renderScaleWidth / 2,
      meY + map.height / 2 - world.windowHeight / world.renderScaleWidth / 2,
      world.windowWidth / world.renderScaleWidth,
      world.windowHeight / world.renderScaleWidth,

      -world.windowWidth / 2 / world.renderScaleWidth,
      -world.windowHeight / 2 / world.renderScaleWidth,
      world.windowWidth / world.renderScaleWidth,
      world.windowHeight / world.renderScaleWidth
    );
  }
  ctx.translate(-meX, -meY);

  let layerIds = layerQuery(world);
  let noLayerIds = noLayerQuery(world);
  layerIds = layerIds.sort((a, b)=>{
    return Layer.layer[a] > Layer.layer[b];
  });
  const renderables = [...noLayerIds, ...layerIds];
  
  for (const id of renderables) {
    if (hasComponent(world, Player, id)) {
      drawPlayer(world, id, meId);
    }
    if (hasComponent(world, Sprite, id)) {
      drawSprite(world, id);
    }
    if (hasComponent(world, AnimatedSprite, id)) {
      drawAnimation(world, id);
    }
    if (world.debug.showVelocity) {
      if (hasComponent(world, Body, id) || hasComponent(world, Velocity, id)) {
        drawVelocityVectors(world, id);
      }
    }
    if (world.debug.showIds) {
      drawId(world, id);
    }
    if (world.debug.showColliders) {
      drawColliders(world, id);
    }
  }

  // draw circlular border
  ctx.strokeStyle = "black";
  ctx.beginPath();
  ctx.arc(0, 0, 1000, 0, 2 * Math.PI);
  ctx.stroke();

  ctx.restore();

  return world;
});

function drawPlayer(world, id, meId) {
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
  ctx.rotate(
    Gun.angle[id] - Math.PI / 2
    // - (world.dynamicCamera && id == meId ? -Body.angle[meId] : Math.PI / 2)
  ); //dynamic camera --> add Body.angle instead of subtracting Math.PI / 2;
  ctx.translate(
    -tankBarrel.width / 2,
    -tankBarrel.height / 2 + tankBody.height / 4
  );
  ctx.drawImage(tankBarrel, 0, 0);
  ctx.restore();

  if (world.isMobile && id == meId) {
    drawPath(world, id);
  }

  ctx.restore();
}

function drawPath(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  const arrow = getAsset(assetIdMap["directionArrow"]);
  let inputY = Input.inputY[id];
  let inputX = Input.inputX[id];

  let moving = false;
  const space = Math.sqrt(Math.pow(inputY * 20, 2));
  const rotationStep = (Input.inputX[id] * 2) / 4;
  ctx.save();

  const threshhold = 0.3;

  if (inputY >= threshhold) {
    ctx.rotate(Body.angle[id] + Math.PI / 2);
    ctx.translate(0, -40);
    moving = true;
  } else {
    if (inputY <= -threshhold) {
      ctx.rotate(Body.angle[id] - Math.PI / 2);
      ctx.translate(0, -40);
      moving = true;
    }
  }

  if (moving) {
    for (let i = 0; i < 4; i++) {
      ctx.drawImage(arrow, -arrow.width / 2, 0, 25, 8);
      ctx.rotate(rotationStep);
      ctx.translate(0, -space);
    }
  } else {
    if (inputX >= threshhold || inputX <= -threshhold) {
      let rotationFactor;

      if (inputX >= threshhold) {
        rotationFactor = 1;
      } else {
        if (inputX <= -threshhold) rotationFactor = -1;
      }

      arrow.width = 20;

      ctx.save();
      ctx.rotate(Body.angle[id] + Math.PI / 2);
      ctx.translate(-35 * rotationFactor, -10);
      ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
      ctx.translate(0, 20);
      ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
      ctx.restore();
      ctx.rotate(Body.angle[id] - Math.PI / 2);
      ctx.translate(-35 * rotationFactor, -10);
      ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
      ctx.translate(0, 20);
      ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
    }
  }

  ctx.restore();
}

function drawSprite(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;

  const img = getAsset([Sprite.texture[id]]);
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);

  if (hasComponent(world, Track, id)) {
    const offsetX = Position.x[Track.source[id]];
    const offsetY = Position.y[Track.source[id]];
    ctx.translate(offsetX, offsetY);
  }
  if (hasComponent(world, Rotation, id)) {
    ctx.rotate(Rotation.angle[id] + Math.PI / 2);
  }
  if (hasComponent(world, Velocity, id)) {
    ctx.rotate(Math.atan2(Velocity.y[id], Velocity.x[id]) + Math.PI / 2);
  }
  ctx.globalAlpha = 1 - Sprite.translucency[id];
  ctx.translate(-img.width / 2, -img.height / 2);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawAnimation(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;

  const img = getAsset(AnimatedSprite.sprites[id][AnimatedSprite.current[id]]);
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
  ctx.beginPath();
  ctx.moveTo(0, 0);
  if (hasComponent(world, Velocity, id)) {
    ctx.lineTo(Velocity.x[id], Velocity.y[id]);
  }
  if (hasComponent(world, Body, id)) {
    ctx.lineTo(
      Math.cos(Body.angle[id]) * Body.velocity[id],
      Math.sin(Body.angle[id]) * Body.velocity[id]
    );
  }
  ctx.stroke();
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

function drawColliders(world, id) {
  const { ctx } = world;
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);
  ctx.strokeStyle = "#f0f";
  if (hasComponent(world, CircleCollider, id)) {
    ctx.beginPath();
    ctx.arc(0, 0, CircleCollider.radius[id], 0, 2 * Math.PI);
    ctx.stroke();
  }
  if (hasComponent(world, CapsuleCollider, id)) {
    for (
      let i_cap = 0;
      i_cap < CapsuleCollider.capsuleCount[id];
      i_cap++
    ) {
      const sx = CapsuleCollider.sx[id][i_cap];
      const sy = CapsuleCollider.sy[id][i_cap];
      const ex = CapsuleCollider.ex[id][i_cap];
      const ey = CapsuleCollider.ey[id][i_cap];
      const r = CapsuleCollider.radius[id];

      let nx = -(ey - sy);
      let ny = ex - sx;
      let d = Math.sqrt(nx * nx + ny * ny);
      nx /= d;
      ny /= d;

      ctx.beginPath();
      ctx.arc(sx, sy, r, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(ex, ey, r, 0, 2 * Math.PI);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(sx + nx * r, sy + ny * r);
      ctx.lineTo(ex + nx * r, ey + ny * r);

      ctx.moveTo(sx - nx * r, sy - ny * r);
      ctx.lineTo(ex - nx * r, ey - ny * r);
      ctx.stroke();
    }
  }
  ctx.restore();
}
