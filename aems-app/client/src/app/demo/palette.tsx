"use client";

import { Palette, Palettes } from "@/utils/palette";
import { ColorChooser, ColorPicker, PaletteFilter, PalettePicker } from "../components/common";
import { useState } from "react";
import { ControlGroup, FormGroup } from "@blueprintjs/core";
import { Color } from "@local/common";

const PALETTES = new Palettes();
const PALETTE = Palettes.getPalette("Blue");

export function PaletteDemo() {
  const [palettes, setPalettes] = useState<Palettes>(new Palettes());
  const [palette, setPalette] = useState<Palette>(Palettes.getPalette("Gray"));
  const [color, setColor] = useState<Color>(PALETTE.getColor(0));
  const [selected, setSelected] = useState<Color | undefined>(undefined);

  return (
    <>
      <FormGroup label="Palette Filter">
        <ControlGroup>
          <PaletteFilter palettes={PALETTES} onChange={setPalettes} />
        </ControlGroup>
      </FormGroup>
      <FormGroup label="Palette Picker">
        <ControlGroup>
          <PalettePicker palettes={palettes} palette={palette} onChange={setPalette} options={{ filterable: true }} />
        </ControlGroup>
      </FormGroup>
      <FormGroup label="Color Chooser">
        <ControlGroup>
          <ColorChooser palette={PALETTE} color={color} onChange={setColor} />
        </ControlGroup>
      </FormGroup>
      <FormGroup label="Color Picker">
        <ControlGroup>
          <ColorPicker palettes={palettes} color={selected} onChange={setSelected} />
        </ControlGroup>
      </FormGroup>
    </>
  );
}
