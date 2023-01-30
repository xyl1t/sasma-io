import { world } from "./world.js";

export async function setupEvents() {
  window.addEventListener("resize", world.resize, false);
  world.canvas.addEventListener("mousedown", mousedown, false);
  world.canvas.addEventListener("mouseup", mouseup, false);
  world.canvas.addEventListener("mouseleave", mouseleave, false);
  world.canvas.addEventListener("mousemove", mousemove, false);
  world.canvas.addEventListener("wheel", wheel, false);
  window.addEventListener("keydown", keydown, true);
  window.addEventListener("keyup", keyup, true);
  $("#btnJoin").click(btnJoinClick);
}

function btnJoinClick(e) {
  console.log("join clicked")
  $("#startPageContainer").css("display", "none");
  $("#gameContainer").css("filter", "none");
  world.socket.emit("join"/*, name, x, y, z*/);
}

function mousedown(e) {
  world.mouse.x = e.pageX - world.canvas.offsetLeft;
  world.mouse.y = e.pageY - world.canvas.offsetTop;
  world.mouse.leftDown = (e.buttons & 1) == 1;
  world.mouse.rightDown = (e.buttons & 2) == 2;
}

function mouseup(e) {
  world.mouse.x = e.pageX - world.canvas.offsetLeft;
  world.mouse.y = e.pageY - world.canvas.offsetTop;
  world.mouse.leftDown = (e.buttons & 1) == 1;
  world.mouse.rightDown = (e.buttons & 2) == 2;
}

function mouseleave(e) {
  world.mouse.x = e.pageX - world.canvas.offsetLeft;
  world.mouse.y = e.pageY - world.canvas.offsetTop;
  world.mouse.leftDown = false;
  world.mouse.rightDown = false;
}

function mousemove(e) {
  world.mouse.oldX = world.mouse.x;
  world.mouse.oldY = world.mouse.y;
  world.mouse.x = e.pageX - world.canvas.offsetLeft;
  world.mouse.y = e.pageY - world.canvas.offsetTop;
  const dx = world.mouse.x - world.windowWidth / 2;
  const dy = world.mouse.y - world.windowHeight / 2;
  world.mouse.oldAngle = world.mouse.angle;
  world.mouse.angle = Math.atan2(dy, dx);
  world.mouse.leftDown = (e.buttons & 1) == 1;
  world.mouse.rightDown = (e.buttons & 2) == 2;
}

// NOTE: yet unused
function wheel(e) {
  e.preventDefault();

  let deltaX = e.deltaX;
  let deltaY = e.deltaY;

  if (e.shiftKey) {
    deltaY = 0;
    deltaX = e.deltaY || e.deltaX;
  }

  const finalX = (Math.max(-100, Math.min(100, deltaX)) / 100) * 100;
  const finalY = (Math.max(-100, Math.min(100, deltaY)) / 100) * 100;
}

function keydown(e) {
  world.keyboard[e.key.toLowerCase()] = true;
  if (world.keyboard["r"]) {

  }
}

function keyup(e) {
  world.keyboard[e.key.toLowerCase()] = false;
}
