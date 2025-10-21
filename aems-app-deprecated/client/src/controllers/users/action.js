import { generateActions, generateSelectors, generateTypes } from "../util";

export const key = "users";

// read users
export const READ_USERS = generateTypes(key, "all");
export const [readUsers, readUsersSuccess, readUsersError, readUsersBusy, readUsersPoll] = generateActions(READ_USERS);
export const [selectUsers, selectUsersError, selectUsersBusy, selectUsersPoll, selectUsersRequest] =
  generateSelectors(READ_USERS);

// filter users
export const FILTER_USERS = generateTypes(key, "filter");
export const [filterUsers, filterUsersSuccess, filterUsersError, filterUsersBusy, filterUsersPoll] =
  generateActions(FILTER_USERS);
export const [
  selectFilterUsers,
  selectFilterUsersError,
  selectFilterUsersBusy,
  selectFilterUsersPoll,
  selectFilterUsersRequest,
] = generateSelectors(FILTER_USERS);

// create user
export const CREATE_USER = generateTypes(key, "create");
export const [createUser, createUserSuccess, createUserError, createUserBusy] = generateActions(CREATE_USER);
export const [selectCreateUser, selectCreateUserError, selectCreateUserBusy, , selectCreateUserRequest] =
  generateSelectors(CREATE_USER);

// read user
export const READ_USER = generateTypes(key, "read");
export const [readUser, readUserSuccess, readUserError, readUserBusy, readUserPoll] = generateActions(READ_USER);
export const [selectUser, selectUserError, selectUserBusy, selectUserPoll, selectUserRequest] =
  generateSelectors(READ_USER);

// update user
export const UPDATE_USER = generateTypes(key, "update");
export const [updateUser, updateUserSuccess, updateUserError, updateUserBusy] = generateActions(UPDATE_USER);
export const [selectUpdateUser, selectUpdateUserError, selectUpdateUserBusy, , selectUpdateUserRequest] =
  generateSelectors(UPDATE_USER);

// delete user
export const DELETE_USER = generateTypes(key, "delete");
export const [deleteUser, deleteUserSuccess, deleteUserError, deleteUserBusy] = generateActions(DELETE_USER);
export const [selectDeleteUser, selectDeleteUserError, selectDeleteUserBusy, , selectDeleteUserRequest] =
  generateSelectors(DELETE_USER);
