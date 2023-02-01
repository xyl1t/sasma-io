import { defineQuery, defineSystem, Not } from "../bitecs.js";

import { Body } from "../components/Body.js";
import { Rotation } from "../components/Rotation.js";
import { Position } from "../components/Position.js";
import { Velocity } from "../components/Velocity.js";
import { explosionSystem } from "./ExplosionSystem.js";

// QUERIES // Selects all entities that have the following components
const physicsQuery = defineQuery([Not(Body), Position, Velocity]);
const tankBodyQuery = defineQuery([Body, Position, Velocity]);

// SYSTEMS // a function that runs through some entities and modifies their components
export const physicsSystem = defineSystem((world) => {
  const tankBodies = tankBodyQuery(world);
  for (const id of tankBodies) {
    Velocity.x[id] += Body.power[id] * Body.movingDirection[id] * world.dt;
    Velocity.y[id] += Body.power[id] * Body.movingDirection[id] * world.dt;

    Position.x[id] += Math.cos(Body.angle[id]) * Velocity.x[id] * world.dt;
    Position.y[id] += Math.sin(Body.angle[id]) * Velocity.y[id] * world.dt;

    // TODO: make this value a component `Friction`
    Velocity.x[id] += Velocity.x[id] * -3 * world.dt;
    Velocity.y[id] += Velocity.y[id] * -3 * world.dt;
  }

  const physicsEntities = physicsQuery(world);
  for (const id of physicsEntities) {
    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;

    // TODO: make this value a component `Friction`
    Velocity.x[id] += Velocity.x[id] * -3 * world.dt;
    Velocity.y[id] += Velocity.y[id] * -3 * world.dt;
  }
  return world;
});
