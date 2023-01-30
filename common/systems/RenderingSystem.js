import { defineQuery, defineSystem } from "../bitecs.js";
import { Me } from "/components/Me.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";

const query = defineQuery([Position, Sprite]);
const playerQuery = defineQuery([Me])

export const renderingSystem = defineSystem((world) => {
  const player = playerQuery(world);
  const { canvas, ctx, images } = world;
  ctx.save();
  // ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "lightgray";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  console.log('xPos:',Position.x[player[0]])
  ctx.translate(world.windowWidth / 2, world.windowHeight / 2);
  
  const renderAbleEntities = query(world);
  for (const id of player) {
    ctx.drawImage(
      images[Sprite.texture[id]],
      0,
      0
    );
    ctx.translate(-Position.x[id], -Position.y[id]);
  }
  

  for (const id of renderAbleEntities) {
    if (player[0] != id){
      ctx.drawImage(
        images[Sprite.texture[id]],
        Position.x[id],
        Position.y[id]
      );
    }
    
  }
  ctx.strokeStyle = "black";
  ctx.strokeRect(0, 0, 400, 300);
  ctx.restore();

  return world;
});
