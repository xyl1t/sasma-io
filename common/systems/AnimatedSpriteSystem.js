import { defineQuery, defineSystem, removeComponent, removeEntity } from "../bitecs.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";

const AnimatedSpriteSpritesQuery = defineQuery([AnimatedSprite]);

export const animatedSpriteSystem = defineSystem((world) => {
  const AnimatedSpriteSprites = AnimatedSpriteSpritesQuery(world);
  for (const id of AnimatedSpriteSprites) {
    if (AnimatedSprite.lastTime[id] >= AnimatedSprite.interval[id]) {
      AnimatedSprite.lastTime[id] -= AnimatedSprite.interval[id];
      AnimatedSprite.current[id]++;
      if (AnimatedSprite.current[id] >= AnimatedSprite.numberOfSprites[id]) {
        removeEntity(world, id);
      }
    }
    AnimatedSprite.lastTime[id] += world.dt;
  }
  return world;
});
