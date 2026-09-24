import { inject, injectable } from "tsyringe";
import { CameraRepository } from "@cameras/domain/cameraRepository.js";
import { ICamera, ICameraChanges, ICameraCreate } from "~types/interfaces.js";
import { SpecterApiError, SpecterHttpClient } from "@specter/specterHttpClient.js";
import { SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import type { SpecterCamera, SpecterCameraUpdate } from "@specter/specterTypes.js";

// fa's own fields live in the Specter camera's metadata under this key, next to other apps' keys.
const FA_METADATA_KEY = "fa";

interface FaCameraMetadata {
  created_by?: string | null;
  location?: string | null;
}

function readFaMetadata(camera: SpecterCamera): FaCameraMetadata {
  const value = camera.metadata?.[FA_METADATA_KEY];
  return value !== null && typeof value === "object" ? (value as FaCameraMetadata) : {};
}

function toCamera(camera: SpecterCamera): ICamera {
  const faMetadata = readFaMetadata(camera);
  return {
    id: camera.id,
    name: camera.name,
    source_url: camera.source_url,
    username: camera.username ?? null,
    has_password: camera.has_password,
    location: faMetadata.location ?? null,
    created_by: faMetadata.created_by ?? null,
    watchlist_ids: camera.watchlist_ids,
    detection_classes: camera.detection_classes,
    is_enabled: camera.is_enabled,
    desired_state: camera.desired_state,
    live_status: camera.live_status ?? null,
  };
}

@injectable()
export class SpecterCameraRepository implements CameraRepository {
  constructor(@inject(SPECTER_HTTP_CLIENT) private readonly specter: SpecterHttpClient) {}

  private get owner() {
    return { owner_id: this.specter.ownerId };
  }

  async create(camera: ICameraCreate): Promise<ICamera> {
    const created = await this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/cameras", {
        params: { path: this.owner },
        body: {
          name: camera.name,
          source_url: camera.source_url,
          credentials: camera.credentials,
          watchlist_ids: camera.watchlist_ids,
          detection_classes: camera.detection_classes,
          metadata: {
            [FA_METADATA_KEY]: { created_by: camera.created_by, location: camera.location },
          },
        },
      }),
    );
    return toCamera(created);
  }

  async findById(cameraId: string): Promise<ICamera | null> {
    const camera = await this.read(cameraId);
    return camera === null ? null : toCamera(camera);
  }

  async findAll(): Promise<ICamera[]> {
    const cameras = await this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/cameras", { params: { path: this.owner } }),
    );
    return cameras.map(toCamera);
  }

  async update(cameraId: string, changes: ICameraChanges): Promise<ICamera> {
    const { location, ...specterChanges } = changes;
    const body: SpecterCameraUpdate = specterChanges;
    if (location !== undefined) {
      // Specter replaces metadata whole, so the other keys are read back first.
      const current = await this.read(cameraId);
      if (current === null) throw new SpecterApiError(404, `camera ${cameraId} does not exist`);
      body.metadata = {
        ...current.metadata,
        [FA_METADATA_KEY]: { ...readFaMetadata(current), location },
      };
    }
    const updated = await this.specter.unwrap(
      this.specter.api.PATCH("/owners/{owner_id}/cameras/{camera_id}", {
        params: { path: { ...this.owner, camera_id: cameraId } },
        body,
      }),
    );
    return toCamera(updated);
  }

  async delete(cameraId: string): Promise<void> {
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/cameras/{camera_id}", {
        params: { path: { ...this.owner, camera_id: cameraId } },
      }),
    );
  }

  async start(cameraId: string): Promise<ICamera> {
    const camera = await this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/cameras/{camera_id}/start", {
        params: { path: { ...this.owner, camera_id: cameraId } },
      }),
    );
    return toCamera(camera);
  }

  async stop(cameraId: string): Promise<ICamera> {
    const camera = await this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/cameras/{camera_id}/stop", {
        params: { path: { ...this.owner, camera_id: cameraId } },
      }),
    );
    return toCamera(camera);
  }

  private async read(cameraId: string): Promise<SpecterCamera | null> {
    try {
      return await this.specter.unwrap(
        this.specter.api.GET("/owners/{owner_id}/cameras/{camera_id}", {
          params: { path: { ...this.owner, camera_id: cameraId } },
        }),
      );
    } catch (error) {
      if (error instanceof SpecterApiError && error.specterStatus === 404) return null;
      throw error;
    }
  }
}
