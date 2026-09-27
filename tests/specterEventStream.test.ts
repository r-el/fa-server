import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SpecterEventStream } from "@specter/specterEventStream.js";

const connectMock = vi.hoisted(() => vi.fn());

vi.mock("@nats-io/transport-node", () => ({ connect: connectMock }));

describe("SpecterEventStream connection lifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    connectMock.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries a failed initial connection", async () => {
    let isClosed = false;
    const connection = {
      isClosed: () => isClosed,
      close: vi.fn(async () => {
        isClosed = true;
      }),
    };
    connectMock
      .mockRejectedValueOnce(new Error("NATS unavailable"))
      .mockResolvedValueOnce(connection);

    const stream = new SpecterEventStream({
      apiUrl: "http://specter.test",
      apiTokenFile: "unused",
      natsUrl: "nats://nats.test:4222",
      ownerId: "facealert",
      requestTimeoutMs: 1_000,
    });

    stream.start();
    await vi.advanceTimersByTimeAsync(1_000);
    await vi.waitFor(() => expect(connectMock).toHaveBeenCalledTimes(2));
    await stream.stop();

    expect(stream.isConnected).toBe(false);
  });
});