import "./style.scss";

import { Button, Checkbox, Dialog, H2 } from "@blueprintjs/core";
import {
  DIALOG_BODY,
  DIALOG_FOOTER,
  DIALOG_FOOTER_ACTIONS,
  DIALOG_HEADER,
} from "@blueprintjs/core/lib/esm/common/classes";
import { SingleInputType, validate } from "utils/form";
import { debounce, isEmpty, isEqual } from "lodash";
import { loginUser, selectLoginUser, selectLoginUserError, selectLoginUserRequest } from "controllers/user/action";
import { useDispatch, useSelector } from "react-redux";
import { useEffect, useState } from "react";

import { Analytics } from "utils/analytics";
import FormInput from "components/Form/Input";
import { useNavigate } from "react-router-dom";

interface LoginProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Login(props: LoginProps) {
  const { isOpen, onClose } = props;

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const success = useSelector(selectLoginUser);
  const error = useSelector(selectLoginUserError);
  const request = useSelector(selectLoginUserRequest);

  const [showPW, setShowPW] = useState(false);
  const [formInfo, setFormInfo] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({ email: "", password: "" });

  useEffect(() => {
    if (!isEmpty(success)) {
      setFormInfo({ email: "", password: "" });
      setErrors({ email: "", password: "" });
      onClose?.();
    }
  }, [success, setFormInfo, setErrors, onClose]);

  const shouldClose = () => {
    setFormInfo({ email: "", password: "" });
    setErrors({ email: "", password: "" });
    onClose?.();
  };

  useEffect(() => {
    if (isOpen) {
      Analytics.getInstance().event("Login", "Opened");
    }
    return () => {};
  }, [isOpen]);

  const handleChange = (event: any) => {
    event.preventDefault();
    const { name, value } = event.target;
    setFormInfo((state) => ({ ...state, [name]: value }));
    debounceField({ name, value });
  };

  const handleShowPW = () => setShowPW((state) => !state);

  const debounceField = debounce(({ name, value }) => {
    let validName = "text";
    const { isValid, getMessage } = validate(validName);
    if (!isValid(value, [])) {
      setErrors((state) => ({ ...state, [name]: getMessage(value, []) }));
    } else {
      setErrors((state) => ({ ...state, [name]: "" }));
    }
  }, Number(process.env.REACT_APP_DEBOUNCE));

  const handleSubmit = (event: any) => {
    event.preventDefault();
    const payload = formInfo;
    const emptyKeys = Object.keys(payload).filter((key) => !payload[key as keyof typeof payload]);
    emptyKeys.forEach((key) => {
      setErrors((state) => ({ ...state, [key as keyof typeof errors]: `Please provide required input` }));
    });
    if (Object.keys(errors).every((key) => !errors[key as keyof typeof errors])) {
      dispatch(loginUser({ ...payload, name: payload.email }));
    }
  };

  const handleRedirect = () => navigate("/");

  const LoginForm: SingleInputType[] = [
    {
      name: "email",
      type: "text",
      autoComplete: "username",
      label: "Email/Name",
      labelInfo: "*",
      value: formInfo.email,
      placeholder: "email or name",
    },
    {
      name: "password",
      type: showPW ? "text" : "password",
      autoComplete: "password",
      label: "Password",
      labelInfo: "*",
      value: formInfo.password,
    },
  ];

  return (
    <Dialog className="login" isOpen={isOpen}>
      <div className={DIALOG_HEADER}>
        <H2>Log In</H2>
        <Button minimal intent="primary" icon="cross" onClick={onClose ? shouldClose : handleRedirect} />
      </div>
      <form onSubmit={handleSubmit}>
        <div className={DIALOG_BODY}>
          {error && (isEmpty(formInfo.password) || isEqual(formInfo, request)) ? (
            <p className="red">{error.error}</p>
          ) : (
            ""
          )}
          {LoginForm.map((input) => {
            input.handleChange = handleChange;
            input.error = errors[input.name as keyof typeof errors];
            return <FormInput {...input} key={input.name} />;
          })}
        </div>
        <div className={DIALOG_FOOTER}>
          <Checkbox checked={showPW} onChange={handleShowPW}>
            {"Show Password"}
          </Checkbox>
          <div className={DIALOG_FOOTER_ACTIONS}>
            <Button
              className="button-right"
              minimal
              intent="primary"
              key="cancel"
              text="Cancel"
              onClick={onClose ? shouldClose : handleRedirect}
            />
            <Button className="button-submit" intent="primary" type="submit" text="Log In" />
          </div>
        </div>
      </form>
    </Dialog>
  );
}
