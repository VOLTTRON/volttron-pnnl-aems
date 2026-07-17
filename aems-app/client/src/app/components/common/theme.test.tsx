import { render } from "@testing-library/react";
import { Theme } from "./theme";
import { PreferencesContext } from "../providers/preferences";
import { CurrentContext } from "../providers/current";
import { Mode } from "@local/prisma";
import { Classes } from "@blueprintjs/core";

function renderTheme(mode: Mode) {
  return render(
    <PreferencesContext.Provider value={{ preferences: { theme: "default", mode } }}>
      <CurrentContext.Provider value={{ loading: false }}>
        <Theme>
          <div data-testid="child">child</div>
        </Theme>
      </CurrentContext.Provider>
    </PreferencesContext.Provider>,
  );
}

describe("Theme", () => {
  afterEach(() => {
    // Clean up dark class after each test
    document.body.classList.remove(Classes.DARK);
  });

  it("renders children", () => {
    const { getByTestId } = renderTheme(Mode.Light);
    expect(getByTestId("child")).toBeInTheDocument();
  });

  it("adds bp5-dark class to document.body in Dark mode", () => {
    renderTheme(Mode.Dark);
    expect(document.body.classList.contains(Classes.DARK)).toBe(true);
  });

  it("does not add bp5-dark class to document.body in Light mode", () => {
    renderTheme(Mode.Light);
    expect(document.body.classList.contains(Classes.DARK)).toBe(false);
  });

  it("removes bp5-dark class when switching from dark to light", () => {
    document.body.classList.add(Classes.DARK);
    renderTheme(Mode.Light);
    expect(document.body.classList.contains(Classes.DARK)).toBe(false);
  });
});
