import { useState, useCallback, useContext } from "react";
import { NotificationContext, NotificationType } from "@/app/components/providers";

export interface Operation {
  id: string;
  type: "control" | "unit" | "holiday" | "location" | "occupancy";
  entityId?: string;
  promise: Promise<any>;
  description: string;
}

export const useOperationManager = () => {
  const [operations, setOperations] = useState<Map<string, Operation>>(new Map());
  const { createNotification } = useContext(NotificationContext);

  const generateOperationId = useCallback((type: string, entityId?: string): string => {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 9);
    return entityId ? `${type}-${entityId}-${timestamp}-${random}` : `${type}-${timestamp}-${random}`;
  }, []);

  const addOperation = useCallback(
    (operation: Omit<Operation, "id"> & { id?: string }) => {
      const id = operation.id || generateOperationId(operation.type, operation.entityId);
      const fullOperation: Operation = { ...operation, id };

      setOperations((prev) => new Map(prev).set(id, fullOperation));

      // Handle promise completion/failure
      fullOperation.promise
        .then(() => {
          setOperations((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
        })
        .catch((error) => {
          setOperations((prev) => {
            const next = new Map(prev);
            next.delete(id);
            return next;
          });
          createNotification?.(`${fullOperation.description} failed: ${error.message}`, NotificationType.Error);
        });

      return id;
    },
    [generateOperationId, createNotification],
  );

  const removeOperation = useCallback((id: string) => {
    setOperations((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const isOperationPending = useCallback(
    (type: string, entityId?: string): boolean => {
      for (const operation of operations.values()) {
        if (operation.type === type && (!entityId || operation.entityId === entityId)) {
          return true;
        }
      }
      return false;
    },
    [operations],
  );

  const getOperationsByType = useCallback(
    (type: string): Operation[] => {
      return Array.from(operations.values()).filter((op) => op.type === type);
    },
    [operations],
  );

  const waitForOperations = useCallback(
    async (operationIds: string[]): Promise<void> => {
      const promises = operationIds.map((id) => operations.get(id)?.promise).filter(Boolean);

      if (promises.length > 0) {
        await Promise.allSettled(promises);
      }
    },
    [operations],
  );

  const waitForAllOperations = useCallback(async (): Promise<void> => {
    const promises = Array.from(operations.values()).map((op) => op.promise);
    if (promises.length > 0) {
      await Promise.allSettled(promises);
    }
  }, [operations]);

  const hasAnyOperations = useCallback((): boolean => {
    return operations.size > 0;
  }, [operations]);

  const getOperationCount = useCallback((): number => {
    return operations.size;
  }, [operations]);

  return {
    operations,
    addOperation,
    removeOperation,
    isOperationPending,
    getOperationsByType,
    waitForOperations,
    waitForAllOperations,
    hasAnyOperations,
    getOperationCount,
  };
};
