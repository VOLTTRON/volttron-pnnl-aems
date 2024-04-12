import { IUser } from "controllers/users/action";
import { DeepPartial } from "../../utils/types";

export const key: string = "user";

export function readUser(): void;
export function selectUser(state: any): IUser | undefined;
export function readUserPoll(payload: number | undefined): IUser | undefined;

export function loginUser(payload: DeepPartial<IUser>): void;
export function selectLoginUser(state: any): any;
export function selectLoginUserError(state: any): any;
export function selectLoginUserBusy(state: any): any;
export function selectLoginUserRequest(state: any): any;

export function logoutUser();
export function selectLogoutUser(state: any): any;
export function selectLogoutUserError(state: any): any;
export function selectLogoutUserBusy(state: any): any;
export function selectLogoutUserRequest(state: any): any;

export function updateUser(payload: any): IUser | undefined;
export function selectUpdateUser(state: any);
export function selectUpdateUserError(state: any);
export function selectUpdateUserRequest(state: any);
