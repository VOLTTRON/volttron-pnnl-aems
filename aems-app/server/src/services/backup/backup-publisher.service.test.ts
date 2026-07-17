import { BackupSubscriptionPublisher } from "./backup-publisher.service";
import { SubscriptionService } from "@/subscription/subscription.service";
import { Mutation } from "@local/common";

function makeSubscription(): jest.Mocked<SubscriptionService> {
  return {
    publish: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<SubscriptionService>;
}

describe("BackupSubscriptionPublisher", () => {
  let sub: jest.Mocked<SubscriptionService>;
  let publisher: BackupSubscriptionPublisher;

  beforeEach(() => {
    sub = makeSubscription();
    publisher = new BackupSubscriptionPublisher(sub);
  });

  describe("publishPolicy", () => {
    it("publishes to the collection topic and the per-id topic", async () => {
      await publisher.publishPolicy("pol-1", Mutation.Created);
      expect(sub.publish).toHaveBeenCalledTimes(2);
      expect(sub.publish).toHaveBeenCalledWith("BackupPolicy", { topic: "BackupPolicy", id: "pol-1", mutation: Mutation.Created });
      expect(sub.publish).toHaveBeenCalledWith("BackupPolicy/pol-1", { topic: "BackupPolicy", id: "pol-1", mutation: Mutation.Created });
    });
  });

  describe("publishDestination", () => {
    it("publishes to the collection topic and the per-id topic", async () => {
      await publisher.publishDestination("dst-1", Mutation.Updated);
      expect(sub.publish).toHaveBeenCalledWith("BackupDestination", expect.objectContaining({ id: "dst-1" }));
      expect(sub.publish).toHaveBeenCalledWith("BackupDestination/dst-1", expect.objectContaining({ id: "dst-1" }));
    });
  });

  describe("publishRun", () => {
    it("publishes to the collection topic and the per-id topic", async () => {
      await publisher.publishRun("run-1", Mutation.Updated);
      expect(sub.publish).toHaveBeenCalledWith("BackupRun", expect.objectContaining({ id: "run-1" }));
      expect(sub.publish).toHaveBeenCalledWith("BackupRun/run-1", expect.objectContaining({ id: "run-1" }));
    });
  });

  describe("publishKey", () => {
    it("publishes to the collection topic and the per-id topic", async () => {
      await publisher.publishKey("key-1", Mutation.Deleted);
      expect(sub.publish).toHaveBeenCalledWith("BackupKey", expect.objectContaining({ id: "key-1" }));
      expect(sub.publish).toHaveBeenCalledWith("BackupKey/key-1", expect.objectContaining({ id: "key-1" }));
    });
  });
});
