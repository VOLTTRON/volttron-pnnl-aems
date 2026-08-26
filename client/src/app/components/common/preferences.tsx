import { UpdateDialog } from "@/app/dialog";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useMemo, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { Button, FormGroup, HTMLSelect, InputGroup } from "@blueprintjs/core";

export function Preferences({ handleClose }: { handleClose: () => void }) {
  const { current, updateCurrent } = useContext(CurrentContext);
  const { preferences, setPreferences } = useContext(PreferencesContext);
  const currentName = current?.preferences?.name || current?.name || "";
  const currentTimezone = current?.preferences?.timezone ?? preferences?.timezone ?? "browser";

  const [name, setName] = useState(currentName);
  const [timezone, setTimezone] = useState(currentTimezone);

  const timezoneOptions = useMemo(
    () => [
      { value: "browser", label: "Browser (auto-detect)" },
      { value: "none", label: "None (as stored)" },
      ...Intl.supportedValuesOf("timeZone").map((tz) => ({ value: tz, label: tz })),
    ],
    [],
  );

  const handleUpdate = async () => {
    const payload = compilePreferences(preferences, current?.preferences, { name, timezone });
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
      disabled={currentName === name && currentTimezone === timezone}
    >
      <FormGroup label="Displayed Username" labelFor="username">
        <InputGroup
          id="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          rightElement={<Button icon={IconNames.CROSS} onClick={() => setName("")} disabled={name === ""} minimal />}
        />
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
