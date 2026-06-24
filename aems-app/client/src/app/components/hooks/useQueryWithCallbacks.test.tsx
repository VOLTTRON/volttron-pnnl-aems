import { renderHook, act, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { gql } from "@apollo/client";
import { useQueryWithCallbacks } from "./useQueryWithCallbacks";

const TEST_QUERY = gql`
  query TestQuery {
    testField
  }
`;

const successMock = {
  request: { query: TEST_QUERY },
  result: { data: { testField: "hello" } },
};

const errorMock = {
  request: { query: TEST_QUERY },
  error: new Error("network failure"),
};

function makeWrapper(mocks: any[]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <MockedProvider mocks={mocks} addTypename={false}>{children}</MockedProvider>;
  };
}

describe("useQueryWithCallbacks", () => {
  it("returns loading state initially", () => {
    const { result } = renderHook(
      () => useQueryWithCallbacks(TEST_QUERY),
      { wrapper: makeWrapper([successMock]) },
    );
    expect(result.current.loading).toBe(true);
  });

  it("calls onCompleted when data arrives", async () => {
    const onCompleted = jest.fn();
    renderHook(
      () => useQueryWithCallbacks(TEST_QUERY, { onCompleted }),
      { wrapper: makeWrapper([successMock]) },
    );
    await waitFor(() => expect(onCompleted).toHaveBeenCalledWith({ testField: "hello" }));
  });

  it("calls onError when the query errors", async () => {
    const onError = jest.fn();
    renderHook(
      () => useQueryWithCallbacks(TEST_QUERY, { onError }),
      { wrapper: makeWrapper([errorMock]) },
    );
    await waitFor(() => expect(onError).toHaveBeenCalled());
    expect(onError.mock.calls[0][0].message).toMatch(/network failure/);
  });

  it("returns the query result data", async () => {
    const { result } = renderHook(
      () => useQueryWithCallbacks(TEST_QUERY),
      { wrapper: makeWrapper([successMock]) },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ testField: "hello" });
  });

  it("always calls the latest onCompleted closure (stale-closure guard)", async () => {
    const firstCallback = jest.fn();
    const secondCallback = jest.fn();
    let currentCallback = firstCallback;

    const { rerender } = renderHook(
      () => useQueryWithCallbacks(TEST_QUERY, { onCompleted: currentCallback }),
      { wrapper: makeWrapper([successMock]) },
    );

    currentCallback = secondCallback;
    rerender();

    await waitFor(() => expect(secondCallback).toHaveBeenCalled());
    expect(firstCallback).not.toHaveBeenCalled();
  });

  it("does not call onCompleted before data is available", () => {
    const onCompleted = jest.fn();
    renderHook(
      () => useQueryWithCallbacks(TEST_QUERY, { onCompleted }),
      { wrapper: makeWrapper([successMock]) },
    );
    // Synchronously after mount, data hasn't resolved yet
    expect(onCompleted).not.toHaveBeenCalled();
  });
});
