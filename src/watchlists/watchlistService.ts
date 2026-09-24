// Watchlists, their targets and reference photos, kept by Specter. Only operators and admins use them.

import { inject, injectable } from "tsyringe";
import { SpecterHttpClient } from "@specter/specterHttpClient.js";
import { SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import type { SpecterTarget, SpecterWatchlist } from "@specter/specterTypes.js";

// Bodies go to Specter unchanged: it validates them and refuses unknown fields.
type SpecterBody = any;

export interface UploadedPhoto {
  fileName: string;
  contentType: string;
  content: Buffer;
}

export interface ReferenceImageFile {
  contentType: string;
  body: ReadableStream<Uint8Array>;
}

function buildPhotoForm(photos: UploadedPhoto[], targetsJson?: string): FormData {
  const form = new FormData();
  if (targetsJson !== undefined) form.append("targets", targetsJson);
  for (const photo of photos) {
    form.append("images", new Blob([new Uint8Array(photo.content)], { type: photo.contentType }), photo.fileName);
  }
  return form;
}

@injectable()
export class WatchlistService {
  constructor(@inject(SPECTER_HTTP_CLIENT) private readonly specter: SpecterHttpClient) {}

  private get owner() {
    return { owner_id: this.specter.ownerId };
  }

  private watchlistPath(watchlistId: string) {
    return { ...this.owner, watchlist_id: watchlistId };
  }

  private targetPath(watchlistId: string, targetId: string) {
    return { ...this.watchlistPath(watchlistId), target_id: targetId };
  }

  listWatchlists(): Promise<SpecterWatchlist[]> {
    return this.specter.unwrap(this.specter.api.GET("/owners/{owner_id}/watchlists", { params: { path: this.owner } }));
  }

  createWatchlist(body: SpecterBody): Promise<SpecterWatchlist> {
    return this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/watchlists", { params: { path: this.owner }, body }),
    );
  }

  getWatchlist(watchlistId: string): Promise<SpecterWatchlist> {
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/watchlists/{watchlist_id}", {
        params: { path: this.watchlistPath(watchlistId) },
      }),
    );
  }

  updateWatchlist(watchlistId: string, body: SpecterBody): Promise<SpecterWatchlist> {
    return this.specter.unwrap(
      this.specter.api.PATCH("/owners/{owner_id}/watchlists/{watchlist_id}", {
        params: { path: this.watchlistPath(watchlistId) },
        body,
      }),
    );
  }

  async deleteWatchlist(watchlistId: string): Promise<void> {
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/watchlists/{watchlist_id}", {
        params: { path: this.watchlistPath(watchlistId) },
      }),
    );
  }

  listTargets(watchlistId: string): Promise<SpecterTarget[]> {
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/watchlists/{watchlist_id}/targets", {
        params: { path: this.watchlistPath(watchlistId) },
      }),
    );
  }

  /** Creates a batch of targets; Specter checks that every photo is named by exactly one target. */
  async createTargets(watchlistId: string, targetsJson: string, photos: UploadedPhoto[]): Promise<SpecterTarget[]> {
    const response = await this.specter.fetchOwnerResource(`watchlists/${watchlistId}/targets`, {
      method: "POST",
      body: buildPhotoForm(photos, targetsJson),
    });
    return response.json();
  }

  getTarget(watchlistId: string, targetId: string): Promise<SpecterTarget> {
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/watchlists/{watchlist_id}/targets/{target_id}", {
        params: { path: this.targetPath(watchlistId, targetId) },
      }),
    );
  }

  updateTarget(watchlistId: string, targetId: string, body: SpecterBody): Promise<SpecterTarget> {
    return this.specter.unwrap(
      this.specter.api.PATCH("/owners/{owner_id}/watchlists/{watchlist_id}/targets/{target_id}", {
        params: { path: this.targetPath(watchlistId, targetId) },
        body,
      }),
    );
  }

  async deleteTarget(watchlistId: string, targetId: string): Promise<void> {
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/watchlists/{watchlist_id}/targets/{target_id}", {
        params: { path: this.targetPath(watchlistId, targetId) },
      }),
    );
  }

  async addImages(watchlistId: string, targetId: string, photos: UploadedPhoto[]): Promise<SpecterTarget> {
    const response = await this.specter.fetchOwnerResource(
      `watchlists/${watchlistId}/targets/${targetId}/images`,
      { method: "POST", body: buildPhotoForm(photos) },
    );
    return response.json();
  }

  async readImage(watchlistId: string, targetId: string, imageId: string): Promise<ReferenceImageFile> {
    const response = await this.specter.fetchOwnerResource(
      `watchlists/${watchlistId}/targets/${targetId}/images/${imageId}`,
    );
    return { contentType: response.headers.get("Content-Type") ?? "image/jpeg", body: response.body };
  }

  async deleteImage(watchlistId: string, targetId: string, imageId: string): Promise<void> {
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/watchlists/{watchlist_id}/targets/{target_id}/images/{image_id}", {
        params: { path: { ...this.targetPath(watchlistId, targetId), image_id: imageId } },
      }),
    );
  }

  getEnrollmentBatch(batchId: string): Promise<SpecterTarget[]> {
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/enrollment-batches/{enrollment_batch_id}", {
        params: { path: { ...this.owner, enrollment_batch_id: batchId } },
      }),
    );
  }
}
