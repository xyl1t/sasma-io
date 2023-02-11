import {
  defineQuery,
  defineSystem,
  getEntityComponents,
  hasComponent,
  Not,
} from "../bitecs.js";
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
import { Follow } from "../components/Follow.js";
import { Layer } from "../components/Layer.js";
import { Zone } from "../components/Zone.js";
import { PickupEffect } from "../components/PickupEffect.js";

const meQuery = defineQuery([Me]);
const noLayerQuery = defineQuery([Position, Not(Layer)]);
const layerQuery = defineQuery([Position, Layer]);
const zoneQuery = defineQuery([Zone]);
const effectQuery = defineQuery([PickupEffect, Player]);

export const renderingSystem = defineSystem((world) => {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  ctx.save();

  // clear screen
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // center screen
  ctx.translate(world.windowWidth / 2, world.windowHeight / 2);
  ctx.scale(world.renderScaleWidth, world.renderScaleHeight);

  // move to current player
  const meId = meQuery(world)[0];
  let meX = 0;
  let meY = 0;
  if (hasComponent(world, Follow, meId)) {
    meX = Position.x[Follow.source[meId]];
    meY = Position.y[Follow.source[meId]];
    console.log(Follow.source[meId], meX, meY);
  } else if (hasComponent(world, Position, meId)) {
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
      meY + map.height / 2 - diagnoal / world.renderScaleHeight / 2,
      diagnoal / world.renderScaleWidth,
      diagnoal / world.renderScaleHeight,

      -diagnoal / 2 / world.renderScaleWidth,
      -diagnoal / 2 / world.renderScaleHeight,
      diagnoal / world.renderScaleWidth,
      diagnoal / world.renderScaleHeight
    );
  } else {
    ctx.drawImage(
      map,
      meX + map.width / 2 - world.windowWidth / 2 / world.renderScaleWidth,
      meY + map.height / 2 - world.windowHeight / 2 / world.renderScaleHeight,
      world.windowWidth / world.renderScaleWidth,
      world.windowHeight / world.renderScaleHeight,

      -world.windowWidth / 2 / world.renderScaleWidth,
      -world.windowHeight / 2 / world.renderScaleHeight,
      world.windowWidth / world.renderScaleWidth,
      world.windowHeight / world.renderScaleHeight
    );
  }
  ctx.translate(-meX, -meY);

  if (hasComponent(world, Gun, meId) && world.isMobile) {
    ctx.save();
    ctx.setLineDash([15, 15]); /*dashes are 5px and spaces are 3px*/
    ctx.translate(Position.x[meId], Position.y[meId]);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(
      Math.cos(Gun.angle[meId]) * 500,
      Math.sin(Gun.angle[meId]) * 500
    );
    const gradient = ctx.createLinearGradient(
      0,
      0,
      Math.cos(Gun.angle[meId]) * 500,
      Math.sin(Gun.angle[meId]) * 500
    );
    gradient.addColorStop(0, "rgb(127, 127, 127, 0.3)");
    gradient.addColorStop(1, "rgb(127, 127, 127, 0)");
    ctx.strokeStyle = gradient;
    ctx.lineWidth = 4;
    ctx.lineCap = "round";
    ctx.stroke();
    ctx.restore();
  }

  let layerIds = layerQuery(world);
  let noLayerIds = noLayerQuery(world);
  layerIds = layerIds.sort((a, b) =>
    Layer.layer[a] == Layer.layer[b] ? a - b : Layer.layer[a] - Layer.layer[b]
  );
  const renderables = [...noLayerIds, ...layerIds];

  for (const id of renderables) {
    if (hasComponent(world, Input, id)) {
      drawPlayer(world, id, meId);
    }
    if (hasComponent(world, Sprite, id)) {
      drawSprite(world, id);
    }
    if (hasComponent(world, AnimatedSprite, id)) {
      drawAnimation(world, id);
    }
  }

  for (const id of renderables) {
    if (world.debug.showVelocity) {
      if (hasComponent(world, Body, id) || hasComponent(world, Velocity, id)) {
        drawVelocityVectors(world, id);
      }
    }
    if (world.debug.showIds) {
      drawId(world, id);
    }
    if (world.debug.showComponents) {
      drawComponents(world, id);
    }
    if (world.debug.showColliders) {
      drawColliders(world, id);
    }
  }

  const zoneEntitys = zoneQuery(world);
  drawZones(world, zoneEntitys);

  ctx.restore();

  $("#txtPlayerCount").text("");
  $("#txtWaitingCount").text("");
  if (!world.gameStarted && world.players?.length < 2) {
    $("#txtPlayerCount").text(
      "Waiting for Players: " +
        `${world.players?.length <= 2 ? 2 - world.players?.length : 0}`
    );
  } else if (!world.gameStarted && world.players?.length >= 2) {
    $("#txtWaitingCount").text(`Game starts in : ${world.currentWaitingTime}`);
  } else {
    $("#txtPlayerCount").text(
      `Game started, Remaining players: ${world.players?.length}`
    );
  }

  return world;
});

function drawZones(world, zoneEntitys) {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  ctx.save();
  ctx.globalAlpha = 0.4;
  let innerZoneId;
  for (let zId of zoneEntitys) {
    ctx.strokeStyle = "black";
    ctx.beginPath();
    if (Zone.collision[zId] == 1) {
      ctx.fillStyle = "#7016b5";
      ctx.arc(0, 0, Zone.size[zId] + 20, 0, 2 * Math.PI, false);
      ctx.arc(0, 0, Zone.size[innerZoneId], 0, 2 * Math.PI, true);
      ctx.fill();
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = "#d60404";
      ctx.beginPath();
      ctx.arc(0, 0, Zone.size[zId], 0, 2 * Math.PI, false);
      ctx.arc(0, 0, Zone.size[zId] + 1000, 0, 2 * Math.PI, true);
      ctx.fill();
    } else {
      innerZoneId = zId;
      ctx.arc(0, 0, Zone.size[zId], 0, 2 * Math.PI);
    }
    //ctx.stroke();
  }
  ctx.restore();
}

function drawPlayer(world, id, meId) {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  let playersWithEffects = effectQuery(world);
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

  //Effect
  if (hasComponent(world, PickupEffect, id)) {
    ctx.save();
    const effect = getAsset(PickupEffect.type[id]);
    ctx.rotate(Body.angle[id] + Math.PI / 2);
    ctx.translate(-effect.width / 2, effect.height / 2);
    ctx.drawImage(effect, 0, 0);
    ctx.restore();
    if (id == meId) {
      let text = "";
      switch (PickupEffect.type[id]) {
        case assetIdMap["pickup_heal"]:
          text = "Healing++";
          break;
        case assetIdMap["pickup_reload"]:
          text = "Reload++";
          break;
        case assetIdMap["pickup_movement"]:
          text = "Speed++";
          break;
        case assetIdMap["pickup_damage"]:
          text = "Damage++";
          break;
      }
      ctx.save();
      ctx.lineCap = "round";
      ctx.font = "40px Verdana";
      ctx.lineWidth = 6;
      ctx.fillStyle = "#fff";
      ctx.strokeStyle = "#000";
      if (world.dynamicCamera) {
        ctx.rotate(Body.angle[meId] + Math.PI / 2);
      }
      ctx.translate(-effect.width / 2, effect.height / 2);

      ctx.strokeText(
        text,
        -world.windowWidth / (2 * world.renderScaleWidth) + 50,
        -world.windowHeight / (2 * world.renderScaleHeight) + 50
      );
      ctx.fillText(
        text,
        -world.windowWidth / (2 * world.renderScaleWidth) + 50,
        -world.windowHeight / (2 * world.renderScaleHeight) + 50
      );
      ctx.restore();
    }
  }

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

  if (/*world.isMobile && */ id == meId) {
    drawPath(world, id);
  }

  //healthbar
  if (world.gameStarted) {
    ctx.save();
    if (world.dynamicCamera) {
      ctx.rotate(Body.angle[meId] + Math.PI / 2);
    }
    const width = 50;
    const height = 8;
    const healthWidth = (width * Player.health[id]) / 100;
    const rad = height / 2;
    const verticalOffset = -20 * 2;
    ctx.beginPath();
    ctx.fillStyle = "#444";
    ctx.arc(-width / 2, verticalOffset + rad, rad, 0, Math.PI * 2, false);
    ctx.arc(+width / 2, verticalOffset + rad, rad, 0, Math.PI * 2, false);
    ctx.rect(-width / 2, verticalOffset, width, height);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = "#3d0";
    ctx.arc(-width / 2, verticalOffset + rad, rad - 2, 0, Math.PI * 2, false);
    ctx.arc(
      healthWidth - width / 2,
      verticalOffset + rad,
      rad - 2,
      0,
      Math.PI * 2,
      false
    );
    ctx.rect(-width / 2, verticalOffset + 2, healthWidth, height - 4);
    ctx.fill();
    ctx.restore();
  }

  if (id == meId && hasComponent(world, Gun, id)) {
    drawReloadIndicator(world, id);
  }

  ctx.restore();
}

function drawPath(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;
  const arrow = getAsset(assetIdMap["directionArrow"]);
  let inputY = Input.inputY[id];
  let inputX = Input.inputX[id];
  let velocity = Math.abs(Body.velocity[id] / 10);
  let angleVel = Body.angleVelocity[id];
  let direction = Body.velocity[id] >= -5 ? 1 : -1;

  ctx.save();
  const space = velocity; //(velocity + 15)/1.5;
  const rotationStep = angleVel / 10;

  if (velocity < 5 && Math.abs(angleVel) > 0.1) {
    arrow.width = 20;

    const rotationFactor = angleVel > 0 ? 1 : -1;

    ctx.save();
    ctx.rotate(Body.angle[id] + Math.PI / 2);
    ctx.translate(-35 * rotationFactor, 0);
    ctx.translate(0, (-angleVel * 8) / 2);
    ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
    ctx.translate(0, angleVel * 8);
    ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
    ctx.restore();
    ctx.save();
    ctx.rotate(Body.angle[id] - Math.PI / 2);
    ctx.translate(-35 * rotationFactor, 0);
    ctx.translate(0, (-angleVel * 8) / 2);
    ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
    ctx.translate(0, angleVel * 8);
    ctx.drawImage(arrow, -arrow.width / 2, -arrow.height / 2, 20, 8);
    ctx.restore();
  }
  ctx.rotate(Body.angle[id] + (Math.PI / 2) * direction);
  ctx.translate(0, -35);
  for (let i = 0; i < 4; i++) {
    if (!(velocity < 5 && Math.abs(angleVel) > 0.1)) {
      ctx.rotate(rotationStep);
    }
    ctx.translate(0, -space);
    ctx.drawImage(arrow, -arrow.width / 2, 0, 25, 8);
  }

  ctx.restore();
}

function drawReloadIndicator(world, id) {
  if (Gun.reloadTimeLeft[id] > 0) {
    const { canvas, ctx, assetIdMap, getAsset } = world;

    const radius = 10;
    const startAngleDeg = -90;
    const startAngle = startAngleDeg * (Math.PI / 180);
    const endAngle =
      startAngle +
      Math.PI * (2 * (Gun.reloadTimeLeft[id] / Gun.rateOfFire[id]));

    ctx.beginPath();
    ctx.moveTo(0, 0);

    ctx.arc(0, 0, radius, startAngle, endAngle, false);
    ctx.fillStyle = "white";
    ctx.strokeStyle = "gray";
    ctx.fill();
    ctx.stroke();
  }
}

function drawSprite(world, id) {
  const { canvas, ctx, assetIdMap, getAsset } = world;

  const img = getAsset([Sprite.texture[id]]);
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);

  if (hasComponent(world, Follow, id)) {
    const offsetX = Position.x[Follow.source[id]];
    const offsetY = Position.y[Follow.source[id]];
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

function drawComponents(world, id) {
  const { ctx } = world;
  ctx.save();
  ctx.translate(Position.x[id], Position.y[id]);
  let lines = 0;
  for (const comp of getEntityComponents(world, id)) {
    for (const key in comp) {
      const componentString = `${key}: ${comp[key][id]}\n`;
      ctx.fillText(
        componentString,
        -ctx.measureText(id).width / 2,
        ++lines * 10
      );
    }
  }

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
    for (let i_cap = 0; i_cap < CapsuleCollider.capsuleCount[id]; i_cap++) {
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

function lerp(value1, value2, amount) {
  amount = amount < 0 ? 0 : amount;
  amount = amount > 1 ? 1 : amount;
  return value1 + (value2 - value1) * amount;
}
