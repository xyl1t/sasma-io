import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  Not,
} from "../bitecs.js";

import { Body } from "../components/Body.js";
import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { explosionSystem } from "./ExplosionSystem.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Sprite } from "../components/Sprite.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { Bullet } from "../components/Bullet.js";
import { CircleCollider } from "../components/CircleCollider.js";

// QUERIES // Selects all entities that have the following components
const movementQuery = defineQuery([Position, Velocity]);
const circleColliderQuery = defineQuery([Position, Velocity, CircleCollider]);

const friction = 3;

// SYSTEMS // a function that runs through some entities and modifies their components
export const movementSystem = defineSystem((world) => {
  const movingEntities = movementQuery(world);
  for (const id of movingEntities) {
    if (hasComponent(world, Force, id) && hasComponent(world, Mass, id)) {
      Acceleration.x[id] = Force.x[id] / Mass.value[id];
      Acceleration.y[id] = Force.y[id] / Mass.value[id];
    }
    if (hasComponent(world, Acceleration, id)) {
      Velocity.x[id] += Acceleration.x[id] * world.dt;
      Velocity.y[id] += Acceleration.y[id] * world.dt;
    }

    if (hasComponent(world, Body, id)) {
      Body.acceleration[id] = Body.force[id] / Mass.value[id];
      Body.velocity[id] += Body.acceleration[id] * world.dt;
      Position.x[id] += Math.cos(Body.angle[id]) * Body.velocity[id] * world.dt;
      Position.y[id] += Math.sin(Body.angle[id]) * Body.velocity[id] * world.dt;
      Body.velocity[id] += Body.velocity[id] * -friction * world.dt;

      Body.angle[id] += Body.angleVelocity[id] * world.dt;
      Body.lastTrackDistance[id] += Math.abs(
        Body.angleVelocity[id] * world.dt * 32
      );
      Body.lastTrackDistance[id] += Math.abs(Body.velocity[id] * world.dt);

      if (Body.lastTrackDistance[id] > 14) {
        Body.lastTrackDistance[id] = 0;
        const trackId = addEntity(world);

        addComponent(world, Position, trackId);
        Position.x[trackId] = Position.x[id];
        Position.y[trackId] = Position.y[id];

        addComponent(world, Rotation, trackId);
        Rotation.angle[trackId] = Body.angle[id];

        addComponent(world, Sprite, trackId);
        Sprite.texture[trackId] = world.assetIdMap["tracksDouble"];

        addComponent(world, TimeToLive, trackId);
        TimeToLive.timeToLive[trackId] = 3;
        TimeToLive.fadeTime[trackId] = 3;
      }
    }

    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;

    Velocity.x[id] += Velocity.x[id] * -friction * 1 * world.dt;
    Velocity.y[id] += Velocity.y[id] * -friction * 1 * world.dt;

    Force.x[id] = 0;
    Force.y[id] = 0;
  }

  const collidingPairs = resolveStaticCollision(circleColliderQuery(world));
  resolveDynamicCollision(collidingPairs);

  return world;
});


function resolveStaticCollision(entities) {
  const collidingPairs = [];

  // Static collisions, i.e. overlap
  for (const id of entities) {
    for (const targetId of entities) {
      if (id == targetId) continue;
      if (!areCirclesOverlapping(id, targetId)) continue;
      // Collision has occured
      collidingPairs.push([ id, targetId ]);

      const x1 = Position.x[id];
      const y1 = Position.y[id];
      const r1 = CircleCollider.radius[id];
      const x2 = Position.x[targetId];
      const y2 = Position.y[targetId];
      const r2 = CircleCollider.radius[targetId];

      // Distance between ball centers
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      // Calculate displacement required
      const overlap = 0.5 * (dist - r1 - r2);

      // Displace Current ball away from collision
      Position.x[id] -= (overlap * (x1 - x2)) / dist; // TODO: optimize
      Position.y[id] -= (overlap * (y1 - y2)) / dist;

      // Displace Target Ball away from collision
      Position.x[targetId] += (overlap * (x1 - x2)) / dist;
      Position.y[targetId] += (overlap * (y1 - y2)) / dist;
    }
  }
  
  return collidingPairs;
}

function resolveDynamicCollision(collidingPairs) {
  for (const pair of collidingPairs) {
    const id1 = pair[0];
    const id2 = pair[1];

    const x1 = Position.x[id1];
    const y1 = Position.y[id1];
    const vx1 = Velocity.x[id1];
    const vy1 = Velocity.y[id1];
    const r1 = CircleCollider.radius[id1];
    const mass1 = Mass.value[id1];
    const x2 = Position.x[id2];
    const y2 = Position.y[id2];
    const vx2 = Velocity.x[id2];
    const vy2 = Velocity.y[id2];
    const r2 = CircleCollider.radius[id2];
    const mass2 = Mass.value[id2];

    // Distance between balls
    const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

    // Normal
    const nx = (x2 - x1) / dist;
    const ny = (y2 - y1) / dist;

    // Tangent
    const tx = -ny;
    const ty = nx;

    // Dot Product Tangent
    const dpTan1 = vx1 * tx + vy1 * ty;
    const dpTan2 = vx2 * tx + vy2 * ty;

    // Dot Product Normal
    const dpNorm1 = vx1 * nx + vy1 * ny;
    const dpNorm2 = vx2 * nx + vy2 * ny;

    // Conservation of momentum in 1D
    const m1 = (dpNorm1 * (mass1 - mass2) + 2.0 * mass2 * dpNorm2) / (mass1 + mass2);
    const m2 = (dpNorm2 * (mass2 - mass1) + 2.0 * mass1 * dpNorm1) / (mass1 + mass2);

    // Update ball velocities
    Velocity.x[id1] = tx * dpTan1 + nx * m1;
    Velocity.y[id1] = ty * dpTan1 + ny * m1;
    Velocity.x[id2] = tx * dpTan2 + nx * m2;
    Velocity.y[id2] = ty * dpTan2 + ny * m2;
  }
}

function areCirclesOverlapping(id, targetId) {
  const x1 = Position.x[id];
  const y1 = Position.y[id];
  const r1 = CircleCollider.radius[id];
  const x2 = Position.x[targetId];
  const y2 = Position.y[targetId];
  const r2 = CircleCollider.radius[targetId];
  return Math.abs((x1 - x2) ** 2 + (y1 - y2) ** 2) <= (r1 + r2) ** 2;
}