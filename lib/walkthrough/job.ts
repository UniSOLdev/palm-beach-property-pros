import { WALKTHROUGH_SECTIONS } from "@/lib/walkthrough/config";
import type {
  ChecklistState,
  PhotoScope,
  PropertyIntake,
  WalkthroughJob,
  WalkthroughPhoto,
} from "@/lib/walkthrough/types";

export const initialProperty: PropertyIntake = {
  clientName: "",
  address: "",
  phone: "",
  email: "",
  squareFootage: "",
  propertyType: "Luxury listing",
  occupancy: "Empty",
  serviceType: "Listing Prep",
  notes: "",
};

export function createInitialChecklist(): ChecklistState {
  return WALKTHROUGH_SECTIONS.reduce((acc, section) => {
    acc[section.id] = {
      condition: "Light",
      notes: "",
      needsAddOn: false,
      photos: [],
    };
    return acc;
  }, {} as ChecklistState);
}

export function createWalkthroughJob(now = new Date()): WalkthroughJob {
  const timestamp = now.toISOString();

  return {
    id: createLocalId("job"),
    version: 1,
    status: "draft",
    createdAt: timestamp,
    updatedAt: timestamp,
    property: initialProperty,
    propertyPhotos: [],
    checklist: createInitialChecklist(),
    selectedAddOnIds: [],
  };
}

export function createPhotoAssets(files: FileList | null, scope: PhotoScope): WalkthroughPhoto[] {
  if (!files) {
    return [];
  }

  return Array.from(files).map((file) => ({
    id: createLocalId("photo"),
    name: file.name,
    scope,
    size: file.size,
    type: file.type || "image/*",
    capturedAt: new Date().toISOString(),
    source: "camera-or-library",
    analysisStatus: "not-ready",
  }));
}

export function touchJob(job: WalkthroughJob): WalkthroughJob {
  return {
    ...job,
    updatedAt: new Date().toISOString(),
  };
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}
