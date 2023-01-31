import { defineComponent, Types } from "../bitecs.js";

export const Body = defineComponent({
  angle: Types.f32,
  movingDirection: Types.f32,
  power: Types.f32,
  rotationSpeed: Types.f32,
});
