import { defineQuery, defineSystem, hasComponent, Not } from "../bitecs.js";

import { Body } from "../components/Body.js";
import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { explosionSystem } from "./ExplosionSystem.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";

// QUERIES // Selects all entities that have the following components
const physicsQuery = defineQuery([Position, Velocity]);
const tankBodyQuery = defineQuery([Body, Position, Velocity]);

const friction = 3;

// SYSTEMS // a function that runs through some entities and modifies their components
export const physicsSystem = defineSystem((world) => {
  // const tankBodies = tankBodyQuery(world);
  // for (const id of tankBodies) {
  //   Velocity.x[id] += Body.power[id] * Body.movingDirection[id] * world.dt;
  //   Velocity.y[id] += Body.power[id] * Body.movingDirection[id] * world.dt;
  //
  //   Position.x[id] += Math.cos(Body.angle[id]) * Velocity.x[id] * world.dt;
  //   Position.y[id] += Math.sin(Body.angle[id]) * Velocity.y[id] * world.dt;
  //
  //   // TODO: make this value a component `Friction`
  //   Velocity.x[id] += Velocity.x[id] * -3 * world.dt;
  //   Velocity.y[id] += Velocity.y[id] * -3 * world.dt;
  // }

  const physicsEntities = physicsQuery(world);
  for (const id of physicsEntities) {
    Force.x[id] = 0;
    Force.y[id] = 0;
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
    }

    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;

    Velocity.x[id] += Velocity.x[id] * -friction * world.dt;
    Velocity.y[id] += Velocity.y[id] * -friction * world.dt;
  }

  return world;
});
