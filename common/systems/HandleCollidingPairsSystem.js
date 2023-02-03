import {
  addComponent,
  addEntity,
  defineSystem,
  hasComponent,
  removeEntity,
} from "../bitecs.js";
import { AnimatedSprite } from "../components/AnimatedSprite.js";
import { Bullet } from "../components/Bullet.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";

export const handleCollidingPairsSystem = defineSystem((world) => {
  for (let [id1, id2] of world.collidingPairs) {
    const isBullet1 = hasComponent(world, Bullet, id1);
    const isBullet2 = hasComponent(world, Bullet, id2);
    const isPlayer1 = hasComponent(world, Player, id1);
    const isPlayer2 = hasComponent(world, Player, id2);
    if ((isBullet1 && isPlayer2) || (isPlayer1 && isBullet2)) {
      if (hasComponent(world, Bullet, id2)) {
        [id1, id2] = [id2, id1];
      }
      handleBulletPlayerHit(world, id1, id2);
    }
  }

  return world;
});

function handleBulletPlayerHit(world, bulletId, playerId) {
  const explosionId = addEntity(world);
  addComponent(world, Position, explosionId);
  Position.x[explosionId] = Position.x[bulletId];
  Position.y[explosionId] = Position.y[bulletId];
  addComponent(world, AnimatedSprite, explosionId);
  let spriteIdxs = [];
  for (let idx = 1; idx <= 5; idx++) {
    spriteIdxs.push(world.assetIdMap["explosionSmoke" + idx]);
  }
  AnimatedSprite.numberOfSprites[explosionId] = spriteIdxs.length;
  AnimatedSprite.sprites[explosionId].set(spriteIdxs);
  AnimatedSprite.interval[explosionId] = 0.05;
  AnimatedSprite.lastTime[explosionId] = 0;
  AnimatedSprite.current[explosionId] = 0;

  Player.health[playerId] -= Bullet.damage[bulletId];

  removeEntity(world, bulletId);
}
