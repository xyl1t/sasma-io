import { defineComponent, Types } from "../bitecs.js";

export const Input = defineComponent({
  inputX: Types.f32,
  inputY: Types.f32,
  angle: Types.f32,
  shooting: Types.ui8,
});
