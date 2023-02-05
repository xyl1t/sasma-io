import { defineComponent, Types } from "../bitecs.js";

export const AnimatedSprite = defineComponent({
  sprites: [Types.ui8, 16],
  interval: Types.f32,
  lastTime: Types.f32,
  current: Types.ui8,
  numberOfSprites: Types.ui8,
});
