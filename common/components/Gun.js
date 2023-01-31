import { defineComponent, Types } from "../bitecs.js";

export const Gun = defineComponent({
  angle: Types.f32,
  shooting: Types.ui8,
  rateOfFire: Types.f32,
  lastTimeFired: Types.ui32,
  source: Types.eid,
});
