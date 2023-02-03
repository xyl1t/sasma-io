import { defineComponent, Types } from "../bitecs.js";

export const PickupEffect = defineComponent({
  type: Types.ui8,
  effectDuration: Types.f32,
  effectValue: Types.f32,
  oldValue: Types.f32
});
