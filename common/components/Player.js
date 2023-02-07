import { defineComponent, Types } from "../bitecs.js";

export const Player = defineComponent({
  color: Types.ui8,
  viewDistanceWidth: Types.ui16,
  viewDistanceHeight: Types.ui16,
  health: Types.f32,
  damagedBy: Types.eid,
  isMobile: Types.ui8,
});
