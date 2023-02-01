import { defineComponent, Types } from "../bitecs.js";

export const TimeToLive = defineComponent({
  timeToLive: Types.f32,
  fadeTime: Types.f32
});
