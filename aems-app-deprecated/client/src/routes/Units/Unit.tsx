import {
  Button,
  HandleInteractionKind,
  HandleType,
  InputGroup,
  Intent,
  Label,
  Menu,
  MenuItem,
  MultiSlider,
  NumericInput,
  Spinner,
  Tag,
} from "@blueprintjs/core";
import {
  COMPRESSORS_MAX,
  COMPRESSORS_MIN,
  COOLING_CAPACITY_MAX,
  COOLING_CAPACITY_MIN,
  COOLING_LOCKOUT_MAX,
  COOLING_LOCKOUT_MIN,
  COOLING_PEAK_OFFSET_MAX,
  COOLING_PEAK_OFFSET_MIN,
  EARLIEST_START_MAX,
  EARLIEST_START_MIN,
  ECONOMIZER_SETPOINT_MAX,
  ECONOMIZER_SETPOINT_MIN,
  HEATING_PEAK_OFFSET_MAX,
  HEATING_PEAK_OFFSET_MIN,
  HEAT_PUMP_BACKUP_MAX,
  HEAT_PUMP_BACKUP_MIN,
  HEAT_PUMP_LOCKOUT_MAX,
  HEAT_PUMP_LOCKOUT_MIN,
  LATEST_START_MAX,
  LATEST_START_MIN,
  OPTIMAL_START_DEVIATION_MAX,
  OPTIMAL_START_DEVIATION_MIN,
  OPTIMAL_START_LOCKOUT_MAX,
  OPTIMAL_START_LOCKOUT_MIN,
} from "utils/unit";
import { get, merge } from "lodash";
import { useCallback, useState, useEffect, useRef } from "react";

import { DeepPartial } from "../../utils/types";
import { IUnit } from "controllers/units/action";
import { IconNames } from "@blueprintjs/icons";
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import { Select } from "@blueprintjs/select";
import { IEnum } from "common/types";
import { ZoneType } from "common";
import { useDispatch, useSelector } from "react-redux";
import {
  readLocationsSearch,
  queryLocationsSearch,
  selectLocationsSearch,
  selectQueryLocationsSearch,
  ILocation,
} from "controllers/locations/action";
import { selectQueryLocationsSearchBusy } from "controllers/locations/action";
import { BUSY_USER } from "controllers/busy/action";

export function Unit(props: {
  unit: DeepPartial<IUnit> | IUnit;
  editing: DeepPartial<IUnit> | null;
  handleChange: (field: string, unit?: DeepPartial<IUnit> | null) => (value: any) => void;
  hidden?: Array<string>;
}) {
  const { hidden, unit, editing, handleChange } = props;

  const searchRef = useRef(null);

  const [temp, setTemp] = useState({} as any);
  const [query, setQuery] = useState("");

  const getValue = useCallback((field: string) => get(editing, field, get(unit, field)), [editing, unit]);

  const searchInfo = useSelector(selectLocationsSearch);
  const queryResults = useSelector(selectQueryLocationsSearch);
  const queryBusy = useSelector(selectQueryLocationsSearchBusy);

  const dispatch = useDispatch();
  useEffect(() => dispatch(readLocationsSearch()), [dispatch]);
  useEffect(
    () => (searchInfo?.autoComplete ? dispatch(queryLocationsSearch({ auto: true, search: query })) : undefined),
    [dispatch, query, searchInfo]
  );

  const mapUrl = getValue(`location`)
    ? `https://www.google.com/maps/search/?api=1&query=${getValue(`location.latitude`)},${getValue(
        `location.longitude`
      )}`
    : `https://www.google.com/maps/@?api=1&map_action=map`;

  const renderLocation = (props: any, label: string, path: string) => {
    const location = getValue(path) as ILocation | null | undefined;
    if (searchInfo === undefined) {
      return (
        <Label>
          <b>Location...</b>
          <Spinner intent={Intent.PRIMARY} />
        </Label>
      );
    } else if (searchInfo.autoComplete || searchInfo.addressSearch) {
      return (
        <Label>
          <b>Location Search</b>
          <Select
            items={queryResults ?? []}
            itemRenderer={(v, { handleClick, modifiers }) => (
              <MenuItem
                active={location?.name === (v.display_name ?? v.name)}
                disabled={modifiers.disabled}
                key={v.name}
                text={v.display_name ?? v.name}
                onClick={() => handleClick(v)}
                onMouseDown={(e) => e.preventDefault()}
              />
            )}
            onItemSelect={(v): any =>
              handleChange(
                path,
                editing
              )({ name: v.display_name ?? v.name, latitude: parseFloat(v.lat), longitude: parseFloat(v.lon) })
            }
            noResults={<MenuItem disabled={true} text="No results" />}
            filterable={false}
            popoverProps={{
              isOpen: searchRef.current === document.activeElement,
              autoFocus: false,
            }}
          >
            <InputGroup
              inputRef={searchRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              rightElement={
                searchInfo.addressSearch ? (
                  <Button
                    icon={IconNames.SEARCH}
                    minimal
                    onClick={() => dispatch(queryLocationsSearch({ search: query }))}
                    loading={get(queryBusy, "type") === BUSY_USER}
                    autoFocus={false}
                  />
                ) : undefined
              }
              onKeyDown={(k) => (k.key === "Enter" ? dispatch(queryLocationsSearch({ search: query })) : null)}
            />
          </Select>
        </Label>
      );
    } else {
      return (
        <Label>
          <b>Location Update</b>
          <InputGroup
            type="text"
            value={location?.name ?? ""}
            onChange={(e) => {
              handleChange(`${path}.name`, editing)(e.target.value);
            }}
          />
          {renderNumeric(props, "Longitude", -180, 180, `${path}.longitude`, undefined, true)}
          {renderNumeric(props, "Latitude", -90, 90, `${path}.latitude`, undefined, true)}
        </Label>
      );
    }
  };

  const renderNumeric = (
    props: any,
    label: string,
    min: number,
    max: number,
    path: string,
    element?: any,
    fractions?: boolean
  ) => {
    let value = temp[path];
    if (value === undefined) {
      value = getValue(path);
    }
    return (
      <Label>
        <b>{label}</b>
        <NumericInput
          {...props}
          step={fractions ? 0.5 : 1}
          {...(fractions && { minorStepSize: 0.0001 })}
          min={min}
          max={max}
          value={value}
          onValueChange={(v, s) => {
            if (fractions) {
              setTemp(merge({}, temp, { [path]: s }));
            }
            handleChange(path, editing)(v);
          }}
          rightElement={element}
          clampValueOnBlur
        />
      </Label>
    );
  };

  const renderTemperature = (props: any, label: string, min: number, max: number, step: number, path: string) => {
    return (
      <Label>
        <b>{label}</b>
        <MultiSlider
          {...props}
          min={min}
          max={max}
          stepSize={0.5}
          labelStepSize={step}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > min && v < max) ? `${v}º\xa0F` : "")}
        >
          <MultiSlider.Handle
            type={HandleType.FULL}
            interactionKind={HandleInteractionKind.LOCK}
            value={getValue(path)}
            onChange={(v) => {
              handleChange(path, editing)(v);
            }}
          />
        </MultiSlider>
      </Label>
    );
  };

  const renderDuration = (props: any, label: string, min: number, max: number, step: number, path: string) => {
    return (
      <Label>
        <b>{label}</b>
        <MultiSlider
          {...props}
          min={min}
          max={max}
          stepSize={5}
          labelStepSize={step}
          labelRenderer={(v, o) => (o?.isHandleTooltip || (v > min && v < max) ? `${v}\xa0min` : "")}
        >
          <MultiSlider.Handle
            type={HandleType.FULL}
            interactionKind={HandleInteractionKind.LOCK}
            value={getValue(path)}
            onChange={(v) => {
              handleChange(path, editing)(v);
            }}
          />
        </MultiSlider>
      </Label>
    );
  };

  const renderSelect = (
    props: any,
    label: string,
    values: Array<IEnum<any> | { name: any; label: string }>,
    path: string,
    transform?: (v: string) => any
  ) => {
    return (
      <Label>
        <b>{label}</b>
        <Popover2
          content={
            <Menu>
              {values?.map((value) => (
                <MenuItem
                  key={value.label}
                  text={value.label}
                  onClick={() => handleChange(path, editing)(value.name)}
                />
              ))}
            </Menu>
          }
          placement="bottom-start"
        >
          <Button {...props} rightIcon={IconNames.CARET_DOWN} minimal>
            {transform ? transform(getValue(path)) : getValue(path)}
          </Button>
        </Popover2>
      </Label>
    );
  };

  // const renderCheckbox = (
  //   props: any,
  //   label: string,
  //   path: string,
  //   description: (value: boolean) => string,
  //   reversed?: boolean
  // ) => {
  //   const value = getValue(path);
  //   return (
  //     <Label>
  //       <b>{label}</b>
  //       <Checkbox
  //         {...props}
  //         label={description(value)}
  //         checked={reversed ? !value : value}
  //         onClick={() => handleChange(path, unit)(reversed ? value : !value)}
  //       />
  //     </Label>
  //   );
  // };

  return (
    <>
      {hidden?.includes("label") ? null : (
        <div className="row">
          <h3> </h3>
          <div className="unit">
            <Label>
              <b>Unit Label</b>
              <InputGroup
                type="text"
                value={getValue(`label`)}
                onChange={(e) => {
                  handleChange(`label`, editing)(e.target.value);
                }}
              />
            </Label>
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("location") ? null : (
        <div className="row">
          <div>
            <Label>
              <b>Unit Location</b>
              <InputGroup
                className="tooltip-icon"
                type="text"
                value={getValue(`location.name`) ?? "No location set"}
                readOnly
                rightElement={
                  <Tooltip2 content={mapUrl}>
                    <Button icon={IconNames.MAP} onClick={() => window.open(mapUrl, "_blank")} minimal />
                  </Tooltip2>
                }
              />
            </Label>
          </div>
          <div>{renderLocation({}, "Unit Location", `location`)}</div>
        </div>
      )}
      {hidden?.includes("peakLoadExclude") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Participate in Grid Services",
              [
                { name: false, label: "Yes" },
                { name: true, label: "No" },
              ],
              `peakLoadExclude`,
              (v) => (v ? "No" : "Yes")
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("coolingPeakOffset") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              getValue("peakLoadExclude") ? { disabled: true } : {},
              "Cooling Offset During Grid Services",
              COOLING_PEAK_OFFSET_MIN,
              COOLING_PEAK_OFFSET_MAX,
              1,
              `coolingPeakOffset`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("heatingPeakOffset") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              getValue("peakLoadExclude") ? { disabled: true } : {},
              "Heating Offset During Grid Services",
              HEATING_PEAK_OFFSET_MIN,
              HEATING_PEAK_OFFSET_MAX,
              1,
              `heatingPeakOffset`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("zoneLocation") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Zone Location",
              ZoneType.values.filter((v) => v.type === "location"),
              `zoneLocation`,
              (v) => ZoneType.parse(v)?.label || v
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("zoneMass") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Zone Mass",
              ZoneType.values.filter((v) => v.type === "mass"),
              `zoneMass`,
              (v) => ZoneType.parse(v)?.label || v
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("zoneOrientation") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Zone Orientation",
              ZoneType.values.filter((v) => v.type === "orientation"),
              `zoneOrientation`,
              (v) => ZoneType.parse(v)?.label || v
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("zoneBuilding") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Zone Type",
              ZoneType.values.filter((v) => v.type === "building"),
              `zoneBuilding`,
              (v) => ZoneType.parse(v)?.label || v
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("coolingCapacity") ? null : (
        <div className="row">
          <div className="unit">
            {renderNumeric(
              {},
              "Rated Cooling Capacity",
              COOLING_CAPACITY_MIN,
              COOLING_CAPACITY_MAX,
              `coolingCapacity`,
              <Tag minimal>tons</Tag>,
              true
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("compressors") ? null : (
        <div className="row">
          <div className="unit">
            {renderNumeric({}, "Number of Compressors", COMPRESSORS_MIN, COMPRESSORS_MAX, `compressors`)}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("optimalStartLockout") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              {},
              "Disable Optimal Start when Outdoor Temperatures are below",
              OPTIMAL_START_LOCKOUT_MIN,
              OPTIMAL_START_LOCKOUT_MAX,
              5,
              `optimalStartLockout`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("optimalStartDeviation") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              {},
              "Optimal Start Allowable Zone Temperature Deviation",
              OPTIMAL_START_DEVIATION_MIN,
              OPTIMAL_START_DEVIATION_MAX,
              0.5,
              `optimalStartDeviation`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("earliestStart") ? null : (
        <div className="row">
          <div className="unit">
            {renderDuration(
              {},
              "Earliest Start Time Before Occupancy",
              EARLIEST_START_MIN,
              EARLIEST_START_MAX,
              30,
              `earliestStart`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("latestStart") ? null : (
        <div className="row">
          <div className="unit">
            {renderDuration(
              {},
              "Latest Start Time Before Occupancy",
              LATEST_START_MIN,
              LATEST_START_MAX,
              15,
              `latestStart`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("heatPump") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Heat Pump",
              [
                { name: true, label: "Yes" },
                { name: false, label: "No" },
              ],
              `heatPump`,
              (v) => (v ? "Yes" : "No")
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("heatPumpBackup") ? null : (
        <div className="row">
          <div className="unit">
            {renderNumeric(
              getValue("heatPump") ? {} : { disabled: true },
              "Heat Pump Electric Backup Capacity",
              HEAT_PUMP_BACKUP_MIN,
              HEAT_PUMP_BACKUP_MAX,
              `heatPumpBackup`,
              <Tag minimal>kW</Tag>,
              true
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("heatPumpLockout") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              getValue("heatPump") ? {} : { disabled: true },
              "Heat Pump Auxiliary Heat Lockout",
              HEAT_PUMP_LOCKOUT_MIN,
              HEAT_PUMP_LOCKOUT_MAX,
              8,
              `heatPumpLockout`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("economizer") ? null : (
        <div className="row">
          <div className="select">
            {renderSelect(
              {},
              "Economizer",
              [
                { name: true, label: "Yes" },
                { name: false, label: "No" },
              ],
              `economizer`,
              (v) => (v ? "Yes" : "No")
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("economizerSetpoint") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              getValue("economizer") ? {} : { disabled: true },
              "Economizer Switchover Temperature Setpoint",
              ECONOMIZER_SETPOINT_MIN,
              ECONOMIZER_SETPOINT_MAX,
              5,
              `economizerSetpoint`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
      {hidden?.includes("coolingLockout") ? null : (
        <div className="row">
          <div className="unit">
            {renderTemperature(
              getValue("economizer") ? {} : { disabled: true },
              "Compressor Cooling Lockout Temperature",
              COOLING_LOCKOUT_MIN,
              COOLING_LOCKOUT_MAX,
              5,
              `coolingLockout`
            )}
          </div>
          <div />
          <div />
        </div>
      )}
    </>
  );
}
