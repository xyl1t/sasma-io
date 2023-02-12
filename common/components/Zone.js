import { defineComponent, Types } from "../bitecs.js";

export const Zone = defineComponent({
  size: Types.f32,
  collision: Types.ui8,
  speed: Types.f32
});
