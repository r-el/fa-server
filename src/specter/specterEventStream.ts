import { connect, type NatsConnection } from "@nats-io/transport-node";
import { DeliverPolicy, jetstream, type ConsumerMessages } from "@nats-io/jetstream";
import logger from "@core/utils/logger.js";
import { InvalidSpecterEventError, parseSpecterEvent, type SpecterEvent } from "./specterEventParser.js";
import type { SpecterConfig } from "./specterConfig.js";

const INITIAL_RETRY_DELAY_MS = 1_000;
const MAXIMUM_RETRY_DELAY_MS = 30_000;

export type SpecterEventHandler = (event: SpecterEvent) => void | Promise<void>;

interface StreamSubscription {
  stream: string;
  filterSubjects: string[];
  deliverPolicy: DeliverPolicy;
}

function sleep(delayMs: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, delayMs));
}

/**
 * Follows the owner's Specter events with ordered (ephemeral) JetStream consumers.
 *
 * Nothing is acknowledged or stored: fa only relays live events, and anything missed while fa is
 * down stays readable through the HTTP API.
 */
export class SpecterEventStream {
  private readonly handlers = new Set<SpecterEventHandler>();
  private readonly activeMessages = new Set<ConsumerMessages>();
  private connection: NatsConnection | null = null;
  private isStopped = false;

  constructor(private readonly config: SpecterConfig) {}

  get isConnected(): boolean {
    return this.connection !== null && !this.connection.isClosed();
  }

  onEvent(handler: SpecterEventHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  /** Connects in the background, retrying until Specter's NATS server is reachable. */
  start(): void {
    void this.run();
  }

  async stop(): Promise<void> {
    this.isStopped = true;
    for (const messages of this.activeMessages) messages.stop();
    await this.connection?.close();
  }

  private async run(): Promise<void> {
    try {
      this.connection = await connect({
        servers: this.config.natsUrl,
        name: "fa-server",
        waitOnFirstConnect: true,
        maxReconnectAttempts: -1,
      });
    } catch (error) {
      logger.error("Cannot connect to Specter's NATS server", { error: error?.message });
      return;
    }
    if (this.isStopped) {
      await this.connection.close();
      return;
    }
    logger.info("Connected to Specter's NATS server", { servers: this.config.natsUrl });
    const owner = `specter.owners.${this.config.ownerId}`;
    const subscriptions: StreamSubscription[] = [
      {
        stream: "EVENTS",
        filterSubjects: [
          `${owner}.cameras.*.match_confirmed`,
          `${owner}.cameras.*.rule_triggered`,
          `${owner}.enrollment.status_changed`,
        ],
        deliverPolicy: DeliverPolicy.New,
      },
      // The latest status of every camera first, so the relay starts with the current state.
      {
        stream: "CAMERA_STATUS",
        filterSubjects: [`${owner}.cameras.*.status_changed`],
        deliverPolicy: DeliverPolicy.LastPerSubject,
      },
      {
        stream: "CONFIGURATION",
        filterSubjects: [`${owner}.configuration.changed`],
        deliverPolicy: DeliverPolicy.New,
      },
    ];
    await Promise.all(subscriptions.map((subscription) => this.follow(subscription)));
  }

  private async follow(subscription: StreamSubscription): Promise<void> {
    let retryDelayMs = INITIAL_RETRY_DELAY_MS;
    while (!this.isStopped) {
      try {
        // Specter declares its streams when it starts, so they may not exist yet.
        const consumer = await jetstream(this.connection!).consumers.get(subscription.stream, {
          filter_subjects: subscription.filterSubjects,
          deliver_policy: subscription.deliverPolicy,
        });
        const messages = await consumer.consume();
        this.activeMessages.add(messages);
        retryDelayMs = INITIAL_RETRY_DELAY_MS;
        try {
          for await (const message of messages) {
            await this.dispatch(message.subject, () => message.json());
          }
        } finally {
          this.activeMessages.delete(messages);
        }
      } catch (error) {
        if (this.isStopped) return;
        logger.warn("Cannot follow a Specter stream, retrying", {
          stream: subscription.stream,
          retryDelayMs,
          error: error?.message,
        });
      }
      if (this.isStopped) return;
      await sleep(retryDelayMs);
      retryDelayMs = Math.min(retryDelayMs * 2, MAXIMUM_RETRY_DELAY_MS);
    }
  }

  private async dispatch(subject: string, readPayload: () => unknown): Promise<void> {
    let event: SpecterEvent;
    try {
      event = parseSpecterEvent(subject, readPayload());
    } catch (error) {
      const reason = error instanceof InvalidSpecterEventError ? error.message : "not JSON";
      logger.warn("Skipping a Specter event", { subject, reason });
      return;
    }
    for (const handler of this.handlers) {
      try {
        await handler(event);
      } catch (error) {
        logger.error("A Specter event handler failed", { subject, error: error?.message });
      }
    }
  }
}
