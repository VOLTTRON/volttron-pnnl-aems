"use client";

import { ReadCurrentDocument, ReadCurrentQuery, UpdateCurrentDocument, UpdateCurrentMutation } from "@/graphql-codegen/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { createContext, useCallback, useContext } from "react";
import { useState } from "react";
import { NotificationContext, NotificationType } from "./notification";

export const SensitivePreferences = ["name"] as const;

export type ReadCurrentType = ReadCurrentQuery["readCurrent"];
export type UpdateCurrentType = UpdateCurrentMutation["updateCurrent"];

export type RefetchCurrent = () => Promise<void>;
export type UpdateCurrent = (current: UpdateCurrentType & {}) => Promise<void>;

export const CurrentContext = createContext<{
  current?: ReadCurrentType;
  loading: boolean;
  updateCurrent?: UpdateCurrent;
  refetchCurrent?: RefetchCurrent;
}>({ loading: true });

/**
 * Provider for the current user.
 */
export function CurrentProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState<ReadCurrentType | undefined>();

  const { createNotification } = useContext(NotificationContext);

  const { refetch } = useQuery(ReadCurrentDocument, {
    variables: {},
    fetchPolicy: "no-cache",
    onCompleted: (data) => {
      setCurrent(data.readCurrent);
    },
    onError: (error) => {
      setCurrent(null);
      createNotification?.(`Failed to fetch current user: ${error.message}`, NotificationType.Error);
    },
  });

  const [update] = useMutation(UpdateCurrentDocument, {
    onCompleted: (data) => {
      setCurrent(data.updateCurrent);
    },
    onError: (error) => {
      createNotification?.(`Failed to update current user: ${error.message}`, NotificationType.Error);
    },
  });

  const updateCurrent = useCallback(
    async (current: UpdateCurrentType & {}) => {
      await update({ variables: { update: current } });
    },
    [update],
  );

  const refetchCurrent = useCallback(async () => {
    const { data } = await refetch();
    setCurrent(data.readCurrent);
  }, [refetch]);

  return (
    <CurrentContext.Provider
      value={{
        current,
        loading: current === undefined,
        updateCurrent,
        refetchCurrent,
      }}
    >
      {children}
    </CurrentContext.Provider>
  );
}
