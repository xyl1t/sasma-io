import { defineComponent, Types } from "../bitecs.js";

export const Body = defineComponent({
  angle: Types.f32,
  movingDirection: Types.f32, // forward or backward
  power: Types.f32,
  rotationSpeed: Types.f32,
});
