import type { SpecterHttpClient } from "./specterHttpClient.js";
import type { SpecterWatchlist } from "./specterTypes.js";

// configuration.changed events invalidate the cache at once; the limit only bounds a missed event.
const DEFAULT_TIME_TO_LIVE_MS = 60_000;

export interface CatalogSnapshot {
  cameraNames: Map<string, string>;
  watchlists: Map<string, Pick<SpecterWatchlist, "name" | "kind">>;
  targetLabels: Map<string, string>;
}

/** Names of the owner's cameras, watchlists and targets, to label alerts and notifications. */
export class SpecterCatalog {
  private snapshot: Promise<CatalogSnapshot> | null = null;
  private loadedAtMs = 0;

  constructor(
    private readonly specter: SpecterHttpClient,
    private readonly timeToLiveMs = DEFAULT_TIME_TO_LIVE_MS,
  ) {}

  invalidate(): void {
    this.snapshot = null;
  }

  async read(): Promise<CatalogSnapshot> {
    if (this.snapshot === null || Date.now() - this.loadedAtMs > this.timeToLiveMs) {
      this.loadedAtMs = Date.now();
      const snapshot = this.load();
      this.snapshot = snapshot;
      // A failed load is not cached, so the next caller tries again.
      snapshot.catch(() => {
        if (this.snapshot === snapshot) this.snapshot = null;
      });
    }
    return this.snapshot;
  }

  private async load(): Promise<CatalogSnapshot> {
    const owner = { path: { owner_id: this.specter.ownerId } };
    const [cameras, watchlists] = await Promise.all([
      this.specter.unwrap(this.specter.api.GET("/owners/{owner_id}/cameras", { params: owner })),
      this.specter.unwrap(this.specter.api.GET("/owners/{owner_id}/watchlists", { params: owner })),
    ]);
    const targetLists = await Promise.all(
      watchlists.map((watchlist) =>
        this.specter.unwrap(
          this.specter.api.GET("/owners/{owner_id}/watchlists/{watchlist_id}/targets", {
            params: { path: { owner_id: this.specter.ownerId, watchlist_id: watchlist.id } },
          }),
        ),
      ),
    );
    return {
      cameraNames: new Map(cameras.map((camera) => [camera.id, camera.name])),
      watchlists: new Map(
        watchlists.map((watchlist) => [watchlist.id, { name: watchlist.name, kind: watchlist.kind }]),
      ),
      targetLabels: new Map(targetLists.flat().map((target) => [target.id, target.label])),
    };
  }
}
