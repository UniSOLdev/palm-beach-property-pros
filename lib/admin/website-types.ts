export interface WebsiteGalleryItem {
  id: string;
  imageUrl: string;
  beforeImageUrl: string | null;
  afterImageUrl: string | null;
  caption: string | null;
  serviceType: string | null;
  location: string | null;
  jobName: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface WebsiteReview {
  id: string;
  customerName: string;
  rating: number;
  reviewText: string | null;
  serviceType: string | null;
  city: string | null;
  source: string | null;
  featured: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface WebsiteHomepageContent {
  id: string;
  heroEyebrow: string | null;
  heroHeadline: string | null;
  heroSubheadline: string | null;
  primaryCtaText: string | null;
  primaryCtaLink: string | null;
  secondaryCtaText: string | null;
  secondaryCtaLink: string | null;
  trustBadges: string[];
  featuredServiceSlugs: string[];
  featuredGalleryIds: string[];
  featuredReviewIds: string[];
  createdAt: string;
}

export interface WebsiteProject {
  id: string;
  title: string;
  serviceType: string | null;
  city: string | null;
  shortDescription: string | null;
  beforeImageUrls: string[];
  afterImageUrls: string[];
  featuredImageUrl: string | null;
  clientName: string | null;
  dateCompleted: string | null;
  featured: boolean;
  showOnHomepage: boolean;
  sortOrder: number;
}
