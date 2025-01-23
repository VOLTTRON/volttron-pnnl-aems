import "./style.scss";

import { Button, Card, Classes, Intent, Menu, MenuItem } from "@blueprintjs/core";
import {
  IFilter,
  ILog,
  createLog,
  deleteLog,
  filterLogs,
  readLogs,
  readLogsPoll,
  selectFilterLogs,
  selectReadLogs,
  updateLog,
} from "controllers/logs/action";
import { isFinite, merge } from "lodash";

import { DeepPartial } from "../../utils/types";
import { Header } from "components";
import { IconNames } from "@blueprintjs/icons";
import { LogType } from "common";
import { Popover2 } from "@blueprintjs/popover2";
import React from "react";
import { RootProps } from "routes";
import { connect } from "react-redux";
import { fastPollInterval } from "controllers/poll/action";
import moment from "moment";

interface LogProps extends RootProps {
  readLogs: (query?: { type: string }) => void;
  readLogsPoll: (payload?: number) => void;
  filterLogs: (payload: IFilter) => void;
  createLog: (payload: DeepPartial<ILog>) => void;
  updateLog: (payload: DeepPartial<ILog>) => void;
  deleteLog: (payload: number) => void;
  logs?: ILog[];
  filtered?: ILog[];
}

class Log extends React.Component<LogProps, any> {
  constructor(props: LogProps) {
    super(props);
    this.state = { type: LogType.BannerType.label, duration: undefined, message: "" };
  }

  componentDidMount() {
    this.props.readLogs({ type: "All" });
    this.props.readLogsPoll(fastPollInterval);
  }

  componentWillUnmount() {
    this.props.readLogs({ type: LogType.BannerType.label });
    this.props.readLogsPoll(fastPollInterval);
  }

  handleChange = (field: "label" | "type" | "message", log?: DeepPartial<ILog>) => {
    return (value: any) => {
      const { editing } = this.state;
      switch (field) {
        case "label":
          return this.setState(log === undefined ? { label: value } : { editing: merge(editing, { label: value }) });
        case "type":
        case "message":
        default:
          return this.setState(
            log === undefined ? { [field]: value } : { editing: merge(editing, { [field]: value }) }
          );
      }
    };
  };

  handleCreate = () => {
    const { type, duration, message } = this.state;
    this.props.createLog({ type, duration, message });
    this.setState({ type: LogType.BannerType.label, duration: undefined, message: "" });
  };

  handleEdit = (log: DeepPartial<ILog>) => {
    const { id, type, message } = log;
    this.setState({ editing: { id, type, message } });
  };

  handleCancel = () => {
    this.setState({ editing: null });
  };

  handleSave = () => {
    const { id, type, message } = this.state?.editing || {};
    this.props.updateLog({ id, type, message });
    this.setState({ editing: null });
  };

  handleDelete = (log: DeepPartial<ILog>) => {
    const { id } = log;
    if (id !== undefined) {
      this.props.deleteLog(id);
    }
  };

  render() {
    const { filtered } = this.props;
    const { message, editing } = this.state;
    return (
      <div className={"log"}>
        <Header {...this.props} />
        <h2>Display Banner</h2>
        <div className="create">
          <Card interactive>
            <div></div>
            <div>
              <b>Message</b>
            </div>
            <div>
              <input
                className={Classes.INPUT}
                type="text"
                value={message}
                onChange={(e) => this.handleChange("message")(e.target.value)}
              />
            </div>
            <div>
              <Button icon={IconNames.ADD_TO_ARTIFACT} intent={Intent.PRIMARY} minimal onClick={this.handleCreate} />
            </div>
          </Card>
        </div>
        <h1>Logs</h1>
        <div className="list">
          {filtered
            ?.filter((l) => l.type !== LogType.BannerType.label)
            .map((log, i) => {
              return isFinite(log.id) && log.id === editing?.id ? (
                <Card key={log.id || log.sequence || i} interactive>
                  <div></div>
                  <div>
                    <Popover2
                      content={
                        <Menu>
                          {LogType.values
                            .filter((t) => t.label !== LogType.BannerType.label)
                            .map((t) => (
                              <MenuItem
                                key={t.name}
                                text={t.label}
                                onClick={() => this.handleChange("type", log)(t.label)}
                              />
                            ))}
                        </Menu>
                      }
                      placement="bottom-end"
                    >
                      <Button rightIcon={IconNames.CARET_DOWN} minimal>
                        {log.type}
                      </Button>
                    </Popover2>
                  </div>
                  <div>
                    <input
                      className={Classes.INPUT}
                      type="text"
                      value={editing.message}
                      onChange={(e) => this.handleChange("message", log)(e.target.value)}
                    />
                  </div>
                  <div>
                    <Button
                      icon={IconNames.FLOPPY_DISK}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={() => this.handleSave()}
                    />
                    <Button
                      icon={IconNames.CROSS}
                      intent={Intent.PRIMARY}
                      minimal
                      onClick={() => this.handleCancel()}
                    />
                  </div>
                </Card>
              ) : (
                <Card key={log.id || log.sequence || i} interactive>
                  <div>[{moment(log.updatedAt).format("y-m-d H:m:s")}]</div>
                  <div>
                    <b>{log.type}</b>
                  </div>
                  <div>{`${log.message}${(log?.count || 0) > 1 ? ` (${log.count})` : ""}`}</div>
                  <div>
                    {isFinite(log.id) && (
                      <Button
                        icon={IconNames.EDIT}
                        intent={Intent.PRIMARY}
                        minimal
                        onClick={() => this.handleEdit(log)}
                      />
                    )}
                    {isFinite(log.id) && (
                      <Button
                        icon={IconNames.TRASH}
                        intent={Intent.WARNING}
                        minimal
                        onClick={() => this.handleDelete(log)}
                        disabled={log.type === LogType.BannerType.label}
                      />
                    )}
                  </div>
                </Card>
              );
            })}
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state: any) => ({
  logs: selectReadLogs(state),
  filtered: selectFilterLogs(state),
});

const mapActionToProps = { readLogs, readLogsPoll, filterLogs, createLog, updateLog, deleteLog };

export default connect(mapStateToProps, mapActionToProps)(Log);
