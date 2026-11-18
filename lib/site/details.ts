/**
 * "Detail of work" photos on the homepage. These are PLACEHOLDERS.
 * Replace the image files in public/site/details/ with your own close-ups
 * (same names) and set placeholder: false. Details only: never a house
 * exterior, face, address, gate, plate, or anything identifying a client.
 */
export const DETAIL_PHOTOS = [
  { src: "/site/details/photo-report.webp", alt: "A visit report with dated photos on a phone", caption: "A photo report after every visit", placeholder: true },
  { src: "/site/details/thermostat.webp", alt: "Thermostat set to 76 degrees with humidity at 50 percent", caption: "Temperature and humidity confirmed", placeholder: true },
  { src: "/site/details/keys.webp", alt: "A coded key tag with no name or address", caption: "Keys coded, never labeled", placeholder: true },
  { src: "/site/details/shutters.webp", alt: "Closed storm shutters", caption: "Storm shutters deployed", placeholder: true },
  { src: "/site/details/pool-equipment.webp", alt: "Pool pump and filter equipment", caption: "Equipment checked and logged", placeholder: true },
  { src: "/site/details/flowers.webp", alt: "Fresh flowers in a vase on arrival day", caption: "Fresh flowers for arrival day", placeholder: true },
] as const;
