/* eslint-disable */
import { TypedDocumentNode as DocumentNode } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  AccountGroupBy: { input: PrismaJson.AccountGroupBy; output: PrismaJson.AccountGroupBy; }
  BannerGroupBy: { input: PrismaJson.BannerGroupBy; output: PrismaJson.BannerGroupBy; }
  CommentGroupBy: { input: PrismaJson.CommentGroupBy; output: PrismaJson.CommentGroupBy; }
  DateTime: { input: string; output: string; }
  FeedbackGroupBy: { input: PrismaJson.FeedbackGroupBy; output: PrismaJson.FeedbackGroupBy; }
  FileGroupBy: { input: PrismaJson.FileGroupBy; output: PrismaJson.FileGroupBy; }
  GeographyGeoJson: { input: PrismaJson.GeographyGeoJson; output: PrismaJson.GeographyGeoJson; }
  GeographyGroupBy: { input: PrismaJson.GeographyGroupBy; output: PrismaJson.GeographyGroupBy; }
  Json: { input: any; output: any; }
  LogGroupBy: { input: PrismaJson.LogGroupBy; output: PrismaJson.LogGroupBy; }
  UserGroupBy: { input: PrismaJson.UserGroupBy; output: PrismaJson.UserGroupBy; }
  UserPreferences: { input: PrismaJson.UserPreferences; output: PrismaJson.UserPreferences; }
};

export type Account = {
  __typename?: 'Account';
  accessToken?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  expiresAt?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  idToken?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  providerAccountId?: Maybe<Scalars['String']['output']>;
  refreshToken?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  sessionState?: Maybe<Scalars['String']['output']>;
  tokenType?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type AccountAggregate = {
  average?: InputMaybe<Array<AccountFields>>;
  count?: InputMaybe<Array<AccountFields>>;
  maximum?: InputMaybe<Array<AccountFields>>;
  minimum?: InputMaybe<Array<AccountFields>>;
  sum?: InputMaybe<Array<AccountFields>>;
};

export type AccountCreateInput = {
  expiresAt?: InputMaybe<Scalars['Int']['input']>;
  idToken?: InputMaybe<Scalars['String']['input']>;
  provider: Scalars['String']['input'];
  providerAccountId: Scalars['String']['input'];
  scope?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
  user: AccountCreateUserRelationInput;
};

export type AccountCreateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
};

export enum AccountFields {
  AccessToken = 'accessToken',
  CreatedAt = 'createdAt',
  ExpiresAt = 'expiresAt',
  Id = 'id',
  IdToken = 'idToken',
  Provider = 'provider',
  ProviderAccountId = 'providerAccountId',
  RefreshToken = 'refreshToken',
  Scope = 'scope',
  SessionState = 'sessionState',
  TokenType = 'tokenType',
  Type = 'type',
  UpdatedAt = 'updatedAt',
  UserId = 'userId'
}

export type AccountFilter = {
  AND?: InputMaybe<Array<AccountFilter>>;
  NOT?: InputMaybe<AccountFilter>;
  OR?: InputMaybe<Array<AccountFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  provider?: InputMaybe<StringFilter>;
  type?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  user?: InputMaybe<UserUniqueFilter>;
  userId?: InputMaybe<StringFilter>;
};

export type AccountOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  provider?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
  user?: InputMaybe<UserOrderBy>;
  userId?: InputMaybe<OrderBy>;
};

export type AccountUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type AccountUpdateInput = {
  expiresAt?: InputMaybe<Scalars['Int']['input']>;
  idToken?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<AccountUpdateUserRelationInput>;
};

export type AccountUpdateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
  disconnect?: InputMaybe<Scalars['Boolean']['input']>;
};

export type Banner = {
  __typename?: 'Banner';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  expiration?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<User>>;
};

export type BannerAggregate = {
  average?: InputMaybe<Array<BannerFields>>;
  count?: InputMaybe<Array<BannerFields>>;
  maximum?: InputMaybe<Array<BannerFields>>;
  minimum?: InputMaybe<Array<BannerFields>>;
  sum?: InputMaybe<Array<BannerFields>>;
};

export type BannerCreateInput = {
  expiration?: InputMaybe<Scalars['DateTime']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
};

export enum BannerFields {
  CreatedAt = 'createdAt',
  Expiration = 'expiration',
  Id = 'id',
  Message = 'message',
  UpdatedAt = 'updatedAt'
}

export type BannerFilter = {
  AND?: InputMaybe<Array<BannerFilter>>;
  NOT?: InputMaybe<BannerFilter>;
  OR?: InputMaybe<Array<BannerFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  expiration?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type BannerOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  expiration?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type BannerUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type BannerUpdateInput = {
  expiration?: InputMaybe<Scalars['DateTime']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  users?: InputMaybe<BannerUpdateUsersRelationInput>;
};

export type BannerUpdateUsersRelationInput = {
  connect?: InputMaybe<Array<UserUniqueFilter>>;
  disconnect?: InputMaybe<Array<UserUniqueFilter>>;
};

export type BooleanFilter = {
  equals?: InputMaybe<Scalars['Boolean']['input']>;
  not?: InputMaybe<BooleanFilter>;
};

export type Comment = {
  __typename?: 'Comment';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type CommentAggregate = {
  average?: InputMaybe<Array<CommentFields>>;
  count?: InputMaybe<Array<CommentFields>>;
  maximum?: InputMaybe<Array<CommentFields>>;
  minimum?: InputMaybe<Array<CommentFields>>;
  sum?: InputMaybe<Array<CommentFields>>;
};

export type CommentCreateInput = {
  message: Scalars['String']['input'];
  user?: InputMaybe<CommentCreateUserRelationInput>;
};

export type CommentCreateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
};

export enum CommentFields {
  CreatedAt = 'createdAt',
  Id = 'id',
  Message = 'message',
  UpdatedAt = 'updatedAt',
  UserId = 'userId'
}

export type CommentFilter = {
  AND?: InputMaybe<Array<CommentFilter>>;
  NOT?: InputMaybe<CommentFilter>;
  OR?: InputMaybe<Array<CommentFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  user?: InputMaybe<UserUniqueFilter>;
  userId?: InputMaybe<StringFilter>;
};

export type CommentOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
  user?: InputMaybe<UserOrderBy>;
  userId?: InputMaybe<OrderBy>;
};

export type CommentUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type CommentUpdateInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<CommentUpdateUserRelationInput>;
};

export type CommentUpdateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
  disconnect?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CurrentCreateInput = {
  email: Scalars['String']['input'];
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  preferences?: InputMaybe<Scalars['UserPreferences']['input']>;
};

export type CurrentUpdateInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  preferences?: InputMaybe<Scalars['UserPreferences']['input']>;
};

export type DateTimeFilter = {
  contains?: InputMaybe<Scalars['DateTime']['input']>;
  equals?: InputMaybe<Scalars['DateTime']['input']>;
  gt?: InputMaybe<Scalars['DateTime']['input']>;
  gte?: InputMaybe<Scalars['DateTime']['input']>;
  in?: InputMaybe<Array<Scalars['DateTime']['input']>>;
  lt?: InputMaybe<Scalars['DateTime']['input']>;
  lte?: InputMaybe<Scalars['DateTime']['input']>;
  mode?: InputMaybe<StringFilterMode>;
  not?: InputMaybe<DateTimeFilter>;
};

export type Feedback = {
  __typename?: 'Feedback';
  assignee?: Maybe<User>;
  assigneeId?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  files?: Maybe<Array<File>>;
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  status?: Maybe<FeedbackStatus>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type FeedbackAggregate = {
  average?: InputMaybe<Array<FeedbackFields>>;
  count?: InputMaybe<Array<FeedbackFields>>;
  maximum?: InputMaybe<Array<FeedbackFields>>;
  minimum?: InputMaybe<Array<FeedbackFields>>;
  sum?: InputMaybe<Array<FeedbackFields>>;
};

export type FeedbackCreateInput = {
  files?: InputMaybe<FeedbackUpdateFilesRelationInput>;
  message: Scalars['String']['input'];
};

export enum FeedbackFields {
  AssigneeId = 'assigneeId',
  CreatedAt = 'createdAt',
  Id = 'id',
  Message = 'message',
  Status = 'status',
  UpdatedAt = 'updatedAt',
  UserId = 'userId'
}

export type FeedbackFilter = {
  AND?: InputMaybe<Array<FeedbackFilter>>;
  NOT?: InputMaybe<FeedbackFilter>;
  OR?: InputMaybe<Array<FeedbackFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  status?: InputMaybe<FeedbackStatusFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  user?: InputMaybe<UserUniqueFilter>;
  userId?: InputMaybe<StringFilter>;
};

export type FeedbackOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  status?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export enum FeedbackStatus {
  Done = 'Done',
  InProgress = 'InProgress',
  Todo = 'Todo'
}

export type FeedbackStatusFilter = {
  equals?: InputMaybe<FeedbackStatus>;
  in?: InputMaybe<Array<FeedbackStatus>>;
  mode?: InputMaybe<StringFilterMode>;
  not?: InputMaybe<FeedbackStatusFilter>;
};

export type FeedbackUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type FeedbackUpdateFilesRelationInput = {
  connect?: InputMaybe<Array<FileUniqueFilter>>;
};

export type FeedbackUpdateInput = {
  assigneeId?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<FeedbackStatus>;
};

export type File = {
  __typename?: 'File';
  contentLength?: Maybe<Scalars['Int']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  feedback?: Maybe<Feedback>;
  feedbackId?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  mimeType?: Maybe<Scalars['String']['output']>;
  objectKey?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type FileAggregate = {
  average?: InputMaybe<Array<FileFields>>;
  count?: InputMaybe<Array<FileFields>>;
  maximum?: InputMaybe<Array<FileFields>>;
  minimum?: InputMaybe<Array<FileFields>>;
  sum?: InputMaybe<Array<FileFields>>;
};

export type FileCreateInput = {
  contentLength: Scalars['Int']['input'];
  mimeType: Scalars['String']['input'];
  objectKey: Scalars['String']['input'];
  user?: InputMaybe<FileCreateUserRelationInput>;
};

export type FileCreateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
};

export enum FileFields {
  ContentLength = 'contentLength',
  CreatedAt = 'createdAt',
  FeedbackId = 'feedbackId',
  Id = 'id',
  MimeType = 'mimeType',
  ObjectKey = 'objectKey',
  UpdatedAt = 'updatedAt',
  UserId = 'userId'
}

export type FileFilter = {
  AND?: InputMaybe<Array<FileFilter>>;
  NOT?: InputMaybe<FileFilter>;
  OR?: InputMaybe<Array<FileFilter>>;
  feedbackId?: InputMaybe<StringFilter>;
  id?: InputMaybe<StringFilter>;
  user?: InputMaybe<UserUniqueFilter>;
  userId?: InputMaybe<StringFilter>;
};

export type FileOrderBy = {
  feedbackId?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  userId?: InputMaybe<OrderBy>;
};

export type FileUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type FileUpdateInput = {
  contentLength?: InputMaybe<Scalars['Int']['input']>;
  mimeType?: InputMaybe<Scalars['String']['input']>;
  objectKey?: InputMaybe<Scalars['String']['input']>;
  user?: InputMaybe<FileCreateUserRelationInput>;
};

export type FloatFilter = {
  equals?: InputMaybe<Scalars['Float']['input']>;
  gt?: InputMaybe<Scalars['Float']['input']>;
  gte?: InputMaybe<Scalars['Float']['input']>;
  in?: InputMaybe<Array<Scalars['Float']['input']>>;
  lt?: InputMaybe<Scalars['Float']['input']>;
  lte?: InputMaybe<Scalars['Float']['input']>;
  not?: InputMaybe<FloatFilter>;
};

export type Geography = {
  __typename?: 'Geography';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** [GeographyGeoJson] */
  geojson?: Maybe<Scalars['GeographyGeoJson']['output']>;
  group?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  type?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type GeographyAggregate = {
  average?: InputMaybe<Array<GeographyFields>>;
  count?: InputMaybe<Array<GeographyFields>>;
  maximum?: InputMaybe<Array<GeographyFields>>;
  minimum?: InputMaybe<Array<GeographyFields>>;
  sum?: InputMaybe<Array<GeographyFields>>;
};

export enum GeographyFields {
  CreatedAt = 'createdAt',
  Geojson = 'geojson',
  Group = 'group',
  Id = 'id',
  Name = 'name',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export type GeographyFilter = {
  AND?: InputMaybe<Array<GeographyFilter>>;
  NOT?: InputMaybe<GeographyFilter>;
  OR?: InputMaybe<Array<GeographyFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  group?: InputMaybe<StringFilter>;
  id?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  type?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type GeographyOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  group?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type GeographyUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type IntFilter = {
  equals?: InputMaybe<Scalars['Int']['input']>;
  gt?: InputMaybe<Scalars['Int']['input']>;
  gte?: InputMaybe<Scalars['Int']['input']>;
  in?: InputMaybe<Array<Scalars['Int']['input']>>;
  lt?: InputMaybe<Scalars['Int']['input']>;
  lte?: InputMaybe<Scalars['Int']['input']>;
  not?: InputMaybe<IntFilter>;
};

export type Log = {
  __typename?: 'Log';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  type?: Maybe<LogType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LogAggregate = {
  average?: InputMaybe<Array<LogFields>>;
  count?: InputMaybe<Array<LogFields>>;
  maximum?: InputMaybe<Array<LogFields>>;
  minimum?: InputMaybe<Array<LogFields>>;
  sum?: InputMaybe<Array<LogFields>>;
};

export type LogCreateInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<LogType>;
};

export enum LogFields {
  CreatedAt = 'createdAt',
  Id = 'id',
  Message = 'message',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export type LogFilter = {
  AND?: InputMaybe<Array<LogFilter>>;
  NOT?: InputMaybe<LogFilter>;
  OR?: InputMaybe<Array<LogFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  type?: InputMaybe<LogTypeFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type LogOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export enum LogType {
  Debug = 'Debug',
  Error = 'Error',
  Fatal = 'Fatal',
  Info = 'Info',
  Trace = 'Trace',
  Warn = 'Warn'
}

export type LogTypeFilter = {
  equals?: InputMaybe<LogType>;
  in?: InputMaybe<Array<LogType>>;
  mode?: InputMaybe<StringFilterMode>;
  not?: InputMaybe<LogTypeFilter>;
};

export type LogUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type LogUpdateInput = {
  message?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<LogType>;
};

export enum ModeType {
  Dark = 'dark',
  Light = 'light'
}

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new account. */
  createAccount?: Maybe<Account>;
  /** Create a new banner. */
  createBanner?: Maybe<Banner>;
  /** Create a new comment. */
  createComment?: Maybe<Comment>;
  /** Create a new user. */
  createCurrent?: Maybe<User>;
  /** Create new feedback. */
  createFeedback?: Maybe<Feedback>;
  /** Create a local file record. */
  createFile?: Maybe<File>;
  /** Create a new log. */
  createLog?: Maybe<Log>;
  /** Create a new user. */
  createUser?: Maybe<User>;
  /** Delete the specified account. */
  deleteAccount?: Maybe<Account>;
  /** Delete the specified banner. */
  deleteBanner?: Maybe<Banner>;
  /** Delete the specified comment. */
  deleteComment?: Maybe<Comment>;
  /** Delete the currently logged in user. */
  deleteCurrent?: Maybe<User>;
  /** Delete the specified feedback. */
  deleteFeedback?: Maybe<Feedback>;
  /** Delete a local file record. */
  deleteFile?: Maybe<File>;
  /** Delete the specified log. */
  deleteLog?: Maybe<Log>;
  /** Delete the specified user. */
  deleteUser?: Maybe<User>;
  /** Update the specified account. */
  updateAccount?: Maybe<Account>;
  /** Update the specified banner. */
  updateBanner?: Maybe<Banner>;
  /** Update the specified comment. */
  updateComment?: Maybe<Comment>;
  /** Update the currently logged in user. */
  updateCurrent?: Maybe<User>;
  /** Update the specified feedback status. */
  updateFeedback?: Maybe<Feedback>;
  /** Update a local file record. */
  updateFile?: Maybe<File>;
  /** Update the specified log. */
  updateLog?: Maybe<Log>;
  /** Update the specified user. */
  updateUser?: Maybe<User>;
};


export type MutationCreateAccountArgs = {
  create: AccountCreateInput;
};


export type MutationCreateBannerArgs = {
  create: BannerCreateInput;
};


export type MutationCreateCommentArgs = {
  create: CommentCreateInput;
};


export type MutationCreateCurrentArgs = {
  create: CurrentCreateInput;
};


export type MutationCreateFeedbackArgs = {
  create?: InputMaybe<FeedbackCreateInput>;
};


export type MutationCreateFileArgs = {
  create: FileCreateInput;
};


export type MutationCreateLogArgs = {
  create: LogCreateInput;
};


export type MutationCreateUserArgs = {
  create: UserCreateInput;
};


export type MutationDeleteAccountArgs = {
  where: AccountUniqueFilter;
};


export type MutationDeleteBannerArgs = {
  where: BannerUniqueFilter;
};


export type MutationDeleteCommentArgs = {
  where: CommentUniqueFilter;
};


export type MutationDeleteFeedbackArgs = {
  where: FeedbackUniqueFilter;
};


export type MutationDeleteFileArgs = {
  where: FileUniqueFilter;
};


export type MutationDeleteLogArgs = {
  where: LogUniqueFilter;
};


export type MutationDeleteUserArgs = {
  where: UserUniqueFilter;
};


export type MutationUpdateAccountArgs = {
  update: AccountUpdateInput;
  where: AccountUniqueFilter;
};


export type MutationUpdateBannerArgs = {
  update: BannerUpdateInput;
  where: BannerUniqueFilter;
};


export type MutationUpdateCommentArgs = {
  update: CommentUpdateInput;
  where: CommentUniqueFilter;
};


export type MutationUpdateCurrentArgs = {
  update: CurrentUpdateInput;
};


export type MutationUpdateFeedbackArgs = {
  update: FeedbackUpdateInput;
  where: FeedbackUniqueFilter;
};


export type MutationUpdateFileArgs = {
  update: FileUpdateInput;
  where: FileUniqueFilter;
};


export type MutationUpdateLogArgs = {
  update: LogUpdateInput;
  where: LogUniqueFilter;
};


export type MutationUpdateUserArgs = {
  update: UserUpdateInput;
  where: UserUniqueFilter;
};

export enum MutationType {
  Create = 'create',
  Delete = 'delete',
  Update = 'update'
}

export enum OrderBy {
  Asc = 'Asc',
  Desc = 'Desc'
}

export type PageInfo = {
  __typename?: 'PageInfo';
  endCursor?: Maybe<Scalars['String']['output']>;
  hasNextPage: Scalars['Boolean']['output'];
  hasPreviousPage: Scalars['Boolean']['output'];
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PagingInput = {
  skip: Scalars['Int']['input'];
  take: Scalars['Int']['input'];
};

export type Query = {
  __typename?: 'Query';
  /** Read a list of geographies at a specific location. */
  areaGeographies?: Maybe<Array<Geography>>;
  /** Count the number of accounts. */
  countAccounts?: Maybe<Scalars['Int']['output']>;
  /** Count the number of banners. */
  countBanners?: Maybe<Scalars['Int']['output']>;
  /** Count the number of comments. */
  countComments?: Maybe<Scalars['Int']['output']>;
  /** Count the number of feedbacks. */
  countFeedbacks?: Maybe<Scalars['Int']['output']>;
  /** Count the number of files. */
  countFiles?: Maybe<Scalars['Int']['output']>;
  /** Count the number of geographies. */
  countGeographies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of logs. */
  countLogs?: Maybe<Scalars['Int']['output']>;
  /** Count the number of user. */
  countUsers?: Maybe<Scalars['Int']['output']>;
  /** Group a list of accounts. */
  groupAccounts?: Maybe<Array<Scalars['AccountGroupBy']['output']>>;
  /** Group a list of banners. */
  groupBanners?: Maybe<Array<Scalars['BannerGroupBy']['output']>>;
  /** Group a list of comments. */
  groupComments?: Maybe<Array<Scalars['CommentGroupBy']['output']>>;
  /** Group a list of feedbacks. */
  groupFeedbacks?: Maybe<Array<Scalars['FeedbackGroupBy']['output']>>;
  /** Group a list of files. */
  groupFiles?: Maybe<Array<Scalars['FileGroupBy']['output']>>;
  /** Group a list of geographies. */
  groupGeographies?: Maybe<Array<Scalars['GeographyGroupBy']['output']>>;
  /** Group a list of logs. */
  groupLogs?: Maybe<Array<Scalars['LogGroupBy']['output']>>;
  /** Group a list of user. */
  groupUsers?: Maybe<Array<Scalars['UserGroupBy']['output']>>;
  /** Paginate through multiple accounts. */
  pageAccount?: Maybe<QueryPageAccountConnection>;
  /** Paginate through multiple banners. */
  pageBanner?: Maybe<QueryPageBannerConnection>;
  /** Paginate through multiple comments. */
  pageComment?: Maybe<QueryPageCommentConnection>;
  /** Paginate through multiple feedback. */
  pageFeedback?: Maybe<QueryPageFeedbackConnection>;
  /** Paginate through multiple files. */
  pageFile?: Maybe<QueryPageFileConnection>;
  /** Paginate through multiple geographies. */
  pageGeography?: Maybe<QueryPageGeographyConnection>;
  /** Paginate through multiple logs. */
  pageLog?: Maybe<QueryPageLogConnection>;
  /** Paginate through multiple users. */
  pageUser?: Maybe<QueryPageUserConnection>;
  /** Read a unique account. */
  readAccount?: Maybe<Account>;
  /** Read a list of accounts. */
  readAccounts?: Maybe<Array<Account>>;
  /** Read a unique banner. */
  readBanner?: Maybe<Banner>;
  /** Read a list of banners. */
  readBanners?: Maybe<Array<Banner>>;
  /** Read a unique comment. */
  readComment?: Maybe<Comment>;
  /** Read a list of comments. */
  readComments?: Maybe<Array<Comment>>;
  /** Read the currently logged in user. */
  readCurrent?: Maybe<User>;
  /** read a unique feedback */
  readFeedback?: Maybe<Feedback>;
  /** Read a list of feedback. */
  readFeedbacks?: Maybe<Array<Feedback>>;
  /** Read a specific file by its ID */
  readFile?: Maybe<File>;
  /** Read a list of files. */
  readFiles?: Maybe<Array<File>>;
  /** Read a list of geographies. */
  readGeographies?: Maybe<Array<Geography>>;
  /** Read a unique geography. */
  readGeography?: Maybe<Geography>;
  /** Read a unique log. */
  readLog?: Maybe<Log>;
  /** Read a list of logs. */
  readLogs?: Maybe<Array<Log>>;
  /** Read a unique user. */
  readUser?: Maybe<User>;
  /** Read a list of user. */
  readUsers?: Maybe<Array<User>>;
};


export type QueryAreaGeographiesArgs = {
  area: Scalars['GeographyGeoJson']['input'];
};


export type QueryCountAccountsArgs = {
  where?: InputMaybe<AccountFilter>;
};


export type QueryCountBannersArgs = {
  where?: InputMaybe<BannerFilter>;
};


export type QueryCountCommentsArgs = {
  where?: InputMaybe<CommentFilter>;
};


export type QueryCountFeedbacksArgs = {
  where?: InputMaybe<FeedbackFilter>;
};


export type QueryCountFilesArgs = {
  where?: InputMaybe<FileFilter>;
};


export type QueryCountGeographiesArgs = {
  where?: InputMaybe<GeographyFilter>;
};


export type QueryCountLogsArgs = {
  where?: InputMaybe<LogFilter>;
};


export type QueryCountUsersArgs = {
  where?: InputMaybe<UserFilter>;
};


export type QueryGroupAccountsArgs = {
  aggregate?: InputMaybe<AccountAggregate>;
  by: Array<AccountFields>;
  where?: InputMaybe<AccountFilter>;
};


export type QueryGroupBannersArgs = {
  aggregate?: InputMaybe<BannerAggregate>;
  by: Array<BannerFields>;
  where?: InputMaybe<BannerFilter>;
};


export type QueryGroupCommentsArgs = {
  aggregate?: InputMaybe<CommentAggregate>;
  by: Array<CommentFields>;
  where?: InputMaybe<CommentFilter>;
};


export type QueryGroupFeedbacksArgs = {
  aggregate?: InputMaybe<FeedbackAggregate>;
  by: Array<FeedbackFields>;
  where?: InputMaybe<FeedbackFilter>;
};


export type QueryGroupFilesArgs = {
  aggregate?: InputMaybe<FileAggregate>;
  by: Array<FileFields>;
  where?: InputMaybe<FileFilter>;
};


export type QueryGroupGeographiesArgs = {
  aggregate?: InputMaybe<GeographyAggregate>;
  by: Array<GeographyFields>;
  where?: InputMaybe<GeographyFilter>;
};


export type QueryGroupLogsArgs = {
  aggregate?: InputMaybe<LogAggregate>;
  by: Array<LogFields>;
  where?: InputMaybe<LogFilter>;
};


export type QueryGroupUsersArgs = {
  aggregate?: InputMaybe<UserAggregate>;
  by: Array<UserFields>;
  where?: InputMaybe<UserFilter>;
};


export type QueryPageAccountArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<AccountFilter>;
};


export type QueryPageBannerArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BannerFilter>;
};


export type QueryPageCommentArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<CommentFilter>;
};


export type QueryPageFeedbackArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<FeedbackFilter>;
};


export type QueryPageFileArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<FileFilter>;
};


export type QueryPageGeographyArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<GeographyFilter>;
};


export type QueryPageLogArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LogFilter>;
};


export type QueryPageUserArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<UserFilter>;
};


export type QueryReadAccountArgs = {
  where: AccountUniqueFilter;
};


export type QueryReadAccountsArgs = {
  distinct?: InputMaybe<Array<AccountFields>>;
  orderBy?: InputMaybe<Array<AccountOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<AccountFilter>;
};


export type QueryReadBannerArgs = {
  where: BannerUniqueFilter;
};


export type QueryReadBannersArgs = {
  distinct?: InputMaybe<Array<BannerFields>>;
  orderBy?: InputMaybe<Array<BannerOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BannerFilter>;
};


export type QueryReadCommentArgs = {
  where: CommentUniqueFilter;
};


export type QueryReadCommentsArgs = {
  distinct?: InputMaybe<Array<CommentFields>>;
  orderBy?: InputMaybe<Array<CommentOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<CommentFilter>;
};


export type QueryReadFeedbackArgs = {
  where: FeedbackUniqueFilter;
};


export type QueryReadFeedbacksArgs = {
  distinct?: InputMaybe<Array<FeedbackFields>>;
  orderBy?: InputMaybe<Array<FeedbackOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<FeedbackFilter>;
};


export type QueryReadFileArgs = {
  where: FileUniqueFilter;
};


export type QueryReadFilesArgs = {
  distinct?: InputMaybe<Array<FileFields>>;
  orderBy?: InputMaybe<Array<FileOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<FileFilter>;
};


export type QueryReadGeographiesArgs = {
  distinct?: InputMaybe<Array<GeographyFields>>;
  orderBy?: InputMaybe<Array<GeographyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<GeographyFilter>;
};


export type QueryReadGeographyArgs = {
  where: GeographyUniqueFilter;
};


export type QueryReadLogArgs = {
  where: LogUniqueFilter;
};


export type QueryReadLogsArgs = {
  distinct?: InputMaybe<Array<LogFields>>;
  orderBy?: InputMaybe<Array<LogOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<LogFilter>;
};


export type QueryReadUserArgs = {
  where: UserUniqueFilter;
};


export type QueryReadUsersArgs = {
  distinct?: InputMaybe<Array<UserFields>>;
  orderBy?: InputMaybe<Array<UserOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<UserFilter>;
};

export type QueryPageAccountConnection = {
  __typename?: 'QueryPageAccountConnection';
  edges?: Maybe<Array<Maybe<QueryPageAccountConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageAccountConnectionEdge = {
  __typename?: 'QueryPageAccountConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Account>;
};

export type QueryPageBannerConnection = {
  __typename?: 'QueryPageBannerConnection';
  edges?: Maybe<Array<Maybe<QueryPageBannerConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageBannerConnectionEdge = {
  __typename?: 'QueryPageBannerConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Banner>;
};

export type QueryPageCommentConnection = {
  __typename?: 'QueryPageCommentConnection';
  edges?: Maybe<Array<Maybe<QueryPageCommentConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageCommentConnectionEdge = {
  __typename?: 'QueryPageCommentConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Comment>;
};

export type QueryPageFeedbackConnection = {
  __typename?: 'QueryPageFeedbackConnection';
  edges?: Maybe<Array<Maybe<QueryPageFeedbackConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageFeedbackConnectionEdge = {
  __typename?: 'QueryPageFeedbackConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Feedback>;
};

export type QueryPageFileConnection = {
  __typename?: 'QueryPageFileConnection';
  edges?: Maybe<Array<Maybe<QueryPageFileConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageFileConnectionEdge = {
  __typename?: 'QueryPageFileConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<File>;
};

export type QueryPageGeographyConnection = {
  __typename?: 'QueryPageGeographyConnection';
  edges?: Maybe<Array<Maybe<QueryPageGeographyConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageGeographyConnectionEdge = {
  __typename?: 'QueryPageGeographyConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Geography>;
};

export type QueryPageLogConnection = {
  __typename?: 'QueryPageLogConnection';
  edges?: Maybe<Array<Maybe<QueryPageLogConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageLogConnectionEdge = {
  __typename?: 'QueryPageLogConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Log>;
};

export type QueryPageUserConnection = {
  __typename?: 'QueryPageUserConnection';
  edges?: Maybe<Array<Maybe<QueryPageUserConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageUserConnectionEdge = {
  __typename?: 'QueryPageUserConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<User>;
};

export type StringFilter = {
  contains?: InputMaybe<Scalars['String']['input']>;
  endsWith?: InputMaybe<Scalars['String']['input']>;
  equals?: InputMaybe<Scalars['String']['input']>;
  in?: InputMaybe<Array<Scalars['String']['input']>>;
  mode?: InputMaybe<StringFilterMode>;
  not?: InputMaybe<StringFilter>;
  startsWith?: InputMaybe<Scalars['String']['input']>;
};

export enum StringFilterMode {
  Default = 'Default',
  Insensitive = 'Insensitive'
}

export type Subscription = {
  __typename?: 'Subscription';
  /** Read a list of geographies at a specific location. */
  areaGeographies?: Maybe<Array<Geography>>;
  /** Count the number of accounts. */
  countAccounts?: Maybe<Scalars['Int']['output']>;
  /** Count the number of banners. */
  countBanners?: Maybe<Scalars['Int']['output']>;
  /** Count the number of comments. */
  countComments?: Maybe<Scalars['Int']['output']>;
  /** Count the number of feedbacks. */
  countFeedbacks?: Maybe<Scalars['Int']['output']>;
  /** Count the number of files. */
  countFiles?: Maybe<Scalars['Int']['output']>;
  /** Count the number of geographies. */
  countGeographies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of logs. */
  countLogs?: Maybe<Scalars['Int']['output']>;
  /** Count the number of user. */
  countUsers?: Maybe<Scalars['Int']['output']>;
  /** Group a list of accounts. */
  groupAccounts?: Maybe<Array<Scalars['AccountGroupBy']['output']>>;
  /** Group a list of banners. */
  groupBanners?: Maybe<Array<Scalars['BannerGroupBy']['output']>>;
  /** Group a list of comments. */
  groupComments?: Maybe<Array<Scalars['CommentGroupBy']['output']>>;
  /** Group a list of feedbacks. */
  groupFeedbacks?: Maybe<Array<Scalars['FeedbackGroupBy']['output']>>;
  /** Group a list of files. */
  groupFiles?: Maybe<Array<Scalars['FileGroupBy']['output']>>;
  /** Group a list of geographies. */
  groupGeographies?: Maybe<Array<Scalars['GeographyGroupBy']['output']>>;
  /** Group a list of logs. */
  groupLogs?: Maybe<Array<Scalars['LogGroupBy']['output']>>;
  /** Group a list of user. */
  groupUsers?: Maybe<Array<Scalars['UserGroupBy']['output']>>;
  /** Read a unique account. */
  readAccount?: Maybe<Account>;
  /** Read a list of accounts. */
  readAccounts?: Maybe<Array<Account>>;
  /** Read a unique banner. */
  readBanner?: Maybe<Banner>;
  /** Read a list of banners. */
  readBanners?: Maybe<Array<Banner>>;
  /** Read a unique comment. */
  readComment?: Maybe<Comment>;
  /** Read a list of comments. */
  readComments?: Maybe<Array<Comment>>;
  /** Read the currently logged in user. */
  readCurrent?: Maybe<User>;
  /** read a unique feedback */
  readFeedback?: Maybe<Feedback>;
  /** Read a list of feedback. */
  readFeedbacks?: Maybe<Array<Feedback>>;
  /** Read a specific file by its ID */
  readFile?: Maybe<File>;
  /** Read a list of files. */
  readFiles?: Maybe<Array<File>>;
  /** Read a list of geographies. */
  readGeographies?: Maybe<Array<Geography>>;
  /** Read a unique geography. */
  readGeography?: Maybe<Geography>;
  /** Read a unique log. */
  readLog?: Maybe<Log>;
  /** Read a list of logs. */
  readLogs?: Maybe<Array<Log>>;
  /** Read a unique user. */
  readUser?: Maybe<User>;
  /** Read a list of user. */
  readUsers?: Maybe<Array<User>>;
};


export type SubscriptionAreaGeographiesArgs = {
  area: Scalars['GeographyGeoJson']['input'];
};


export type SubscriptionCountAccountsArgs = {
  where?: InputMaybe<AccountFilter>;
};


export type SubscriptionCountBannersArgs = {
  where?: InputMaybe<BannerFilter>;
};


export type SubscriptionCountCommentsArgs = {
  where?: InputMaybe<CommentFilter>;
};


export type SubscriptionCountFeedbacksArgs = {
  where?: InputMaybe<FeedbackFilter>;
};


export type SubscriptionCountFilesArgs = {
  where?: InputMaybe<FileFilter>;
};


export type SubscriptionCountGeographiesArgs = {
  where?: InputMaybe<GeographyFilter>;
};


export type SubscriptionCountLogsArgs = {
  where?: InputMaybe<LogFilter>;
};


export type SubscriptionCountUsersArgs = {
  where?: InputMaybe<UserFilter>;
};


export type SubscriptionGroupAccountsArgs = {
  aggregate?: InputMaybe<AccountAggregate>;
  by: Array<AccountFields>;
  where?: InputMaybe<AccountFilter>;
};


export type SubscriptionGroupBannersArgs = {
  aggregate?: InputMaybe<BannerAggregate>;
  by: Array<BannerFields>;
  where?: InputMaybe<BannerFilter>;
};


export type SubscriptionGroupCommentsArgs = {
  aggregate?: InputMaybe<CommentAggregate>;
  by: Array<CommentFields>;
  where?: InputMaybe<CommentFilter>;
};


export type SubscriptionGroupFeedbacksArgs = {
  aggregate?: InputMaybe<FeedbackAggregate>;
  by: Array<FeedbackFields>;
  where?: InputMaybe<FeedbackFilter>;
};


export type SubscriptionGroupFilesArgs = {
  aggregate?: InputMaybe<FileAggregate>;
  by: Array<FileFields>;
  where?: InputMaybe<FileFilter>;
};


export type SubscriptionGroupGeographiesArgs = {
  aggregate?: InputMaybe<GeographyAggregate>;
  by: Array<GeographyFields>;
  where?: InputMaybe<GeographyFilter>;
};


export type SubscriptionGroupLogsArgs = {
  aggregate?: InputMaybe<LogAggregate>;
  by: Array<LogFields>;
  where?: InputMaybe<LogFilter>;
};


export type SubscriptionGroupUsersArgs = {
  aggregate?: InputMaybe<UserAggregate>;
  by: Array<UserFields>;
  where?: InputMaybe<UserFilter>;
};


export type SubscriptionReadAccountArgs = {
  where: AccountUniqueFilter;
};


export type SubscriptionReadAccountsArgs = {
  distinct?: InputMaybe<Array<AccountFields>>;
  orderBy?: InputMaybe<Array<AccountOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<AccountFilter>;
};


export type SubscriptionReadBannerArgs = {
  where: BannerUniqueFilter;
};


export type SubscriptionReadBannersArgs = {
  distinct?: InputMaybe<Array<BannerFields>>;
  orderBy?: InputMaybe<Array<BannerOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BannerFilter>;
};


export type SubscriptionReadCommentArgs = {
  where: CommentUniqueFilter;
};


export type SubscriptionReadCommentsArgs = {
  distinct?: InputMaybe<Array<CommentFields>>;
  orderBy?: InputMaybe<Array<CommentOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<CommentFilter>;
};


export type SubscriptionReadFeedbackArgs = {
  where: FeedbackUniqueFilter;
};


export type SubscriptionReadFeedbacksArgs = {
  distinct?: InputMaybe<Array<FeedbackFields>>;
  orderBy?: InputMaybe<Array<FeedbackOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<FeedbackFilter>;
};


export type SubscriptionReadFileArgs = {
  where: FileUniqueFilter;
};


export type SubscriptionReadFilesArgs = {
  distinct?: InputMaybe<Array<FileFields>>;
  orderBy?: InputMaybe<Array<FileOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<FileFilter>;
};


export type SubscriptionReadGeographiesArgs = {
  distinct?: InputMaybe<Array<GeographyFields>>;
  orderBy?: InputMaybe<Array<GeographyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<GeographyFilter>;
};


export type SubscriptionReadGeographyArgs = {
  where: GeographyUniqueFilter;
};


export type SubscriptionReadLogArgs = {
  where: LogUniqueFilter;
};


export type SubscriptionReadLogsArgs = {
  distinct?: InputMaybe<Array<LogFields>>;
  orderBy?: InputMaybe<Array<LogOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<LogFilter>;
};


export type SubscriptionReadUserArgs = {
  where: UserUniqueFilter;
};


export type SubscriptionReadUsersArgs = {
  distinct?: InputMaybe<Array<UserFields>>;
  orderBy?: InputMaybe<Array<UserOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<UserFilter>;
};

export type User = {
  __typename?: 'User';
  accounts?: Maybe<Array<Account>>;
  banners?: Maybe<Array<Banner>>;
  comments?: Maybe<Array<Comment>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  email?: Maybe<Scalars['String']['output']>;
  emailVerified?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  /** [UserPreferences] */
  preferences?: Maybe<Scalars['UserPreferences']['output']>;
  role?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type UserAggregate = {
  average?: InputMaybe<Array<UserFields>>;
  count?: InputMaybe<Array<UserFields>>;
  maximum?: InputMaybe<Array<UserFields>>;
  minimum?: InputMaybe<Array<UserFields>>;
  sum?: InputMaybe<Array<UserFields>>;
};

export type UserCreateInput = {
  email: Scalars['String']['input'];
  emailVerified?: InputMaybe<Scalars['DateTime']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  preferences?: InputMaybe<Scalars['UserPreferences']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export enum UserFields {
  CreatedAt = 'createdAt',
  Email = 'email',
  EmailVerified = 'emailVerified',
  Id = 'id',
  Image = 'image',
  Name = 'name',
  Preferences = 'preferences',
  Role = 'role',
  UpdatedAt = 'updatedAt'
}

export type UserFilter = {
  AND?: InputMaybe<Array<UserFilter>>;
  NOT?: InputMaybe<UserFilter>;
  OR?: InputMaybe<Array<UserFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  email?: InputMaybe<StringFilter>;
  emailVerified?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  image?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  role?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type UserOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  email?: InputMaybe<OrderBy>;
  emailVerified?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  image?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  role?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type UserUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type UserUpdateAccountsRelationInput = {
  connect?: InputMaybe<Array<AccountUniqueFilter>>;
  create?: InputMaybe<Array<AccountCreateInput>>;
  delete?: InputMaybe<Array<AccountUniqueFilter>>;
  disconnect?: InputMaybe<Array<AccountUniqueFilter>>;
};

export type UserUpdateBannersRelationInput = {
  connect?: InputMaybe<Array<BannerUniqueFilter>>;
  create?: InputMaybe<Array<BannerCreateInput>>;
  delete?: InputMaybe<Array<BannerUniqueFilter>>;
  disconnect?: InputMaybe<Array<BannerUniqueFilter>>;
};

export type UserUpdateCommentsRelationInput = {
  connect?: InputMaybe<Array<CommentUniqueFilter>>;
  create?: InputMaybe<Array<CommentCreateInput>>;
  delete?: InputMaybe<Array<CommentUniqueFilter>>;
  disconnect?: InputMaybe<Array<CommentUniqueFilter>>;
};

export type UserUpdateInput = {
  email?: InputMaybe<Scalars['String']['input']>;
  emailVerified?: InputMaybe<Scalars['DateTime']['input']>;
  image?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  password?: InputMaybe<Scalars['String']['input']>;
  preferences?: InputMaybe<Scalars['UserPreferences']['input']>;
  role?: InputMaybe<Scalars['String']['input']>;
};

export type BannerFieldsFragment = { __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'BannerFieldsFragment' };

export type ReadBannerQueryVariables = Exact<{
  where: BannerUniqueFilter;
}>;


export type ReadBannerQuery = { __typename?: 'Query', readBanner?: { __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadBannersQueryVariables = Exact<{
  where?: InputMaybe<BannerFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<BannerOrderBy> | BannerOrderBy>;
  distinct?: InputMaybe<Array<BannerFields> | BannerFields>;
}>;


export type ReadBannersQuery = { __typename?: 'Query', readBanners?: Array<{ __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateBannerMutationVariables = Exact<{
  create: BannerCreateInput;
}>;


export type CreateBannerMutation = { __typename?: 'Mutation', createBanner?: { __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateBannerMutationVariables = Exact<{
  where: BannerUniqueFilter;
  update: BannerUpdateInput;
}>;


export type UpdateBannerMutation = { __typename?: 'Mutation', updateBanner?: { __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteBannerMutationVariables = Exact<{
  where: BannerUniqueFilter;
}>;


export type DeleteBannerMutation = { __typename?: 'Mutation', deleteBanner?: { __typename?: 'Banner', id?: string | null } | null };

export type SubscribeBannersSubscriptionVariables = Exact<{
  where?: InputMaybe<BannerFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<BannerOrderBy> | BannerOrderBy>;
  distinct?: InputMaybe<Array<BannerFields> | BannerFields>;
}>;


export type SubscribeBannersSubscription = { __typename?: 'Subscription', readBanners?: Array<{ __typename?: 'Banner', id?: string | null, message?: string | null, expiration?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CurrentFragmentFragment = { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'CurrentFragmentFragment' };

export type ReadCurrentQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadCurrentQuery = { __typename?: 'Query', readCurrent?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type CreateCurrentMutationVariables = Exact<{
  create: CurrentCreateInput;
}>;


export type CreateCurrentMutation = { __typename?: 'Mutation', createCurrent?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateCurrentMutationVariables = Exact<{
  update: CurrentUpdateInput;
}>;


export type UpdateCurrentMutation = { __typename?: 'Mutation', updateCurrent?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteCurrentMutationVariables = Exact<{ [key: string]: never; }>;


export type DeleteCurrentMutation = { __typename?: 'Mutation', deleteCurrent?: { __typename?: 'User', id?: string | null } | null };

export type ReadFeedbackQueryVariables = Exact<{
  where: FeedbackUniqueFilter;
}>;


export type ReadFeedbackQuery = { __typename?: 'Query', readFeedback?: { __typename?: 'Feedback', id?: string | null, status?: FeedbackStatus | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null, assignee?: { __typename?: 'User', id?: string | null, name?: string | null } | null, files?: Array<{ __typename?: 'File', id?: string | null, objectKey?: string | null, mimeType?: string | null }> | null } | null };

export type ReadFeedbacksQueryVariables = Exact<{
  where?: InputMaybe<FeedbackFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<FeedbackOrderBy> | FeedbackOrderBy>;
  distinct?: InputMaybe<Array<FeedbackFields> | FeedbackFields>;
}>;


export type ReadFeedbacksQuery = { __typename?: 'Query', readFeedbacks?: Array<{ __typename?: 'Feedback', id?: string | null, status?: FeedbackStatus | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null, assignee?: { __typename?: 'User', id?: string | null, name?: string | null } | null, files?: Array<{ __typename?: 'File', id?: string | null }> | null }> | null };

export type CreateFeedbackMutationVariables = Exact<{
  create: FeedbackCreateInput;
}>;


export type CreateFeedbackMutation = { __typename?: 'Mutation', createFeedback?: { __typename?: 'Feedback', message?: string | null, files?: Array<{ __typename?: 'File', id?: string | null }> | null } | null };

export type UpdateFeedbackMutationVariables = Exact<{
  where: FeedbackUniqueFilter;
  update: FeedbackUpdateInput;
}>;


export type UpdateFeedbackMutation = { __typename?: 'Mutation', updateFeedback?: { __typename?: 'Feedback', status?: FeedbackStatus | null, assigneeId?: string | null } | null };

export type ReadFileQueryVariables = Exact<{
  where: FileUniqueFilter;
}>;


export type ReadFileQuery = { __typename?: 'Query', readFile?: { __typename?: 'File', id?: string | null } | null };

export type ReadFilesQueryVariables = Exact<{
  where: FileFilter;
}>;


export type ReadFilesQuery = { __typename?: 'Query', readFiles?: Array<{ __typename?: 'File', id?: string | null, objectKey?: string | null, mimeType?: string | null, contentLength?: number | null, feedback?: { __typename?: 'Feedback', id?: string | null } | null }> | null };

export type CreateFileMutationVariables = Exact<{
  create: FileCreateInput;
}>;


export type CreateFileMutation = { __typename?: 'Mutation', createFile?: { __typename?: 'File', objectKey?: string | null, contentLength?: number | null, mimeType?: string | null, createdAt?: string | null, updatedAt?: string | null, id?: string | null, userId?: string | null, feedbackId?: string | null } | null };

export type GeographyFieldsFragment = { __typename?: 'Geography', id?: string | null, name?: string | null, group?: string | null, type?: string | null, geojson?: PrismaJson.GeographyGeoJson | null, createdAt?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'GeographyFieldsFragment' };

export type AreaGeographiesQueryVariables = Exact<{
  area: Scalars['GeographyGeoJson']['input'];
}>;


export type AreaGeographiesQuery = { __typename?: 'Query', areaGeographies?: Array<{ __typename?: 'Geography', id?: string | null, name?: string | null, group?: string | null, type?: string | null, geojson?: PrismaJson.GeographyGeoJson | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ReadGeographyQueryVariables = Exact<{
  where: GeographyUniqueFilter;
}>;


export type ReadGeographyQuery = { __typename?: 'Query', readGeography?: { __typename?: 'Geography', id?: string | null, name?: string | null, group?: string | null, type?: string | null, geojson?: PrismaJson.GeographyGeoJson | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadGeographiesQueryVariables = Exact<{
  where?: InputMaybe<GeographyFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<GeographyOrderBy> | GeographyOrderBy>;
  distinct?: InputMaybe<Array<GeographyFields> | GeographyFields>;
}>;


export type ReadGeographiesQuery = { __typename?: 'Query', countGeographies?: number | null, readGeographies?: Array<{ __typename?: 'Geography', id?: string | null, name?: string | null, group?: string | null, type?: string | null, geojson?: PrismaJson.GeographyGeoJson | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type LogFieldsFragment = { __typename?: 'Log', id?: string | null, type?: LogType | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'LogFieldsFragment' };

export type ReadLogQueryVariables = Exact<{
  where: LogUniqueFilter;
}>;


export type ReadLogQuery = { __typename?: 'Query', readLog?: { __typename?: 'Log', id?: string | null, type?: LogType | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadLogsQueryVariables = Exact<{
  where?: InputMaybe<LogFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<LogOrderBy> | LogOrderBy>;
  distinct?: InputMaybe<Array<LogFields> | LogFields>;
}>;


export type ReadLogsQuery = { __typename?: 'Query', countLogs?: number | null, readLogs?: Array<{ __typename?: 'Log', id?: string | null, type?: LogType | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateLogMutationVariables = Exact<{
  create: LogCreateInput;
}>;


export type CreateLogMutation = { __typename?: 'Mutation', createLog?: { __typename?: 'Log', id?: string | null, type?: LogType | null, message?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteLogMutationVariables = Exact<{
  where: LogUniqueFilter;
}>;


export type DeleteLogMutation = { __typename?: 'Mutation', deleteLog?: { __typename?: 'Log', id?: string | null } | null };

export type UserFieldsFragment = { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } & { ' $fragmentName'?: 'UserFieldsFragment' };

export type ReadUserQueryVariables = Exact<{
  where: UserUniqueFilter;
}>;


export type ReadUserQuery = { __typename?: 'Query', readUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadUsersQueryVariables = Exact<{
  where?: InputMaybe<UserFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<UserOrderBy> | UserOrderBy>;
  distinct?: InputMaybe<Array<UserFields> | UserFields>;
}>;


export type ReadUsersQuery = { __typename?: 'Query', countUsers?: number | null, readUsers?: Array<{ __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateUserMutationVariables = Exact<{
  create: UserCreateInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateUserMutationVariables = Exact<{
  where: UserUniqueFilter;
  update: UserUpdateInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteUserMutationVariables = Exact<{
  where: UserUniqueFilter;
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser?: { __typename?: 'User', id?: string | null } | null };

export const BannerFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BannerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Banner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<BannerFieldsFragment, unknown>;
export const CurrentFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CurrentFragmentFragment, unknown>;
export const GeographyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeographyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Geography"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geojson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GeographyFieldsFragment, unknown>;
export const LogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Log"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<LogFieldsFragment, unknown>;
export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const ReadBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBannerQuery, ReadBannerQueryVariables>;
export const ReadBannersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBanners"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanners"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBannersQuery, ReadBannersQueryVariables>;
export const CreateBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateBannerMutation, CreateBannerMutationVariables>;
export const UpdateBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateBannerMutation, UpdateBannerMutationVariables>;
export const DeleteBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteBannerMutation, DeleteBannerMutationVariables>;
export const SubscribeBannersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBanners"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanners"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubscribeBannersSubscription, SubscribeBannersSubscriptionVariables>;
export const ReadCurrentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadCurrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readCurrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadCurrentQuery, ReadCurrentQueryVariables>;
export const CreateCurrentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateCurrent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrentCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createCurrent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateCurrentMutation, CreateCurrentMutationVariables>;
export const UpdateCurrentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateCurrent"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"CurrentUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateCurrent"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateCurrentMutation, UpdateCurrentMutationVariables>;
export const DeleteCurrentDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteCurrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteCurrent"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteCurrentMutation, DeleteCurrentMutationVariables>;
export const ReadFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadFeedbackQuery, ReadFeedbackQueryVariables>;
export const ReadFeedbacksDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadFeedbacks"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readFeedbacks"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"assignee"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}}]}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadFeedbacksQuery, ReadFeedbacksQueryVariables>;
export const CreateFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"files"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateFeedbackMutation, CreateFeedbackMutationVariables>;
export const UpdateFeedbackDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateFeedback"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FeedbackUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateFeedback"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"assigneeId"}}]}}]}}]} as unknown as DocumentNode<UpdateFeedbackMutation, UpdateFeedbackMutationVariables>;
export const ReadFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<ReadFileQuery, ReadFileQueryVariables>;
export const ReadFilesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadFiles"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readFiles"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"objectKey"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"feedback"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ReadFilesQuery, ReadFilesQueryVariables>;
export const CreateFileDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateFile"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"FileCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createFile"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"objectKey"}},{"kind":"Field","name":{"kind":"Name","value":"contentLength"}},{"kind":"Field","name":{"kind":"Name","value":"mimeType"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"userId"}},{"kind":"Field","name":{"kind":"Name","value":"feedbackId"}}]}}]}}]} as unknown as DocumentNode<CreateFileMutation, CreateFileMutationVariables>;
export const AreaGeographiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"AreaGeographies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"area"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeographyGeoJson"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"areaGeographies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"area"},"value":{"kind":"Variable","name":{"kind":"Name","value":"area"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geojson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<AreaGeographiesQuery, AreaGeographiesQueryVariables>;
export const ReadGeographyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadGeography"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeographyUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readGeography"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geojson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadGeographyQuery, ReadGeographyQueryVariables>;
export const ReadGeographiesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadGeographies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"GeographyFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeographyOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"GeographyFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readGeographies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geojson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countGeographies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadGeographiesQuery, ReadGeographiesQueryVariables>;
export const ReadLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadLogQuery, ReadLogQueryVariables>;
export const ReadLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LogFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadLogsQuery, ReadLogsQueryVariables>;
export const CreateLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateLogMutation, CreateLogMutationVariables>;
export const DeleteLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteLogMutation, DeleteLogMutationVariables>;
export const ReadUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadUserQuery, ReadUserQueryVariables>;
export const ReadUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadUsersQuery, ReadUsersQueryVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;