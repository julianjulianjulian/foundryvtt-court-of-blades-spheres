import { BladesSheet } from "../../../systems/blades-in-the-dark/module/blades-sheet.js";
import { Utils, MODULE_ID } from "./utils.js";

export class CourtOfBladesSheet extends BladesSheet {
  /* -------------------------------------------------------------------------- */
  /*                               Error messages                               */
  /* -------------------------------------------------------------------------- */

  /**
   * Permission error message for adding items
   * @override
   * @param {*} event 
   * @param {*} droppedItem 
   * @returns 
   */
  async _onDropItem(event, droppedItem) {
    await super._onDropItem(event, droppedItem);
    if (!this.actor.isOwner) {
      ui.notifications.error(`You do not have sufficient permissions to edit this sheet. Please speak to your GM if you feel you have reached this message in error.`, { permanent: true });
      return false;
    }
    await this.handleDrop(event, droppedItem);
  }

  /**
   * Permission error message for adding actors
   * @override
   * @param {*} event 
   * @param {*} droppedActor 
   * @returns 
   */
  async _onDropActor(event, droppedActor) {
    await super._onDropActor(event, droppedActor);
    if (!this.actor.isOwner) {
      ui.notifications.error(`You do not have sufficient permissions to edit this sheet. Please speak to your GM if you feel you have reached this message in error.`, { permanent: true });
      return false;
    }
    await this.handleDrop(event, droppedActor);
  }

  // TODO is this a helper...?
  /**
   * 
   * @param {*} propName 
   * @param {*} value 
   */
  setLocalProp(propName, value) {
    this[propName] = value;
    this.render(false);
  }

  /* -------------------------------------------------------------------------- */
  /*                        Abilities, Items and Upgrades                       */
  /* -------------------------------------------------------------------------- */

  /**
   * Dialog window for adding an existing item or ability to sheet
   * @param {*} item_type 
   */
  async generateAddExistingItemDialog(item_type) {
    let all_items = await Utils.getSourcedItemsByType(item_type);
    all_items = Utils.filterItemsForDuplicatesOnActor(all_items, item_type, this.actor, true);
    let grouped_items = {};

    let items_html = '<div class="items-list">';
    all_items = all_items.filter(i => !i.name.includes("Veteran"));
    let sorted_grouped_items = Utils.groupItemsByClass(all_items);

    for (const [itemclass, group] of Object.entries(sorted_grouped_items)) {
      items_html += `<div class="item-group"><header>${itemclass}</header>`;
      for (const item of group) {
        let trimmedname = Utils.trimClassFromName(item.name);
        let strip = Utils.strip;
        let description = item.system.description.replace(/"/g, '&quot;');
        items_html += `
              <div class="item-block">
                <input type="checkbox" id="character-${this.actor.id}-${item_type}add-${item.id}" data-${item_type}-id="${item.id}" >
                <label for="character-${this.actor.id}-${item_type}add-${item.id}" title="${strip(description)}" class="hover-term">${trimmedname}</label>
              </div>
            `;
      }
      items_html += '</div>';
    }

    items_html += '</div>';

    let d = new Dialog({
      title: game.i18n.localize("COB.Actor." + Utils.capitalizeFirstLetter(item_type) + "Action.AddExisting"),
      content: `<h3>${game.i18n.localize("COB.Actor." + Utils.capitalizeFirstLetter(item_type) + "Action.AddTip")}</h3>
                      ${items_html}
                      `,
      buttons: {
        add: {
          icon: "<i class='fas fa-check'></i>",
          label: game.i18n.localize("BITD.Add"), // TODO loc
          callback: async (html) => {
            let itemInputs = html.find("input:checked");
            let items = [];
            for (const itemelement of itemInputs) {
              let item = await Utils.getItemByType(item_type, itemelement.dataset[item_type + "Id"]);
              items.push(item);
            }
            this.actor.createEmbeddedDocuments("Item", items);
          }
        },
        cancel: {
          icon: "<i class='fas fa-times'></i>",
          label: game.i18n.localize("bitd-alt.Cancel"), // TODO loc
          callback: () => { }
        }
      },
      render: (html) => {
        this.addTermTooltips(html);
      },
      close: (html) => {

      }
    }, { classes: ["add-existing-dialog"], width: "650" });
    d.render(true);
  }


  /* -------------------------------------------------------------------------- */
  /*                                     UI                                     */
  /* -------------------------------------------------------------------------- */

  /**
   * Radio toggle management
   * @param {*} event 
   */
  _onRadioToggle(event) {
    let type = event.target.tagName.toLowerCase();
    let target = event.target;
    if (type == "label") {
      let labelID = $(target).attr('for');
      target = $(`#${labelID}`).get(0);
    }
    if (target.checked) {
      //find the next lowest-value input with the same name and click that one instead
      let name = target.name;
      let value = parseInt(target.value) - 1;
      this.element.find(`input[name="${name}"][value="${value}"]`).trigger('click');
    }
    else {
      //trigger the click on this one
      $(target).trigger('click');
    }
  }
}
