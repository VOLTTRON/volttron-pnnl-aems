import "./style.scss";

import { Button, Card, Checkbox, Icon, InputGroup, Intent, Label } from "@blueprintjs/core";

import { DeepPartial } from "../../utils/types";
import { Header } from "components";
import { IconNames } from "@blueprintjs/icons";
import React from "react";
import { RootProps } from "routes";
import { connect } from "react-redux";
import { flatten, get, isEqual, merge, omit, uniq, xor } from "lodash";
import {
  IUser,
  createUser,
  readUsers,
  selectUsers,
  filterUsers,
  selectFilterUsers,
  IFilter,
  updateUser,
  deleteUser,
} from "controllers/users/action";
import { updateUser as updateCurrent } from "controllers/user/action";
import { RoleType } from "common";
import { selectUser } from "controllers/user/action";
import { zxcvbn, zxcvbnOptions } from "@zxcvbn-ts/core";
import * as zxcvbnCommonPackage from "@zxcvbn-ts/language-common";
import * as zxcvbnEnPackage from "@zxcvbn-ts/language-en";
import { Tooltip2 } from "@blueprintjs/popover2";

const options = {
  dictionary: {
    ...zxcvbnCommonPackage.dictionary,
    ...zxcvbnEnPackage.dictionary,
  },
  graphs: zxcvbnCommonPackage.adjacencyGraphs,
  translations: zxcvbnEnPackage.translations,
};
zxcvbnOptions.setOptions(options);

interface AccountProps extends RootProps {
  readUsers: () => void;
  filterUsers: (payload: IFilter) => void;
  createUser: (payload: DeepPartial<IUser>) => void;
  updateUser: (payload: DeepPartial<IUser>) => void;
  deleteUser: (payload: string) => void;
  updateCurrent: (payload: DeepPartial<IUser>) => void;
  user?: IUser;
  accounts?: IUser[];
  filtered?: IUser[];
}

interface AccountState {
  name: string;
  email: string;
  role: string;
  password: string;
  verify: string;
  editing: (DeepPartial<IUser> & { password: string; verify: string }) | null;
  show: "create-pw" | "create-pwv" | "edit-pw" | "edit-pwv" | null;
}

class Account extends React.Component<AccountProps, AccountState> {
  constructor(props: AccountProps) {
    super(props);
    this.state = {
      name: "",
      email: "",
      role: "",
      password: "",
      verify: "",
      editing: null,
      show: null,
    };
  }

  componentDidMount() {
    const { user } = this.props;
    if (this.isAdmin()) {
      this.props.readUsers();
    } else {
      this.setState({ editing: user ? { id: user.id, password: "", verify: "" } : null });
    }
  }

  handleChange = (field: keyof AccountState, account?: DeepPartial<IUser>) => {
    return (value: string) => {
      const { editing } = this.state;
      switch (field) {
        // @ts-expect-error
        case "role":
          const role = account === undefined ? this.state.role : get(editing, "role", account?.role ?? "");
          value = xor(role.split(" "), [value]).join(" ");
        case "name":
        case "email":
        case "password":
        case "verify":
          return this.setState(
            // @ts-expect-error
            account === undefined ? { [field]: value } : { editing: merge(editing, { [field]: value }) }
          );
        default:
          throw new Error(`Unhandled field passed to handleChange function.`);
      }
    };
  };

  handleCreate = () => {
    const { name, email, role, password } = this.state;
    this.props.createUser({ name, email, role, password });
    this.setState({
      name: "",
      email: "",
      role: "",
      password: "",
      verify: "",
      editing: null,
      show: null,
    });
  };

  handleEdit = (account: DeepPartial<IUser>) => {
    const { id } = account;
    this.setState({ editing: { id, password: "", verify: "" } });
  };

  handleCancel = () => {
    this.setState({ editing: null });
  };

  handleSave = () => {
    const { user } = this.props;
    const account = omit(this.state?.editing, ["verify", ...(this.state?.editing?.password ? [] : ["password"])]);
    if (this.isAdmin()) {
      if (account) {
        this.props.updateUser(account);
      }
      this.setState({ editing: null });
    } else {
      if (account) {
        this.props.updateCurrent(account);
      }
      this.setState({ editing: user ? { id: user.id, password: "", verify: "" } : null });
    }
  };

  handleDelete = (account: DeepPartial<IUser>) => {
    const { id } = account;
    if (id !== undefined) {
      this.props.deleteUser(id);
    }
  };

  isCreate() {
    const { name, email, role, password, verify } = this.state;
    if (!(name && email && password)) {
      return false;
    }
    const errors = this.getErrors(name, email, role, password, verify);
    const isErrors = errors.email || errors.name || errors.verify || errors.password?.feedback.warning;
    return !isErrors;
  }

  isSave(account: IUser) {
    const { editing } = this.state;
    const { name, email, role, password, verify } = merge({ verify: "" }, account, this.state.editing);
    const errors = this.getErrors(name, email, role, password, verify);
    const updated = merge({}, account, editing);
    const isErrors = errors.email || errors.name || errors.verify || errors.password?.feedback.warning;
    const isUpdated = !isEqual(merge({ password: "" }, account), omit(updated, ["verify"]));
    return !isErrors && isUpdated;
  }

  isAdmin() {
    const { user } = this.props;
    return RoleType.Admin.granted(...(user?.role.split(" ") ?? [""]));
  }

  parseRole(role: string) {
    const roles = role
      .split(" ")
      .map((v) => RoleType.parse(v)?.name)
      .filter((v): v is string => !!v);
    const grants = uniq(flatten(role.split(" ").map((v) => RoleType.parse(v)?.grants))).filter((v): v is string => !!v);
    return { roles, grants };
  }

  getErrors(name: string, email: string, role: string, password: string | undefined, verify: string) {
    const errorName = name !== "" && name.length < 2 ? "User name must be specified." : null;
    const errorEmail =
      email !== "" && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/i.test(email) ? "Valid email must be specified." : null;
    const errorPw = password === "" ? null : zxcvbn(password ?? "", [name, email]);
    const errorPwv = password === "" || password === verify ? null : "New password and verify password must match.";
    return { name: errorName, email: errorEmail, password: errorPw, verify: errorPwv };
  }

  renderAccount(account?: IUser) {
    const { show } = this.state;
    const { name, email, role, password, verify } = account
      ? merge({ verify: "" }, account, this.state.editing)
      : this.state;
    const { roles, grants } = this.parseRole(role);
    const showPw = account ? "edit-pw" : "create-pw";
    const showPwv = account ? "edit-pwv" : "create-pwv";
    const errors = this.getErrors(name, email, role, password, verify);
    return (
      <>
        <div>
          <Label>
            <b>Name</b>
            <InputGroup
              type="text"
              value={name}
              onChange={(e) => this.handleChange("name", account)(e.target.value)}
              readOnly={!this.isAdmin()}
              intent={errors.name ? Intent.DANGER : undefined}
              rightElement={
                <div className="icons">
                  {errors.name && (
                    <Tooltip2 content={errors.name}>
                      <Icon className="icon" icon={IconNames.INFO_SIGN} intent={Intent.DANGER} />
                    </Tooltip2>
                  )}
                </div>
              }
            />
          </Label>
          <Label>
            <b>Email</b>
            <InputGroup
              type="text"
              value={email}
              onChange={(e) => this.handleChange("email", account)(e.target.value)}
              readOnly={!this.isAdmin()}
              intent={errors.email ? Intent.DANGER : undefined}
              rightElement={
                <div className="icons">
                  {errors.email && (
                    <Tooltip2 content={errors.email}>
                      <Icon className="icon" icon={IconNames.INFO_SIGN} intent={Intent.DANGER} />
                    </Tooltip2>
                  )}
                </div>
              }
            />
          </Label>
        </div>
        <div>
          <Label>
            <b>New Password</b>
            <InputGroup
              type={show === showPw ? "text" : "password"}
              autoComplete="new-password"
              value={password}
              onChange={(e) => this.handleChange("password", account)(e.target.value)}
              intent={
                errors.password && (errors.password.feedback.warning || errors.password.feedback.suggestions.length > 0)
                  ? errors.password.feedback.warning
                    ? Intent.DANGER
                    : Intent.WARNING
                  : undefined
              }
              rightElement={
                <div className="icons">
                  {errors.password &&
                    (errors.password.feedback.warning || errors.password.feedback.suggestions.length > 0) && (
                      <Tooltip2
                        content={errors.password.feedback.warning || errors.password.feedback.suggestions.join(" \n")}
                      >
                        <Icon
                          className="icon"
                          icon={IconNames.INFO_SIGN}
                          intent={errors.password.feedback.warning ? Intent.DANGER : Intent.WARNING}
                        />
                      </Tooltip2>
                    )}
                  <Button
                    minimal
                    icon={show === showPw ? IconNames.EYE_OFF : IconNames.EYE_OPEN}
                    onClick={() => this.setState({ show: show === showPw ? null : showPw })}
                  />
                </div>
              }
            />
          </Label>
          <Label>
            <b>Verify Password</b>
            <InputGroup
              type={show === showPwv ? "text" : "password"}
              value={verify}
              onChange={(e) => this.handleChange("verify", account)(e.target.value)}
              intent={errors.verify ? Intent.DANGER : errors.verify === undefined ? undefined : Intent.NONE}
              rightElement={
                <div className="icons">
                  {errors.verify && (
                    <Tooltip2 content={errors.verify}>
                      <Icon className="icon" icon={IconNames.INFO_SIGN} intent={Intent.DANGER} />
                    </Tooltip2>
                  )}
                  <Button
                    minimal
                    icon={show === showPwv ? IconNames.EYE_OFF : IconNames.EYE_OPEN}
                    onClick={() => this.setState({ show: show === showPwv ? null : showPwv })}
                  />
                </div>
              }
            />
          </Label>
        </div>
        <div>
          <Label>
            <b>Roles</b>
            {RoleType.values.map((v) => (
              <Checkbox
                key={`checkbox-${v.name}`}
                id={v.name}
                label={`${v.label} Role`}
                checked={roles.includes(v.name)}
                indeterminate={!roles.includes(v.name) && grants.includes(v.name)}
                onChange={() => this.handleChange("role", account)(v.name)}
                disabled={!this.isAdmin()}
              />
            ))}
          </Label>
        </div>
      </>
    );
  }

  renderMyAccount() {
    const { user } = this.props;
    if (this.isAdmin() || !user) {
      return null;
    }
    return (
      <>
        <h2>My Account</h2>
        <div className="create">
          <Card interactive>
            {this.renderAccount(user)}
            <div>
              <Button
                icon={IconNames.FLOPPY_DISK}
                intent={Intent.PRIMARY}
                minimal
                onClick={this.handleSave}
                disabled={!this.isSave(user)}
              />
            </div>
          </Card>
        </div>
      </>
    );
  }

  renderCreateAccount() {
    if (!this.isAdmin()) {
      return null;
    }
    return (
      <>
        <h2>Create Account</h2>
        <div className="create">
          <Card interactive>
            {this.renderAccount()}
            <div>
              <Button
                icon={IconNames.ADD_TO_ARTIFACT}
                intent={Intent.PRIMARY}
                minimal
                onClick={this.handleCreate}
                disabled={!this.isCreate()}
              />
            </div>
          </Card>
        </div>
      </>
    );
  }

  renderAccountList() {
    if (!this.isAdmin()) {
      return null;
    }
    const { filtered } = this.props;
    const { editing } = this.state;
    return (
      <>
        <h1>Accounts</h1>
        <div className="list">
          {filtered?.map((account, i) => {
            return account.id === editing?.id ? (
              <Card key={account.id || i} interactive>
                {this.renderAccount(account)}
                <div>
                  <Button
                    icon={IconNames.FLOPPY_DISK}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => this.handleSave()}
                    disabled={!this.isSave(account)}
                  />
                  <Button icon={IconNames.CROSS} intent={Intent.PRIMARY} minimal onClick={() => this.handleCancel()} />
                </div>
              </Card>
            ) : (
              <Card key={account.id || i} interactive>
                <div>{account.name}</div>
                <div>{account.email}</div>
                <div>{account.role}</div>
                <div>
                  <Button
                    icon={IconNames.EDIT}
                    intent={Intent.PRIMARY}
                    minimal
                    onClick={() => this.handleEdit(account)}
                  />
                  <Button
                    icon={IconNames.TRASH}
                    intent={Intent.WARNING}
                    minimal
                    onClick={() => this.handleDelete(account)}
                  />
                </div>
              </Card>
            );
          })}
        </div>
      </>
    );
  }

  render() {
    return (
      <div className={"account"}>
        <Header {...this.props} />
        {this.renderMyAccount()}
        {this.renderCreateAccount()}
        {this.renderAccountList()}
      </div>
    );
  }
}

const mapStateToProps = (state: any) => ({
  user: selectUser(state),
  accounts: selectUsers(state),
  filtered: selectFilterUsers(state),
});

const mapActionToProps = {
  readUsers,
  filterUsers,
  createUser,
  updateUser,
  deleteUser,
  updateCurrent,
};

export default connect(mapStateToProps, mapActionToProps)(Account);
