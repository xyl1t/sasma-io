import { defineComponent, Types } from "../bitecs.js";

export const Sprite = defineComponent({
  texture: Types.ui8,
  translucency: Types.f32,
});
