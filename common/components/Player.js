import { defineComponent, Types } from "../bitecs.js";

export const Player = defineComponent({
  color: Types.ui32,
  viewDistanceWidth: Types.i32,
  viewDistanceHeight: Types.i32,
});
