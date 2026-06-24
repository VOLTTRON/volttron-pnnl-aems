import { render, screen, waitFor } from "@testing-library/react";
import { MockedProvider } from "@apollo/client/testing";
import { ReadBannersDocument, SubscribeBannersDocument, OrderBy } from "@/graphql-codegen/graphql";
import { Banner } from "./banner";

const queryVars = {
  where: {},
  orderBy: { createdAt: OrderBy.Desc },
};

const futureDate = new Date(Date.now() + 86400_000).toISOString();
const pastDate = new Date(Date.now() - 86400_000).toISOString();

const mockBanner = {
  id: "banner-1",
  message: "Hello world banner",
  expiration: futureDate,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const emptyQueryMock = {
  request: { query: ReadBannersDocument, variables: queryVars },
  result: { data: { readBanners: [] } },
};

const bannerQueryMock = {
  request: { query: ReadBannersDocument, variables: queryVars },
  result: { data: { readBanners: [mockBanner] } },
};

const expiredBannerQueryMock = {
  request: { query: ReadBannersDocument, variables: queryVars },
  result: { data: { readBanners: [{ ...mockBanner, expiration: pastDate }] } },
};

const subscribeEmptyMock = {
  request: { query: SubscribeBannersDocument, variables: queryVars },
  result: { data: { readBanners: [] } },
};

function renderBanner(mocks: any[]) {
  return render(
    <MockedProvider mocks={mocks} addTypename={false}>
      <Banner />
    </MockedProvider>,
  );
}

describe("Banner", () => {
  it("renders without crashing with empty data", async () => {
    renderBanner([emptyQueryMock, subscribeEmptyMock]);
    // No toast should be visible
    await waitFor(() => {
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    });
  });

  it("shows toast message when a non-expired banner is returned", async () => {
    renderBanner([bannerQueryMock, subscribeEmptyMock]);
    await waitFor(() => {
      expect(screen.getByText("Hello world banner")).toBeInTheDocument();
    });
  });

  it("does not show toast for expired banners", async () => {
    renderBanner([expiredBannerQueryMock, subscribeEmptyMock]);
    // Expiration is in the past — no toast shown
    await waitFor(() => {
      expect(screen.queryByText("Hello world banner")).not.toBeInTheDocument();
    });
  });
});
