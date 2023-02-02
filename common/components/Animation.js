import { defineComponent, Types } from "../bitecs.js";

export const Animation = defineComponent({
  sprites: [Types.ui8, 255],
  interval: Types.f32,
  lastTime: Types.f32,
  current: Types.ui8,
  numberOfSprites: Types.ui8,
});
