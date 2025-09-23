import { useMutation, MutationResult, OperationVariables, FetchResult } from "@apollo/client";
import { useOperationManager } from "./useOperationManager";
import { useRef } from "react";

interface TrackedMutationOptions<TData, TVariables extends OperationVariables> {
  operationType: "unit" | "holiday" | "location" | "occupancy";
  getEntityId?: (variables: TVariables) => string | undefined;
  getDescription?: (variables: TVariables) => string;
  onCompleted?: (data: TData) => void;
  onError?: (error: any) => void;
}

export const useMutationWithTracking = <TData = any, TVariables extends OperationVariables = OperationVariables>(
  mutation: any,
  options: TrackedMutationOptions<TData, TVariables>,
): [
  (mutationOptions?: { variables?: TVariables }) => Promise<FetchResult<TData>>,
  MutationResult<TData> & { isOperationPending: boolean },
] => {
  const { addOperation, isOperationPending } = useOperationManager();
  const { operationType, getEntityId, getDescription, onCompleted, onError } = options;
  const lastVariablesRef = useRef<TVariables | undefined>();

  const [mutate, result] = useMutation<TData, TVariables>(mutation, {
    onCompleted,
    onError,
  });

  const trackedMutate = async (mutationOpts?: { variables?: TVariables }) => {
    const variables = mutationOpts?.variables;
    lastVariablesRef.current = variables;

    const entityId = variables && getEntityId ? getEntityId(variables) : undefined;
    const description = variables && getDescription ? getDescription(variables) : `${operationType} operation`;

    // Create the mutation promise
    const mutationPromise = mutate(mutationOpts);

    // Add operation to tracker
    addOperation({
      type: operationType,
      entityId,
      promise: mutationPromise,
      description,
    });

    return mutationPromise;
  };

  const entityId = lastVariablesRef.current && getEntityId ? getEntityId(lastVariablesRef.current) : undefined;
  const isPending = isOperationPending(operationType, entityId);

  return [
    trackedMutate,
    {
      ...result,
      isOperationPending: isPending,
    },
  ];
};
