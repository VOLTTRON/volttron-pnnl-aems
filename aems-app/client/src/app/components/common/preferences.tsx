import { UpdateDialog } from "@/app/dialog";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext, ClientPreferences } from "../providers";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { Palette, Palettes } from "@/utils/palette";
import { PaletteFilter, PalettePicker } from "./palette";

// Get all available palettes for chart colors
const BasePalettes = Palettes.getPalettes({});

export function Preferences({ handleClose }: { handleClose: () => void }) {
  const { current, updateCurrent } = useContext(CurrentContext);
  const { preferences } = useContext(PreferencesContext);
  const currentName = current?.preferences?.name || current?.name || "";
  const currentPrefs = compilePreferences(preferences, current?.preferences);

  const [name, setName] = useState(currentName);
  const [palettes, setPalettes] = useState<Palettes>(Palettes.getPalettes({}));
  const [palette1, setPalette1] = useState<Palette>(Palettes.getPalette(currentPrefs.palette1 || "Radiant Harmony"));
  const [palette2, setPalette2] = useState<Palette>(Palettes.getPalette(currentPrefs.palette2 || "Desert Oasis"));
  const [palette3, setPalette3] = useState<Palette>(Palettes.getPalette(currentPrefs.palette3 || "Earthy Elegance"));
  const [paletteWarm, setPaletteWarm] = useState<Palette>(
    Palettes.getPalette(currentPrefs.paletteWarm || "Radiant Harmony"),
  );
  const [paletteCool, setPaletteCool] = useState<Palette>(
    Palettes.getPalette(currentPrefs.paletteCool || "Desert Oasis"),
  );

  const hasChanges =
    currentName !== name ||
    currentPrefs.palette1 !== palette1.name ||
    currentPrefs.palette2 !== palette2.name ||
    currentPrefs.palette3 !== palette3.name ||
    currentPrefs.paletteWarm !== paletteWarm.name ||
    currentPrefs.paletteCool !== paletteCool.name;

  const handleUpdate = async () => {
    const serverPreferences = {
      name: name,
    };
    const clientPreferences: ClientPreferences = {
      palette1: palette1.name,
      palette2: palette2.name,
      palette3: palette3.name,
      paletteWarm: paletteWarm.name,
      paletteCool: paletteCool.name,
    };
    await updateCurrent?.({
      preferences: compilePreferences(preferences, current?.preferences, serverPreferences, clientPreferences),
    });
    handleClose();
  };

  return (
    <UpdateDialog
      title="Preferences"
      icon={IconNames.USER}
      onUpdate={handleUpdate}
      open={true}
      setOpen={handleClose}
      disabled={!hasChanges}
    >
      <FormGroup label="Displayed Username" labelFor="username">
        <InputGroup
          id="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          rightElement={<Button icon={IconNames.CROSS} onClick={() => setName("")} disabled={name === ""} minimal />}
        />
      </FormGroup>

      <FormGroup label="Palette Filter">
        <PaletteFilter palettes={BasePalettes} onChange={setPalettes} />
      </FormGroup>

      <FormGroup label="Primary Chart Palette" helperText="Used for temperatures and main metrics">
        <PalettePicker palettes={palettes} palette={palette1} onChange={setPalette1} />
      </FormGroup>

      <FormGroup label="Secondary Chart Palette" helperText="Used for setpoints and demands">
        <PalettePicker palettes={palettes} palette={palette2} onChange={setPalette2} />
      </FormGroup>

      <FormGroup label="Tertiary Chart Palette" helperText="Used for status and states">
        <PalettePicker palettes={palettes} palette={palette3} onChange={setPalette3} />
      </FormGroup>

      <FormGroup label="Warm Chart Palette" helperText="Used for warm metrics">
        <PalettePicker palettes={palettes} palette={paletteWarm} onChange={setPaletteWarm} />
      </FormGroup>

      <FormGroup label="Cool Chart Palette" helperText="Used for cool metrics">
        <PalettePicker palettes={palettes} palette={paletteCool} onChange={setPaletteCool} />
      </FormGroup>
    </UpdateDialog>
  );
}
