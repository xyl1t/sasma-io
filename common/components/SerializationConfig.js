import { Position } from "./Position.js";
import { Velocity } from "./Velocity.js";
import { Sprite } from "./Sprite.js";
import { Player } from "./Player.js";
import { Me } from "./Me.js";
import { Input } from "./Input.js";
import { Map } from "./Map.js";

// necessary config for serialization and deserialization
export const serializationConfig = [
  Map,
  Me,
  Player,
  Position,
  Input,
  Sprite,
  Velocity,
];
