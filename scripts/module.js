import { CourtOfBladesCharacterSheet } from "./court-of-blades-character-sheet.js";
import { CourtOfBladesCrewSheet } from "./court-of-blades-crew-sheet.js";
//import { BladesAlternateItemSheet } from "./court-of-blades-item-sheet.js";
import { CourtOfBladesClassSheet } from "./court-of-blades-class-sheet.js";
import { registerSystemSettings } from "./settings.js";
import { preloadHandlebarsTemplates } from "./blades-templates.js";
import { registerHandlebarsHelpers } from "./handlebars-helpers.js";
import { registerHooks } from "./hooks.js";

Hooks.once('init', async function () {
  // PC
  Actors.registerSheet("court-of-blades", CourtOfBladesCharacterSheet, {
    types: ["character"],
    label: game.i18n.localize('COB.System.CharacterSheet'),
    makeDefault: true
  });

  // Coterie
  Actors.registerSheet("court-of-blades", CourtOfBladesCrewSheet, {
    types: ["crew"],
    label: game.i18n.localize('COB.System.CrewSheet'),
    makeDefault: false
  });

  // Items.registerSheet("bitd-alt", BladesAlternateItemSheet, { types: ["item"], makeDefault: true});

  // Playbooks
  Items.registerSheet("court-of-blades", CourtOfBladesClassSheet, {
    types: ["class"],
    label: game.i18n.localize('COB.System.PlaybookSheet'),
    makeDefault: true
  });

  await registerSystemSettings();
  await preloadHandlebarsTemplates();
  await registerHandlebarsHelpers();
  await registerHooks();
});
