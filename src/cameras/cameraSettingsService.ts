// Zones and rules of a camera, kept by Specter; fa only checks who may see or change them.

import { inject, injectable } from "tsyringe";
import { CameraService, CameraUser } from "@cameras/cameraService.js";
import { SpecterHttpClient } from "@specter/specterHttpClient.js";
import { SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import type { SpecterRule, SpecterZone } from "@specter/specterTypes.js";

// Bodies go to Specter unchanged: it validates them and refuses unknown fields.
type SpecterBody = any;

@injectable()
export class CameraSettingsService {
  constructor(
    @inject(CameraService) private readonly cameraService: CameraService,
    @inject(SPECTER_HTTP_CLIENT) private readonly specter: SpecterHttpClient,
  ) {}

  private cameraPath(cameraId: string) {
    return { owner_id: this.specter.ownerId, camera_id: cameraId };
  }

  async listZones(cameraId: string, user: CameraUser): Promise<SpecterZone[]> {
    await this.cameraService.getAccessibleCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/cameras/{camera_id}/zones", {
        params: { path: this.cameraPath(cameraId) },
      }),
    );
  }

  async createZone(cameraId: string, body: SpecterBody, user: CameraUser): Promise<SpecterZone> {
    await this.cameraService.getManageableCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/cameras/{camera_id}/zones", {
        params: { path: this.cameraPath(cameraId) },
        body,
      }),
    );
  }

  async updateZone(cameraId: string, zoneId: string, body: SpecterBody, user: CameraUser): Promise<SpecterZone> {
    await this.cameraService.getManageableCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.PATCH("/owners/{owner_id}/cameras/{camera_id}/zones/{zone_id}", {
        params: { path: { ...this.cameraPath(cameraId), zone_id: zoneId } },
        body,
      }),
    );
  }

  async deleteZone(cameraId: string, zoneId: string, user: CameraUser): Promise<void> {
    await this.cameraService.getManageableCamera(cameraId, user);
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/cameras/{camera_id}/zones/{zone_id}", {
        params: { path: { ...this.cameraPath(cameraId), zone_id: zoneId } },
      }),
    );
  }

  async listRules(cameraId: string, user: CameraUser): Promise<SpecterRule[]> {
    await this.cameraService.getAccessibleCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.GET("/owners/{owner_id}/cameras/{camera_id}/rules", {
        params: { path: this.cameraPath(cameraId) },
      }),
    );
  }

  async createRule(cameraId: string, body: SpecterBody, user: CameraUser): Promise<SpecterRule> {
    await this.cameraService.getManageableCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.POST("/owners/{owner_id}/cameras/{camera_id}/rules", {
        params: { path: this.cameraPath(cameraId) },
        body,
      }),
    );
  }

  async updateRule(cameraId: string, ruleId: string, body: SpecterBody, user: CameraUser): Promise<SpecterRule> {
    await this.cameraService.getManageableCamera(cameraId, user);
    return this.specter.unwrap(
      this.specter.api.PATCH("/owners/{owner_id}/cameras/{camera_id}/rules/{rule_id}", {
        params: { path: { ...this.cameraPath(cameraId), rule_id: ruleId } },
        body,
      }),
    );
  }

  async deleteRule(cameraId: string, ruleId: string, user: CameraUser): Promise<void> {
    await this.cameraService.getManageableCamera(cameraId, user);
    await this.specter.unwrap(
      this.specter.api.DELETE("/owners/{owner_id}/cameras/{camera_id}/rules/{rule_id}", {
        params: { path: { ...this.cameraPath(cameraId), rule_id: ruleId } },
      }),
    );
  }
}
