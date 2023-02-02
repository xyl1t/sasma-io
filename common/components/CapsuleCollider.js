import { defineComponent, Types } from "../bitecs.js";

export const CapsuleCollider = defineComponent({
  radius: Types.f32,
  sx: Types.f32,
  sy: Types.f32,
  ex: Types.f32,
  ey: Types.f32,
});
