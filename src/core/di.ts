import "reflect-metadata";
import { container } from "tsyringe";
import { CameraService } from "@cameras/cameraService.js";
import { EventService } from "@events/eventService.js";
import { UserService } from "@users/userService.js";
import { AuthService } from "@auth/authService.js";
import { CAMERA_REPOSITORY } from "@cameras/infrastructure/tokens.js";
import { SupabaseCameraRepository } from "@cameras/infrastructure/supabaseCameraRepository.js";
import { VECTOR_REPOSITORY } from "@vector/infrastructure/tokens.js";
import { QdrantVectorRepository } from "@vector/infrastructure/qdrantVectorRepository.js";

// Register services in DI container
container.registerSingleton(CameraService);
container.registerSingleton(EventService);
container.registerSingleton(UserService);
container.registerSingleton(AuthService);
container.registerSingleton(CAMERA_REPOSITORY, SupabaseCameraRepository);
container.registerSingleton(VECTOR_REPOSITORY, QdrantVectorRepository);

export { container };
