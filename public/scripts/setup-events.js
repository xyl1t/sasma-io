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
  

  $('#joyMoveBase').on('touchstart',onJoyMove);
  $('#joyMoveBase').on('touchmove',onJoyMove);
  $('#joyMoveBase').on('touchend',onJoyRelease);

  $('#joyAngleBase').on('touchstart',onJoyMove);
  $('#joyAngleBase').on('touchmove',onJoyMove);
  $('#joyAngleBase').on('touchend',onJoyRelease);

  window.addEventListener("touchstart", () => {
    world.isMobile = true;
  })
   
  $("#btnJoin").click(btnJoinClick);
  //easter egg
  $("#bullet").click((ea));
}

function btnJoinClick(e) {
  console.log("join clicked");
  $("#startPageContainer").css("display", "none");
  $("#gameContainer").css("filter", "none");

  //activate mobile controls
  if (world.isMobile)
    $('#joyCtrl').css("visibility", "visible")

  world.socket.emit("join" /*, name, x, y, z*/);
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

  // debug
  if (
    (world.keyboard["alt"] || world.keyboard["meta"]) &&
    world.keyboard["control"]
  ) {
    // ids
    if (world.keyboard["i"]) {
      world.debug.showIds = !world.debug.showIds;
    }
    // velocity
    if (world.keyboard["v"]) {
      world.debug.showVelocity = !world.debug.showVelocity;
    }
    // collision
    if (world.keyboard["c"]) {
      world.debug.showCollision = !world.debug.showCollision;
    }
  }
}

function keyup(e) {
  world.keyboard[e.key.toLowerCase()] = false;
}

function onJoyMove(e){
  e = e.originalEvent;

  e.preventDefault();


  let base = e.srcElement;
  let btn = e.srcElement.nextElementSibling;
  let touch;

  for(let t of e.changedTouches){
    if(t.target==base){
      touch = t;
    }
  }

  let rect = base.getBoundingClientRect();

  let convertedInputX = 0;
  let convertedInputY = 0;
  let angle = 0;
  let bounds = false;

  let xDif = (-1)*(rect.width)/2 + touch.clientX-rect.left;
  let yDif = (-1)*(rect.height)/2 + touch.clientY-rect.top;

  let distanceToMiddle = Math.sqrt(Math.pow(xDif,2) + Math.pow(yDif,2));

  if(distanceToMiddle <= (rect.width/2)){
    btn.style.left = (xDif+"px");
    btn.style.top = (yDif+"px");

  }else{

    //happens, when touch is out of the joystick area

    let newTop = ((rect.width/2)/distanceToMiddle*yDif);
    let newBot = ((rect.width/2)/distanceToMiddle*xDif);

    btn.style.top = newTop+"px";
    btn.style.left = newBot+"px";

    bounds = true; //out of bounds

  }



  if(base.style.left != "0px")
    convertedInputX = parseInt(btn.style.left.substring(0,btn.style.left.length-2))/(rect.width/2);
  else
    convertedInputX=0;


  if(base.style.left != "0px")
    convertedInputY = parseInt(btn.style.top.substring(0,btn.style.top.length-2))/(rect.height/2);
  else
    convertedInputY=0;

  if(xDif>0){
    angle = Math.atan(yDif/xDif);
  }else{
    angle = Math.PI + Math.atan(yDif/xDif);
  }

  world.joy[base.parentElement.id].x = convertedInputX;
  world.joy[base.parentElement.id].y = convertedInputY * (-1);
  world.joy[base.parentElement.id].angle = angle;
  world.joy[base.parentElement.id].bounds = bounds;
}

function onJoyRelease(e){
  e = e.originalEvent;
  let base = e.srcElement;
  let btn = e.srcElement.nextElementSibling;

  btn.style.left = 0;
  btn.style.top = 0;

  world.joy[base.parentElement.id].x = 0;
  world.joy[base.parentElement.id].y = 0;
  //world.joy[base.parentElement.id].angle = 0;     //angle should stay
  world.joy[base.parentElement.id].bounds = false;
}

function ea(e){
 $("#bullet").attr("src","./assets/frontpageImages/easterEgg.png");
 $("#bullet2").attr("src","./assets/frontpageImages/easterEgg.png")
}

