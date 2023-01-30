export function randBetween(min, max) {
  return Math.random() * (max - min) + min;
}

export function dist(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

export function vecAngle(x, y) {
  return Math.atan2(y, x);
}

export function vecLength(x, y) {
  return Math.sqrt(x * x + y * y);
}


export function genId() {
  return Math.floor((1 + Math.random()) * 0x100000000)
    .toString(16)
    .substring(1)
    .toString();
  player;
}

export function getRandomColor() {
  return `rgb(${Math.floor(Math.random() * 255)},${Math.floor(
    Math.random() * 255
  )},${Math.floor(Math.random() * 255)})`;
}

export class Vector {
  constructor(x, y) {
    this.x = x ?? 0;
    this.y = y ?? 0;
  }

  get length() {
    return Math.sqrt(this.x ** 2 + this.y ** 2);
  }

  set length(l) {
    const a = this.angle;
    this.x = l * Math.cos(a);
    this.y = l * Math.sin(a);
  }

  get angle() {
    return Math.atan2(this.y, this.x);
  }

  set angle(a) {
    const l = this.length;
    this.x = l * Math.cos(a);
    this.y = l * Math.sin(a);
  }

  normalize() {
    const l = this.length;
    if (l == 0) return;
    this.x /= l;
    this.y /= l;
  }

	add(v2) {
		return new Vector(this.x + v2.x, this.y + v2.y);
	}

	subtract(v2) {
		return new Vector(this.x - v2.x, this.y - v2.y);
	}

	multiply(val) {
		return new Vector(this.x * val, this.y * val);
	}

	divide(val) {
		return new Vector(this.x / val, this.y / val);
	}

	addTo(v2) {
		this.x += v2.x;
		this.y += v2.y;
	}

	subtractFrom(v2) {
		this.x -= v2.x;
		this.y -= v2.y;
	}

	multiplyBy(val) {
		this.x *= val;
		this.y *= val;
	}

	divideBy(val) {
		this.x /= val;
		this.y /= val;
	}
}

export const bufferSize = 1024;

export class InputPayload {
  constructor(tick, playerId, inputX, inputY, turretAngle, shooting) {
    this.tick = tick;
    this.playerId = playerId;
    this.inputX = inputX ?? 0;
    this.inputY = inputY ?? 0;
    this.turretAngle = turretAngle ?? 0;
    this.shooting = shooting ?? 0;
  }
}

export class StatePayload {
  constructor(tick, playerId, x, y, turretAngle) {
    this.tick = tick;
    this.playerId = playerId;
    this.x = x ?? 0;
    this.y = y ?? 0;
    this.turretAngle = turretAngle ?? 0;
  }
}
