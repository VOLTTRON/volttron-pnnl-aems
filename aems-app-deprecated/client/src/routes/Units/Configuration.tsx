import { Button, InputGroup, Label, Menu, MenuItem } from "@blueprintjs/core";

import { IConfiguration } from "controllers/configurations/action";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import { Popover2 } from "@blueprintjs/popover2";
import { get } from "lodash";
import { useCallback } from "react";
import { DeepPartial } from "../../utils/types";

export function Configuration(props: {
  unit: IUnit;
  editing: DeepPartial<IUnit> | null;
  configurations?: IConfiguration[];
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  handleCreate: (unit: DeepPartial<IUnit>) => void;
  readOnly?: boolean;
}) {
  const { unit, editing, configurations, handleChange, handleCreate, readOnly } = props;

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  return (
    <>
      {!readOnly && (
        <div className="row">
          <div className="configuration select">
            <Label>
              <h3>Select Configuration</h3>
              <Popover2
                content={
                  <Menu>
                    <MenuItem text="New Configuration" onClick={() => handleCreate(unit)} />
                    {configurations?.map((configuration) => (
                      <MenuItem
                        key={configuration.id}
                        text={configuration.label}
                        onClick={() => handleChange("configurationId", unit)(configuration.id as number)}
                      />
                    ))}
                  </Menu>
                }
                placement="bottom-start"
              >
                <Button rightIcon={IconNames.CARET_DOWN} minimal>
                  {unit?.configuration?.label || "Select Configuration..."}
                </Button>
              </Popover2>
            </Label>
          </div>
          <div />
        </div>
      )}
      <div className="row">
        <div className="label">
          <Label>
            {readOnly ? <h3>Configuration Label</h3> : <b>Configuration Label</b>}
            <InputGroup
              type="text"
              value={getValue("configuration.label")}
              onChange={(e) => handleChange("configuration.label", editing)(e.target.value)}
              readOnly={readOnly}
            />
          </Label>
        </div>
        <div />
      </div>
    </>
  );
}
