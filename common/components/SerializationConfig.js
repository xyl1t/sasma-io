import { Position } from "./Position.js";
import { Velocity } from "./Velocity.js";
import { Sprite } from "./Sprite.js";
import { Player } from "./Player.js";
import { Me } from "./Me.js";
import { Input } from "./Input.js";
import { Map } from "./Map.js";
import { Rotation } from "./Rotation.js";
import { Body } from "./Body.js";
import { Gun } from "./Gun.js";
import { Bot } from "./Bot.js";

// necessary config for serialization and deserialization
export const serializationConfig = [
  Body,
  Bot,
  Gun,
  Input,
  Map,
  Me,
  Player,
  Position,
  Rotation,
  Sprite,
  Velocity,
];
