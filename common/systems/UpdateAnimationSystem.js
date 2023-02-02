import { addComponent, defineQuery, defineSystem, hasComponent, Not, removeComponent, removeEntity } from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Bot } from "../components/Bot.js";
import { Gun } from "../components/Gun.js";


import { Sprite } from "../components/Sprite.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { Animation } from "../components/Animation.js";

const AnimationSpritesQuery = defineQuery([Animation]);

export const updateAnimationSystem = defineSystem((world) => {

  const animationSprites = AnimationSpritesQuery(world);
  for (const id of animationSprites) {
    if (Animation.lastTime[id] >= Animation.interval[id]){
      Animation.lastTime[id] -= Animation.interval[id];
      Animation.current[id]++;
      if (Animation.current[id] >= Animation.numberOfSprites[id]){
        removeComponent(world, Animation, id);
      }
    }
    Animation.lastTime[id] += world.dt;
  }
  return world;
});
