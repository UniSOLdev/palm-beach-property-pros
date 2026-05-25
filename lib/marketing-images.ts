/** Build Unsplash URLs with consistent quality and format params. */
export function unsplash(src: string, width: number, quality = 80) {
  const base = src.includes("?") ? src.split("?")[0] : src;
  return `${base}?auto=format&fit=crop&w=${width}&q=${quality}&fm=webp`;
}

export const HOME_IMAGES = {
  hero: unsplash("https://images.unsplash.com/photo-1613979617049-0ee344255b08", 2000),
  exterior: unsplash("https://images.unsplash.com/photo-1600585154526-990dced4db0d", 900),
  interior: unsplash("https://images.unsplash.com/photo-1600607687929-7526a8a2ee4d", 900),
  propertySupport: unsplash("https://images.unsplash.com/photo-1504307651254-35680f356dfd", 900),
  operations: unsplash("https://images.unsplash.com/photo-1600573472592-401b489a9119", 1200),
  pressureWash: unsplash("https://images.unsplash.com/photo-1558618666-fcd25c85cd64", 800),
} as const;
