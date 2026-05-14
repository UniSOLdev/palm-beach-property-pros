import type { WebsiteGalleryItem, WebsiteReview } from "./website-types";

/** Demo / fallback content when Supabase is off or featured rows are empty (marketing only). */
export const websiteGalleryDemo: WebsiteGalleryItem[] = [
  {
    id: "demo_gallery_1",
    imageUrl:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf64?auto=format&fit=crop&w=900&q=80",
    beforeImageUrl: null,
    afterImageUrl:
      "https://images.unsplash.com/photo-1628177142898-93e36e4e3a50?auto=format&fit=crop&w=900&q=80",
    caption: "Driveway & entry refresh — algae lifted, plants protected.",
    serviceType: "Pressure Washing",
    location: "Jupiter",
    jobName: null,
    featured: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_gallery_2",
    imageUrl:
      "https://images.unsplash.com/photo-1527515637462-cff94eecc1ac?auto=format&fit=crop&w=900&q=80",
    beforeImageUrl: null,
    afterImageUrl: null,
    caption: "Interior reset — glass, floors, and finishes inspection-ready.",
    serviceType: "Move-out Cleaning",
    location: "Palm Beach Gardens",
    jobName: null,
    featured: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_gallery_3",
    imageUrl:
      "https://images.unsplash.com/photo-1507131312060-12e536e1f55e?auto=format&fit=crop&w=900&q=80",
    beforeImageUrl: null,
    afterImageUrl: null,
    caption: "Exterior detail — coastal pollen and road film removed.",
    serviceType: "Auto Detailing",
    location: "West Palm Beach",
    jobName: null,
    featured: true,
    sortOrder: 2,
    createdAt: new Date().toISOString(),
  },
];

export const websiteReviewsDemo: WebsiteReview[] = [
  {
    id: "demo_rev_1",
    customerName: "Rachel M.",
    rating: 5,
    reviewText:
      "Move-out looked impossible with the movers running late — PBPP still delivered a spotless handoff for our walkthrough.",
    serviceType: "Move-out Cleaning",
    city: "Palm Beach Gardens",
    source: "Google",
    featured: true,
    sortOrder: 0,
    createdAt: new Date().toISOString(),
  },
  {
    id: "demo_rev_2",
    customerName: "Marco D.",
    rating: 5,
    reviewText: "Turnover window was tight; crew texted arrival, finished early, and photos matched our checklist.",
    serviceType: "Airbnb Turnover",
    city: "Singer Island",
    source: "Direct",
    featured: true,
    sortOrder: 1,
    createdAt: new Date().toISOString(),
  },
];
