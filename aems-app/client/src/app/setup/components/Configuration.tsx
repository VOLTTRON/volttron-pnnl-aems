import { InputGroup, Label, Button } from "@blueprintjs/core";
import { IconNames } from "@blueprintjs/icons";
import { useCallback } from "react";
import { get } from "lodash";
import { Unit, Configuration as ConfigurationType } from "@/graphql-codegen/graphql";
import { DeepPartial } from "@local/common";

type UnitType = Unit;

interface ConfigurationProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  handleChange: (
    field: string,
    editingUnit?: DeepPartial<UnitType> | null,
  ) => (value: string | number | boolean | object | null | undefined) => void;
  configurations?: ConfigurationType[];
  readOnly?: boolean;
}

export function Configuration({
  unit,
  editing,
  configurations,
  handleChange,
  handleCreate,
  readOnly = false,
}: ConfigurationProps & {
  handleCreate?: (unit: UnitType) => void;
}) {
  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  return (
    <>
      {!readOnly && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: "1rem",
            alignItems: "end",
            marginBottom: "1rem",
          }}
        >
          <div>
            <Label>
              <h3>Select Configuration</h3>
              <Button
                rightIcon={IconNames.CARET_DOWN}
                minimal
                text={unit?.configuration?.label || "Select Configuration..."}
                onClick={() => {
                  // This would open a menu with configuration options
                  // For now, we'll use a simple approach
                }}
              />
            </Label>
          </div>
          <div />
        </div>
      )}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr auto",
          gap: "1rem",
          alignItems: "end",
          marginBottom: "1rem",
        }}
      >
        <div>
          <Label>
            {readOnly ? <h3>Configuration Label</h3> : <b>Configuration Label</b>}
            <InputGroup
              type="text"
              value={getValue("configuration.label") || ""}
              onChange={(e) => handleChange("configuration.label", editing)(e.target.value)}
              readOnly={readOnly}
              placeholder="Enter configuration label"
            />
          </Label>
        </div>
        <div />
      </div>
    </>
  );
}
