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
import { Bullet } from "./Bullet.js";
import { Acceleration } from "./Acceleration.js";
import { Force } from "./Force.js";
import { Mass } from "./Mass.js";
import { CircleCollider } from "./CircleCollider.js";
import { TimeToLive } from "./TimeToLive.js";
import { Visible } from "./Visible.js";
import { CapsuleCollider } from "./CapsuleCollider.js";
import { AnimatedSprite } from "./AnimatedSprite.js";
import { Follow } from "./Follow.js";
import { Layer } from "./Layer.js";
import { Zone } from "./Zone.js";
import { PickupEffect } from "./PickupEffect.js";
import { Changed } from "../bitecs.js";
import { Track } from "./Track.js";

// necessary config for serialization and deserialization
export const serializationConfig = [
  AnimatedSprite.sprites,
  AnimatedSprite.current,
  Body.angle,
  Body.velocity,
  Body.force,
  Body.angleVelocity,
  Gun.reloadTimeLeft,
  Gun.rateOfFire,
  Gun.angle,
  Input,
  Me,
  Player.color,
  Player.health,
  Position,
  Rotation,
  Sprite,
  PickupEffect.type,
  PickupEffect.effectDuration,
  Follow,
  Velocity,
  CircleCollider,
  CapsuleCollider,
  Layer,
  Zone.size,
  Zone.collision,
  Track,
];


