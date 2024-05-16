"use client";

import { ReadCurrentDocument, UpdateCurrentDocument } from "@/generated/queries/graphql";
import { useMutation, useQuery } from "@apollo/client";
import { User } from "@prisma/client";
import { createContext, useCallback } from "react";

import { useState } from "react";

export type SetCurrent = (current: Partial<User> | undefined) => void;
export type ReadCurrent = () => void;
export type UpdateCurrent = (current: Pick<User, "preferences">) => void;

export const CurrentContext = createContext<{
  current?: Partial<User>;
  loading?: boolean;
  setCurrent?: SetCurrent;
  readCurrent?: ReadCurrent;
  updateCurrent?: UpdateCurrent;
}>({});

/**
 * Provider for the current user.
 */
export default function CurrentProvider({ children }: { children: React.ReactNode }) {
  const [current, setCurrent] = useState(undefined as Partial<User> | undefined);

  const { loading, refetch } = useQuery(ReadCurrentDocument, {
    onCompleted: (data) => {
      setCurrent(data.readCurrent);
    },
    onError: (_error) => {
      setCurrent(undefined);
    },
  });
  const readCurrent = useCallback(() => {
    refetch();
  }, [refetch]);

  const [update] = useMutation(UpdateCurrentDocument, {
    onCompleted: (data) => {
      setCurrent(data.updateCurrent);
    },
    onError: (_error) => {
      setCurrent(undefined);
    },
  });
  const updateCurrent = useCallback(
    (current: Pick<User, "preferences">) => {
      update({ variables: { update: { preferences: JSON.stringify(current.preferences) } } });
    },
    [update]
  );

  return (
    <CurrentContext.Provider value={{ current, loading, setCurrent, readCurrent, updateCurrent }}>
      {children}
    </CurrentContext.Provider>
  );
}
