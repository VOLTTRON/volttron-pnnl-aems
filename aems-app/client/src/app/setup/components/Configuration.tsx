import { InputGroup, Label } from "@blueprintjs/core";
import { cloneDeep, merge } from "lodash";
import { ReadUnitQuery } from "@/graphql-codegen/graphql";
import { DeepPartial } from "@local/common";

type UnitType = NonNullable<ReadUnitQuery["readUnit"]>;

interface ConfigurationProps {
  unit: UnitType | null;
  editing: DeepPartial<UnitType> | null;
  setEditing?: (editing: DeepPartial<UnitType> | null) => void;
  readOnly?: boolean;
}

export function Configuration({ unit, editing, setEditing, readOnly = false }: ConfigurationProps) {
  const configuration = merge({}, unit?.configuration, editing?.configuration);
  const { label } = configuration;

  return (
    <>
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
              value={label ?? ""}
              onChange={(e) => {
                const clone = cloneDeep(editing ?? {});
                clone.configuration = clone.configuration ?? {};
                clone.configuration.label = e.target.value;
                setEditing?.(clone);
              }}
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
