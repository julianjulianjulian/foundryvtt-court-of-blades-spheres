import {onManageActiveEffect, prepareActiveEffectCategories} from "../../../systems/blades-in-the-dark/module/effects.js";
import { BladesActiveEffect } from "../../../systems/blades-in-the-dark/module/blades-active-effect.js";
import { Utils, MODULE_ID } from "./utils.js";
import {queueUpdate} from "./lib/update-queue.js";

// import { migrateWorld } from "../../../systems/blades-in-the-dark/module/migration.js";

/**
 * Pure chaos
 * @extends {ItemSheet}
 */
export class BladesAlternateItemSheet extends ItemSheet {

  //  "description": ""
  //  {
  //   "activation": {
  //     "type": "",
  //     "cost": 0,
  //     "condition": ""
  //   },
  //   "duration": {
  //     "value": null,
  //     "units": ""
  //   },
  //   "target": {
  //     "value": null,
  //     "width": null,
  //     "units": "",
  //     "type": ""
  //   },
  //   "range": {
  //     "value": null,
  //     "long": null,
  //     "units": ""
  //   },
  //   "uses": {
  //     "value": 0,
  //     "max": 0,
  //     "per": null
  //   },
  //   "consume": {
  //     "type": "",
  //     "target": null,
  //     "amount": null
  //   }
  // }
  // "class": "",
  //   "load": 0,
  //   "uses": 1,
  //   "additional_info": "",
  //   "equipped" : false,
  //   "num_available": 1

  /** @override */
	static get defaultOptions() {
	  return foundry.utils.mergeObject(super.defaultOptions, {
  	  classes: ["court-of-blades", "sheet", "item"],
  	  template: "modules/court-of-blades/templates/item-sheet.html",
      width: 400,
      height: 600
      // tabs: [{navSelector: ".tabs", contentSelector: ".tab-content", initial: "playbook"}]
    });
  }

  /** @override **/
  async _onDropItem(event, droppedItem) {
    await super._onDropItem(event, droppedItem);
    if (!this.actor.isOwner) {
      ui.notifications.error(`You do not have sufficient permissions to edit this character. Please speak to your GM if you feel you have reached this message in error.`, {permanent: true});
      return false;
    }
	  await this.handleDrop(event, droppedItem);
  }

  setLocalProp(propName, value){
    this[propName] = value;
    this.render(false);
  }

  /** @override */
	activateListeners(html) {
    super.activateListeners(html);

    // Everything below here is only needed if the sheet is editable
    //if (!this.options.editable) return;

    html.find(".effect-control").click(ev => BladesActiveEffect.onManageActiveEffect(ev, this.item));
    // if ( this.item.isOwned ) return ui.notifications.warn(game.i18n.localize("BITD.EffectWarning"))
      
//    });
  }

  /** @override */
  async getData() {
    console.log(this.item);
    let data = await super.getData();
    return data;
  }

}
