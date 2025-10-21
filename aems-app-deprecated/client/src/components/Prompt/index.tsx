import { useCallback, useContext, useEffect } from "react";

import { UNSAFE_NavigationContext as NavigationContext } from "react-router-dom";
import { isString } from "lodash";

function useConfirmExit(confirmExit: () => boolean, when = true) {
  const { navigator } = useContext(NavigationContext) as any;

  useEffect(() => {
    if (!when) {
      return;
    }

    const push = navigator.push;

    navigator.push = (...args: Parameters<typeof push>) => {
      const result = confirmExit();
      if (result !== false) {
        push(...args);
      }
    };

    return () => {
      navigator.push = push;
    };
  }, [navigator, confirmExit, when]);
}

export function usePrompt(message: string, when = true) {
  useEffect(() => {
    if (when) {
      window.onbeforeunload = function () {
        return message;
      };
    }

    return () => {
      window.onbeforeunload = null;
    };
  }, [message, when]);

  const confirmExit = useCallback(() => {
    const confirm = window.confirm(message);
    return confirm;
  }, [message]);
  useConfirmExit(confirmExit, when);
}

function Prompt(props: { when: boolean; message: string | (() => string) }) {
  const { when, message } = props;
  usePrompt(isString(message) ? message : message(), when);
  return null;
}

export default Prompt;
