import "./style.scss";

import { Button, Card, Classes, Intent } from "@blueprintjs/core";
import {
  IConfiguration,
  IFilter,
  createConfiguration,
  deleteConfiguration,
  filterConfigurations,
  readConfigurations,
  selectFilterConfigurations,
  selectReadConfigurations,
  updateConfiguration,
} from "controllers/configurations/action";
import { createConfigurationDefault, createConfigurationLabel, isConfigurationDelete } from "utils/configuration";

import { DeepPartial } from "../../utils/types";
import { Header } from "components";
import { IconNames } from "@blueprintjs/icons";
import React from "react";
import { RootProps } from "routes";
import { connect } from "react-redux";
import { merge } from "lodash";

interface ConfigurationProps extends RootProps {
  readConfigurations: () => void;
  filterConfigurations: (payload: IFilter) => void;
  createConfiguration: (payload: DeepPartial<IConfiguration>) => void;
  updateConfiguration: (payload: DeepPartial<IConfiguration>) => void;
  deleteConfiguration: (payload: number) => void;
  configurations?: IConfiguration[];
  filtered?: IConfiguration[];
}

class Configuration extends React.Component<ConfigurationProps, any> {
  constructor(props: ConfigurationProps) {
    super(props);
    this.state = {
      label: createConfigurationLabel({}),
      editing: null,
    };
  }

  componentDidMount() {
    this.props.readConfigurations();
  }

  handleChange = (field: "label" | "value", configuration?: DeepPartial<IConfiguration>) => {
    return (value: string) => {
      const { editing } = this.state;
      switch (field) {
        case "label":
          return this.setState(
            configuration === undefined ? { label: value } : { editing: merge(editing, { label: value }) }
          );
        case "value":
      }
    };
  };

  handleCreate = () => {
    const { label } = this.state;
    const configuration = createConfigurationDefault(label);
    this.props.createConfiguration(configuration);
    this.setState({
      label: createConfigurationLabel({}),
      editing: null,
    });
  };

  handleEdit = (configuration: DeepPartial<IConfiguration>) => {
    const { id, label } = configuration;
    this.setState({ editing: { id, label } });
  };

  handleCancel = () => {
    this.setState({ editing: null });
  };

  handleSave = () => {
    const { id, label } = this.state?.editing;
    this.props.updateConfiguration({ id, label });
    this.setState({ editing: null });
  };

  handleDelete = (configuration: DeepPartial<IConfiguration>) => {
    const { id } = configuration;
    if (id !== undefined) {
      this.props.deleteConfiguration(id);
    }
  };

  render() {
    const { filtered } = this.props;
    const { label, editing } = this.state;
    return (
      <div className={"configuration"}>
        <Header {...this.props} />
        <h2>Create Configuration</h2>
        <div className="create">
          <Card interactive>
            <div>
              <input
                className={Classes.INPUT}
                type="text"
                value={label}
                onChange={(e) => this.handleChange("label")(e.target.value)}
              />
            </div>
            <div>
              <Button icon={IconNames.ADD_TO_ARTIFACT} intent={Intent.PRIMARY} minimal onClick={this.handleCreate} />
            </div>
          </Card>
        </div>
        <h1>Configurations</h1>
        <div className="list">
          {filtered?.map((configuration, i) => {
            return configuration.id === editing?.id ? (
              <Card key={configuration.id || i} interactive>
                <div>
                  <input
                    className={Classes.INPUT}
                    type="text"
                    value={editing.label}
                    onChange={(e) => this.handleChange("label", configuration)(e.target.value)}
                  />
                </div>
                <div>
                  <Button
                    icon={IconNames.FLOPPY_DISK}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => this.handleSave()}
                  />
                  <Button icon={IconNames.CROSS} intent={Intent.PRIMARY} minimal onClick={() => this.handleCancel()} />
                </div>
              </Card>
            ) : (
              <Card key={configuration.id || i} interactive>
                <div>{configuration.label}</div>
                <div>
                  <Button
                    icon={IconNames.EDIT}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => this.handleEdit(configuration)}
                  />
                  <Button
                    icon={IconNames.TRASH}
                    intent={Intent.WARNING}
                    minimal
                    onClick={() => this.handleDelete(configuration)}
                    disabled={!isConfigurationDelete(configuration)}
                  />
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
  configurations: selectReadConfigurations(state),
  filtered: selectFilterConfigurations(state),
});

const mapActionToProps = {
  readConfigurations,
  filterConfigurations,
  createConfiguration,
  updateConfiguration,
  deleteConfiguration,
};

export default connect(mapStateToProps, mapActionToProps)(Configuration);
