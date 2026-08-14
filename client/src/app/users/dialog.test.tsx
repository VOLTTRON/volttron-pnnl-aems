import { render, screen } from "@testing-library/react";
import { CurrentContext } from "../components/providers";

jest.mock("@apollo/client", () => ({
  useMutation: jest.fn(() => [jest.fn(), { loading: false }]),
}));

jest.mock("../dialog", () => ({
  CreateDialog: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="create-dialog">
      <span>{title}</span>
      {children}
    </div>
  ),
  UpdateDialog: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="update-dialog">
      <span>{title}</span>
      {children}
    </div>
  ),
  DeleteDialog: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="delete-dialog">
      <span>{title}</span>
      {children}
    </div>
  ),
  ConfirmDialog: ({ title, children }: { title: string; children?: React.ReactNode }) => (
    <div data-testid="confirm-dialog">
      <span>{title}</span>
      {children}
    </div>
  ),
}));

jest.mock("../components/hooks/useIsKeycloakEnabled", () => ({
  useIsKeycloakEnabled: () => false,
}));

const mockCurrentCtx = {
  current: {
    id: "u1",
    name: "Admin",
    email: "admin@example.com",
    role: "admin",
    image: null,
    emailVerified: null,
    preferences: null,
    createdAt: "",
    updatedAt: "",
  },
  loading: false,
  updateCurrent: jest.fn(),
  refetchCurrent: jest.fn(),
};

function withCurrent(node: React.ReactNode) {
  return <CurrentContext.Provider value={mockCurrentCtx}>{node}</CurrentContext.Provider>;
}

describe("CreateUser", () => {
  it("renders the Create User dialog with form fields", () => {
    const { CreateUser } = require("./dialog");
    render(withCurrent(<CreateUser open={true} setOpen={jest.fn()} />));
    expect(screen.getByText("Create User")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Email")).toBeInTheDocument();
  });
});

describe("UpdateUser", () => {
  const mockUser = {
    id: "u2",
    name: "Bob",
    email: "bob@example.com",
    role: "user",
    image: null,
    emailVerified: null,
    preferences: null,
    createdAt: "",
    updatedAt: "",
  };

  it("renders the Update User dialog with existing data", () => {
    const { UpdateUser } = require("./dialog");
    render(withCurrent(<UpdateUser open={true} setOpen={jest.fn()} user={mockUser} />));
    expect(screen.getByText("Update User")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Bob")).toBeInTheDocument();
  });
});

describe("DeleteUser", () => {
  const mockUser = {
    id: "u3",
    name: "Charlie",
    email: "charlie@example.com",
    role: "user",
    image: null,
    emailVerified: null,
    preferences: null,
    createdAt: "",
    updatedAt: "",
  };

  it("renders the Delete User dialog with user name", () => {
    const { DeleteUser } = require("./dialog");
    render(withCurrent(<DeleteUser open={true} setOpen={jest.fn()} user={mockUser} />));
    expect(screen.getByText("Delete User")).toBeInTheDocument();
    expect(screen.getByText(/Charlie/)).toBeInTheDocument();
  });
});

describe("LoginAsUser", () => {
  const mockUser = {
    id: "u4",
    name: "Dave",
    email: "dave@example.com",
    role: "user",
    image: null,
    emailVerified: null,
    preferences: null,
    createdAt: "",
    updatedAt: "",
  };

  it("renders the Login As User dialog with user name", () => {
    const { LoginAsUser } = require("./dialog");
    render(withCurrent(<LoginAsUser open={true} setOpen={jest.fn()} user={mockUser} />));
    expect(screen.getByText("Login As User")).toBeInTheDocument();
    expect(screen.getByText(/Dave/)).toBeInTheDocument();
  });
});
