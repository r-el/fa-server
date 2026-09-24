import { Readable } from "node:stream";
import { Response } from "express";
import { container } from "@core/di.js";
import { catchAsync } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { CameraService } from "@cameras/cameraService.js";
import { cameraIdSchema } from "@cameras/cameraSchemas.js";
import { SpecterHttpClient } from "@specter/specterHttpClient.js";
import { SPECTER_HTTP_CLIENT } from "@specter/tokens.js";
import { TypedRequest } from "~types/request.js";
import { issueLiveTicket } from "./liveVideoRelay.js";

export class LiveController {
  /** A one-use ticket for WS /api/cameras/{camera_id}/live/mse?ticket=..., valid for a minute. */
  static issueTicket = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    await container.resolve(CameraService).getAccessibleCamera(camera_id, req.user);
    res.json({ success: true, data: issueLiveTicket(req.user.id, camera_id) });
  });

  static readFrame = catchAsync(async (req: TypedRequest, res: Response) => {
    const { camera_id } = validate(req.params, cameraIdSchema);
    await container.resolve(CameraService).getAccessibleCamera(camera_id, req.user);
    const specter = container.resolve<SpecterHttpClient>(SPECTER_HTTP_CLIENT);
    const frame = await specter.fetchOwnerResource(`cameras/${camera_id}/live/frame.jpeg`);
    res.setHeader("Content-Type", frame.headers.get("Content-Type") ?? "image/jpeg");
    res.setHeader("Cache-Control", "no-store");
    Readable.fromWeb(frame.body as any).pipe(res);
  });
}
