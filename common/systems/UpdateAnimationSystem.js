import { defineQuery, defineSystem, removeComponent } from "../bitecs.js";
import { Animation } from "../components/Animation.js";

const AnimationSpritesQuery = defineQuery([Animation]);

export const updateAnimationSystem = defineSystem((world) => {
  const animationSprites = AnimationSpritesQuery(world);
  for (const id of animationSprites) {
    if (Animation.lastTime[id] >= Animation.interval[id]) {
      Animation.lastTime[id] -= Animation.interval[id];
      Animation.current[id]++;
      if (Animation.current[id] >= Animation.numberOfSprites[id]) {
        removeComponent(world, Animation, id);
      }
    }
    Animation.lastTime[id] += world.dt;
  }
  return world;
});
