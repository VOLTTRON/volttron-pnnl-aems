import {
  Alignment,
  Button,
  Classes,
  Menu,
  Navbar,
  NavbarGroup,
  NavbarHeading,
  PopoverInteractionKind,
} from "@blueprintjs/core";
import { Location, useLocation } from "react-router";
import { RouteProps, constructPath } from "routes";

import { ConditionalWrapper } from "utils/utils";
import { Link } from "react-router-dom";
import { Node } from "utils/tree";
import { Popover2 } from "@blueprintjs/popover2";
import React from "react";
import { RoleType } from "common";
import { RouteType } from "routes/types";
import { concat } from "lodash";
import { selectUser } from "controllers/user/action";
import { useSelector } from "react-redux";

export interface NavProps extends RouteProps {
  label?: string;
  showChildren?: boolean;
}

const hasChildren = (node: Node<RouteType>): boolean => !node.isLeaf();

const findNavRoute = (node: Node<RouteType> | undefined): Node<RouteType> | undefined => {
  while (node && node?.data?.id !== 0) {
    node = node?.parent;
  }
  return node;
};

export const isActive = (location: Location, node: Node<RouteType>): boolean =>
  concat([constructPath(node)], ...node.children.map((c) => constructPath(c))).includes(location.pathname);

function Navigation(props: NavProps) {
  const { node, label, showChildren } = props;

  const user = useSelector(selectUser);
  const location = useLocation();
  const parent = findNavRoute(node);

  const renderLink = (child: Node<RouteType>, primary: boolean) => {
    const { data } = child;
    if (data) {
      return (
        <Link key={data.name} to={constructPath(child)}>
          <Button
            key={data.name}
            minimal
            intent={primary ? "primary" : "none"}
            text={data.label}
            active={isActive(location, child)}
          />
        </Link>
      );
    }
  };

  const isVisible = (route?: RouteType) => {
    return route && !route?.hidden && (!route?.admin || RoleType.AdminType.granted(...(user?.role?.split(" ") || [])));
  };

  const renderMenu = (children: Array<Node<RouteType>>) => {
    const primary: boolean = false;
    return (
      <React.Fragment>
        {children
          .filter((c) => isVisible(c.data))
          .map((child) => (
            <ConditionalWrapper
              key={child.data?.name}
              condition={Boolean(child.data)}
              wrapper={(c) => (
                <Menu key={child.data?.name} className={`${Classes.POPOVER_DISMISS} subNav`}>
                  {c}
                </Menu>
              )}
            >
              {renderLink(child, primary)}
            </ConditionalWrapper>
          ))}
      </React.Fragment>
    );
  };

  const renderLinks = (child: Node<RouteType>) => {
    const { data, children } = child;
    return (
      <Popover2
        key={data?.name}
        content={renderMenu(children)}
        placement={"bottom-start"}
        minimal
        interactionKind={PopoverInteractionKind.CLICK}
      >
        <Button
          key={data?.name}
          minimal
          intent="primary"
          text={data?.label}
          active={isActive(location, child)}
          rightIcon="caret-down"
        />
      </Popover2>
    );
  };

  const primary: boolean = true;
  return (
    <Navbar className="navigation">
      <NavbarGroup align={Alignment.RIGHT}>
        {label && <NavbarHeading>{label}</NavbarHeading>}
        {parent &&
          parent.children
            .filter((c) => isVisible(c.data))
            .map((child) => (showChildren && hasChildren(child) ? renderLinks(child) : renderLink(child, primary)))}
      </NavbarGroup>
    </Navbar>
  );
}

export default Navigation;
