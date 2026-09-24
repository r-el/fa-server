import { Readable } from "node:stream";
import { Response, Router } from "express";
import multer from "multer";
import { z } from "zod";
import { container } from "@core/di.js";
import { authenticateToken, requireRole } from "@core/middlewares/authMiddleware.js";
import { ApiError, catchAsync } from "@core/middlewares/errorHandler.js";
import { validate } from "@core/validationService.js";
import { specterIdSchema } from "@cameras/cameraSchemas.js";
import { TypedRequest } from "~types/request.js";
import { UploadedPhoto, WatchlistService } from "./watchlistService.js";

// Matches Specter's own limits (api.maximum_image_size_mebibytes), so fa refuses the same files.
const MAXIMUM_PHOTO_SIZE_BYTES = 10 * 1024 * 1024;
const MAXIMUM_PHOTOS_PER_REQUEST = 20;
const PHOTO_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const watchlistParams = z.object({ watchlist_id: specterIdSchema("Watchlist") });
const targetParams = watchlistParams.extend({ target_id: specterIdSchema("Target") });
const imageParams = targetParams.extend({ image_id: specterIdSchema("Image") });
const batchParams = z.object({ enrollment_batch_id: specterIdSchema("Enrollment batch") });
const createTargetsBody = z.object({ targets: z.string().min(2).max(100_000) });

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAXIMUM_PHOTO_SIZE_BYTES, files: MAXIMUM_PHOTOS_PER_REQUEST },
  fileFilter: (req, file, accept) => {
    if (PHOTO_CONTENT_TYPES.has(file.mimetype)) accept(null, true);
    else accept(new ApiError(400, `${file.originalname} must be a JPEG, PNG or WebP image`));
  },
});
const uploadPhotos = (req, res, next) =>
  upload.array("images", MAXIMUM_PHOTOS_PER_REQUEST)(req, res, (error) => {
    if (error instanceof multer.MulterError) return next(new ApiError(400, error.message));
    next(error);
  });

const watchlistService = () => container.resolve(WatchlistService);

function readPhotos(req: TypedRequest): UploadedPhoto[] {
  return ((req as any).files ?? []).map((file: Express.Multer.File) => ({
    fileName: file.originalname,
    contentType: file.mimetype,
    content: file.buffer,
  }));
}

const router = Router();
router.use(authenticateToken, requireRole(["admin", "operator"]));

router.get("/", catchAsync(async (req: TypedRequest, res: Response) => {
  res.json({ success: true, data: await watchlistService().listWatchlists() });
}));

router.post("/", catchAsync(async (req: TypedRequest, res: Response) => {
  res.status(201).json({ success: true, data: await watchlistService().createWatchlist(req.body) });
}));

router.get("/:watchlist_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id } = validate(req.params, watchlistParams);
  res.json({ success: true, data: await watchlistService().getWatchlist(watchlist_id) });
}));

router.patch("/:watchlist_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id } = validate(req.params, watchlistParams);
  res.json({ success: true, data: await watchlistService().updateWatchlist(watchlist_id, req.body) });
}));

router.delete("/:watchlist_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id } = validate(req.params, watchlistParams);
  await watchlistService().deleteWatchlist(watchlist_id);
  res.json({ success: true, message: "Watchlist deleted successfully" });
}));

router.get("/:watchlist_id/targets", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id } = validate(req.params, watchlistParams);
  res.json({ success: true, data: await watchlistService().listTargets(watchlist_id) });
}));

// multipart/form-data: `targets` is a JSON list of {label, metadata, image_file_names}; `images` the photos.
router.post("/:watchlist_id/targets", uploadPhotos, catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id } = validate(req.params, watchlistParams);
  const { targets } = validate(req.body, createTargetsBody);
  const created = await watchlistService().createTargets(watchlist_id, targets, readPhotos(req));
  res.status(201).json({ success: true, data: created });
}));

router.get("/:watchlist_id/targets/:target_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id } = validate(req.params, targetParams);
  res.json({ success: true, data: await watchlistService().getTarget(watchlist_id, target_id) });
}));

router.patch("/:watchlist_id/targets/:target_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id } = validate(req.params, targetParams);
  res.json({ success: true, data: await watchlistService().updateTarget(watchlist_id, target_id, req.body) });
}));

router.delete("/:watchlist_id/targets/:target_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id } = validate(req.params, targetParams);
  await watchlistService().deleteTarget(watchlist_id, target_id);
  res.json({ success: true, message: "Target deleted successfully" });
}));

router.post("/:watchlist_id/targets/:target_id/images", uploadPhotos, catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id } = validate(req.params, targetParams);
  const photos = readPhotos(req);
  if (photos.length === 0) throw new ApiError(400, "At least one image is required");
  res.status(201).json({ success: true, data: await watchlistService().addImages(watchlist_id, target_id, photos) });
}));

router.get("/:watchlist_id/targets/:target_id/images/:image_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id, image_id } = validate(req.params, imageParams);
  const image = await watchlistService().readImage(watchlist_id, target_id, image_id);
  res.setHeader("Content-Type", image.contentType);
  // Photos of real people: never kept by shared caches.
  res.setHeader("Cache-Control", "private, max-age=3600");
  Readable.fromWeb(image.body as any).pipe(res);
}));

router.delete("/:watchlist_id/targets/:target_id/images/:image_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { watchlist_id, target_id, image_id } = validate(req.params, imageParams);
  await watchlistService().deleteImage(watchlist_id, target_id, image_id);
  res.json({ success: true, message: "Image deleted successfully" });
}));

export const enrollmentBatchRoutes = Router();
enrollmentBatchRoutes.use(authenticateToken, requireRole(["admin", "operator"]));
enrollmentBatchRoutes.get("/:enrollment_batch_id", catchAsync(async (req: TypedRequest, res: Response) => {
  const { enrollment_batch_id } = validate(req.params, batchParams);
  res.json({ success: true, data: await watchlistService().getEnrollmentBatch(enrollment_batch_id) });
}));

export default router;
