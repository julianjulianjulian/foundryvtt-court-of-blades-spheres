/**
 * Define a set of template paths to pre-load
 * Pre-loaded templates are compiled and cached for fast access when rendering
 * @return {Promise}
 */
export const preloadHandlebarsTemplates = async function() {

  // Define template paths to load
  const templatePaths = [

    // Actor Sheet Partials
    "modules/court-of-blades/templates/parts/coins.hbs",
    "modules/court-of-blades/templates/parts/attributes.hbs",
    "modules/court-of-blades/templates/parts/harm.hbs",
    "modules/court-of-blades/templates/parts/load.hbs",
    "modules/court-of-blades/templates/parts/radiotoggles.hbs",
    "modules/court-of-blades/templates/parts/ability.hbs",
    "modules/court-of-blades/templates/parts/item.hbs",
    "modules/court-of-blades/templates/parts/item-header.hbs",
    // "modules/court-of-blades/templates/parts/turf-list.hbs",
    // "modules/court-of-blades/templates/parts/cohort-block.hbs",
    // "modules/court-of-blades/templates/parts/factions.hbs",
    "modules/court-of-blades/templates/parts/active-effects.hbs",
  ];

  // Load the template parts
  return await loadTemplates(templatePaths);
};
