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

    Velocity.x[id] += Velocity.x[id] * -friction * world.dt;
    Velocity.y[id] += Velocity.y[id] * -friction * world.dt;

    Force.x[id] = 0;
    Force.y[id] = 0;
  }

  handleCollision(movingEntities, circleColliderQuery(world));

  return world;
});

function handleCollision(world, entities) {
  // Static collisions, i.e. overlap
  for (const id of entities) {
    for (const targetId of entities) {
      if (id == targetId) continue;
      if (!areCirclesOverlapping(id, targetId)) continue;
      // Collision has occured
      // vecCollidingPairs.push_back({ &id, &targetId });

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
