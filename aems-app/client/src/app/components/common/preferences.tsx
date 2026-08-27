import { UpdateDialog } from "@/app/dialog";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useMemo, useState } from "react";
import { compilePreferences, ConfigContext, CurrentContext, PreferencesContext, ClientPreferences } from "../providers";
import { Button, FormGroup, HTMLSelect, InputGroup } from "@blueprintjs/core";
import { Palette, Palettes } from "@/utils/palette";
import { PaletteFilter, PalettePicker } from "./palette";

// Get all available palettes for chart colors
const BasePalettes = Palettes.getPalettes({});

export function Preferences({ handleClose }: { handleClose: () => void }) {
  const { current, updateCurrent } = useContext(CurrentContext);
  const { preferences, setPreferences } = useContext(PreferencesContext);
  const { config } = useContext(ConfigContext);
  const currentName = current?.preferences?.name || current?.name || "";
  const currentPrefs = compilePreferences(preferences, current?.preferences);

  const currentTimezone = current?.preferences?.timezone ?? preferences?.timezone ?? "location";

  const [name, setName] = useState(currentName);
  const [timezone, setTimezone] = useState(currentTimezone);
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
  const [paletteGradient, setPaletteGradient] = useState<Palette>(
    Palettes.getPalette(currentPrefs.paletteGradient || "Turquoise"),
  );

  const hasChanges =
    currentName !== name ||
    currentPrefs.palette1 !== palette1.name ||
    currentPrefs.palette2 !== palette2.name ||
    currentPrefs.palette3 !== palette3.name ||
    currentPrefs.paletteWarm !== paletteWarm.name ||
    currentPrefs.paletteCool !== paletteCool.name ||
    currentPrefs.paletteGradient !== paletteGradient.name ||
    currentName !== name ||
    currentTimezone !== timezone;

  const timezoneOptions = useMemo(() => {
    const siteTz = config?.location || Intl.DateTimeFormat().resolvedOptions().timeZone;
    return [
      { value: "location", label: `Site (${siteTz})` },
      { value: "browser", label: "Browser (auto-detect)" },
      { value: "none", label: "None (as stored)" },
      ...Intl.supportedValuesOf("timeZone").map((tz) => ({ value: tz, label: tz })),
    ];
  }, [config?.location]);

  const handleUpdate = async () => {
    const serverPreferences = {
      name: name,
      timezone: timezone,
    };
    const clientPreferences: ClientPreferences = {
      palette1: palette1.name,
      palette2: palette2.name,
      palette3: palette3.name,
      paletteWarm: paletteWarm.name,
      paletteCool: paletteCool.name,
      paletteGradient: paletteGradient.name,
    };
    const payload = compilePreferences(preferences, current?.preferences, serverPreferences, clientPreferences);
    setPreferences?.(payload);
    await updateCurrent?.({ preferences: payload });
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

      <FormGroup label="Gradient Chart Palette" helperText="Used for gradient metrics">
        <PalettePicker palettes={palettes} palette={paletteGradient} onChange={setPaletteGradient} />
      </FormGroup>
      <FormGroup label="Timezone" labelFor="timezone">
        <HTMLSelect
          id="timezone"
          value={timezone}
          onChange={(e) => setTimezone(e.target.value)}
          options={timezoneOptions}
          fill
        />
      </FormGroup>
    </UpdateDialog>
  );
}
