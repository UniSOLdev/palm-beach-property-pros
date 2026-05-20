export const SUPPLY_CATEGORIES = [
  "Pressure Washing",
  "Detailing",
  "Cleaning",
  "Lawn Care",
  "PPE",
  "Chemicals",
  "Tools",
  "Consumables",
  "Equipment",
  "Misc",
] as const;

export type SupplyCategory = (typeof SUPPLY_CATEGORIES)[number];

export const SUPPLY_UNITS = ["each", "bottle", "gallon", "box", "roll", "bag", "pair", "set"] as const;
