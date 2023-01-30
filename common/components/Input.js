import { defineComponent, Types } from "../bitecs.js";

export const Input = defineComponent({
  inputX: Types.i8,
  inputY: Types.i8,
  angle: Types.f32,
  shooting: Types.ui8,
});
