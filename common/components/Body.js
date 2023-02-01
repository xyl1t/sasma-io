import { defineComponent, Types } from "../bitecs.js";

export const Body = defineComponent({
  movingDirection: Types.f32, // forward or backward
  rotationSpeed: Types.f32,
  power: Types.f32,
  angle: Types.f32,
  force: Types.f32,
  acceleration: Types.f32,
  velocity: Types.f32,
});
