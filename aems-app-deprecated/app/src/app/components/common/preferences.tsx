import { UpdateDialog } from "@/app/dialog";
import { IconNames } from "@blueprintjs/icons";
import { useContext, useState } from "react";
import { compilePreferences, CurrentContext, PreferencesContext } from "../providers";
import { Button, FormGroup, InputGroup } from "@blueprintjs/core";

export function Preferences({ handleClose }: { handleClose: () => void }) {
  const { current, updateCurrent } = useContext(CurrentContext);
  const { preferences } = useContext(PreferencesContext);
  const currentName = current?.preferences?.name || current?.name || "";

  const [name, setName] = useState(currentName);

  const handleUpdate = async () => {
    await updateCurrent?.({ preferences: compilePreferences(preferences, current?.preferences, { name: name }) });
    handleClose();
  };

  return (
    <UpdateDialog
      title="Preferences"
      icon={IconNames.USER}
      onUpdate={handleUpdate}
      open={true}
      setOpen={handleClose}
      disabled={currentName === name}
    >
      <FormGroup label="Displayed Username" labelFor="username">
        <InputGroup
          id="username"
          value={name}
          onChange={(e) => setName(e.target.value)}
          rightElement={<Button icon={IconNames.CROSS} onClick={() => setName("")} disabled={name === ""} minimal />}
        />
      </FormGroup>
    </UpdateDialog>
  );
}
