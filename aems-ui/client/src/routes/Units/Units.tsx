import "./style.scss";

import { Alert, Button, Card, Collapse, InputGroup, Intent, Label, Position, Tree } from "@blueprintjs/core";
import { Header, Prompt } from "components";
import {
  IConfiguration,
  createConfiguration,
  deleteConfiguration,
  readConfigurations,
  readConfigurationsPoll,
  selectReadConfigurations,
  updateConfiguration,
} from "controllers/configurations/action";
import {
  IFilter,
  IUnit,
  filterUnits,
  readUnits,
  readUnitsPoll,
  selectFilterUnits,
  selectReadUnits,
  updateUnit,
} from "controllers/units/action";
import { IconName, IconNames } from "@blueprintjs/icons";
import { cloneDeep, get, isEqual, isNil, isObject, merge, set } from "lodash";

import { Configuration } from "./Configuration";
import { Holidays } from "./Holidays";
import { Occupancies } from "./Occupancies";
import React from "react";
import { RootProps } from "routes";
import { Schedules } from "./Schedules";
import { Setpoints } from "./Setpoints";
import { StageType } from "common";
import { Tooltip2 } from "@blueprintjs/popover2";
import { Unit } from "./Unit";
import { connect } from "react-redux";
import { createConfigurationDefault } from "utils/configuration";
import { defaultPollInterval } from "controllers/poll/action";
import { isSetpointValid } from "utils/setpoint";
import { DeepPartial } from "../../utils/types";

interface UnitsProps extends RootProps {
  readUnits: () => void;
  readUnitsPoll: (payload?: number) => void;
  filterUnits: (payload: IFilter) => void;
  updateUnit: (payload: DeepPartial<IUnit>) => void;
  units?: IUnit[];
  filtered?: IUnit[];
  readConfigurations: () => void;
  readConfigurationsPoll: (payload?: number) => void;
  createConfiguration: (payload: DeepPartial<IConfiguration>) => void;
  updateConfiguration: (payload: DeepPartial<IConfiguration>) => void;
  deleteConfiguration: (payload: number) => void;
  configurations?: IConfiguration[];
}

interface UnitsState {
  editing: DeepPartial<IUnit> | null;
  expanded: string | null;
  confirm: (() => void) | null;
}

class Units extends React.Component<UnitsProps, UnitsState> {
  constructor(props: UnitsProps) {
    super(props);
    this.state = {
      editing: null,
      expanded: null,
      confirm: null,
    };
  }

  componentDidMount() {
    this.props.readUnits();
    this.props.readConfigurations();
    this.props.readUnitsPoll(defaultPollInterval);
    this.props.readConfigurationsPoll(defaultPollInterval);
  }

  componentWillUnmount() {
    this.props.readUnitsPoll();
    this.props.readConfigurationsPoll();
  }

  getValue = (field: string, editing?: DeepPartial<IUnit> | null, unit?: DeepPartial<IUnit> | null) => {
    const { units } = this.props;
    const temp = unit ? unit : units?.find((v) => v.id === editing?.id);
    return get(editing, field, get(temp, field));
  };

  handleChange = (field: string, editing?: DeepPartial<IUnit> | null) => {
    return (value: any) => {
      const doDefault = (value: any) => {
        if (editing) {
          if (isObject(this.getValue(field, editing))) {
            set(editing, field, merge(cloneDeep(get(editing, field)), value));
          } else {
            set(editing, field, value);
          }
          this.setState({ editing });
        }
      };
      switch (field) {
        case "configurationId":
          this.props.updateUnit({ id: editing?.id, configurationId: value as number });
          break;
        default:
          doDefault(value);
      }
    };
  };

  handleCreate = (unit: DeepPartial<IUnit>) => {
    const configuration = createConfigurationDefault();
    configuration.unitId = unit.id;
    this.props.createConfiguration(configuration);
    this.setState({
      editing: null,
      expanded: null,
    });
  };

  handleEdit = (unit: IUnit) => {
    const { filtered } = this.props;
    const { editing } = this.state;
    const current = editing && filtered?.find((v) => v.id === editing.id);
    if (current && this.isSave(current)) {
      this.setState({ confirm: () => this.setState({ editing: { id: unit.id } }) });
    } else {
      this.setState({ editing: { id: unit.id } });
    }
  };

  handleCancel = () => {
    const { filtered } = this.props;
    const { editing } = this.state;
    const current = editing && filtered?.find((v) => v.id === editing.id);
    if (current && this.isSave(current)) {
      this.setState({ confirm: () => this.setState({ editing: null, expanded: null }) });
    } else {
      this.setState({ editing: null, expanded: null });
    }
  };

  handleConfirm = () => {
    const { confirm } = this.state;
    this.setState({ confirm: null }, confirm ?? undefined);
  };

  handleSave = () => {
    const { editing } = this.state;
    if (editing) {
      this.props.updateUnit(editing);
    }
  };

  handleDelete = (configuration: DeepPartial<IConfiguration>) => {
    const { id } = configuration;
    if (id !== undefined) {
      this.props.deleteConfiguration(id);
    }
  };

  handlePush = (unit: DeepPartial<IUnit>) => {
    const { id } = unit;
    if (id !== undefined) {
      this.props.updateUnit({ id, stage: StageType.UpdateType.label });
    }
  };

  isSave = (unit: IUnit) => {
    const { editing } = this.state;
    const temp = merge({}, unit, editing);
    const valid = isSetpointValid(temp.configuration?.setpoint);
    return valid && !isEqual(unit, temp);
  };

  isPush = (unit: IUnit) => {
    switch (unit.stage) {
      case StageType.UpdateType.label:
      case StageType.DeleteType.label:
      case StageType.ProcessType.label:
        return false;
      case StageType.CreateType.label:
      case StageType.CompleteType.label:
      case StageType.FailType.label:
      default:
        return !this.isSave(unit);
    }
  };

  renderStatus(unit: IUnit) {
    let icon: IconName = IconNames.ISSUE;
    let intent: Intent = Intent.WARNING;
    let message: string = "Push Unit Configuration";
    switch (unit.stage) {
      case StageType.UpdateType.label:
        icon = IconNames.REFRESH;
        intent = Intent.PRIMARY;
        break;
      case StageType.ProcessType.label:
        icon = IconNames.REFRESH;
        intent = Intent.SUCCESS;
        break;
      case StageType.CreateType.label:
        icon = IconNames.ISSUE;
        intent = Intent.WARNING;
        break;
      case StageType.DeleteType.label:
        icon = IconNames.DELETE;
        intent = Intent.DANGER;
        break;
      case StageType.CompleteType.label:
        icon = IconNames.CONFIRM;
        intent = Intent.SUCCESS;
        break;
      case StageType.FailType.label:
        icon = IconNames.ERROR;
        intent = Intent.DANGER;
        break;
      default:
    }
    return (
      <Tooltip2 content={message} placement={Position.TOP} disabled={!this.isPush(unit)}>
        <Button
          icon={icon}
          intent={intent}
          minimal
          onClick={() => this.handlePush(unit)}
          disabled={!this.isPush(unit)}
        />
      </Tooltip2>
    );
  }

  renderConfirm() {
    const { confirm } = this.state;
    if (confirm === null) {
      return null;
    }
    return (
      <Alert
        intent={Intent.DANGER}
        isOpen={true}
        confirmButtonText="Yes"
        cancelButtonText="Cancel"
        onConfirm={() => this.handleConfirm()}
        onClose={() => this.setState({ confirm: null })}
      >
        <p>There are changes which have not been saved. Do you still want to continue?</p>
      </Alert>
    );
  }

  renderPrompt() {
    const { filtered } = this.props;
    const { editing } = this.state;
    const current = editing && filtered?.find((v) => v.id === editing.id);
    const prompt = !isNil(current) && this.isSave(current);
    return (
      <Prompt when={prompt} message="There are changes which have not been saved. Do you still want to continue?" />
    );
  }

  render() {
    const { filtered, configurations } = this.props;
    const { editing, expanded } = this.state;
    return (
      <div className={"units"}>
        {this.renderPrompt()}
        <Header {...this.props} />
        <h1>Units</h1>
        <div className="list">
          {filtered?.map((unit, i) => {
            return unit.id === editing?.id ? (
              <Card key={unit.id ?? i} interactive>
                <div className="row">
                  <div>
                    <Label>
                      <h3>{unit.label}</h3>
                    </Label>
                  </div>
                  <div>
                    {this.renderStatus(unit)}
                    <Tooltip2 content="Save" placement={Position.TOP} disabled={!this.isSave(unit)}>
                      <Button
                        icon={IconNames.FLOPPY_DISK}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleSave()}
                        disabled={!this.isSave(unit)}
                      />
                    </Tooltip2>
                    <Tooltip2 content="Exit" placement={Position.TOP}>
                      <Button
                        icon={IconNames.CROSS}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleCancel()}
                      />
                    </Tooltip2>
                  </div>
                </div>
                <div className="row">
                  <div>
                    <Label>
                      <b>Campus</b>
                      <InputGroup type="text" value={unit.campus} readOnly />
                    </Label>
                  </div>
                  <div>
                    <Label>
                      <b>Building</b>
                      <InputGroup type="text" value={unit.building} readOnly />
                    </Label>
                  </div>
                  <div>
                    <Label>
                      <b>System</b>
                      <InputGroup type="text" value={unit.system} readOnly />
                    </Label>
                  </div>
                  <div>
                    <Label>
                      <b>Timezone</b>
                      <InputGroup type="text" value={unit.timezone} readOnly />
                    </Label>
                  </div>
                  <div />
                </div>
                <Collapse isOpen={true}>
                  <Tree
                    contents={[
                      {
                        id: "configuration",
                        label: "Configuration",
                        icon: IconNames.SERIES_CONFIGURATION,
                        hasCaret: true,
                        isExpanded: expanded === "configuration",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "configuration"}>
                    <Configuration
                      unit={unit}
                      editing={editing}
                      configurations={configurations}
                      handleChange={this.handleChange}
                      handleCreate={this.handleCreate}
                    />
                  </Collapse>
                  <Tree
                    contents={[
                      {
                        id: "setpoints",
                        label: "Setpoints",
                        icon: IconNames.TEMPERATURE,
                        hasCaret: true,
                        isExpanded: expanded === "setpoints",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "setpoints"}>
                    <Setpoints unit={unit} editing={editing} handleChange={this.handleChange} />
                  </Collapse>
                  <Tree
                    contents={[
                      {
                        id: "schedules",
                        label: "Occupancy Schedules",
                        icon: IconNames.TIME,
                        hasCaret: true,
                        isExpanded: expanded === "schedules",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "schedules"}>
                    <Schedules unit={unit} editing={editing} handleChange={this.handleChange} />
                  </Collapse>
                  <Tree
                    contents={[
                      {
                        id: "holidays",
                        label: "Holidays",
                        icon: IconNames.TIMELINE_EVENTS,
                        hasCaret: true,
                        isExpanded: expanded === "holidays",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "holidays"}>
                    <Holidays unit={unit} editing={editing} handleChange={this.handleChange} />
                  </Collapse>
                  <Tree
                    contents={[
                      {
                        id: "occupancies",
                        label: "Temporary Occupancy",
                        icon: IconNames.HOME,
                        hasCaret: true,
                        isExpanded: expanded === "occupancies",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "occupancies"}>
                    <Occupancies unit={unit} editing={editing} handleChange={this.handleChange} />
                  </Collapse>
                  {/* <Tree
                    contents={[
                      {
                        id: "lockouts",
                        label: "Lockouts",
                        icon: IconNames.LOCK,
                        hasCaret: true,
                        isExpanded: expanded === "lockouts",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "lockouts"}>
                    <span>Lockouts Coming Soon</span>
                  </Collapse> */}
                  <Tree
                    contents={[
                      {
                        id: "rtu",
                        label: "RTU Configuration",
                        icon: IconNames.COG,
                        hasCaret: true,
                        isExpanded: expanded === "rtu",
                      },
                    ]}
                    onNodeExpand={(e) => this.setState({ expanded: e.id as string })}
                    onNodeCollapse={() => this.setState({ expanded: null })}
                    onNodeClick={(e) => this.setState({ expanded: e.id === expanded ? null : (e.id as string) })}
                  />
                  <Collapse isOpen={expanded === "rtu"}>
                    <Unit
                      unit={unit}
                      editing={editing}
                      handleChange={this.handleChange}
                      hidden={[
                        "peakLoadExclude",
                        "zoneLocation",
                        "zoneMass",
                        "zoneOrientation",
                        "zoneBuilding",
                        "coolingCapacity",
                        "compressors",
                        "heatPumpBackup",
                        "coolingPeakOffset",
                        "heatingPeakOffset",
                      ]}
                    />
                  </Collapse>
                </Collapse>
              </Card>
            ) : (
              <Card key={unit.id ?? i} interactive>
                <div className="row">
                  <div>
                    <Label>
                      <h3>{unit.label}</h3>
                    </Label>
                  </div>
                  <div>
                    {this.renderStatus(unit)}
                    <Tooltip2 content="Edit" placement={Position.TOP}>
                      <Button
                        icon={IconNames.EDIT}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleEdit(unit)}
                      />
                    </Tooltip2>
                  </div>
                </div>
              </Card>
            );
          })}
          {this.renderConfirm()}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => ({
  units: selectReadUnits(state),
  filtered: selectFilterUnits(state),
  configurations: selectReadConfigurations(state),
});

const mapActionToProps = {
  readUnits,
  readUnitsPoll,
  filterUnits,
  updateUnit,
  readConfigurations,
  readConfigurationsPoll,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
};

export default connect(mapStateToProps, mapActionToProps)(Units);
