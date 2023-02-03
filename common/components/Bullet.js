import { defineComponent, Types } from "../bitecs.js";

export const Bullet = defineComponent({
  source: Types.eid,
  damage: Types.f32,
});
