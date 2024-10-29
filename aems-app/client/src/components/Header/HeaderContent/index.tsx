import { Button } from "@blueprintjs/core";
import Login from "components/Login";
import Logout from "components/Logout";
import Navigation from "../Navigation";
import { RootProps } from "routes";
import { parseBoolean } from "utils/utils";
import { useState } from "react";

const isLogin = parseBoolean(process.env.REACT_APP_LOGIN || "");

export default function HeaderContent(props: RootProps) {
  // Login Form state and handler
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const showLogin = () => setIsLoginOpen(true);
  const closeLogin = () => setIsLoginOpen(false);

  // Logout Form state and handler
  const [isLogoutOpen, setIsLogoutOpen] = useState(false);
  const showLogout = () => setIsLogoutOpen(true);
  const closeLogout = () => setIsLogoutOpen(false);

  const { user } = props;

  return (
    <div className="header">
      <div className="header-left">
        <Navigation {...props} showChildren />
      </div>
      <div className="header-right">
        {isLogin &&
          (!user ? (
            <Button key="login" icon="log-in" minimal intent="primary" text="Log In" onClick={showLogin} />
          ) : (
            <Button key="logout" icon="log-out" minimal intent="primary" text="Log Out" onClick={showLogout} />
          ))}
      </div>
      {isLogin && <Login isOpen={isLoginOpen} onClose={closeLogin} />}
      {isLogin && <Logout isOpen={isLogoutOpen} onClose={closeLogout} />}
    </div>
  );
}
