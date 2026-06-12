import {
  ApolloError,
  DocumentNode,
  OperationVariables,
  QueryHookOptions,
  QueryResult,
  TypedDocumentNode,
  useQuery,
} from "@apollo/client";
import { useEffect, useRef } from "react";

type Options<TData, TVariables extends OperationVariables> = Omit<
  QueryHookOptions<TData, TVariables>,
  "onCompleted" | "onError"
> & {
  onCompleted?: (data: TData) => void;
  onError?: (error: ApolloError) => void;
};

/**
 * Drop-in replacement for useQuery that supports onCompleted/onError callbacks
 * via derived state. Apollo 3.14 deprecated those options on useQuery; this
 * wrapper preserves the call-site shape while moving the side-effects into
 * useEffect so the deprecation warning is silenced.
 *
 * Callbacks fire when the corresponding data/error reference changes — match
 * for fetchPolicy: "no-cache" (each fetch produces a new ref) and for cache
 * reads where the underlying data actually changes.
 */
export function useQueryWithCallbacks<TData = any, TVariables extends OperationVariables = OperationVariables>(
  query: DocumentNode | TypedDocumentNode<TData, TVariables>,
  options?: Options<TData, TVariables>,
): QueryResult<TData, TVariables> {
  const { onCompleted, onError, ...rest } = options ?? {};

  const onCompletedRef = useRef(onCompleted);
  const onErrorRef = useRef(onError);
  onCompletedRef.current = onCompleted;
  onErrorRef.current = onError;

  const result = useQuery<TData, TVariables>(query, rest as QueryHookOptions<TData, TVariables>);

  useEffect(() => {
    if (result.data !== undefined) {
      onCompletedRef.current?.(result.data);
    }
  }, [result.data]);

  useEffect(() => {
    if (result.error) {
      onErrorRef.current?.(result.error);
    }
  }, [result.error]);

  return result;
}
