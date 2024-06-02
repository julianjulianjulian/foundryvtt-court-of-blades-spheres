import { BladesActiveEffect } from "../../../systems/blades-in-the-dark/module/blades-active-effect.js";
import { CourtOfBladesSheet } from "./court-of-blades-sheet.js";
import { Utils, MODULE_ID } from "./utils.js";
import { queueUpdate } from "./lib/update-queue.js";

/**
 * Modified crew sheet
 * @extends {CourtOfBladesSheet}
 */
export class CourtOfBladesCrewSheet extends CourtOfBladesSheet {
  coins_open = false;
  harm_open = false;
  load_open = false;
  allow_edit = false;
  show_debug = false;

  /* -------------------------------------------------------------------------- */
  /*                                  Get data                                  */
  /* -------------------------------------------------------------------------- */

  // TODO add comments
  /**
   * @override
   * @returns 
   */
  async getData(options) {
    /* --------------------------- Initial data import -------------------------- */
    let sheetData = await super.getData(options);

    // Editing rights
    sheetData.editable = this.options.editable;
    sheetData.isGM = game.user.isGM;

    // Moving some data around
    // NOTE What BitD defines as sheetData is here referred to as actorData
    // NOTE What BitD-alt defines as data and data.data is here referred to as sheetData and data.system    
    const actorData = sheetData.data;
    sheetData.actor = actorData;
    sheetData.system = actorData.system;

    // Ui parameters
    sheetData.coins_open = this.coins_open;
    sheetData.harm_open = this.harm_open;
    sheetData.allow_edit = this.allow_edit;
    sheetData.show_debug = this.show_debug;
    sheetData.system.experience_max = "10"; // FIXME there has to be a better way to set this?
    sheetData.system.heat_max = "9";
    sheetData.system.wanted_max = "3";
    sheetData.system.tier_max = "6";

    // Crew-specific parameters
    if (!("strength" in sheetData.system)) {
      sheetData.system.strength = "";
      sheetData.system.healer = "";
      sheetData.system["healer-type"] = "";
      sheetData.system.reputation = "";
    }

    /* ---------------------------------- Notes --------------------------------- */
    // Displaying clocks in notes

    let rawNotes = this.actor.getFlag("court-of-blades", "notes");
    if (rawNotes) {
      let pattern = /(@UUID\[([^]*?)]){[^}]*?}/gm;
      let linkedEntities = [...rawNotes.matchAll(pattern)];

      for (let index = 0; index < linkedEntities.length; index++) {
        const entity = await fromUuid(linkedEntities[index][2]);
        if (entity?.type === "🕛 clock") {

        }
      }

      let clockNotes = await TextEditor.enrichHTML(rawNotes, {
        documents: false,
        async: true
      });

      sheetData.notes = await TextEditor.enrichHTML(clockNotes, {
        relativeTo: this.document, secrets: this.document.isOwner, async: true
      });

    }

    /* ---------------------------------- Turfs --------------------------------- */
    // TODO adjust for CoB?
    // Calculate Turfs amount.
    // We already have Lair, so set to -1.
    let turfs_amount = 0
    actorData.items.forEach(item => {

      if (item.type === "crew_type") {
        Object.entries(item.system.turfs).forEach(([key, turf]) => {
          if (turf.name === 'BITD.Turf') {
            turfs_amount += (turf.value === true) ? 1 : 0;
          }
        });
      }

    });
    sheetData.system.turfs_amount = turfs_amount;

    /* -------------------------------- Crew type ------------------------------- */
    // Check whether a crew type has been selected
    let owned_crew_types = this.actor.items.filter(item => item.type == "crew_type");
    if (owned_crew_types.length == 1) {
      console.log("One crew type selected. Doing the thing.");
      sheetData.selected_crew_type = owned_crew_types[0];
    }
    else {
      console.log("Wrong number of crew_types on character " + this.actor.name);
    }

    /* ----------------------- Crew abilities and upgrades ---------------------- */
    let combined_abilities_list = [];
    let all_generic_items = [];
    let my_items = [];

    if (sheetData.selected_crew_type) {
      combined_abilities_list = await Utils.getVirtualListOfItems("crew_ability", sheetData, true, sheetData.selected_crew_type.name, false, true);
      my_items = await Utils.getVirtualListOfItems("crew_upgrade", sheetData, true, sheetData.selected_crew_type.name, true, true);

      sheetData.selected_crew_type_full = sheetData.selected_crew_type;
      sheetData.selected_crew_type_full = await Utils.getItemByType("crew_type", sheetData.selected_crew_type.id);
    }
    else {
      combined_abilities_list = await Utils.getVirtualListOfItems("crew_ability", sheetData, true, "", false, true);

      my_items = await Utils.getVirtualListOfItems("crew_upgrade", sheetData, true, "noclassselected", true, true);
    }

    all_generic_items = await Utils.getVirtualListOfItems("crew_upgrade", sheetData, true, "", false, false);
    sheetData.available_crew_type_abilities = combined_abilities_list;

    sheetData.generic_items = all_generic_items;
    sheetData.my_items = my_items;

    let my_abilities = sheetData.items.filter(ability => ability.type == "crew_ability");
    sheetData.my_abilities = my_abilities;

    return sheetData;

  }

  /* -------------------------------------------------------------------------- */
  /*                             Activate Listeners                             */
  /* -------------------------------------------------------------------------- */

  // TODO add comments
  /**
   * Activate Character Sheet listeners
   * @param {*} html 
   * @returns 
   */
  activateListeners(html) {
    super.activateListeners(html);

    this.addTermTooltips(html);

    // Everything below here is only needed if the sheet is editable
    if (!this.options.editable) return;

    new ContextMenu(html, ".item-block.owned", this.upgradeContextMenu);
    // new ContextMenu(html, ".ability-block", this.abilityContextMenu);
    new ContextMenu(html, ".context-items > span", this.upgradeListContextMenu);
    new ContextMenu(html, ".item-list-add", this.upgradeListContextMenu, { eventName: "click" });
    new ContextMenu(html, ".context-abilities", this.abilityListContextMenu);
    new ContextMenu(html, ".ability-add-popup", this.abilityListContextMenu, { eventName: "click" });
    //new ContextMenu(html, ".trauma-item", this.traumaListContextMenu);
    //new ContextMenu(html, ".acquaintance", this.acquaintanceContextMenu);

    html.find("img.clockImage").on("click", async e => {
      let entity = await fromUuid(e.currentTarget.dataset.uuid);
      let currentValue = entity.system.value;
      let currentMax = entity.system.type;
      if (currentValue < currentMax) {
        currentValue++;
        await entity.update({ data: { value: currentValue } });
        this.render();
      }
    });

    html.find("img.clockImage").on("contextmenu", async e => {
      let entity = await fromUuid(e.currentTarget.dataset.uuid);
      let currentValue = entity.system.value;
      let currentMax = entity.system.type;
      if (currentValue > 0) {
        currentValue = currentValue - 1;
        await entity.update({ data: { value: currentValue } });
        this.render();
      }
    });

    html.find("input.radio-toggle, label.radio-toggle").click(e => e.preventDefault());
    html.find("input.radio-toggle, label.radio-toggle").mousedown(e => {
      this._onRadioToggle(e);
    });

    html.find('.inline-input').on('input', async ev => {
      let input = ev.currentTarget.previousSibling;
      input.value = ev.currentTarget.innerText;
    })

    html.find('.inline-input').on('blur', async ev => {
      let input = ev.currentTarget.previousSibling;
      $(input).change();
    })

    html.find('.debug-toggle').click(async ev => {
      this.setLocalProp("show_debug", !this.show_debug);
      // html.find('.debug-toggle').toggleClass(on)
      // this.show_debug = true;
    });

    /* -------------------------------- Upgrades -------------------------------- */
    // Editing
    // TODO does this do anything?  
    html.find('.item-block .clickable-edit').click(ev => {
      ev.preventDefault();
      let upgradeId = ev.currentTarget.closest(".item-block").dataset.itemId;
      let item = this.actor.items.get(upgradeId);
      if (item && !item.data.virtual) {
        item.sheet.render(true);
      }
    });

    // Checkbox
    html.find('.item-block .main-checkbox').change(async ev => {
      let checkbox = ev.target;
      let item_id = checkbox.closest(".item-block").dataset.itemId;
      await Utils.toggleOwnership(checkbox.checked, this.actor, 'crew_upgrade', item_id);
    });

    // Primary checkbox (if two)
    html.find('.item-block .main-checkbox').change(ev => {
      let checkbox = ev.target;
      let itemId = checkbox.closest(".item-block").dataset.itemId;
      let item = this.actor.items.get(itemId);
      if (item) {
        return item.update({ data: { equipped: checkbox.checked } });
      }
    });

    // Secondary checkbox 
    html.find('.item-block .child-checkbox').click(ev => {
      let checkbox = ev.target;
      let $main = $(checkbox).siblings(".main-checkbox");
      $main.trigger('click');
    });


    /* -------------------------------- Abilities ------------------------------- */
    // Editing
    // TODO Does this do anything?
    html.find('.ability-block .clickable-edit').click(ev => {
      ev.preventDefault();
      let abilityId = ev.currentTarget.closest(".ability-block").dataset.abilityId;
      let ability = this.actor.items.get(abilityId);
      ability.sheet.render(true);
    });

    // Checkbox
    html.find('.ability-block .main-checkbox').change(async ev => {
      let checkbox = ev.target;
      let ability_id = checkbox.closest(".ability-block").dataset.abilityId;
      await Utils.toggleOwnership(checkbox.checked, this.actor, 'crew_ability', ability_id);
    });

    /* ------------------------ Delete upgrade or ability ----------------------- */
    html.find('.item-control.item-delete').click(async ev => {
      let item_id = ev.target.closest("div.item").dataset.itemId;
      await this.actor.deleteEmbeddedDocuments('Item', [item_id]);
    });

    /* ---------------------------- Edit lock button ---------------------------- */
    html.find('.toggle-allow-edit').click(async (event) => {
      event.preventDefault();
      this.setLocalProp("allow_edit", !this.allow_edit);
    });

    /* -------------------------------- Coin box -------------------------------- */
    html.find('.coins-box').click(async ev => {
      if (!$(ev.target).closest('.coins-box .full-view').length) {
        html.find('.coins-box').toggleClass('open');
        this.coins_open = !this.coins_open;
      }
    });

    /* ----------------------------- Active effects ----------------------------- */
    // manage active effects
    // TODO bring these back?
    /* html.find(".effect-control").click(ev => BladesActiveEffect.onManageActiveEffect(ev, this.actor));
 */
    // TODO does this do anything?
    html.find(".toggle-expand").click(ev => {
      if (!this._element.hasClass("can-expand")) {
        this.setPosition({ height: 275 });
        this._element.addClass("can-expand");
      }
      else {
        this.setPosition({ height: "auto" });
        this._element.removeClass("can-expand");
      }
    });
  }



  /* -------------------------------------------------------------------------- */
  /*                              Helper overrides                              */
  /* -------------------------------------------------------------------------- */

  /** 
   * Setting default options for character sheet
   * @override 
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["court-of-blades", "sheet", "crew", "pc", "actor"], // TODO remove pc class
      template: "modules/court-of-blades/templates/crew-sheet.hbs",
      width: 800,
      height: 1200,
      tabs: [{ navSelector: ".tabs", contentSelector: ".tab-content", initial: "crew_type" }]
    });
  }

  /**
   * Dropping NPCs or crew types on character sheet
   * @override
   * @param {*} event 
   * @param {*} droppedEntity 
   */
  async handleDrop(event, droppedEntity) {
    let droppedEntityFull = await fromUuid(droppedEntity.uuid);
    switch (droppedEntityFull.type) {
      case "npc":
        // await CourtOfBladesCharacterSheet.addAcquaintance(this.actor, droppedEntityFull); // TODO add "add cohort" function based on add acquaintance
        break;
      case "crew_type":
        await this.switchCrewType(droppedEntityFull);
        break;
      default:
        break;
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                               Acquaintances                                */
  /* -------------------------------------------------------------------------- */

  // TODO Adjust for crews
  /**
   * Adds an NPC to the character as an acquaintance of neutral standing
   * @param {*} actor - target
   * @param {*} acq - acquaintance to be added
   */
  /* static async addAcquaintance(actor, acq) {
    let current_acquaintances = actor.system.acquaintances;
    let acquaintance = {
      id: acq.id,
      name: acq.name,
      description_short: acq.system.description_short,
      standing: "neutral"
    };
    let unique_id = !current_acquaintances.some((oldAcq) => {
      return oldAcq.id == acq.id;
    });
    if (unique_id) {
      await actor.update({ data: { acquaintances: current_acquaintances.concat([acquaintance]) } });
    }
    else {
      ui.notifications.info("The dropped NPC is already an acquaintance of this character.");
    }
  } */

  /**
   * Add an array of NPCs as acquaintances of neutral standing
   * @param {*} actor 
   * @param {*} acqArr 
   */
  /* static async addAcquaintanceArray(actor, acqArr) {
    let current_acquaintances = actor.system.acquaintances;
    for (const currAcq of current_acquaintances) {
      acqArr.findSplice((acq) => acq.id == currAcq._id);
    }
    acqArr = acqArr.map((acq) => {
      return {
        id: acq.id,
        name: acq.name,
        description_short: acq.system.description_short,
        standing: "neutral"
      }
    });
    await actor.update({ data: { acquaintances: current_acquaintances.concat(acqArr) } });
  } */

  /**
   * Remove NPC from acquiantance list by ID
   * @param {*} actor 
   * @param {*} acqId 
   */
  /* static async removeAcquaintance(actor, acqId) {
    let current_acquaintances = actor.system.acquaintances;
    let updated_acquaintances = current_acquaintances.filter(acq => acq._id !== acqId && acq.id !== acqId);
    await actor.update({ data: { acquaintances: updated_acquaintances } });
  }
 */
  /**
   * Remove NPCs from acquaintance list based on array of IDs
   * @param {*} actor 
   * @param {*} acqArr 
   */
  /* static async removeAcquaintanceArray(actor, acqArr) {
    //see who the current acquaintances are
    let current_acquaintances = actor.system.acquaintances;
    //for each of the passed acquaintances
    for (const currAcq of acqArr) {
      //remove the matching acquaintance from the current acquaintances
      current_acquaintances.findSplice((acq) => acq.id == currAcq.id);
    }
    // let new_acquaintances = current_acquaintances.filter(acq => acq._id !== acqId && acq.id !== acqId);
    await actor.update({ data: { acquaintances: current_acquaintances } });
  } */


  /* -------------------------------------------------------------------------- */
  /*                                  Crew Types                                */
  /* -------------------------------------------------------------------------- */

  /**
   * Replace crew type
   * @param {*} newCrewTypeItem 
   */
  async switchCrewType(newCrewTypeItem) {
    //await this.switchToCrewTypeAcquaintances(newCrewTypeItem);
    if (this._state == 1) {
      Hooks.once("CourtOfBladesCrewSheet", () => {
        console.log("rerendering to refresh stale data");
        setTimeout(() => this.render(false), 100);
      })
    }
  }

  /*  async switchToCrewTypeAcquaintances(selected_crew_type) {
     let all_acquaintances = await Utils.getSourcedItemsByType('npc');
     let crew_type_acquaintances = all_acquaintances.filter(item => {
       return item.system.associated_class.trim() === selected_crew_type.name
     });
     let current_acquaintances = this.actor.system.acquaintances;
     let neutral_acquaintances = current_acquaintances.filter(acq => acq.standing === "neutral");
     await CourtOfBladesCharacterSheet.removeAcquaintanceArray(this.actor, neutral_acquaintances);
     await CourtOfBladesCharacterSheet.addAcquaintanceArray(this.actor, crew_type_acquaintances);
   } */

  /* -------------------------------------------------------------------------- */
  /*                            Upgrades and Abilities                          */
  /* -------------------------------------------------------------------------- */

  /**
   * Creating new item in sheet
   * @returns 
   */
  async addNewUpgrade() {
    let item_data_model = game.system.model.Item.crew_upgrade;
    let new_item_data = { name: "New Upgrade", type: "crew_upgrade", data: { ...item_data_model } };
    new_item_data.data.class = "custom";

    let new_item = await this.actor.createEmbeddedDocuments("Item", [new_item_data], { renderSheet: true });
    return new_item;
  }

  /**
   * Creating new ability in sheet
   * @returns 
   */
  async addNewAbility() {
    let ability_data_model = game.system.model.Item.crew_ability;
    let new_ability_data = { name: "New Ability", type: "crew_ability", data: { ...ability_data_model } };
    new_ability_data.data.class = "custom";

    let new_abilities = await this.actor.createEmbeddedDocuments("Item", [new_ability_data], { renderSheet: true });
    let new_ability = new_abilities[0];
    await new_ability.setFlag(MODULE_ID, "custom_crew_ability", true);

    return new_ability;
  }

  /* -------------------------------------------------------------------------- */
  /*                            Context menu objects                            */
  /* -------------------------------------------------------------------------- */

  upgradeContextMenu = [
    {
      name: game.i18n.localize("COB.Actor.ItemAction.Delete"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        this.actor.deleteEmbeddedDocuments("Item", [element.data("item-id")]);
      }
    }
  ];

  upgradeListContextMenu = [
    {
      name: game.i18n.localize("COB.Actor.ItemAction.AddNew"),
      icon: '<i class="fas fa-plus"></i>',
      callback: async (element) => {
        await this.addNewUpgrade();
      }
    },
    {
      name: game.i18n.localize("COB.Actor.ItemAction.AddExisting"),
      icon: '<i class="fas fa-plus"></i>',
      callback: async (element) => {
        await this.generateAddExistingItemDialog("crew_upgrade", this.actor);
      }
    }
  ];

  // TODO update to reputation
  /*   traumaListContextMenu = [
      {
        name: game.i18n.localize("COB.Actor.ItemAction.Delete"),
        icon: '<i class="fas fa-trash"></i>',
        callback: element => {
          let traumaToDisable = element.data("trauma");
          let traumaUpdateObject = this.actor.system.trauma.list;
          traumaUpdateObject[traumaToDisable.toLowerCase()] = false;
          queueUpdate(() => this.actor.update({ data: { trauma: { list: traumaUpdateObject } } }));
        }
      }
    ]; */

  abilityContextMenu = [
    {
      name: game.i18n.localize("COB.Actor.AbilityAction.Delete"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        this.actor.deleteEmbeddedDocuments("Item", [element.data("ability-id")]);
      }
    }
  ];

  abilityListContextMenu = [
    {
      name: game.i18n.localize("COB.Actor.AbilityAction.AddNew"),
      icon: '<i class="fas fa-plus"></i>',
      callback: async (element) => {
        await this.addNewAbility();
      }
    },
    {
      name: game.i18n.localize("COB.Actor.AbilityAction.AddExisting"),
      icon: '<i class="fas fa-plus"></i>',
      callback: async (element) => {
        await this.generateAddExistingItemDialog("crew_ability", this.actor);
      }
    }
  ];

  // TODO update to cohorts
  /* acquaintanceContextMenu = [
    {
      name: game.i18n.localize("COB.Actor.ItemAction.Delete"),
      icon: '<i class="fas fa-trash"></i>',
      callback: element => {
        CourtOfBladesCharacterSheet.removeAcquaintance(this.actor, element.data("acquaintance"));
        // this.actor.deleteEmbeddedDocuments("Item", [element.data("ability-id")]);
      }
    }
  ]; */




  /* -------------------------------------------------------------------------- */
  /*                                   Helpers                                  */
  /* -------------------------------------------------------------------------- */

  // TODO move this?
  async clearLoad() {
    await this.actor.setFlag('court-of-blades', 'equipped-items', '');
  }

  /**
   * 
   * @param {*} html 
   */
  addTermTooltips(html) {
    html.find('.hover-term').hover(function (e) { // Hover event
      var titleText;
      if (e.target.title == "") {
        titleText = BladesLookup.getTerm($(this).text());
      }
      else {
        titleText = e.target.title;
      }
      $(this).data('tiptext', titleText).removeAttr('title');
      $('<p class="bitd-alt tooltip"></p>').text(titleText).appendTo('body').css('top', (e.pageY - 10) + 'px').css('left', (e.pageX + 20) + 'px').fadeIn('fast');
    }, function () { // Hover off event
      $(this).attr('title', $(this).data('tiptext'));
      $('.tooltip').remove();
    }).mousemove(function (e) { // Mouse move event
      $('.tooltip').css('top', (e.pageY - 10) + 'px').css('left', (e.pageX + 20) + 'px');
    });
  }
}
