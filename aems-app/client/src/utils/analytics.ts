import ReactGA from "react-ga";
import { isEmpty } from "lodash";

export class Analytics {
  private static instance: Analytics;

  /**
   * Singleton getter method.
   *
   * @returns the single instance
   */
  public static getInstance(): Analytics {
    if (!Analytics.instance) {
      Analytics.instance = new Analytics();
    }
    return Analytics.instance;
  }

  private _initialized: boolean;

  private constructor() {
    this._initialized = false;
    this.initialize();
  }

  private initialize = () => {
    if (!this._initialized && !isEmpty(process.env.REACT_APP_GA_CLIENT_ID)) {
      ReactGA.initialize(process.env.REACT_APP_GA_CLIENT_ID as string);
      this._initialized = true;
    }
  };

  /**
   * Called for a page view.
   *
   * @param path
   * @param query
   */
  pageview = (path: string, query?: string) => {
    if (this._initialized) {
      ReactGA.pageview(`${path}${query ? query : ""}`);
    } else {
      console.log(`Analytics Debug Page View: ${path}${query ? query : ""}`);
    }
  };

  /**
   * Called for explicit user actions.
   *
   * @param category
   * @param action
   * @param label
   */
  event = (category: string, action: string, label?: string) => {
    if (this._initialized) {
      ReactGA.event({ category, action, label });
    } else {
      console.log(`Analytics Debug Event: ${category} -> ${action}${label ? " (" + label + ")" : ""}`);
    }
  };
}
