import { defineComponent, Types } from "../bitecs.js";

export const CapsuleCollider = defineComponent({
  radius: Types.f32,
  sx: [Types.f32, 10],
  sy: [Types.f32, 10],
  ex: [Types.f32, 10],
  ey: [Types.f32, 10],
  capsuleCount: Types.ui8,
});
