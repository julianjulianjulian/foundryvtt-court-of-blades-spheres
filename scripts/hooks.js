import { CourtOfBladesSheet } from "./court-of-blades-sheet.js";
import { MODULE_ID, Utils } from "./utils.js";

export async function registerHooks() {
  /* -------------------------------------------------------------------------- */
  /*                                  On ready                                  */
  /* -------------------------------------------------------------------------- */

  Hooks.once('ready', () => {

    CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.concat([
      {
          pattern : /(@UUID\[([^]*?)]){[^}]*?}/gm,
          enricher : async (match, options) => {
            let linkedDoc = await fromUuid(match[2]);
            if(linkedDoc?.type == "🕛 clock"){
              const doc = document.createElement("div");
              doc.classList.add('linkedClock');
              let droppedItemTextRaw = match[0];
              let droppedItemRegex = /{[^}]*?}/g;
              let droppedItemTextRenamed = droppedItemTextRaw.replace(droppedItemRegex, `{${linkedDoc.name}}`);
              doc.innerHTML = `<img src="systems/blades-in-the-dark/styles/assets/progressclocks-svg/Progress Clock ${linkedDoc.system.type}-${linkedDoc.system.value}.svg" class="clockImage" data-uuid="${match[2]}" />
                <br/> 
                ${droppedItemTextRenamed}`;
              return doc;
            }
            else return false;
          }
      }
    ])
  });
  //why isn't sheet showing up in update hook?

  Hooks.on("deleteItem", async (item, options, id) =>{
    if(item.type === "item" && item.parent){
      await Utils.toggleOwnership(false, item.parent, "item", item.id)
    }
  })

  Hooks.on("renderBladesClockSheet", async(sheet, html, options)=>{
    let characters = game.actors.filter(a => {
      return a.type === "character";
    });
    for (let index = 0; index < characters.length; index++) {
      const character = characters[index];
      let notes = await character.getFlag('court-of-blades', 'notes');
      notes = notes ? notes : "";
      if(notes.includes(sheet.actor._id)){
        character.sheet.render(false);
      }
      
    }
  });
  
  // should we just display items and abilities some other way so switching back and forth between sheets is easy?
  Hooks.on("updateActor", async (actor, updateData, options, actorId)=>{
    if(options.diff && updateData?.flags?.core && "sheetClass" in updateData?.flags?.core){
    }
    if(actor._sheet instanceof CourtOfBladesSheet){
    }
  });

  Hooks.on("createActor", async (actor)=>{
    if(actor._sheet instanceof CourtOfBladesSheet){
    }
  })
  return true;
}