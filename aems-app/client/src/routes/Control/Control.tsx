import "./style.scss";

import {
  Alert,
  Button,
  Card,
  Collapse,
  InputGroup,
  Intent,
  Label,
  Menu,
  MenuItem,
  Position,
  Tree,
} from "@blueprintjs/core";
import { Header, Prompt } from "components";
import {
  IControl,
  IFilter,
  filterControls,
  readControls,
  readControlsPoll,
  selectFilterControls,
  selectReadControls,
  updateControl,
} from "controllers/controls/action";
import { IconName, IconNames } from "@blueprintjs/icons";
import { cloneDeep, get, has, isEqual, isNil, isObject, merge, set } from "lodash";

import { DeepPartial } from "../../utils/types";
import { IUnit } from "controllers/units/action";
import React from "react";
import { RootProps } from "routes";
import { StageType } from "common";
import { Popover2, Tooltip2 } from "@blueprintjs/popover2";
import { Unit } from "../Units/Unit";
import { connect } from "react-redux";
import { defaultPollInterval } from "controllers/poll/action";

interface ControlsProps extends RootProps {
  readControls: () => void;
  readControlsPoll: (payload?: number) => void;
  filterControls: (payload: IFilter) => void;
  updateControl: (payload: DeepPartial<IControl>) => void;
  controls?: IControl[];
  filtered?: IControl[];
}

interface ControlsState {
  editing: DeepPartial<IControl> | null;
  expanded: string | null;
  confirm: (() => void) | null;
}

class Control extends React.Component<ControlsProps, ControlsState> {
  constructor(props: ControlsProps) {
    super(props);
    this.state = {
      editing: null,
      expanded: null,
      confirm: null,
    };
  }

  componentDidMount() {
    this.props.readControls();
    this.props.readControlsPoll(defaultPollInterval);
  }

  componentWillUnmount() {
    this.props.readControlsPoll();
  }

  getValue = (field: string, editing?: DeepPartial<IControl> | null, control?: DeepPartial<IControl> | null) => {
    const { controls } = this.props;
    const temp = control ?? controls?.find((v) => v.id === editing?.id);
    return get(editing, field, get(temp, field));
  };

  handleChange = (field: string, editing?: DeepPartial<IControl> | null) => {
    return (value: any) => {
      if (editing) {
        if (isObject(this.getValue(field, editing))) {
          set(editing, field, merge(cloneDeep(get(editing, field)), value));
        } else {
          set(editing, field, value);
        }
        this.setState({ editing });
      }
    };
  };

  handleEdit = (control: IControl) => {
    const { filtered } = this.props;
    const { editing } = this.state;
    const current = editing && filtered?.find((v) => v.id === editing.id);
    if (current && this.isSave(current)) {
      this.setState({
        confirm: () =>
          this.setState({ editing: { id: control.id, units: current.units.map((v) => ({ id: v.id as number })) } }),
      });
    } else {
      this.setState({ editing: { id: control.id, units: control.units.map((v) => ({ id: v.id as number })) } });
    }
  };

  handleCancel = () => {
    const { filtered } = this.props;
    const { editing } = this.state;
    const current = editing && filtered?.find((v) => v.id === editing.id);
    if (current && this.isSave(current)) {
      this.setState({ confirm: () => this.setState({ editing: null }) });
    } else {
      this.setState({ editing: null });
    }
  };

  handleConfirm = () => {
    const { confirm } = this.state;
    this.setState({ confirm: null }, confirm ?? undefined);
  };

  handleSave = () => {
    const { editing } = this.state;
    if (editing) {
      this.props.updateControl(editing);
    }
  };

  handlePush = (control: DeepPartial<IControl>) => {
    const { id } = control;
    if (id !== undefined) {
      this.props.updateControl({ id, stage: StageType.UpdateType.label });
    }
  };

  isSave = (control: IControl) => {
    const { editing } = this.state;
    const temp = merge({}, control, editing);
    return !isEqual(control, temp);
  };

  isPush = (control: IControl) => {
    switch (control.stage) {
      case StageType.UpdateType.label:
      case StageType.DeleteType.label:
      case StageType.ProcessType.label:
        return false;
      case StageType.CreateType.label:
      case StageType.CompleteType.label:
      case StageType.FailType.label:
      default:
        return !this.isSave(control);
    }
  };

  renderStatus(item: IControl | IUnit) {
    let icon: IconName = IconNames.ISSUE;
    let intent: Intent = Intent.WARNING;
    let message: string = "Push ILC Configuration";
    switch (item.stage) {
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
    const notParticipating = get(item, "peakLoadExclude", false);
    if (notParticipating) {
      icon = IconNames.DISABLE;
      intent = Intent.NONE;
    }
    if (has(item, "units")) {
      const control = item as IControl;
      return (
        <Tooltip2 content={message} placement={Position.TOP}>
          <Button
            icon={icon}
            intent={intent}
            minimal
            onClick={() => this.handlePush(control)}
            disabled={!this.isPush(control)}
          />
        </Tooltip2>
      );
    } else {
      return <Button icon={icon} intent={intent} minimal />;
    }
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
    const { filtered } = this.props;
    const { editing, expanded } = this.state;
    return (
      <div className={"controls"}>
        {this.renderPrompt()}
        <Header {...this.props} />
        <h1>Intelligent Load Control</h1>
        <div className="list">
          {filtered?.map((control, i) => {
            return control.id === editing?.id ? (
              <Card key={`control-${control.id ?? i}-editing`} interactive>
                <div className="row">
                  <div>
                    <Label>
                      <h3>{control.label}</h3>
                    </Label>
                  </div>
                  <div>
                    {this.renderStatus(control)}
                    <Tooltip2 content="Save" placement={Position.TOP} disabled={!this.isSave(control)}>
                      <Button
                        icon={IconNames.FLOPPY_DISK}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleSave()}
                        disabled={!this.isSave(control)}
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
                      <InputGroup type="text" value={control.campus} readOnly />
                    </Label>
                  </div>
                  <div>
                    <Label>
                      <b>Building</b>
                      <InputGroup type="text" value={control.building} readOnly />
                    </Label>
                  </div>
                  <div />
                </div>
                <div className="row">
                  <div className="label">
                    <Label>
                      <b>ILC Label</b>
                      <InputGroup
                        type="text"
                        value={this.getValue("label", editing, control)}
                        onChange={(e) => this.handleChange("label", editing)(e.target.value)}
                      />
                    </Label>
                  </div>
                  <div />
                </div>
                <div className="row">
                  <div className="select">
                    <Label>
                      <b>Participate in Grid Services</b>
                      <Popover2
                        content={
                          <Menu>
                            {[
                              { name: false, label: "Yes" },
                              { name: true, label: "No" },
                            ]?.map((value) => (
                              <MenuItem
                                key={value.label}
                                text={value.label}
                                onClick={() => this.handleChange("peakLoadExclude", editing)(value.name)}
                              />
                            ))}
                          </Menu>
                        }
                        placement="bottom-start"
                      >
                        <Button rightIcon={IconNames.CARET_DOWN} minimal>
                          {this.getValue("peakLoadExclude", editing, control) ? "No" : "Yes"}
                        </Button>
                      </Popover2>
                    </Label>
                  </div>
                  <div />
                  <div />
                </div>
                <Label>
                  <h3>Units</h3>
                </Label>
                {control.units.map((unit, i) => (
                  <>
                    <Tree
                      key={`tree-${unit.id}`}
                      contents={[
                        {
                          id: `unit-${unit.id}`,
                          label: unit.label,
                          hasCaret: true,
                          isExpanded: expanded === `${control.id}-${unit.id}`,
                        },
                      ]}
                      onNodeExpand={(e) => this.setState({ expanded: `${control.id}-${unit.id}` })}
                      onNodeCollapse={() => this.setState({ expanded: null })}
                      onNodeClick={(e) =>
                        this.setState({
                          expanded: `${control.id}-${unit.id}` === expanded ? null : `${control.id}-${unit.id}`,
                        })
                      }
                    />
                    <Collapse key={`collapse-${unit.id}`} isOpen={expanded === `${control.id}-${unit.id}`}>
                      <Unit
                        unit={unit}
                        editing={editing?.units?.find((v) => v?.id === unit.id) ?? null}
                        handleChange={(f) => this.handleChange(`units[${i}].${f}`, editing)}
                        hidden={[
                          ...(this.getValue(`peakLoadExclude`, editing, control) ? ["peakLoadExclude"] : []),
                          ...(this.getValue(`peakLoadExclude`, editing, control) ||
                          this.getValue(`units[${i}].peakLoadExclude`, editing, control)
                            ? [
                                "zoneLocation",
                                "zoneMass",
                                "zoneOrientation",
                                "zoneBuilding",
                                "coolingCapacity",
                                "compressors",
                                "heatPump",
                                "heatPumpBackup",
                                "coolingPeakOffset",
                                "heatingPeakOffset",
                              ]
                            : []),
                          ...[
                            "optimalStartLockout",
                            "optimalStartDeviation",
                            "earliestStart",
                            "latestStart",
                            "economizer",
                            "economizerSetpoint",
                            "heatPumpLockout",
                            "coolingLockout",
                          ],
                        ]}
                      />
                    </Collapse>
                  </>
                ))}
              </Card>
            ) : (
              <Card key={`control-${control.id ?? i}`} interactive>
                <div className="row">
                  <div>
                    <Label>
                      <h3>{control.label}</h3>
                    </Label>
                  </div>
                  <div>
                    {this.renderStatus(control)}
                    <Tooltip2 content="Edit" placement={Position.TOP}>
                      <Button
                        icon={IconNames.EDIT}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleEdit(control)}
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
  controls: selectReadControls(state),
  filtered: selectFilterControls(state),
});

const mapActionToProps = {
  readControls,
  readControlsPoll,
  filterControls,
  updateControl,
};

export default connect(mapStateToProps, mapActionToProps)(Control);
