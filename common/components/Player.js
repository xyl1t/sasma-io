import { defineComponent, Types } from "../bitecs.js";

export const Player = defineComponent({
  viewDistanceWidth: Types.i32,
  viewDistanceHeight: Types.i32,
});
