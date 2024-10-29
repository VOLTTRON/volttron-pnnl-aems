import { BusyAuto, BusyUser } from "controllers/busy/action";
import { DeepPartial } from "../../utils/types";

export interface IUser {
  id?: string;
  altId: string;
  name: string;
  email: string;
  role: string;
  preferences: string;
  createdAt: string;
  updatedAt: string;
  password?: string;
  token?: string;
  units?: { id: number }[];
}

export interface IFilter {
  field?: "id" | "name" | "email" | "role" | "createdAt" | "updatedAt";
  direction?: "asc" | "dsc";
  search?: string;
  auto?: boolean;
}

export function createUser(payload: DeepPartial<IUser>): void;
export function selectCreateUserError(state: any): any | undefined;
export function selectCreateUser(state: any): IUser | undefined;
export function selectCreateUserBusy(state: any): boolean | undefined;
export function selectCreateUserRequest(
  state: any
): DeepPartial<IUser> | undefined;

export function readUsers(): void;
export function selectUsers(state: any): List<IUser> | undefined;

export function filterUsers(payload: IFilter): void;
export function selectFilterUsers(state: any): List<IUser> | undefined;
export function selectFilterUsersBusy():
  | boolean
  | { type: BusyAuto | BusyUser }
  | undefined;

export function readUser(payload: string): void;
export function selectUser(state: any): IUser | undefined;

export function updateUser(payload: DeepPartial<IUser>): void;
export function selectUpdateUser(state: any): IUser | undefined;

export function deleteUser(payload: string): void;
export function selectDeleteUser(state: any): IUser | undefined;
