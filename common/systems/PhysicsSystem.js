import { addComponent, addEntity, defineQuery, defineSystem, hasComponent, Not } from "../bitecs.js";

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

// QUERIES // Selects all entities that have the following components
const physicsQuery = defineQuery([Position, Velocity]);
const tankBodyQuery = defineQuery([Body, Position, Velocity]);

const friction = 3;

// SYSTEMS // a function that runs through some entities and modifies their components
export const physicsSystem = defineSystem((world) => {

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

      Body.angle[id] += Body.angleVelocity[id] * world.dt;
      Body.lastTrackDistance[id] += Math.abs(Body.angleVelocity[id] * world.dt * 32);
      Body.lastTrackDistance[id] += Math.abs(Body.velocity[id] * world.dt);
      
 
      if (Body.lastTrackDistance[id] > 14){
        Body.lastTrackDistance[id] = 0;
        const trackId = addEntity(world);

        addComponent(world, Position, trackId);
        Position.x[trackId] = Position.x[id];
        Position.y[trackId] = Position.y[id];
  
        addComponent(world, Rotation, trackId);
        Rotation.angle[trackId] = Body.angle[id];
  
        addComponent(world, Sprite, trackId);
        Sprite.texture[trackId] = world.assetIdMap['tracksDouble'];

        addComponent(world, TimeToLive, trackId);
        TimeToLive.timeToLive[trackId] = 3;
        TimeToLive.fadeTime[trackId] = 3;
      }
    }

    Position.x[id] += Velocity.x[id] * world.dt;
    Position.y[id] += Velocity.y[id] * world.dt;

    Velocity.x[id] += Velocity.x[id] * -friction * world.dt;
    Velocity.y[id] += Velocity.y[id] * -friction * world.dt;
  }

  return world;
});
