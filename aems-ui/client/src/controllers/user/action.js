import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "user";

// read user
export const READ_USER = generateTypes(key, "current");
export const [readUser, readUserSuccess, readUserError, readUserBusy, readUserPoll] = generateActions(READ_USER);
export const [selectUser, selectUserError, selectUserBusy, selectUserPoll, selectUserRequest] =
  generateSelectors(READ_USER);

// update user
export const UPDATE_USER = generateTypes(key, "update");
export const [updateUser, updateUserSuccess, updateUserError, updateUserBusy] = generateActions(UPDATE_USER);
export const [selectUpdateUser, selectUpdateUserError, selectUpdateUserBusy, , selectUpdateUserRequest] =
  generateSelectors(UPDATE_USER);

// login user
export const LOGIN_USER = generateTypes(key, "login");
export const [loginUser, loginUserSuccess, loginUserError, loginUserBusy] = generateActions(LOGIN_USER);
export const [selectLoginUser, selectLoginUserError, selectLoginUserBusy, , selectLoginUserRequest] =
  generateSelectors(LOGIN_USER);

// logout user
export const LOGOUT_USER = generateTypes(key, "logout");
export const [logoutUser, logoutUserSuccess, logoutUserError, logoutUserBusy] = generateActions(LOGOUT_USER);
export const [selectLogoutUser, selectLogoutUserError, selectLogoutUserBusy, , selectLogoutUserRequest] =
  generateSelectors(LOGOUT_USER);
