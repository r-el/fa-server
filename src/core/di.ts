import "reflect-metadata";
import { container } from "tsyringe";
import { CameraService } from "@cameras/cameraService.js";
import { EventService } from "@events/eventService.js";
import { UserService } from "@users/userService.js";
import { AuthService } from "@auth/authService.js";

// Register services in DI container
container.registerSingleton(CameraService);
container.registerSingleton(EventService);
container.registerSingleton(UserService);
container.registerSingleton(AuthService);

export { container };
