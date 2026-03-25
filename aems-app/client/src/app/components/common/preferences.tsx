import { UpdateDialog } from "@/app/dialog";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";
import { Palette, Palettes, PaletteScheme } from "@/utils/palette";
import { PalettePicker } from "./palette";

// Get only diverging palettes for chart colors
const divergingPalettes = Palettes.getPalettes({ scheme: PaletteScheme.Diverging });

export function Preferences({ handleClose }: { handleClose: () => void }) {
  const { current, updateCurrent } = useContext(CurrentContext);
  const { preferences } = useContext(PreferencesContext);
  const currentName = current?.preferences?.name || current?.name || "";
  const currentPrefs = compilePreferences(preferences, current?.preferences);

  const [name, setName] = useState(currentName);
  const [palette1, setPalette1] = useState<Palette>(
    Palettes.getPalette(currentPrefs.palette1 || "Radiant Harmony"),
  );
  const [palette2, setPalette2] = useState<Palette>(Palettes.getPalette(currentPrefs.palette2 || "Desert Oasis"));
  const [palette3, setPalette3] = useState<Palette>(Palettes.getPalette(currentPrefs.palette3 || "Pastel Dreams"));

  const hasChanges =
    currentName !== name ||
    currentPrefs.palette1 !== palette1.name ||
    currentPrefs.palette2 !== palette2.name ||
    currentPrefs.palette3 !== palette3.name;

  const handleUpdate = async () => {
    await updateCurrent?.({
      preferences: compilePreferences(preferences, current?.preferences, {
        name: name,
        palette1: palette1.name,
        palette2: palette2.name,
        palette3: palette3.name,
      }),
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

      <FormGroup label="Primary Chart Palette" helperText="Used for temperatures and main metrics">
        <PalettePicker palettes={divergingPalettes} palette={palette1} onChange={setPalette1} />
      </FormGroup>

      <FormGroup label="Secondary Chart Palette" helperText="Used for setpoints and demands">
        <PalettePicker palettes={divergingPalettes} palette={palette2} onChange={setPalette2} />
      </FormGroup>

      <FormGroup label="Tertiary Chart Palette" helperText="Used for status and states">
        <PalettePicker palettes={divergingPalettes} palette={palette3} onChange={setPalette3} />
      </FormGroup>
    </UpdateDialog>
  );
}
