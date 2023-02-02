import {
  addComponent,
  addEntity,
  defineQuery,
  defineSystem,
  hasComponent,
  Not,
  removeComponent,
  removeEntity,
} from "../bitecs.js";
import { Pickup } from "../components/Pickup.js";
import { Player } from "../components/Player.js";
import { Position } from "../components/Position.js";
import { Sprite } from "../components/Sprite.js";
import { Body } from "../components/Body.js";
import { PickupEffect } from "../components/PickupEffect.js";
import { Gun } from "../components/Gun.js";

const pickupQuery = defineQuery([Position, Sprite, Pickup]);
const playerQuery = defineQuery([Player, Body, Gun]);
const effectQuery = defineQuery([PickupEffect,Body,Gun]);

const collectRadius = 40;

export const pickupSystem = defineSystem((world) => {
  const pickups = pickupQuery(world);
  const players = playerQuery(world);

  const effects = effectQuery(world);

  for (let puId of pickups) {
    for (let playerId of players) {
      if (
        Position.x[puId] - collectRadius <= Position.x[playerId] &&
        Position.x[puId] + collectRadius >= Position.x[playerId] &&
        Position.y[puId] - collectRadius <= Position.y[playerId] &&
        Position.y[puId] + collectRadius >= Position.y[playerId]
      ) {

        /******* 
        Pickup types
        0: Speedboost
        1: Increased Rate of Fire
        ********/
        const effectDuration = 4;

        const speedBoostFactor = 2;
        const rateOfFireBoostFactor = 0.5;

        if(hasComponent(world,PickupEffect,playerId)){
            PickupEffect.effectDuration[playerId] = effectDuration;
        }else{
            switch(Pickup.type[puId]){
                case 0: addComponent(world,PickupEffect,playerId);
                        PickupEffect.type[playerId] = 0;
                        PickupEffect.effectDuration[playerId] = effectDuration;
                        PickupEffect.oldValue[playerId] = Body.power[playerId];
                        PickupEffect.effectValue[playerId] = Body.power[playerId]*speedBoostFactor;
                    break;
                
                case 1: addComponent(world,PickupEffect,playerId);
                       PickupEffect.type[playerId] = 1;
                       PickupEffect.effectDuration[playerId] = effectDuration;
                       PickupEffect.oldValue[playerId] = Gun.rateOfFire[playerId];
                       PickupEffect.effectValue[playerId] = Gun.rateOfFire[playerId]*rateOfFireBoostFactor;
                    break;
            }
        }
        removeEntity(world, puId);
      }
    }
  }

  for(let eId of effects){
    if(PickupEffect.effectDuration[eId]>0){
        PickupEffect.effectDuration[eId]-=world.dt;
    
        switch(PickupEffect.type[eId]){
            case 0:  Body.power[eId] = PickupEffect.effectValue[eId];
                    break;
            
            case 1:  Gun.rateOfFire[eId] = PickupEffect.effectValue[eId];
                    break;
        }
        
    }else{
        switch(PickupEffect.type[eId]){
            case 0:  Body.power[eId] = PickupEffect.oldValue[eId];
                    break;

            case 1:  Gun.rateOfFire[eId] = PickupEffect.oldValue[eId];
                    break;
        }
        removeComponent(world,PickupEffect,eId);
    }
  }



});
