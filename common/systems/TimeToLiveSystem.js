import { addComponent, defineQuery, defineSystem, hasComponent, Not, removeEntity } from "../bitecs.js";
import { Body } from "../components/Body.js";
import { Bot } from "../components/Bot.js";
import { Gun } from "../components/Gun.js";

import { Rotation } from "../components/Rotation.js";
import { Input } from "../components/Input.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { Velocity } from "../components/Velocity.js";
import { TimeToLive } from "../components/TimeToLive.js";
import { Animation } from "../components/Animation.js";

const removeSpritesQuery = defineQuery([TimeToLive]);

export const timeToLiveSystem = defineSystem((world) => {
  const spritesToRemove = removeSpritesQuery(world);
  for (const id of spritesToRemove) {
    if (TimeToLive.timeToLive[id] <= TimeToLive.fadeTime[id]){
        Sprite.translucency[id] = 1 - TimeToLive.timeToLive[id] / TimeToLive.fadeTime[id];
    }
    if (TimeToLive.timeToLive[id] <= 0){
        removeEntity(world, id);
    }
    TimeToLive.timeToLive[id] -= world.dt;
  }
  return world;
});
