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

const speedBoostFactor = 2;
const rateOfFireBoostFactor = 0.5;
const damageBoostFactor = 2;
const healingFactor = 40;
const viewFactor = 2;

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



        if(hasComponent(world,PickupEffect,playerId)){
          if(PickupEffect.type[playerId] == Pickup.type[puId]){
            PickupEffect.effectDuration[playerId] = effectDuration;
            removeEntity(world, puId);
          }
        }else{
            switch(Pickup.type[puId]){
                case world.assetIdMap.pickup_movement: addComponent(world,PickupEffect,playerId);
                        PickupEffect.type[playerId] = world.assetIdMap.pickup_movement;
                        PickupEffect.effectDuration[playerId] = effectDuration;
                        PickupEffect.oldValue[playerId] = Body.power[playerId];
                        PickupEffect.effectValue[playerId] = Body.power[playerId]*speedBoostFactor;
                    break;
                
                case world.assetIdMap.pickup_reload: addComponent(world,PickupEffect,playerId);
                       PickupEffect.type[playerId] = world.assetIdMap.pickup_reload;
                       PickupEffect.effectDuration[playerId] = effectDuration;
                       PickupEffect.oldValue[playerId] = Gun.rateOfFire[playerId];
                       PickupEffect.effectValue[playerId] = Gun.rateOfFire[playerId]*rateOfFireBoostFactor;
                    break;

                case world.assetIdMap.pickup_damage: addComponent(world,PickupEffect,playerId);
                      PickupEffect.type[playerId] = world.assetIdMap.pickup_damage;
                      PickupEffect.effectDuration[playerId] = effectDuration;
                      PickupEffect.oldValue[playerId] = Gun.damage[playerId];
                      PickupEffect.effectValue[playerId] = Gun.damage[playerId]*damageBoostFactor;
                    break;

                case world.assetIdMap.pickup_heal: addComponent(world,PickupEffect,playerId);
                      PickupEffect.type[playerId] = world.assetIdMap.pickup_heal;
                      PickupEffect.effectDuration[playerId] = effectDuration;
                      PickupEffect.oldValue[playerId] = Player.health[playerId];
                      PickupEffect.effectValue[playerId] = healingFactor;
                    break;
                
            }
            removeEntity(world, puId);
        }
        
      }
    }
  }

  for(let eId of effects){
    if(PickupEffect.effectDuration[eId]>0){
        PickupEffect.effectDuration[eId]-=world.dt;
    
        switch(PickupEffect.type[eId]){
            case world.assetIdMap.pickup_movement:  Body.power[eId] = PickupEffect.effectValue[eId];
                    break;
            
            case world.assetIdMap.pickup_reload:  Gun.rateOfFire[eId] = PickupEffect.effectValue[eId];
                    break;

            case world.assetIdMap.pickup_damage: Gun.damage[eId] = PickupEffect.effectValue[eId];
                    break;

            case world.assetIdMap.pickup_heal: 
                      if(Player.health[eId]<100)                  
                          Player.health[eId] += PickupEffect.effectValue[eId]*world.dt;
                    break;

        }
        
    }else{
        switch(PickupEffect.type[eId]){
            case world.assetIdMap.pickup_movement:  Body.power[eId] = PickupEffect.oldValue[eId];
                    break;

            case world.assetIdMap.pickup_reload:  Gun.rateOfFire[eId] = PickupEffect.oldValue[eId];
                    break;

            case world.assetIdMap.pickup_damage: Gun.damage[eId] = PickupEffect.oldValue[eId];
                  break;
            
            case world.assetIdMap.pickup_heal: break;

        }
        removeComponent(world,PickupEffect,eId);
    }
  }



});
