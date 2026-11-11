/* List sections, in display order, and which recipe (by id) sits in which.
   Kept apart from data/*.json so re-scraping never loses the sorting. Unlisted ids go to "Other". */
window.CATEGORIES = [
  { name: 'Breakfast & porridge', ids: ['havregrot', 'risgrot', 'arme-riddere'] },
  { name: 'Chicken', ids: ['kyllingfilet-i-form', 'wok-med-kylling-og-nudler', 'helstekt-kylling-pa-gronnsakseng',
    'helstekt-kylling-med-ovnsbakte-poteter', 'marry-me-chicken'] },
  { name: 'Meat', ids: ['beef-stew-with-carrots-potatoes', 'cast-iron-pan-seared-steak-oven-finished'] },
  { name: 'Fish', ids: ['laks-i-folie'] },
  { name: 'Pasta', ids: ['lasagne', 'mac-and-cheese', 'pasta-carbonara', 'next-level-spaghetti-bolognese'] },
  { name: 'Soups', ids: ['kjottsuppe', 'kremet-fiskesuppe'] },
  { name: 'Sides & sauces', ids: ['brun-saus', 'ovnsstekte-potetbater', 'flotegratinerte-poteter', 'how-to-cook-rice'] },
  { name: 'Baking', ids: ['hveteboller', 'eltefrie-grove-rundstykker', 'bananbrod', 'eplekake'] },
  { name: 'Drinks', ids: ['mango-lassi', '1000-calorie-smoothie'] }
];
