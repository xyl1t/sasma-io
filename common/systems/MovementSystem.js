import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  Not,
  removeEntity,
} from "../bitecs.js";

import { Body } from "../components/Body.js";
import { Player } from "../components/Player.js";
import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Sprite } from "../components/Sprite.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { CapsuleCollider } from "../components/CapsuleCollider.js";
import { Fake } from "../components/Fake.js";
import { Layer } from "../components/Layer.js";
import { Track } from "../components/Track.js";

// QUERIES // Selects all entities that have the following components
const movementQuery = defineQuery([Position, Velocity]);
const circleColliderWithoutFakeQuery = defineQuery([
  Position,
  CircleCollider,
  Not(Fake),
]);
const fakeQuery = defineQuery([Fake]);
const circleColliderQuery = defineQuery([Position, CircleCollider]);
const capsuleColliderQuery = defineQuery([Position, CapsuleCollider]);

const friction = 3;

// SYSTEMS // a function that runs through some entities and modifies their components
export const movementSystem = defineSystem((world) => {
  const movingEntities = movementQuery(world);
  world.simulationSteps = 4;
  world.simulationDt = world.dt / world.simulationSteps;
  world.collidingPairs = [];
  for (let sim = 0; sim < world.simulationSteps; sim++) {
    for (const id of movingEntities) {
      const mass = hasComponent(world, Mass, id) ? Mass.value[id] : 1;

      if (hasComponent(world, Body, id)) {
        Body.acceleration[id] = Body.force[id] / mass;
        Body.velocity[id] += Body.acceleration[id] * world.simulationDt;
        Position.x[id] +=
          Math.cos(Body.angle[id]) * Body.velocity[id] * world.simulationDt;
        Position.y[id] +=
          Math.sin(Body.angle[id]) * Body.velocity[id] * world.simulationDt;
        Body.velocity[id] += Body.velocity[id] * -friction * world.simulationDt;

        if (Math.abs(Body.velocity[id]) < 0.0001) {
          Body.velocity[id] = 0;
        }

        if (Math.abs(Body.angleVelocity[id]) < 0.01) {
          Body.angleVelocity[id] = 0;
        }

        Body.angleVelocity[id] +=
          Body.angleAcceleration[id] * world.simulationDt;
        Body.angle[id] += Body.angleVelocity[id] * world.simulationDt;
        Body.angleVelocity[id] +=
          Body.angleVelocity[id] * -5 * world.simulationDt; // NOTE: friction
        Body.lastTrackDistance[id] += Math.abs(
          Body.angleVelocity[id] * world.simulationDt * 32
        );
        Body.lastTrackDistance[id] += Math.abs(
          Body.velocity[id] * world.simulationDt
        );

        if (Body.lastTrackDistance[id] > 20) {
          Body.lastTrackDistance[id] = 0;
          const trackId = addEntity(world);
          addComponent(world, Track, trackId);

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

          addComponent(world, Layer, trackId);
          Layer.layer[trackId] = 9;
        }
      }

      if (hasComponent(world, Force, id)) {
        Acceleration.x[id] = Force.x[id] / mass;
        Acceleration.y[id] = Force.y[id] / mass;
      }

      if (hasComponent(world, Acceleration, id)) {
        Velocity.x[id] += Acceleration.x[id];
        Velocity.y[id] += Acceleration.y[id];
      }

      Position.x[id] += Velocity.x[id] * world.simulationDt;
      Position.y[id] += Velocity.y[id] * world.simulationDt;

      Velocity.x[id] += Velocity.x[id] * -friction * 1 * world.simulationDt;
      Velocity.y[id] += Velocity.y[id] * -friction * 1 * world.simulationDt;

      if (Math.abs(Velocity.x[id]) < 0.01) {
        Velocity.x[id] = 0;
      }
      if (Math.abs(Velocity.y[id]) < 0.01) {
        Velocity.y[id] = 0;
      }

      Force.x[id] = 0;
      Force.y[id] = 0;
    }

    world.collidingPairsWithFake = [];
    resolveStaticCollision(
      world,
      circleColliderWithoutFakeQuery(world),
      capsuleColliderQuery(world)
    );
    resolveDynamicCollision(world, circleColliderQuery(world));
    for (const id of fakeQuery(world)) {
      removeEntity(world, id);
    }
  }

  world.collidingPairs = [...new Set(world.collidingPairs)];

  return world;
});

function resolveStaticCollision(
  world,
  circleCollidersWithoutFake,
  capsuleColliders
) {
  // Static collisions, i.e. overlap
  for (const id of circleCollidersWithoutFake) {
    const x1 = Position.x[id];
    const y1 = Position.y[id];
    const r1 = CircleCollider.radius[id];

    // Against Edges
    for (const capsuleId of capsuleColliders) {
      for (
        let i_cap = 0;
        i_cap < CapsuleCollider.capsuleCount[capsuleId];
        i_cap++
      ) {
        const sx = CapsuleCollider.sx[capsuleId][i_cap] + Position.x[capsuleId];
        const sy = CapsuleCollider.sy[capsuleId][i_cap] + Position.y[capsuleId];
        const ex = CapsuleCollider.ex[capsuleId][i_cap] + Position.x[capsuleId];
        const ey = CapsuleCollider.ey[capsuleId][i_cap] + Position.y[capsuleId];
        const r = CapsuleCollider.radius[capsuleId];

        // Check that line formed by velocity vector, intersects with line segment
        const fLineX1 = ex - sx;
        const fLineY1 = ey - sy;

        const fLineX2 = x1 - sx;
        const fLineY2 = y1 - sy;

        const fEdgeLength = fLineX1 * fLineX1 + fLineY1 * fLineY1;

        // This is nifty - It uses the DP of the line segment vs the line to the object, to work out
        // how much of the segment is in the "shadow" of the object vector. The min and max clamp
        // this to lie between 0 and the line segment length, which is then normalised. We can
        // use this to calculate the closest point on the line segment
        const t =
          Math.max(
            0,
            Math.min(fEdgeLength, fLineX1 * fLineX2 + fLineY1 * fLineY2)
          ) / fEdgeLength;

        // Which we do here
        const fClosestPointX = sx + t * fLineX1;
        const fClosestPointY = sy + t * fLineY1;

        // And once we know the closest point, we can check if the ball has collided with the segment in the
        // same way we check if two balls have collided
        const fDistance = Math.sqrt(
          (x1 - fClosestPointX) ** 2 + (y1 - fClosestPointY) ** 2
        );

        if (fDistance <= r1 + r) {
          // Collision has occurred - treat collision point as a ball that cannot move. To make this
          // compatible with the dynamic resolution code below, we add a fake ball with an infinite mass
          // so it behaves like a solid object when the momentum calculations are performed

          const fakeCircleColliderId = addEntity(world);
          addComponent(world, Fake, fakeCircleColliderId);
          addComponent(world, Position, fakeCircleColliderId);
          Position.x[fakeCircleColliderId] = fClosestPointX;
          Position.y[fakeCircleColliderId] = fClosestPointY;
          addComponent(world, Velocity, fakeCircleColliderId);
          Velocity.x[fakeCircleColliderId] = -Velocity.x[id];
          Velocity.y[fakeCircleColliderId] = -Velocity.y[id];
          addComponent(world, Mass, fakeCircleColliderId);
          Mass.value[fakeCircleColliderId] = Mass.value[id];
          addComponent(world, CircleCollider, fakeCircleColliderId);
          CircleCollider.radius[fakeCircleColliderId] =
            CircleCollider.radius[id];

          // Add collision to vector of collisions for dynamic resolution
          world.collidingPairsWithFake.push([id, fakeCircleColliderId]);
          world.collidingPairs.push([id, capsuleId]);

          // Calculate displacement required
          const fOverlap = 1.0 * (fDistance - r - r1);

          // Displace Current Ball away from collision
          Position.x[id] -= (fOverlap * (x1 - fClosestPointX)) / fDistance;
          Position.y[id] -= (fOverlap * (y1 - fClosestPointY)) / fDistance;
        }
      }
    }

    for (const targetId of circleCollidersWithoutFake) {
      if (id == targetId) continue;
      if (!areCirclesOverlapping(id, targetId)) continue;
      // Collision has occured

      world.collidingPairsWithFake.push([id, targetId]);
      world.collidingPairs.push([id, targetId]);

      const x1 = Position.x[id];
      const y1 = Position.y[id];
      const r1 = CircleCollider.radius[id];
      const x2 = Position.x[targetId];
      const y2 = Position.y[targetId];
      const r2 = CircleCollider.radius[targetId];

      // Distance between ball centers
      const dist = Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);

      // Calculate displacement required
      const overlap = 0.6 * (dist - r1 - r2);

      // Displace Current ball away from collision
      Position.x[id] -= (overlap * (x1 - x2)) / dist; // TODO: optimize
      Position.y[id] -= (overlap * (y1 - y2)) / dist;

      // Displace Target Ball away from collision
      Position.x[targetId] += (overlap * (x1 - x2)) / dist;
      Position.y[targetId] += (overlap * (y1 - y2)) / dist;
    }
  }
}

function resolveDynamicCollision(world) {
  for (const pair of world.collidingPairsWithFake) {
    const id1 = pair[0];
    const id2 = pair[1];

    const x1 = Position.x[id1];
    const y1 = Position.y[id1];
    const vx1 = Velocity.x[id1];
    const vy1 = Velocity.y[id1];
    // console.log(Velocity.x[id1], vx1)
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
    const m1 =
      (dpNorm1 * (mass1 - mass2) + 2.0 * mass2 * dpNorm2) / (mass1 + mass2);
    const m2 =
      (dpNorm2 * (mass2 - mass1) + 2.0 * mass1 * dpNorm1) / (mass1 + mass2);

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
