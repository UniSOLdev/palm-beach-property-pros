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
    roomCounts: {
      bedrooms: "",
      bathrooms: "",
      kitchens: "1",
      livingAreas: "",
      levels: "",
    },
    laborComplexity: "Elevated",
    turnaround: "Standard",
  notes: "",
};

export function createInitialChecklist(): ChecklistState {
  return WALKTHROUGH_SECTIONS.reduce((acc, section) => {
    acc[section.id] = {
      condition: "Light",
      notes: "",
      needsAddOn: false,
      completed: false,
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

export async function createPhotoAssets(
  files: FileList | null,
  scope: PhotoScope,
): Promise<WalkthroughPhoto[]> {
  if (!files) {
    return [];
  }

  return Promise.all(
    Array.from(files).map(async (file) => ({
      id: createLocalId("photo"),
      name: file.name,
      scope,
      size: file.size,
      type: file.type || "image/*",
      previewUrl: await readFileAsDataUrl(file),
      capturedAt: new Date().toISOString(),
      source: "camera-or-library" as const,
      analysisStatus: "not-ready" as const,
    })),
  );
}

export function touchJob(job: WalkthroughJob): WalkthroughJob {
  return {
    ...job,
    updatedAt: new Date().toISOString(),
  };
}

export function normalizeWalkthroughJob(value: unknown): WalkthroughJob {
  const fallback = createWalkthroughJob();

  if (!value || typeof value !== "object") {
    return fallback;
  }

  const incoming = value as Partial<WalkthroughJob>;
  const property = {
    ...fallback.property,
    ...(incoming.property ?? {}),
    roomCounts: {
      ...fallback.property.roomCounts,
      ...(incoming.property?.roomCounts ?? {}),
    },
  };
  const checklist = createInitialChecklist();

  for (const section of WALKTHROUGH_SECTIONS) {
    checklist[section.id] = {
      ...checklist[section.id],
      ...(incoming.checklist?.[section.id] ?? {}),
      photos: incoming.checklist?.[section.id]?.photos ?? [],
      completed: Boolean(incoming.checklist?.[section.id]?.completed),
    };
  }

  return {
    ...fallback,
    ...incoming,
    version: 1,
    property,
    propertyPhotos: incoming.propertyPhotos ?? [],
    checklist,
    selectedAddOnIds: incoming.selectedAddOnIds ?? [],
  };
}

function createLocalId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return `${prefix}_${crypto.randomUUID()}`;
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => resolve("");
    reader.readAsDataURL(file);
  });
}
