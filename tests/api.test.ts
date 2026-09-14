import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";

const testUser = {
  id: "user-1",
  username: "testuser",
  name: "Test User",
  email: "test@example.com",
  role: "admin",
};

const testCamera = {
  id: "camera-1",
  name: "Front Door",
  camera_id: "front-door",
  connection_string: "rtsp://camera.test/front-door",
  created_by: testUser.id,
};

const testEvent = {
  id: "event-1",
  camera_id: testCamera.camera_id,
  person_id: "person-1",
  time: new Date("2026-01-01T00:00:00.000Z"),
  level: "info",
};

vi.mock("../src/services/authService.js", () => ({
  registerUser: vi.fn(),
  loginUser: vi.fn(),
}));

vi.mock("../src/services/userService.js", () => ({
  getUserById: vi.fn(),
  getUserByUsername: vi.fn(),
  getUserByEmail: vi.fn(),
  getAllUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deleteUser: vi.fn(),
}));

vi.mock("../src/services/cameraService.js", () => ({
  CameraService: {
    createCamera: vi.fn(),
    getCamerasForUser: vi.fn(),
    getCameraById: vi.fn(),
    updateCamera: vi.fn(),
    deleteCamera: vi.fn(),
    assignCameraToUser: vi.fn(),
    removeCameraAssignment: vi.fn(),
    getCameraAssignments: vi.fn(),
  },
}));

vi.mock("../src/services/eventService.js", () => ({
  EventService: {
    getEventsForUser: vi.fn(),
    getEventById: vi.fn(),
    getEventImage: vi.fn(),
    getEventsStatsForUser: vi.fn(),
  },
}));

vi.mock("../src/models/camera.js", () => ({
  Camera: {
    getAllCameras: vi.fn(),
    getCamerasByUserId: vi.fn(),
  },
}));

vi.mock("../src/services/mongoGridFSService.js", () => ({
  mongoGridFSService: {
    connect: vi.fn(),
    getPersonsWithImages: vi.fn(),
    getStats: vi.fn(),
    getEvents: vi.fn(),
    getImageAsBase64: vi.fn(),
    getImageById: vi.fn(),
    db: null,
  },
}));

vi.mock("../src/db/mongodb.js", () => ({
  isMongoDBAvailable: vi.fn(() => false),
  getMongoDBStatus: vi.fn(() => "not_configured"),
}));

vi.mock("../src/middlewares/authMiddleware.js", () => ({
  authenticateToken: (req: { user?: typeof testUser }, _res: unknown, next: () => void) => {
    req.user = testUser;
    next();
  },
  requireRole: () => (_req: unknown, _res: unknown, next: () => void) => next(),
  canAccessUser: (_req: unknown, _res: unknown, next: () => void) => next(),
}));

const { default: app } = await import("../src/server.js");
const { registerUser, loginUser } = await import("../src/services/authService.js");
const userService = await import("../src/services/userService.js");
const { CameraService } = await import("../src/services/cameraService.js");
const { EventService } = await import("../src/services/eventService.js");
const { Camera } = await import("../src/models/camera.js");

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(registerUser).mockResolvedValue({ user: testUser, token: "register-token" });
  vi.mocked(loginUser).mockResolvedValue({ user: testUser, token: "login-token" });
  vi.mocked(userService.getUserById).mockResolvedValue(testUser);
  vi.mocked(userService.getAllUsers).mockResolvedValue([testUser]);
  vi.mocked(CameraService.getCamerasForUser).mockResolvedValue([testCamera]);
  vi.mocked(EventService.getEventsForUser).mockResolvedValue({
    events: [testEvent],
    pagination: { total: 1, page: 1, limit: 10 },
  });
  vi.mocked(EventService.getEventsStatsForUser).mockResolvedValue({
    totalEvents: 1,
    levelStats: [{ level: "info", count: 1 }],
    camerasCount: 1,
  });
  vi.mocked(Camera.getCamerasByUserId).mockResolvedValue([testCamera]);
  vi.mocked(Camera.getAllCameras).mockResolvedValue([testCamera]);
});

describe("health and root API", () => {
  it("returns a healthy response", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, message: "Server is healthy" });
    expect(response.headers.ratelimit).toContain("limit=1000");
  });

  it("returns the root API response", async () => {
    const response = await request(app).get("/");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ success: true, message: "Welcome to FaceAlert Server!" });
  });

  it("serves the OpenAPI document", async () => {
    const response = await request(app).get("/api-docs.json");

    expect(response.status).toBe(200);
    expect(response.body.openapi).toBe("3.0.0");
    expect(response.body.paths["/health"]).toBeDefined();
  });
});

describe("auth API", () => {
  it("registers a user", async () => {
    const response = await request(app).post("/auth/register").send({
      username: testUser.username,
      password: "password123",
      name: testUser.name,
      email: testUser.email,
      role: testUser.role,
    });

    expect(response.status).toBe(201);
    expect(response.body.data.token).toBe("register-token");
    expect(registerUser).toHaveBeenCalledOnce();
  });

  it("logs a user in", async () => {
    const response = await request(app).post("/auth/login").send({
      username: testUser.username,
      password: "password123",
    });

    expect(response.status).toBe(200);
    expect(response.body.data.token).toBe("login-token");
    expect(loginUser).toHaveBeenCalledWith(testUser.username, "password123");
  });
});

describe("users, cameras, and events API", () => {
  it("returns the authenticated user profile and user list", async () => {
    const profile = await request(app).get("/users/profile");
    const users = await request(app).get("/users");

    expect(profile.status).toBe(200);
    expect(profile.body.data.user.username).toBe(testUser.username);
    expect(users.status).toBe(200);
    expect(users.body.data).toHaveLength(1);
  });

  it("returns cameras for the authenticated user", async () => {
    const response = await request(app).get("/cameras");

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([testCamera]);
    expect(CameraService.getCamerasForUser).toHaveBeenCalledWith(testUser.id, testUser.role);
  });

  it("returns events and event statistics", async () => {
    const events = await request(app).get("/events");
    const stats = await request(app).get("/events/stats");
    const count = await request(app).get("/events/count");

    expect(events.status).toBe(200);
    expect(events.body.data).toEqual([{ ...testEvent, time: testEvent.time.toISOString() }]);
    expect(stats.status).toBe(200);
    expect(stats.body.data.totalEvents).toBe(1);
    expect(count.status).toBe(200);
    expect(count.body.data.count).toBe(1);
  });
});

describe("dashboard API", () => {
  it("returns dashboard statistics for the authenticated user", async () => {
    const response = await request(app).get("/api/dashboard/stats");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({
      success: true,
      stats: {
        activeCameras: 1,
        todaysEvents: 0,
        highRiskAlerts: 0,
        systemStatus: "offline",
      },
    });
  });
});

describe("Mongo fallback API", () => {
  it("returns mock persons when MongoDB is unavailable", async () => {
    const response = await request(app).get("/api/mongo/persons");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.persons).toHaveLength(1);
  });

  it("returns mock alerts when MongoDB is unavailable", async () => {
    const response = await request(app).get("/api/mongo/alerts");

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.pagination.total).toBe(1);
  });
});
