import { defineQuery, defineSystem, removeComponent } from "../bitecs.js";
import { Player } from "../components/Player.js";
import { Acceleration } from "../components/Acceleration.js";
import { Force } from "../components/Force.js";
import { Mass } from "../components/Mass.js";
import { Gun } from "../components/Gun.js";
import { Body } from "../components/Body.js";
import { CircleCollider } from "../components/CircleCollider.js";
import { Layer } from "../components/Layer.js";
import { Velocity } from "../components/Velocity.js";
import { Position } from "../components/Position.js";
import { Input } from "../components/Input.js";

const query = defineQuery([Player]);

export const playerSystem = defineSystem((world) => {
  const entities = query(world);

  for (const id of entities) {
    if (Player.health[id] <= 0) {
      removeComponent(world, Position, id);
      removeComponent(world, Velocity, id);
      removeComponent(world, Acceleration, id);
      removeComponent(world, Force, id);
      removeComponent(world, Mass, id);
      removeComponent(world, Gun, id);
      removeComponent(world, Body, id);
      removeComponent(world, Input, id);
      removeComponent(world, CircleCollider, id);
      removeComponent(world, Layer, id);
    }
  }

  return world;
});
