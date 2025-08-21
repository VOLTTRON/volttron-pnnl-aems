"use client";

import "./index.css";

import { Banner, GlobalLoading, Notification, Theme } from "./components/common";
import {
  CurrentProvider,
  GraphqlProvider,
  RouteProvider,
  LoggingProvider,
  LoadingProvider,
  NotificationProvider,
  PreferencesProvider,
} from "./components/providers";
import { BlueprintProvider } from "@blueprintjs/core";
import { Suspense } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <LoggingProvider>
          <BlueprintProvider>
            <Suspense>
              <GraphqlProvider>
                <RouteProvider>
                  <NotificationProvider>
                    <LoadingProvider>
                      <PreferencesProvider>
                        <CurrentProvider>
                          <Theme>
                            <Suspense>
                              {children}
                              <Banner />
                              <Notification />
                              <GlobalLoading />
                            </Suspense>
                          </Theme>
                        </CurrentProvider>
                      </PreferencesProvider>
                    </LoadingProvider>
                  </NotificationProvider>
                </RouteProvider>
              </GraphqlProvider>
            </Suspense>
          </BlueprintProvider>
        </LoggingProvider>
      </body>
    </html>
  );
}
