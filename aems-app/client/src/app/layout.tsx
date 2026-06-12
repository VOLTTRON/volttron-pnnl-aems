"use client";

import "./index.css";

import { Banner, GlobalLoading, Notification, Theme } from "./components/common";
import {
  ConfigProvider,
  CurrentProvider,
  GraphqlProvider,
  RouteProvider,
  LoggingProvider,
  LoadingProvider,
  NotificationProvider,
  PreferencesProvider,
  ScreenSizeProvider,
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
                        <ScreenSizeProvider>
                          <ConfigProvider>
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
                          </ConfigProvider>
                        </ScreenSizeProvider>
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
