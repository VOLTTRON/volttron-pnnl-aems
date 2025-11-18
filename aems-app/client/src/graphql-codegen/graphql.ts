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
  ChangeData: { input: PrismaJson.ChangeData; output: PrismaJson.ChangeData; }
  ChangeGroupBy: { input: PrismaJson.ChangeGroupBy; output: PrismaJson.ChangeGroupBy; }
  CommentGroupBy: { input: PrismaJson.CommentGroupBy; output: PrismaJson.CommentGroupBy; }
  ConfigurationGroupBy: { input: PrismaJson.ConfigurationGroupBy; output: PrismaJson.ConfigurationGroupBy; }
  ControlGroupBy: { input: PrismaJson.ControlGroupBy; output: PrismaJson.ControlGroupBy; }
  DateTime: { input: string; output: string; }
  FeedbackGroupBy: { input: PrismaJson.FeedbackGroupBy; output: PrismaJson.FeedbackGroupBy; }
  FileGroupBy: { input: PrismaJson.FileGroupBy; output: PrismaJson.FileGroupBy; }
  GeographyGeoJson: { input: PrismaJson.GeographyGeoJson; output: PrismaJson.GeographyGeoJson; }
  GeographyGroupBy: { input: PrismaJson.GeographyGroupBy; output: PrismaJson.GeographyGroupBy; }
  HolidayGroupBy: { input: PrismaJson.HolidayGroupBy; output: PrismaJson.HolidayGroupBy; }
  Json: { input: any; output: any; }
  LocationGroupBy: { input: PrismaJson.LocationGroupBy; output: PrismaJson.LocationGroupBy; }
  LogGroupBy: { input: PrismaJson.LogGroupBy; output: PrismaJson.LogGroupBy; }
  OccupancyGroupBy: { input: PrismaJson.OccupancyGroupBy; output: PrismaJson.OccupancyGroupBy; }
  ScheduleGroupBy: { input: PrismaJson.ScheduleGroupBy; output: PrismaJson.ScheduleGroupBy; }
  SetpointGroupBy: { input: PrismaJson.SetpointGroupBy; output: PrismaJson.SetpointGroupBy; }
  UnitGroupBy: { input: PrismaJson.UnitGroupBy; output: PrismaJson.UnitGroupBy; }
  UserGroupBy: { input: PrismaJson.UserGroupBy; output: PrismaJson.UserGroupBy; }
  UserPreferences: { input: PrismaJson.UserPreferences; output: PrismaJson.UserPreferences; }
};

export type Account = {
  __typename?: 'Account';
  access_token?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  expires_at?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  id_token?: Maybe<Scalars['String']['output']>;
  provider?: Maybe<Scalars['String']['output']>;
  providerAccountId?: Maybe<Scalars['String']['output']>;
  refresh_token?: Maybe<Scalars['String']['output']>;
  scope?: Maybe<Scalars['String']['output']>;
  session_state?: Maybe<Scalars['String']['output']>;
  token_type?: Maybe<Scalars['String']['output']>;
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
  access_token?: InputMaybe<Scalars['String']['input']>;
  expires_at?: InputMaybe<Scalars['Int']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  provider: Scalars['String']['input'];
  providerAccountId: Scalars['String']['input'];
  refresh_token?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  session_state?: InputMaybe<Scalars['String']['input']>;
  token_type?: InputMaybe<Scalars['String']['input']>;
  type: Scalars['String']['input'];
  user: AccountCreateUserRelationInput;
};

export type AccountCreateUserRelationInput = {
  connect?: InputMaybe<UserUniqueFilter>;
};

export enum AccountFields {
  AccessToken = 'access_token',
  CreatedAt = 'createdAt',
  ExpiresAt = 'expires_at',
  Id = 'id',
  IdToken = 'id_token',
  Provider = 'provider',
  ProviderAccountId = 'providerAccountId',
  RefreshToken = 'refresh_token',
  Scope = 'scope',
  SessionState = 'session_state',
  TokenType = 'token_type',
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
  access_token?: InputMaybe<Scalars['String']['input']>;
  expires_at?: InputMaybe<Scalars['Int']['input']>;
  id_token?: InputMaybe<Scalars['String']['input']>;
  provider?: InputMaybe<Scalars['String']['input']>;
  providerAccountId?: InputMaybe<Scalars['String']['input']>;
  refresh_token?: InputMaybe<Scalars['String']['input']>;
  scope?: InputMaybe<Scalars['String']['input']>;
  session_state?: InputMaybe<Scalars['String']['input']>;
  token_type?: InputMaybe<Scalars['String']['input']>;
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

export type Change = {
  __typename?: 'Change';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  /** [ChangeData] */
  data?: Maybe<Scalars['ChangeData']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  key?: Maybe<Scalars['String']['output']>;
  mutation?: Maybe<ChangeMutation>;
  table?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  user?: Maybe<User>;
  userId?: Maybe<Scalars['String']['output']>;
};

export type ChangeAggregate = {
  average?: InputMaybe<Array<ChangeFields>>;
  count?: InputMaybe<Array<ChangeFields>>;
  maximum?: InputMaybe<Array<ChangeFields>>;
  minimum?: InputMaybe<Array<ChangeFields>>;
  sum?: InputMaybe<Array<ChangeFields>>;
};

export type ChangeCreateInput = {
  data?: InputMaybe<Scalars['ChangeData']['input']>;
  key: Scalars['String']['input'];
  mutation: ChangeMutation;
  table: Scalars['String']['input'];
  userId?: InputMaybe<Scalars['String']['input']>;
};

export enum ChangeFields {
  CreatedAt = 'createdAt',
  Data = 'data',
  Id = 'id',
  Key = 'key',
  Mutation = 'mutation',
  Table = 'table',
  UpdatedAt = 'updatedAt',
  UserId = 'userId'
}

export type ChangeFilter = {
  AND?: InputMaybe<Array<ChangeFilter>>;
  NOT?: InputMaybe<ChangeFilter>;
  OR?: InputMaybe<Array<ChangeFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  key?: InputMaybe<StringFilter>;
  mutation?: InputMaybe<ChangeMutation>;
  table?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  user?: InputMaybe<UserFilter>;
  userId?: InputMaybe<StringFilter>;
};

export enum ChangeMutation {
  Create = 'Create',
  Delete = 'Delete',
  Update = 'Update',
  Upsert = 'Upsert'
}

export type ChangeOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  key?: InputMaybe<OrderBy>;
  mutation?: InputMaybe<OrderBy>;
  table?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
  userId?: InputMaybe<OrderBy>;
};

export type ChangeUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type ChangeUpdateInput = {
  data?: InputMaybe<Scalars['ChangeData']['input']>;
  key?: InputMaybe<Scalars['String']['input']>;
  mutation?: InputMaybe<ChangeMutation>;
  table?: InputMaybe<Scalars['String']['input']>;
  userId?: InputMaybe<Scalars['String']['input']>;
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

export type Configuration = {
  __typename?: 'Configuration';
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  fridaySchedule?: Maybe<Schedule>;
  fridayScheduleId?: Maybe<Scalars['String']['output']>;
  holidaySchedule?: Maybe<Schedule>;
  holidayScheduleId?: Maybe<Scalars['String']['output']>;
  holidays?: Maybe<Array<Holiday>>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  mondaySchedule?: Maybe<Schedule>;
  mondayScheduleId?: Maybe<Scalars['String']['output']>;
  occupancies?: Maybe<Array<Occupancy>>;
  saturdaySchedule?: Maybe<Schedule>;
  saturdayScheduleId?: Maybe<Scalars['String']['output']>;
  setpoint?: Maybe<Setpoint>;
  setpointId?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<ModelStage>;
  sundaySchedule?: Maybe<Schedule>;
  sundayScheduleId?: Maybe<Scalars['String']['output']>;
  thursdaySchedule?: Maybe<Schedule>;
  thursdayScheduleId?: Maybe<Scalars['String']['output']>;
  tuesdaySchedule?: Maybe<Schedule>;
  tuesdayScheduleId?: Maybe<Scalars['String']['output']>;
  units?: Maybe<Array<Unit>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  wednesdaySchedule?: Maybe<Schedule>;
  wednesdayScheduleId?: Maybe<Scalars['String']['output']>;
};

export type ConfigurationAggregate = {
  average?: InputMaybe<Array<ConfigurationFields>>;
  count?: InputMaybe<Array<ConfigurationFields>>;
  maximum?: InputMaybe<Array<ConfigurationFields>>;
  minimum?: InputMaybe<Array<ConfigurationFields>>;
  sum?: InputMaybe<Array<ConfigurationFields>>;
};

export type ConfigurationCreateHolidaysRelationInput = {
  create?: InputMaybe<Array<HolidayCreateInput>>;
};

export type ConfigurationCreateInput = {
  correlation?: InputMaybe<Scalars['String']['input']>;
  fridayScheduleId?: InputMaybe<Scalars['String']['input']>;
  holidayScheduleId?: InputMaybe<Scalars['String']['input']>;
  holidays?: InputMaybe<ConfigurationCreateHolidaysRelationInput>;
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  mondayScheduleId?: InputMaybe<Scalars['String']['input']>;
  occupancies?: InputMaybe<ConfigurationCreateOccupanciesRelationInput>;
  saturdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  setpointId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  sundayScheduleId?: InputMaybe<Scalars['String']['input']>;
  thursdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  tuesdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  wednesdayScheduleId?: InputMaybe<Scalars['String']['input']>;
};

export type ConfigurationCreateOccupanciesRelationInput = {
  create?: InputMaybe<Array<OccupancyCreateInput>>;
};

export enum ConfigurationFields {
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  FridayScheduleId = 'fridayScheduleId',
  HolidayScheduleId = 'holidayScheduleId',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  MondayScheduleId = 'mondayScheduleId',
  SaturdayScheduleId = 'saturdayScheduleId',
  SetpointId = 'setpointId',
  Stage = 'stage',
  SundayScheduleId = 'sundayScheduleId',
  ThursdayScheduleId = 'thursdayScheduleId',
  TuesdayScheduleId = 'tuesdayScheduleId',
  UpdatedAt = 'updatedAt',
  WednesdayScheduleId = 'wednesdayScheduleId'
}

export type ConfigurationFilter = {
  AND?: InputMaybe<Array<ConfigurationFilter>>;
  NOT?: InputMaybe<ConfigurationFilter>;
  OR?: InputMaybe<Array<ConfigurationFilter>>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  fridayScheduleId?: InputMaybe<StringFilter>;
  holidayScheduleId?: InputMaybe<StringFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  mondayScheduleId?: InputMaybe<StringFilter>;
  saturdayScheduleId?: InputMaybe<StringFilter>;
  setpointId?: InputMaybe<StringFilter>;
  stage?: InputMaybe<ModelStage>;
  sundayScheduleId?: InputMaybe<StringFilter>;
  thursdayScheduleId?: InputMaybe<StringFilter>;
  tuesdayScheduleId?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  wednesdayScheduleId?: InputMaybe<StringFilter>;
};

export type ConfigurationOrderBy = {
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  fridayScheduleId?: InputMaybe<OrderBy>;
  holidayScheduleId?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  mondayScheduleId?: InputMaybe<OrderBy>;
  saturdayScheduleId?: InputMaybe<OrderBy>;
  setpointId?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  sundayScheduleId?: InputMaybe<OrderBy>;
  thursdayScheduleId?: InputMaybe<OrderBy>;
  tuesdayScheduleId?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
  wednesdayScheduleId?: InputMaybe<OrderBy>;
};

export type ConfigurationUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type ConfigurationUpdateFridayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateHolidayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateHolidaysRelationInput = {
  connect?: InputMaybe<Array<HolidayUniqueFilter>>;
  delete?: InputMaybe<Array<HolidayUniqueFilter>>;
};

export type ConfigurationUpdateInput = {
  correlation?: InputMaybe<Scalars['String']['input']>;
  fridaySchedule?: InputMaybe<ConfigurationUpdateFridayScheduleRelationInput>;
  fridayScheduleId?: InputMaybe<Scalars['String']['input']>;
  holidaySchedule?: InputMaybe<ConfigurationUpdateHolidayScheduleRelationInput>;
  holidayScheduleId?: InputMaybe<Scalars['String']['input']>;
  holidays?: InputMaybe<ConfigurationUpdateHolidaysRelationInput>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  mondaySchedule?: InputMaybe<ConfigurationUpdateMondayScheduleRelationInput>;
  mondayScheduleId?: InputMaybe<Scalars['String']['input']>;
  occupancies?: InputMaybe<ConfigurationUpdateOccupanciesRelationInput>;
  saturdaySchedule?: InputMaybe<ConfigurationUpdateSaturdayScheduleRelationInput>;
  saturdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  setpoint?: InputMaybe<ConfigurationUpdateSetpointRelationInput>;
  setpointId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  sundaySchedule?: InputMaybe<ConfigurationUpdateSundayScheduleRelationInput>;
  sundayScheduleId?: InputMaybe<Scalars['String']['input']>;
  thursdaySchedule?: InputMaybe<ConfigurationUpdateThursdayScheduleRelationInput>;
  thursdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  tuesdaySchedule?: InputMaybe<ConfigurationUpdateTuesdayScheduleRelationInput>;
  tuesdayScheduleId?: InputMaybe<Scalars['String']['input']>;
  wednesdaySchedule?: InputMaybe<ConfigurationUpdateWednesdayScheduleRelationInput>;
  wednesdayScheduleId?: InputMaybe<Scalars['String']['input']>;
};

export type ConfigurationUpdateMondayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateOccupanciesRelationInput = {
  connect?: InputMaybe<Array<OccupancyUniqueFilter>>;
  delete?: InputMaybe<Array<OccupancyUniqueFilter>>;
};

export type ConfigurationUpdateSaturdayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateSetpointRelationInput = {
  update?: InputMaybe<SetpointUpdateInput>;
};

export type ConfigurationUpdateSundayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateThursdayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateTuesdayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type ConfigurationUpdateWednesdayScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

export type Control = {
  __typename?: 'Control';
  building?: Maybe<Scalars['String']['output']>;
  campus?: Maybe<Scalars['String']['output']>;
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  peakLoadExclude?: Maybe<Scalars['Boolean']['output']>;
  stage?: Maybe<ModelStage>;
  units?: Maybe<Array<Unit>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type ControlAggregate = {
  average?: InputMaybe<Array<ControlFields>>;
  count?: InputMaybe<Array<ControlFields>>;
  maximum?: InputMaybe<Array<ControlFields>>;
  minimum?: InputMaybe<Array<ControlFields>>;
  sum?: InputMaybe<Array<ControlFields>>;
};

export type ControlCreateInput = {
  building?: InputMaybe<Scalars['String']['input']>;
  campus?: InputMaybe<Scalars['String']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  peakLoadExclude?: InputMaybe<Scalars['Boolean']['input']>;
  stage?: InputMaybe<ModelStage>;
  units?: InputMaybe<UnitUniqueFilter>;
};

export enum ControlFields {
  Building = 'building',
  Campus = 'campus',
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  Name = 'name',
  PeakLoadExclude = 'peakLoadExclude',
  Stage = 'stage',
  UpdatedAt = 'updatedAt'
}

export type ControlFilter = {
  AND?: InputMaybe<Array<ControlFilter>>;
  NOT?: InputMaybe<ControlFilter>;
  OR?: InputMaybe<Array<ControlFilter>>;
  building?: InputMaybe<StringFilter>;
  campus?: InputMaybe<StringFilter>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  peakLoadExclude?: InputMaybe<BooleanFilter>;
  stage?: InputMaybe<ModelStage>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type ControlOrderBy = {
  building?: InputMaybe<OrderBy>;
  campus?: InputMaybe<OrderBy>;
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  peakLoadExclude?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type ControlUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type ControlUpdateInput = {
  building?: InputMaybe<Scalars['String']['input']>;
  campus?: InputMaybe<Scalars['String']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  peakLoadExclude?: InputMaybe<Scalars['Boolean']['input']>;
  stage?: InputMaybe<ModelStage>;
  units?: InputMaybe<UnitUniqueFilter>;
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

export type Holiday = {
  __typename?: 'Holiday';
  configurations?: Maybe<Array<Configuration>>;
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  day?: Maybe<Scalars['Int']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  month?: Maybe<Scalars['Int']['output']>;
  observance?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<ModelStage>;
  type?: Maybe<HolidayType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type HolidayAggregate = {
  average?: InputMaybe<Array<HolidayFields>>;
  count?: InputMaybe<Array<HolidayFields>>;
  maximum?: InputMaybe<Array<HolidayFields>>;
  minimum?: InputMaybe<Array<HolidayFields>>;
  sum?: InputMaybe<Array<HolidayFields>>;
};

export type HolidayCreateConfigurationsRelationInput = {
  connect?: InputMaybe<Array<ConfigurationUniqueFilter>>;
};

export type HolidayCreateInput = {
  configurations?: InputMaybe<HolidayCreateConfigurationsRelationInput>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  day?: InputMaybe<Scalars['Int']['input']>;
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Int']['input']>;
  observance?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  type: HolidayType;
};

export enum HolidayFields {
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  Day = 'day',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  Month = 'month',
  Observance = 'observance',
  Stage = 'stage',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export type HolidayFilter = {
  AND?: InputMaybe<Array<HolidayFilter>>;
  NOT?: InputMaybe<HolidayFilter>;
  OR?: InputMaybe<Array<HolidayFilter>>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  day?: InputMaybe<IntFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  month?: InputMaybe<IntFilter>;
  observance?: InputMaybe<StringFilter>;
  stage?: InputMaybe<ModelStage>;
  type?: InputMaybe<HolidayType>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type HolidayOrderBy = {
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  day?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  month?: InputMaybe<OrderBy>;
  observance?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  type?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export enum HolidayType {
  Custom = 'Custom',
  Disabled = 'Disabled',
  Enabled = 'Enabled'
}

export type HolidayUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type HolidayUpdateConfigurationsRelationInput = {
  connect?: InputMaybe<Array<ConfigurationUniqueFilter>>;
};

export type HolidayUpdateInput = {
  configurations?: InputMaybe<HolidayUpdateConfigurationsRelationInput>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  day?: InputMaybe<Scalars['Int']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  month?: InputMaybe<Scalars['Int']['input']>;
  observance?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  type?: InputMaybe<HolidayType>;
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

export type Location = {
  __typename?: 'Location';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['ID']['output']>;
  latitude?: Maybe<Scalars['Float']['output']>;
  longitude?: Maybe<Scalars['Float']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  units?: Maybe<Array<Unit>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type LocationAggregate = {
  average?: InputMaybe<Array<LocationFields>>;
  count?: InputMaybe<Array<LocationFields>>;
  maximum?: InputMaybe<Array<LocationFields>>;
  minimum?: InputMaybe<Array<LocationFields>>;
  sum?: InputMaybe<Array<LocationFields>>;
};

export type LocationCreateInput = {
  latitude: Scalars['Float']['input'];
  longitude: Scalars['Float']['input'];
  name: Scalars['String']['input'];
  units?: InputMaybe<LocationCreateUnitsRelationInput>;
};

export type LocationCreateUnitsRelationInput = {
  connect?: InputMaybe<Array<UnitUniqueFilter>>;
};

export enum LocationFields {
  CreatedAt = 'createdAt',
  Id = 'id',
  Latitude = 'latitude',
  Longitude = 'longitude',
  Name = 'name',
  UpdatedAt = 'updatedAt'
}

export type LocationFilter = {
  AND?: InputMaybe<Array<LocationFilter>>;
  NOT?: InputMaybe<LocationFilter>;
  OR?: InputMaybe<Array<LocationFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  latitude?: InputMaybe<FloatFilter>;
  longitude?: InputMaybe<FloatFilter>;
  name?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type LocationOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  latitude?: InputMaybe<OrderBy>;
  longitude?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type LocationUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type LocationUpdateInput = {
  latitude?: InputMaybe<Scalars['Float']['input']>;
  longitude?: InputMaybe<Scalars['Float']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  units?: InputMaybe<LocationUpdateUnitsRelationInput>;
};

export type LocationUpdateUnitsRelationInput = {
  connect?: InputMaybe<Array<UnitUniqueFilter>>;
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

export enum ModelStage {
  Complete = 'Complete',
  Create = 'Create',
  Delete = 'Delete',
  Fail = 'Fail',
  Process = 'Process',
  Read = 'Read',
  Update = 'Update'
}

export type Mutation = {
  __typename?: 'Mutation';
  /** Create a new account. */
  createAccount?: Maybe<Account>;
  /** Create a new banner. */
  createBanner?: Maybe<Banner>;
  /** Create a new change. */
  createChange?: Maybe<Change>;
  /** Create a new comment. */
  createComment?: Maybe<Comment>;
  /** Create a new configuration. */
  createConfiguration?: Maybe<Configuration>;
  /** Create a new control. */
  createControl?: Maybe<Control>;
  /** Create a new user. */
  createCurrent?: Maybe<User>;
  /** Create new feedback. */
  createFeedback?: Maybe<Feedback>;
  /** Create a local file record. */
  createFile?: Maybe<File>;
  /** Create a new holiday. */
  createHoliday?: Maybe<Holiday>;
  /** Create a new location. */
  createLocation?: Maybe<Location>;
  /** Create a new log. */
  createLog?: Maybe<Log>;
  /** Create a new occupancy. */
  createOccupancy?: Maybe<Occupancy>;
  /** Create a new schedule. */
  createSchedule?: Maybe<Schedule>;
  /** Create a new setpoint. */
  createSetpoint?: Maybe<Setpoint>;
  /** Create a new unit. */
  createUnit?: Maybe<Unit>;
  /** Create a new user. */
  createUser?: Maybe<User>;
  /** Delete the specified account. */
  deleteAccount?: Maybe<Account>;
  /** Delete the specified banner. */
  deleteBanner?: Maybe<Banner>;
  /** Delete the specified change. */
  deleteChange?: Maybe<Change>;
  /** Delete the specified comment. */
  deleteComment?: Maybe<Comment>;
  /** Delete the specified configuration. */
  deleteConfiguration?: Maybe<Configuration>;
  /** Delete the specified control. */
  deleteControl?: Maybe<Control>;
  /** Delete the currently logged in user. */
  deleteCurrent?: Maybe<User>;
  /** Delete the specified feedback. */
  deleteFeedback?: Maybe<Feedback>;
  /** Delete a local file record. */
  deleteFile?: Maybe<File>;
  /** Delete the specified holiday. */
  deleteHoliday?: Maybe<Holiday>;
  /** Delete the specified location. */
  deleteLocation?: Maybe<Location>;
  /** Delete the specified log. */
  deleteLog?: Maybe<Log>;
  /** Delete the specified occupancy. */
  deleteOccupancy?: Maybe<Occupancy>;
  /** Delete the specified schedule. */
  deleteSchedule?: Maybe<Schedule>;
  /** Delete the specified setpoint. */
  deleteSetpoint?: Maybe<Setpoint>;
  /** Delete the specified unit. */
  deleteUnit?: Maybe<Unit>;
  /** Delete the specified user. */
  deleteUser?: Maybe<User>;
  /** Update the specified account. */
  updateAccount?: Maybe<Account>;
  /** Update the specified banner. */
  updateBanner?: Maybe<Banner>;
  /** Update the specified change. */
  updateChange?: Maybe<Change>;
  /** Update the specified comment. */
  updateComment?: Maybe<Comment>;
  /** Update the specified configuration. */
  updateConfiguration?: Maybe<Configuration>;
  /** Update the specified control. */
  updateControl?: Maybe<Control>;
  /** Update the currently logged in user. */
  updateCurrent?: Maybe<User>;
  /** Update the specified feedback status. */
  updateFeedback?: Maybe<Feedback>;
  /** Update a local file record. */
  updateFile?: Maybe<File>;
  /** Update the specified holiday. */
  updateHoliday?: Maybe<Holiday>;
  /** Update the specified location. */
  updateLocation?: Maybe<Location>;
  /** Update the specified log. */
  updateLog?: Maybe<Log>;
  /** Update the specified occupancy. */
  updateOccupancy?: Maybe<Occupancy>;
  /** Update the specified schedule. */
  updateSchedule?: Maybe<Schedule>;
  /** Update the specified setpoint. */
  updateSetpoint?: Maybe<Setpoint>;
  /** Update the specified unit. */
  updateUnit?: Maybe<Unit>;
  /** Update the specified user. */
  updateUser?: Maybe<User>;
};


export type MutationCreateAccountArgs = {
  create: AccountCreateInput;
};


export type MutationCreateBannerArgs = {
  create: BannerCreateInput;
};


export type MutationCreateChangeArgs = {
  create: ChangeCreateInput;
};


export type MutationCreateCommentArgs = {
  create: CommentCreateInput;
};


export type MutationCreateConfigurationArgs = {
  create: ConfigurationCreateInput;
};


export type MutationCreateControlArgs = {
  create: ControlCreateInput;
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


export type MutationCreateHolidayArgs = {
  create: HolidayCreateInput;
};


export type MutationCreateLocationArgs = {
  create: LocationCreateInput;
};


export type MutationCreateLogArgs = {
  create: LogCreateInput;
};


export type MutationCreateOccupancyArgs = {
  create: OccupancyCreateInput;
};


export type MutationCreateScheduleArgs = {
  create: ScheduleCreateInput;
};


export type MutationCreateSetpointArgs = {
  create: SetpointCreateInput;
};


export type MutationCreateUnitArgs = {
  create: UnitCreateInput;
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


export type MutationDeleteChangeArgs = {
  where: ChangeUniqueFilter;
};


export type MutationDeleteCommentArgs = {
  where: CommentUniqueFilter;
};


export type MutationDeleteConfigurationArgs = {
  where: ConfigurationUniqueFilter;
};


export type MutationDeleteControlArgs = {
  where: ControlUniqueFilter;
};


export type MutationDeleteFeedbackArgs = {
  where: FeedbackUniqueFilter;
};


export type MutationDeleteFileArgs = {
  where: FileUniqueFilter;
};


export type MutationDeleteHolidayArgs = {
  where: HolidayUniqueFilter;
};


export type MutationDeleteLocationArgs = {
  where: LocationUniqueFilter;
};


export type MutationDeleteLogArgs = {
  where: LogUniqueFilter;
};


export type MutationDeleteOccupancyArgs = {
  where: OccupancyUniqueFilter;
};


export type MutationDeleteScheduleArgs = {
  where: ScheduleUniqueFilter;
};


export type MutationDeleteSetpointArgs = {
  where: SetpointUniqueFilter;
};


export type MutationDeleteUnitArgs = {
  where: UnitUniqueFilter;
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


export type MutationUpdateChangeArgs = {
  update: ChangeUpdateInput;
  where: ChangeUniqueFilter;
};


export type MutationUpdateCommentArgs = {
  update: CommentUpdateInput;
  where: CommentUniqueFilter;
};


export type MutationUpdateConfigurationArgs = {
  update: ConfigurationUpdateInput;
  where: ConfigurationUniqueFilter;
};


export type MutationUpdateControlArgs = {
  update: ControlUpdateInput;
  where: ControlUniqueFilter;
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


export type MutationUpdateHolidayArgs = {
  update: HolidayUpdateInput;
  where: HolidayUniqueFilter;
};


export type MutationUpdateLocationArgs = {
  update: LocationUpdateInput;
  where: LocationUniqueFilter;
};


export type MutationUpdateLogArgs = {
  update: LogUpdateInput;
  where: LogUniqueFilter;
};


export type MutationUpdateOccupancyArgs = {
  update: OccupancyUpdateInput;
  where: OccupancyUniqueFilter;
};


export type MutationUpdateScheduleArgs = {
  update: ScheduleUpdateInput;
  where: ScheduleUniqueFilter;
};


export type MutationUpdateSetpointArgs = {
  update: SetpointUpdateInput;
  where: SetpointUniqueFilter;
};


export type MutationUpdateUnitArgs = {
  update: UnitUpdateInput;
  where: UnitUniqueFilter;
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

export type Occupancy = {
  __typename?: 'Occupancy';
  configuration?: Maybe<Configuration>;
  configurationId?: Maybe<Scalars['String']['output']>;
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  date?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  schedule?: Maybe<Schedule>;
  scheduleId?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<ModelStage>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type OccupancyAggregate = {
  average?: InputMaybe<Array<OccupancyFields>>;
  count?: InputMaybe<Array<OccupancyFields>>;
  maximum?: InputMaybe<Array<OccupancyFields>>;
  minimum?: InputMaybe<Array<OccupancyFields>>;
  sum?: InputMaybe<Array<OccupancyFields>>;
};

export type OccupancyCreateConfigurationRelationInput = {
  connect?: InputMaybe<ConfigurationUniqueFilter>;
};

export type OccupancyCreateInput = {
  configuration?: InputMaybe<OccupancyCreateConfigurationRelationInput>;
  configurationId?: InputMaybe<Scalars['String']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  date: Scalars['DateTime']['input'];
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  schedule?: InputMaybe<OccupancyCreateScheduleRelationInput>;
  scheduleId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
};

export type OccupancyCreateScheduleRelationInput = {
  create?: InputMaybe<ScheduleCreateInput>;
};

export enum OccupancyFields {
  ConfigurationId = 'configurationId',
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  Date = 'date',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  ScheduleId = 'scheduleId',
  Stage = 'stage',
  UpdatedAt = 'updatedAt'
}

export type OccupancyFilter = {
  AND?: InputMaybe<Array<OccupancyFilter>>;
  NOT?: InputMaybe<OccupancyFilter>;
  OR?: InputMaybe<Array<OccupancyFilter>>;
  configurationId?: InputMaybe<StringFilter>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  date?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  scheduleId?: InputMaybe<StringFilter>;
  stage?: InputMaybe<ModelStage>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type OccupancyOrderBy = {
  configurationId?: InputMaybe<OrderBy>;
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  date?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  scheduleId?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type OccupancyUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type OccupancyUpdateConfigurationRelationInput = {
  connect?: InputMaybe<ConfigurationUniqueFilter>;
};

export type OccupancyUpdateInput = {
  configuration?: InputMaybe<OccupancyUpdateConfigurationRelationInput>;
  configurationId?: InputMaybe<Scalars['String']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  date?: InputMaybe<Scalars['DateTime']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  schedule?: InputMaybe<OccupancyUpdateScheduleRelationInput>;
  scheduleId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
};

export type OccupancyUpdateScheduleRelationInput = {
  update?: InputMaybe<ScheduleUpdateInput>;
};

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
  /** Count the number of changes. */
  countChanges?: Maybe<Scalars['Int']['output']>;
  /** Count the number of comments. */
  countComments?: Maybe<Scalars['Int']['output']>;
  /** Count the number of configurations. */
  countConfigurations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of controls. */
  countControls?: Maybe<Scalars['Int']['output']>;
  /** Count the number of feedbacks. */
  countFeedbacks?: Maybe<Scalars['Int']['output']>;
  /** Count the number of files. */
  countFiles?: Maybe<Scalars['Int']['output']>;
  /** Count the number of geographies. */
  countGeographies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of holidays. */
  countHolidays?: Maybe<Scalars['Int']['output']>;
  /** Count the number of locations. */
  countLocations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of logs. */
  countLogs?: Maybe<Scalars['Int']['output']>;
  /** Count the number of occupancies. */
  countOccupancies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of schedules. */
  countSchedules?: Maybe<Scalars['Int']['output']>;
  /** Count the number of setpoints. */
  countSetpoints?: Maybe<Scalars['Int']['output']>;
  /** Count the number of units. */
  countUnits?: Maybe<Scalars['Int']['output']>;
  /** Count the number of user. */
  countUsers?: Maybe<Scalars['Int']['output']>;
  /** Group a list of accounts. */
  groupAccounts?: Maybe<Array<Scalars['AccountGroupBy']['output']>>;
  /** Group a list of banners. */
  groupBanners?: Maybe<Array<Scalars['BannerGroupBy']['output']>>;
  /** Group a list of changes. */
  groupChanges?: Maybe<Array<Scalars['ChangeGroupBy']['output']>>;
  /** Group a list of comments. */
  groupComments?: Maybe<Array<Scalars['CommentGroupBy']['output']>>;
  /** Group a list of configurations. */
  groupConfigurations?: Maybe<Array<Scalars['ConfigurationGroupBy']['output']>>;
  /** Group a list of controls. */
  groupControls?: Maybe<Array<Scalars['ControlGroupBy']['output']>>;
  /** Group a list of feedbacks. */
  groupFeedbacks?: Maybe<Array<Scalars['FeedbackGroupBy']['output']>>;
  /** Group a list of files. */
  groupFiles?: Maybe<Array<Scalars['FileGroupBy']['output']>>;
  /** Group a list of geographies. */
  groupGeographies?: Maybe<Array<Scalars['GeographyGroupBy']['output']>>;
  /** Group a list of holidays. */
  groupHolidays?: Maybe<Array<Scalars['HolidayGroupBy']['output']>>;
  /** Group a list of locations. */
  groupLocations?: Maybe<Array<Scalars['LocationGroupBy']['output']>>;
  /** Group a list of logs. */
  groupLogs?: Maybe<Array<Scalars['LogGroupBy']['output']>>;
  /** Group a list of occupancies. */
  groupOccupancies?: Maybe<Array<Scalars['OccupancyGroupBy']['output']>>;
  /** Group a list of schedules. */
  groupSchedules?: Maybe<Array<Scalars['ScheduleGroupBy']['output']>>;
  /** Group a list of setpoints. */
  groupSetpoints?: Maybe<Array<Scalars['SetpointGroupBy']['output']>>;
  /** Group a list of units. */
  groupUnits?: Maybe<Array<Scalars['UnitGroupBy']['output']>>;
  /** Group a list of user. */
  groupUsers?: Maybe<Array<Scalars['UserGroupBy']['output']>>;
  /** Paginate through multiple accounts. */
  pageAccount?: Maybe<QueryPageAccountConnection>;
  /** Paginate through multiple banners. */
  pageBanner?: Maybe<QueryPageBannerConnection>;
  /** Paginate through multiple changes. */
  pageChange?: Maybe<QueryPageChangeConnection>;
  /** Paginate through multiple comments. */
  pageComment?: Maybe<QueryPageCommentConnection>;
  /** Paginate through multiple configurations. */
  pageConfiguration?: Maybe<QueryPageConfigurationConnection>;
  /** Paginate through multiple controls. */
  pageControl?: Maybe<QueryPageControlConnection>;
  /** Paginate through multiple feedback. */
  pageFeedback?: Maybe<QueryPageFeedbackConnection>;
  /** Paginate through multiple files. */
  pageFile?: Maybe<QueryPageFileConnection>;
  /** Paginate through multiple geographies. */
  pageGeography?: Maybe<QueryPageGeographyConnection>;
  /** Paginate through multiple holidays. */
  pageHoliday?: Maybe<QueryPageHolidayConnection>;
  /** Paginate through multiple locations. */
  pageLocation?: Maybe<QueryPageLocationConnection>;
  /** Paginate through multiple logs. */
  pageLog?: Maybe<QueryPageLogConnection>;
  /** Paginate through multiple occupancies. */
  pageOccupancy?: Maybe<QueryPageOccupancyConnection>;
  /** Paginate through multiple schedules. */
  pageSchedule?: Maybe<QueryPageScheduleConnection>;
  /** Paginate through multiple setpoints. */
  pageSetpoint?: Maybe<QueryPageSetpointConnection>;
  /** Paginate through multiple units. */
  pageUnit?: Maybe<QueryPageUnitConnection>;
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
  /** Read a unique change. */
  readChange?: Maybe<Change>;
  /** Read a list of changes. */
  readChanges?: Maybe<Array<Change>>;
  /** Read a unique comment. */
  readComment?: Maybe<Comment>;
  /** Read a list of comments. */
  readComments?: Maybe<Array<Comment>>;
  /** Read a unique configuration. */
  readConfiguration?: Maybe<Configuration>;
  /** Read a list of configurations. */
  readConfigurations?: Maybe<Array<Configuration>>;
  /** Read a unique control. */
  readControl?: Maybe<Control>;
  /** Read a list of controls. */
  readControls?: Maybe<Array<Control>>;
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
  /** Read a unique holiday. */
  readHoliday?: Maybe<Holiday>;
  /** Read a list of holidays. */
  readHolidays?: Maybe<Array<Holiday>>;
  /** Read a unique location. */
  readLocation?: Maybe<Location>;
  /** Read a list of locations. */
  readLocations?: Maybe<Array<Location>>;
  /** Read a unique log. */
  readLog?: Maybe<Log>;
  /** Read a list of logs. */
  readLogs?: Maybe<Array<Log>>;
  /** Read a list of occupancies. */
  readOccupancies?: Maybe<Array<Occupancy>>;
  /** Read a unique occupancy. */
  readOccupancy?: Maybe<Occupancy>;
  /** Read a unique schedule. */
  readSchedule?: Maybe<Schedule>;
  /** Read a list of schedules. */
  readSchedules?: Maybe<Array<Schedule>>;
  /** Read a unique setpoint. */
  readSetpoint?: Maybe<Setpoint>;
  /** Read a list of setpoints. */
  readSetpoints?: Maybe<Array<Setpoint>>;
  /** Read a unique unit. */
  readUnit?: Maybe<Unit>;
  /** Read a list of units. */
  readUnits?: Maybe<Array<Unit>>;
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


export type QueryCountChangesArgs = {
  where?: InputMaybe<ChangeFilter>;
};


export type QueryCountCommentsArgs = {
  where?: InputMaybe<CommentFilter>;
};


export type QueryCountConfigurationsArgs = {
  where?: InputMaybe<ConfigurationFilter>;
};


export type QueryCountControlsArgs = {
  where?: InputMaybe<ControlFilter>;
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


export type QueryCountHolidaysArgs = {
  where?: InputMaybe<HolidayFilter>;
};


export type QueryCountLocationsArgs = {
  where?: InputMaybe<LocationFilter>;
};


export type QueryCountLogsArgs = {
  where?: InputMaybe<LogFilter>;
};


export type QueryCountOccupanciesArgs = {
  where?: InputMaybe<OccupancyFilter>;
};


export type QueryCountSchedulesArgs = {
  where?: InputMaybe<ScheduleFilter>;
};


export type QueryCountSetpointsArgs = {
  where?: InputMaybe<SetpointFilter>;
};


export type QueryCountUnitsArgs = {
  where?: InputMaybe<UnitFilter>;
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


export type QueryGroupChangesArgs = {
  aggregate?: InputMaybe<ChangeAggregate>;
  by: Array<ChangeFields>;
  where?: InputMaybe<ChangeFilter>;
};


export type QueryGroupCommentsArgs = {
  aggregate?: InputMaybe<CommentAggregate>;
  by: Array<CommentFields>;
  where?: InputMaybe<CommentFilter>;
};


export type QueryGroupConfigurationsArgs = {
  aggregate?: InputMaybe<ConfigurationAggregate>;
  by: Array<ConfigurationFields>;
  where?: InputMaybe<ConfigurationFilter>;
};


export type QueryGroupControlsArgs = {
  aggregate?: InputMaybe<ControlAggregate>;
  by: Array<ControlFields>;
  where?: InputMaybe<ControlFilter>;
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


export type QueryGroupHolidaysArgs = {
  aggregate?: InputMaybe<HolidayAggregate>;
  by: Array<HolidayFields>;
  where?: InputMaybe<HolidayFilter>;
};


export type QueryGroupLocationsArgs = {
  aggregate?: InputMaybe<LocationAggregate>;
  by: Array<LocationFields>;
  where?: InputMaybe<LocationFilter>;
};


export type QueryGroupLogsArgs = {
  aggregate?: InputMaybe<LogAggregate>;
  by: Array<LogFields>;
  where?: InputMaybe<LogFilter>;
};


export type QueryGroupOccupanciesArgs = {
  aggregate?: InputMaybe<OccupancyAggregate>;
  by: Array<OccupancyFields>;
  where?: InputMaybe<OccupancyFilter>;
};


export type QueryGroupSchedulesArgs = {
  aggregate?: InputMaybe<ScheduleAggregate>;
  by: Array<ScheduleFields>;
  where?: InputMaybe<ScheduleFilter>;
};


export type QueryGroupSetpointsArgs = {
  aggregate?: InputMaybe<SetpointAggregate>;
  by: Array<SetpointFields>;
  where?: InputMaybe<SetpointFilter>;
};


export type QueryGroupUnitsArgs = {
  aggregate?: InputMaybe<UnitAggregate>;
  by: Array<UnitFields>;
  where?: InputMaybe<UnitFilter>;
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


export type QueryPageChangeArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ChangeFilter>;
};


export type QueryPageCommentArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<CommentFilter>;
};


export type QueryPageConfigurationArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ConfigurationFilter>;
};


export type QueryPageControlArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ControlFilter>;
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


export type QueryPageHolidayArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<HolidayFilter>;
};


export type QueryPageLocationArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LocationFilter>;
};


export type QueryPageLogArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<LogFilter>;
};


export type QueryPageOccupancyArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<OccupancyFilter>;
};


export type QueryPageScheduleArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<ScheduleFilter>;
};


export type QueryPageSetpointArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<SetpointFilter>;
};


export type QueryPageUnitArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<UnitFilter>;
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


export type QueryReadChangeArgs = {
  where: ChangeUniqueFilter;
};


export type QueryReadChangesArgs = {
  distinct?: InputMaybe<Array<ChangeFields>>;
  orderBy?: InputMaybe<Array<ChangeOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ChangeFilter>;
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


export type QueryReadConfigurationArgs = {
  where: ConfigurationUniqueFilter;
};


export type QueryReadConfigurationsArgs = {
  distinct?: InputMaybe<Array<ConfigurationFields>>;
  orderBy?: InputMaybe<Array<ConfigurationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ConfigurationFilter>;
};


export type QueryReadControlArgs = {
  where: ControlUniqueFilter;
};


export type QueryReadControlsArgs = {
  distinct?: InputMaybe<Array<ControlFields>>;
  orderBy?: InputMaybe<Array<ControlOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ControlFilter>;
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


export type QueryReadHolidayArgs = {
  where: HolidayUniqueFilter;
};


export type QueryReadHolidaysArgs = {
  distinct?: InputMaybe<Array<HolidayFields>>;
  orderBy?: InputMaybe<Array<HolidayOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<HolidayFilter>;
};


export type QueryReadLocationArgs = {
  where: LocationUniqueFilter;
};


export type QueryReadLocationsArgs = {
  distinct?: InputMaybe<Array<LocationFields>>;
  orderBy?: InputMaybe<Array<LocationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<LocationFilter>;
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


export type QueryReadOccupanciesArgs = {
  distinct?: InputMaybe<Array<OccupancyFields>>;
  orderBy?: InputMaybe<Array<OccupancyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<OccupancyFilter>;
};


export type QueryReadOccupancyArgs = {
  where: OccupancyUniqueFilter;
};


export type QueryReadScheduleArgs = {
  where: ScheduleUniqueFilter;
};


export type QueryReadSchedulesArgs = {
  distinct?: InputMaybe<Array<ScheduleFields>>;
  orderBy?: InputMaybe<Array<ScheduleOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ScheduleFilter>;
};


export type QueryReadSetpointArgs = {
  where: SetpointUniqueFilter;
};


export type QueryReadSetpointsArgs = {
  distinct?: InputMaybe<Array<SetpointFields>>;
  orderBy?: InputMaybe<Array<SetpointOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<SetpointFilter>;
};


export type QueryReadUnitArgs = {
  where: UnitUniqueFilter;
};


export type QueryReadUnitsArgs = {
  distinct?: InputMaybe<Array<UnitFields>>;
  orderBy?: InputMaybe<Array<UnitOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<UnitFilter>;
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

export type QueryPageChangeConnection = {
  __typename?: 'QueryPageChangeConnection';
  edges?: Maybe<Array<Maybe<QueryPageChangeConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageChangeConnectionEdge = {
  __typename?: 'QueryPageChangeConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Change>;
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

export type QueryPageConfigurationConnection = {
  __typename?: 'QueryPageConfigurationConnection';
  edges?: Maybe<Array<Maybe<QueryPageConfigurationConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageConfigurationConnectionEdge = {
  __typename?: 'QueryPageConfigurationConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Configuration>;
};

export type QueryPageControlConnection = {
  __typename?: 'QueryPageControlConnection';
  edges?: Maybe<Array<Maybe<QueryPageControlConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageControlConnectionEdge = {
  __typename?: 'QueryPageControlConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Control>;
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

export type QueryPageHolidayConnection = {
  __typename?: 'QueryPageHolidayConnection';
  edges?: Maybe<Array<Maybe<QueryPageHolidayConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageHolidayConnectionEdge = {
  __typename?: 'QueryPageHolidayConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Holiday>;
};

export type QueryPageLocationConnection = {
  __typename?: 'QueryPageLocationConnection';
  edges?: Maybe<Array<Maybe<QueryPageLocationConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageLocationConnectionEdge = {
  __typename?: 'QueryPageLocationConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Location>;
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

export type QueryPageOccupancyConnection = {
  __typename?: 'QueryPageOccupancyConnection';
  edges?: Maybe<Array<Maybe<QueryPageOccupancyConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageOccupancyConnectionEdge = {
  __typename?: 'QueryPageOccupancyConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Occupancy>;
};

export type QueryPageScheduleConnection = {
  __typename?: 'QueryPageScheduleConnection';
  edges?: Maybe<Array<Maybe<QueryPageScheduleConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageScheduleConnectionEdge = {
  __typename?: 'QueryPageScheduleConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Schedule>;
};

export type QueryPageSetpointConnection = {
  __typename?: 'QueryPageSetpointConnection';
  edges?: Maybe<Array<Maybe<QueryPageSetpointConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageSetpointConnectionEdge = {
  __typename?: 'QueryPageSetpointConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Setpoint>;
};

export type QueryPageUnitConnection = {
  __typename?: 'QueryPageUnitConnection';
  edges?: Maybe<Array<Maybe<QueryPageUnitConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageUnitConnectionEdge = {
  __typename?: 'QueryPageUnitConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<Unit>;
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

export type Schedule = {
  __typename?: 'Schedule';
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  endTime?: Maybe<Scalars['String']['output']>;
  fridayConfigurations?: Maybe<Array<Configuration>>;
  holidayConfigurations?: Maybe<Array<Configuration>>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  mondayConfigurations?: Maybe<Array<Configuration>>;
  occupancies?: Maybe<Array<Occupancy>>;
  occupied?: Maybe<Scalars['Boolean']['output']>;
  saturdayConfigurations?: Maybe<Array<Configuration>>;
  setpoint?: Maybe<Setpoint>;
  setpointId?: Maybe<Scalars['String']['output']>;
  stage?: Maybe<ModelStage>;
  startTime?: Maybe<Scalars['String']['output']>;
  sundayConfigurations?: Maybe<Array<Configuration>>;
  thursdayConfigurations?: Maybe<Array<Configuration>>;
  tuesdayConfigurations?: Maybe<Array<Configuration>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  wednesdayConfigurations?: Maybe<Array<Configuration>>;
};

export type ScheduleAggregate = {
  average?: InputMaybe<Array<ScheduleFields>>;
  count?: InputMaybe<Array<ScheduleFields>>;
  maximum?: InputMaybe<Array<ScheduleFields>>;
  minimum?: InputMaybe<Array<ScheduleFields>>;
  sum?: InputMaybe<Array<ScheduleFields>>;
};

export type ScheduleCreateInput = {
  correlation?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  occupied?: InputMaybe<Scalars['Boolean']['input']>;
  setpoint?: InputMaybe<ScheduleCreateSetpointRelationInput>;
  setpointId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduleCreateSetpointRelationInput = {
  create?: InputMaybe<SetpointCreateInput>;
};

export enum ScheduleFields {
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  EndTime = 'endTime',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  Occupied = 'occupied',
  SetpointId = 'setpointId',
  Stage = 'stage',
  StartTime = 'startTime',
  UpdatedAt = 'updatedAt'
}

export type ScheduleFilter = {
  AND?: InputMaybe<Array<ScheduleFilter>>;
  NOT?: InputMaybe<ScheduleFilter>;
  OR?: InputMaybe<Array<ScheduleFilter>>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  endTime?: InputMaybe<StringFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  occupied?: InputMaybe<BooleanFilter>;
  setpointId?: InputMaybe<StringFilter>;
  stage?: InputMaybe<ModelStage>;
  startTime?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type ScheduleOrderBy = {
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  endTime?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  occupied?: InputMaybe<OrderBy>;
  setpointId?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  startTime?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type ScheduleUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduleUpdateInput = {
  correlation?: InputMaybe<Scalars['String']['input']>;
  endTime?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  occupied?: InputMaybe<Scalars['Boolean']['input']>;
  setpoint?: InputMaybe<ScheduleUpdateSetpointRelationInput>;
  setpointId?: InputMaybe<Scalars['String']['input']>;
  stage?: InputMaybe<ModelStage>;
  startTime?: InputMaybe<Scalars['String']['input']>;
};

export type ScheduleUpdateSetpointRelationInput = {
  update?: InputMaybe<SetpointUpdateInput>;
};

export type Setpoint = {
  __typename?: 'Setpoint';
  configurations?: Maybe<Array<Configuration>>;
  cooling?: Maybe<Scalars['Float']['output']>;
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  deadband?: Maybe<Scalars['Float']['output']>;
  heating?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  schedules?: Maybe<Array<Schedule>>;
  setpoint?: Maybe<Scalars['Float']['output']>;
  stage?: Maybe<ModelStage>;
  standbyOffset?: Maybe<Scalars['Float']['output']>;
  standbyTime?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type SetpointAggregate = {
  average?: InputMaybe<Array<SetpointFields>>;
  count?: InputMaybe<Array<SetpointFields>>;
  maximum?: InputMaybe<Array<SetpointFields>>;
  minimum?: InputMaybe<Array<SetpointFields>>;
  sum?: InputMaybe<Array<SetpointFields>>;
};

export type SetpointCreateInput = {
  cooling?: InputMaybe<Scalars['Float']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  deadband?: InputMaybe<Scalars['Float']['input']>;
  heating?: InputMaybe<Scalars['Float']['input']>;
  label: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  setpoint?: InputMaybe<Scalars['Float']['input']>;
  stage?: InputMaybe<ModelStage>;
  standbyOffset?: InputMaybe<Scalars['Float']['input']>;
  standbyTime?: InputMaybe<Scalars['Int']['input']>;
};

export enum SetpointFields {
  Cooling = 'cooling',
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  Deadband = 'deadband',
  Heating = 'heating',
  Id = 'id',
  Label = 'label',
  Message = 'message',
  Setpoint = 'setpoint',
  Stage = 'stage',
  StandbyOffset = 'standbyOffset',
  StandbyTime = 'standbyTime',
  UpdatedAt = 'updatedAt'
}

export type SetpointFilter = {
  AND?: InputMaybe<Array<SetpointFilter>>;
  NOT?: InputMaybe<SetpointFilter>;
  OR?: InputMaybe<Array<SetpointFilter>>;
  cooling?: InputMaybe<FloatFilter>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  deadband?: InputMaybe<FloatFilter>;
  heating?: InputMaybe<FloatFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  setpoint?: InputMaybe<FloatFilter>;
  stage?: InputMaybe<ModelStage>;
  standbyOffset?: InputMaybe<FloatFilter>;
  standbyTime?: InputMaybe<IntFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type SetpointOrderBy = {
  cooling?: InputMaybe<OrderBy>;
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  deadband?: InputMaybe<OrderBy>;
  heating?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  setpoint?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  standbyOffset?: InputMaybe<OrderBy>;
  standbyTime?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type SetpointUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type SetpointUpdateInput = {
  cooling?: InputMaybe<Scalars['Float']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  deadband?: InputMaybe<Scalars['Float']['input']>;
  heating?: InputMaybe<Scalars['Float']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  setpoint?: InputMaybe<Scalars['Float']['input']>;
  stage?: InputMaybe<ModelStage>;
  standbyOffset?: InputMaybe<Scalars['Float']['input']>;
  standbyTime?: InputMaybe<Scalars['Int']['input']>;
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
  /** Count the number of changes. */
  countChanges?: Maybe<Scalars['Int']['output']>;
  /** Count the number of comments. */
  countComments?: Maybe<Scalars['Int']['output']>;
  /** Count the number of configurations. */
  countConfigurations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of controls. */
  countControls?: Maybe<Scalars['Int']['output']>;
  /** Count the number of feedbacks. */
  countFeedbacks?: Maybe<Scalars['Int']['output']>;
  /** Count the number of files. */
  countFiles?: Maybe<Scalars['Int']['output']>;
  /** Count the number of geographies. */
  countGeographies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of holidays. */
  countHolidays?: Maybe<Scalars['Int']['output']>;
  /** Count the number of locations. */
  countLocations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of logs. */
  countLogs?: Maybe<Scalars['Int']['output']>;
  /** Count the number of occupancies. */
  countOccupancies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of schedules. */
  countSchedules?: Maybe<Scalars['Int']['output']>;
  /** Count the number of setpoints. */
  countSetpoints?: Maybe<Scalars['Int']['output']>;
  /** Count the number of units. */
  countUnits?: Maybe<Scalars['Int']['output']>;
  /** Count the number of user. */
  countUsers?: Maybe<Scalars['Int']['output']>;
  /** Group a list of accounts. */
  groupAccounts?: Maybe<Array<Scalars['AccountGroupBy']['output']>>;
  /** Group a list of banners. */
  groupBanners?: Maybe<Array<Scalars['BannerGroupBy']['output']>>;
  /** Group a list of changes. */
  groupChanges?: Maybe<Array<Scalars['ChangeGroupBy']['output']>>;
  /** Group a list of comments. */
  groupComments?: Maybe<Array<Scalars['CommentGroupBy']['output']>>;
  /** Group a list of configurations. */
  groupConfigurations?: Maybe<Array<Scalars['ConfigurationGroupBy']['output']>>;
  /** Group a list of controls. */
  groupControls?: Maybe<Array<Scalars['ControlGroupBy']['output']>>;
  /** Group a list of feedbacks. */
  groupFeedbacks?: Maybe<Array<Scalars['FeedbackGroupBy']['output']>>;
  /** Group a list of files. */
  groupFiles?: Maybe<Array<Scalars['FileGroupBy']['output']>>;
  /** Group a list of geographies. */
  groupGeographies?: Maybe<Array<Scalars['GeographyGroupBy']['output']>>;
  /** Group a list of holidays. */
  groupHolidays?: Maybe<Array<Scalars['HolidayGroupBy']['output']>>;
  /** Group a list of locations. */
  groupLocations?: Maybe<Array<Scalars['LocationGroupBy']['output']>>;
  /** Group a list of logs. */
  groupLogs?: Maybe<Array<Scalars['LogGroupBy']['output']>>;
  /** Group a list of occupancies. */
  groupOccupancies?: Maybe<Array<Scalars['OccupancyGroupBy']['output']>>;
  /** Group a list of schedules. */
  groupSchedules?: Maybe<Array<Scalars['ScheduleGroupBy']['output']>>;
  /** Group a list of setpoints. */
  groupSetpoints?: Maybe<Array<Scalars['SetpointGroupBy']['output']>>;
  /** Group a list of units. */
  groupUnits?: Maybe<Array<Scalars['UnitGroupBy']['output']>>;
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
  /** Read a unique change. */
  readChange?: Maybe<Change>;
  /** Read a list of changes. */
  readChanges?: Maybe<Array<Change>>;
  /** Read a unique comment. */
  readComment?: Maybe<Comment>;
  /** Read a list of comments. */
  readComments?: Maybe<Array<Comment>>;
  /** Read a unique configuration. */
  readConfiguration?: Maybe<Configuration>;
  /** Read a list of configurations. */
  readConfigurations?: Maybe<Array<Configuration>>;
  /** Read a unique control. */
  readControl?: Maybe<Control>;
  /** Read a list of controls. */
  readControls?: Maybe<Array<Control>>;
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
  /** Read a unique holiday. */
  readHoliday?: Maybe<Holiday>;
  /** Read a list of holidays. */
  readHolidays?: Maybe<Array<Holiday>>;
  /** Read a unique location. */
  readLocation?: Maybe<Location>;
  /** Read a list of locations. */
  readLocations?: Maybe<Array<Location>>;
  /** Read a unique log. */
  readLog?: Maybe<Log>;
  /** Read a list of logs. */
  readLogs?: Maybe<Array<Log>>;
  /** Read a list of occupancies. */
  readOccupancies?: Maybe<Array<Occupancy>>;
  /** Read a unique occupancy. */
  readOccupancy?: Maybe<Occupancy>;
  /** Read a unique schedule. */
  readSchedule?: Maybe<Schedule>;
  /** Read a list of schedules. */
  readSchedules?: Maybe<Array<Schedule>>;
  /** Read a unique setpoint. */
  readSetpoint?: Maybe<Setpoint>;
  /** Read a list of setpoints. */
  readSetpoints?: Maybe<Array<Setpoint>>;
  /** Read a unique unit. */
  readUnit?: Maybe<Unit>;
  /** Read a list of units. */
  readUnits?: Maybe<Array<Unit>>;
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


export type SubscriptionCountChangesArgs = {
  where?: InputMaybe<ChangeFilter>;
};


export type SubscriptionCountCommentsArgs = {
  where?: InputMaybe<CommentFilter>;
};


export type SubscriptionCountConfigurationsArgs = {
  where?: InputMaybe<ConfigurationFilter>;
};


export type SubscriptionCountControlsArgs = {
  where?: InputMaybe<ControlFilter>;
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


export type SubscriptionCountHolidaysArgs = {
  where?: InputMaybe<HolidayFilter>;
};


export type SubscriptionCountLocationsArgs = {
  where?: InputMaybe<LocationFilter>;
};


export type SubscriptionCountLogsArgs = {
  where?: InputMaybe<LogFilter>;
};


export type SubscriptionCountOccupanciesArgs = {
  where?: InputMaybe<OccupancyFilter>;
};


export type SubscriptionCountSchedulesArgs = {
  where?: InputMaybe<ScheduleFilter>;
};


export type SubscriptionCountSetpointsArgs = {
  where?: InputMaybe<SetpointFilter>;
};


export type SubscriptionCountUnitsArgs = {
  where?: InputMaybe<UnitFilter>;
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


export type SubscriptionGroupChangesArgs = {
  aggregate?: InputMaybe<ChangeAggregate>;
  by: Array<ChangeFields>;
  where?: InputMaybe<ChangeFilter>;
};


export type SubscriptionGroupCommentsArgs = {
  aggregate?: InputMaybe<CommentAggregate>;
  by: Array<CommentFields>;
  where?: InputMaybe<CommentFilter>;
};


export type SubscriptionGroupConfigurationsArgs = {
  aggregate?: InputMaybe<ConfigurationAggregate>;
  by: Array<ConfigurationFields>;
  where?: InputMaybe<ConfigurationFilter>;
};


export type SubscriptionGroupControlsArgs = {
  aggregate?: InputMaybe<ControlAggregate>;
  by: Array<ControlFields>;
  where?: InputMaybe<ControlFilter>;
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


export type SubscriptionGroupHolidaysArgs = {
  aggregate?: InputMaybe<HolidayAggregate>;
  by: Array<HolidayFields>;
  where?: InputMaybe<HolidayFilter>;
};


export type SubscriptionGroupLocationsArgs = {
  aggregate?: InputMaybe<LocationAggregate>;
  by: Array<LocationFields>;
  where?: InputMaybe<LocationFilter>;
};


export type SubscriptionGroupLogsArgs = {
  aggregate?: InputMaybe<LogAggregate>;
  by: Array<LogFields>;
  where?: InputMaybe<LogFilter>;
};


export type SubscriptionGroupOccupanciesArgs = {
  aggregate?: InputMaybe<OccupancyAggregate>;
  by: Array<OccupancyFields>;
  where?: InputMaybe<OccupancyFilter>;
};


export type SubscriptionGroupSchedulesArgs = {
  aggregate?: InputMaybe<ScheduleAggregate>;
  by: Array<ScheduleFields>;
  where?: InputMaybe<ScheduleFilter>;
};


export type SubscriptionGroupSetpointsArgs = {
  aggregate?: InputMaybe<SetpointAggregate>;
  by: Array<SetpointFields>;
  where?: InputMaybe<SetpointFilter>;
};


export type SubscriptionGroupUnitsArgs = {
  aggregate?: InputMaybe<UnitAggregate>;
  by: Array<UnitFields>;
  where?: InputMaybe<UnitFilter>;
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


export type SubscriptionReadChangeArgs = {
  where: ChangeUniqueFilter;
};


export type SubscriptionReadChangesArgs = {
  distinct?: InputMaybe<Array<ChangeFields>>;
  orderBy?: InputMaybe<Array<ChangeOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ChangeFilter>;
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


export type SubscriptionReadConfigurationArgs = {
  where: ConfigurationUniqueFilter;
};


export type SubscriptionReadConfigurationsArgs = {
  distinct?: InputMaybe<Array<ConfigurationFields>>;
  orderBy?: InputMaybe<Array<ConfigurationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ConfigurationFilter>;
};


export type SubscriptionReadControlArgs = {
  where: ControlUniqueFilter;
};


export type SubscriptionReadControlsArgs = {
  distinct?: InputMaybe<Array<ControlFields>>;
  orderBy?: InputMaybe<Array<ControlOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ControlFilter>;
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


export type SubscriptionReadHolidayArgs = {
  where: HolidayUniqueFilter;
};


export type SubscriptionReadHolidaysArgs = {
  distinct?: InputMaybe<Array<HolidayFields>>;
  orderBy?: InputMaybe<Array<HolidayOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<HolidayFilter>;
};


export type SubscriptionReadLocationArgs = {
  where: LocationUniqueFilter;
};


export type SubscriptionReadLocationsArgs = {
  distinct?: InputMaybe<Array<LocationFields>>;
  orderBy?: InputMaybe<Array<LocationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<LocationFilter>;
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


export type SubscriptionReadOccupanciesArgs = {
  distinct?: InputMaybe<Array<OccupancyFields>>;
  orderBy?: InputMaybe<Array<OccupancyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<OccupancyFilter>;
};


export type SubscriptionReadOccupancyArgs = {
  where: OccupancyUniqueFilter;
};


export type SubscriptionReadScheduleArgs = {
  where: ScheduleUniqueFilter;
};


export type SubscriptionReadSchedulesArgs = {
  distinct?: InputMaybe<Array<ScheduleFields>>;
  orderBy?: InputMaybe<Array<ScheduleOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ScheduleFilter>;
};


export type SubscriptionReadSetpointArgs = {
  where: SetpointUniqueFilter;
};


export type SubscriptionReadSetpointsArgs = {
  distinct?: InputMaybe<Array<SetpointFields>>;
  orderBy?: InputMaybe<Array<SetpointOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<SetpointFilter>;
};


export type SubscriptionReadUnitArgs = {
  where: UnitUniqueFilter;
};


export type SubscriptionReadUnitsArgs = {
  distinct?: InputMaybe<Array<UnitFields>>;
  orderBy?: InputMaybe<Array<UnitOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<UnitFilter>;
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

export type Unit = {
  __typename?: 'Unit';
  building?: Maybe<Scalars['String']['output']>;
  campus?: Maybe<Scalars['String']['output']>;
  compressors?: Maybe<Scalars['Int']['output']>;
  configuration?: Maybe<Configuration>;
  configurationId?: Maybe<Scalars['String']['output']>;
  control?: Maybe<Control>;
  controlId?: Maybe<Scalars['String']['output']>;
  coolingCapacity?: Maybe<Scalars['Float']['output']>;
  coolingLockout?: Maybe<Scalars['Float']['output']>;
  coolingPeakOffset?: Maybe<Scalars['Float']['output']>;
  correlation?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  earliestStart?: Maybe<Scalars['Int']['output']>;
  economizer?: Maybe<Scalars['Boolean']['output']>;
  economizerSetpoint?: Maybe<Scalars['Float']['output']>;
  heatPump?: Maybe<Scalars['Boolean']['output']>;
  heatPumpBackup?: Maybe<Scalars['Float']['output']>;
  heatPumpLockout?: Maybe<Scalars['Float']['output']>;
  heatingPeakOffset?: Maybe<Scalars['Float']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  latestStart?: Maybe<Scalars['Int']['output']>;
  location?: Maybe<Location>;
  locationId?: Maybe<Scalars['String']['output']>;
  message?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  optimalStartDeviation?: Maybe<Scalars['Float']['output']>;
  optimalStartLockout?: Maybe<Scalars['Float']['output']>;
  peakLoadExclude?: Maybe<Scalars['Boolean']['output']>;
  stage?: Maybe<ModelStage>;
  system?: Maybe<Scalars['String']['output']>;
  timezone?: Maybe<Scalars['String']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  users?: Maybe<Array<User>>;
  zoneBuilding?: Maybe<Scalars['String']['output']>;
  zoneLocation?: Maybe<Scalars['String']['output']>;
  zoneMass?: Maybe<Scalars['String']['output']>;
  zoneOrientation?: Maybe<Scalars['String']['output']>;
};

export type UnitAggregate = {
  average?: InputMaybe<Array<UnitFields>>;
  count?: InputMaybe<Array<UnitFields>>;
  maximum?: InputMaybe<Array<UnitFields>>;
  minimum?: InputMaybe<Array<UnitFields>>;
  sum?: InputMaybe<Array<UnitFields>>;
};

export type UnitCreateInput = {
  building?: InputMaybe<Scalars['String']['input']>;
  campus?: InputMaybe<Scalars['String']['input']>;
  compressors?: InputMaybe<Scalars['Int']['input']>;
  configurationId?: InputMaybe<Scalars['String']['input']>;
  controlId?: InputMaybe<Scalars['String']['input']>;
  coolingCapacity?: InputMaybe<Scalars['Float']['input']>;
  coolingLockout?: InputMaybe<Scalars['Float']['input']>;
  coolingPeakOffset?: InputMaybe<Scalars['Float']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  earliestStart?: InputMaybe<Scalars['Int']['input']>;
  economizer?: InputMaybe<Scalars['Boolean']['input']>;
  economizerSetpoint?: InputMaybe<Scalars['Float']['input']>;
  heatPump?: InputMaybe<Scalars['Boolean']['input']>;
  heatPumpBackup?: InputMaybe<Scalars['Float']['input']>;
  heatPumpLockout?: InputMaybe<Scalars['Float']['input']>;
  heatingPeakOffset?: InputMaybe<Scalars['Float']['input']>;
  label: Scalars['String']['input'];
  latestStart?: InputMaybe<Scalars['Int']['input']>;
  locationId?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  optimalStartDeviation?: InputMaybe<Scalars['Float']['input']>;
  optimalStartLockout?: InputMaybe<Scalars['Float']['input']>;
  peakLoadExclude?: InputMaybe<Scalars['Boolean']['input']>;
  stage?: InputMaybe<ModelStage>;
  system?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  zoneBuilding?: InputMaybe<Scalars['String']['input']>;
  zoneLocation?: InputMaybe<Scalars['String']['input']>;
  zoneMass?: InputMaybe<Scalars['String']['input']>;
  zoneOrientation?: InputMaybe<Scalars['String']['input']>;
};

export enum UnitFields {
  Building = 'building',
  Campus = 'campus',
  Compressors = 'compressors',
  ConfigurationId = 'configurationId',
  ControlId = 'controlId',
  CoolingCapacity = 'coolingCapacity',
  CoolingLockout = 'coolingLockout',
  CoolingPeakOffset = 'coolingPeakOffset',
  Correlation = 'correlation',
  CreatedAt = 'createdAt',
  EarliestStart = 'earliestStart',
  Economizer = 'economizer',
  EconomizerSetpoint = 'economizerSetpoint',
  HeatPump = 'heatPump',
  HeatPumpBackup = 'heatPumpBackup',
  HeatPumpLockout = 'heatPumpLockout',
  HeatingPeakOffset = 'heatingPeakOffset',
  Id = 'id',
  Label = 'label',
  LatestStart = 'latestStart',
  LocationId = 'locationId',
  Message = 'message',
  Name = 'name',
  OccupancyDetection = 'occupancyDetection',
  OptimalStartDeviation = 'optimalStartDeviation',
  OptimalStartLockout = 'optimalStartLockout',
  PeakLoadExclude = 'peakLoadExclude',
  Stage = 'stage',
  System = 'system',
  Timezone = 'timezone',
  UpdatedAt = 'updatedAt',
  ZoneBuilding = 'zoneBuilding',
  ZoneLocation = 'zoneLocation',
  ZoneMass = 'zoneMass',
  ZoneOrientation = 'zoneOrientation'
}

export type UnitFilter = {
  AND?: InputMaybe<Array<UnitFilter>>;
  NOT?: InputMaybe<UnitFilter>;
  OR?: InputMaybe<Array<UnitFilter>>;
  building?: InputMaybe<StringFilter>;
  campus?: InputMaybe<StringFilter>;
  compressors?: InputMaybe<IntFilter>;
  configurationId?: InputMaybe<StringFilter>;
  controlId?: InputMaybe<StringFilter>;
  coolingCapacity?: InputMaybe<FloatFilter>;
  coolingLockout?: InputMaybe<FloatFilter>;
  coolingPeakOffset?: InputMaybe<FloatFilter>;
  correlation?: InputMaybe<StringFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  earliestStart?: InputMaybe<IntFilter>;
  economizer?: InputMaybe<BooleanFilter>;
  economizerSetpoint?: InputMaybe<FloatFilter>;
  heatPump?: InputMaybe<BooleanFilter>;
  heatPumpBackup?: InputMaybe<FloatFilter>;
  heatPumpLockout?: InputMaybe<FloatFilter>;
  heatingPeakOffset?: InputMaybe<FloatFilter>;
  id?: InputMaybe<StringFilter>;
  label?: InputMaybe<StringFilter>;
  latestStart?: InputMaybe<IntFilter>;
  locationId?: InputMaybe<StringFilter>;
  message?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  optimalStartDeviation?: InputMaybe<FloatFilter>;
  optimalStartLockout?: InputMaybe<FloatFilter>;
  peakLoadExclude?: InputMaybe<BooleanFilter>;
  stage?: InputMaybe<ModelStage>;
  system?: InputMaybe<StringFilter>;
  timezone?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
  zoneBuilding?: InputMaybe<StringFilter>;
  zoneLocation?: InputMaybe<StringFilter>;
  zoneMass?: InputMaybe<StringFilter>;
  zoneOrientation?: InputMaybe<StringFilter>;
};

export type UnitOrderBy = {
  building?: InputMaybe<OrderBy>;
  campus?: InputMaybe<OrderBy>;
  compressors?: InputMaybe<OrderBy>;
  configurationId?: InputMaybe<OrderBy>;
  controlId?: InputMaybe<OrderBy>;
  coolingCapacity?: InputMaybe<OrderBy>;
  coolingLockout?: InputMaybe<OrderBy>;
  coolingPeakOffset?: InputMaybe<OrderBy>;
  correlation?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  earliestStart?: InputMaybe<OrderBy>;
  economizer?: InputMaybe<OrderBy>;
  economizerSetpoint?: InputMaybe<OrderBy>;
  heatPump?: InputMaybe<OrderBy>;
  heatPumpBackup?: InputMaybe<OrderBy>;
  heatPumpLockout?: InputMaybe<OrderBy>;
  heatingPeakOffset?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  label?: InputMaybe<OrderBy>;
  latestStart?: InputMaybe<OrderBy>;
  locationId?: InputMaybe<OrderBy>;
  message?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  optimalStartDeviation?: InputMaybe<OrderBy>;
  optimalStartLockout?: InputMaybe<OrderBy>;
  peakLoadExclude?: InputMaybe<OrderBy>;
  stage?: InputMaybe<OrderBy>;
  system?: InputMaybe<OrderBy>;
  timezone?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
  zoneBuilding?: InputMaybe<OrderBy>;
  zoneLocation?: InputMaybe<OrderBy>;
  zoneMass?: InputMaybe<OrderBy>;
  zoneOrientation?: InputMaybe<OrderBy>;
};

export type UnitUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type UnitUpdateConfigurationRelationInput = {
  update?: InputMaybe<ConfigurationUpdateInput>;
};

export type UnitUpdateControlRelationInput = {
  update?: InputMaybe<ControlUpdateInput>;
};

export type UnitUpdateInput = {
  building?: InputMaybe<Scalars['String']['input']>;
  campus?: InputMaybe<Scalars['String']['input']>;
  compressors?: InputMaybe<Scalars['Int']['input']>;
  configuration?: InputMaybe<UnitUpdateConfigurationRelationInput>;
  configurationId?: InputMaybe<Scalars['String']['input']>;
  control?: InputMaybe<UnitUpdateControlRelationInput>;
  controlId?: InputMaybe<Scalars['String']['input']>;
  coolingCapacity?: InputMaybe<Scalars['Float']['input']>;
  coolingLockout?: InputMaybe<Scalars['Float']['input']>;
  coolingPeakOffset?: InputMaybe<Scalars['Float']['input']>;
  correlation?: InputMaybe<Scalars['String']['input']>;
  earliestStart?: InputMaybe<Scalars['Int']['input']>;
  economizer?: InputMaybe<Scalars['Boolean']['input']>;
  economizerSetpoint?: InputMaybe<Scalars['Float']['input']>;
  heatPump?: InputMaybe<Scalars['Boolean']['input']>;
  heatPumpBackup?: InputMaybe<Scalars['Float']['input']>;
  heatPumpLockout?: InputMaybe<Scalars['Float']['input']>;
  heatingPeakOffset?: InputMaybe<Scalars['Float']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  latestStart?: InputMaybe<Scalars['Int']['input']>;
  location?: InputMaybe<UnitUpdateLocationRelationInput>;
  locationId?: InputMaybe<Scalars['String']['input']>;
  message?: InputMaybe<Scalars['String']['input']>;
  name?: InputMaybe<Scalars['String']['input']>;
  optimalStartDeviation?: InputMaybe<Scalars['Float']['input']>;
  optimalStartLockout?: InputMaybe<Scalars['Float']['input']>;
  peakLoadExclude?: InputMaybe<Scalars['Boolean']['input']>;
  stage?: InputMaybe<ModelStage>;
  system?: InputMaybe<Scalars['String']['input']>;
  timezone?: InputMaybe<Scalars['String']['input']>;
  zoneBuilding?: InputMaybe<Scalars['String']['input']>;
  zoneLocation?: InputMaybe<Scalars['String']['input']>;
  zoneMass?: InputMaybe<Scalars['String']['input']>;
  zoneOrientation?: InputMaybe<Scalars['String']['input']>;
};

export type UnitUpdateLocationRelationInput = {
  update?: InputMaybe<LocationUpdateInput>;
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
  units?: Maybe<Array<Unit>>;
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
  units?: InputMaybe<UserUpdateUnitsRelationInput>;
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
  units?: InputMaybe<UserUpdateUnitsRelationInput>;
};

export type UserUpdateUnitsRelationInput = {
  connect?: InputMaybe<Array<UnitUniqueFilter>>;
  disconnect?: InputMaybe<Array<UnitUniqueFilter>>;
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

export type ChangeFieldsFragment = { __typename?: 'Change', id?: string | null, table?: string | null, key?: string | null, mutation?: ChangeMutation | null, data?: PrismaJson.ChangeData | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null } & { ' $fragmentName'?: 'ChangeFieldsFragment' };

export type ReadChangeQueryVariables = Exact<{
  where: ChangeUniqueFilter;
}>;


export type ReadChangeQuery = { __typename?: 'Query', readChange?: { __typename?: 'Change', id?: string | null, table?: string | null, key?: string | null, mutation?: ChangeMutation | null, data?: PrismaJson.ChangeData | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null } | null };

export type ReadChangesQueryVariables = Exact<{
  where?: InputMaybe<ChangeFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<ChangeOrderBy> | ChangeOrderBy>;
  distinct?: InputMaybe<Array<ChangeFields> | ChangeFields>;
}>;


export type ReadChangesQuery = { __typename?: 'Query', countChanges?: number | null, readChanges?: Array<{ __typename?: 'Change', id?: string | null, table?: string | null, key?: string | null, mutation?: ChangeMutation | null, data?: PrismaJson.ChangeData | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null }> | null };

export type CreateChangeMutationVariables = Exact<{
  create: ChangeCreateInput;
}>;


export type CreateChangeMutation = { __typename?: 'Mutation', createChange?: { __typename?: 'Change', id?: string | null, table?: string | null, key?: string | null, mutation?: ChangeMutation | null, data?: PrismaJson.ChangeData | null, createdAt?: string | null, updatedAt?: string | null, user?: { __typename?: 'User', name?: string | null, email?: string | null } | null } | null };

export type DeleteChangeMutationVariables = Exact<{
  where: ChangeUniqueFilter;
}>;


export type DeleteChangeMutation = { __typename?: 'Mutation', deleteChange?: { __typename?: 'Change', id?: string | null } | null };

export type ReadConfigurationQueryVariables = Exact<{
  where: ConfigurationUniqueFilter;
}>;


export type ReadConfigurationQuery = { __typename?: 'Query', readConfiguration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null } | null };

export type ReadConfigurationsQueryVariables = Exact<{
  where?: InputMaybe<ConfigurationFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<ConfigurationOrderBy> | ConfigurationOrderBy>;
  distinct?: InputMaybe<Array<ConfigurationFields> | ConfigurationFields>;
}>;


export type ReadConfigurationsQuery = { __typename?: 'Query', readConfigurations?: Array<{ __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null }> | null };

export type CreateConfigurationMutationVariables = Exact<{
  create: ConfigurationCreateInput;
}>;


export type CreateConfigurationMutation = { __typename?: 'Mutation', createConfiguration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null } | null };

export type UpdateConfigurationMutationVariables = Exact<{
  where: ConfigurationUniqueFilter;
  update: ConfigurationUpdateInput;
}>;


export type UpdateConfigurationMutation = { __typename?: 'Mutation', updateConfiguration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null } | null };

export type DeleteConfigurationMutationVariables = Exact<{
  where: ConfigurationUniqueFilter;
}>;


export type DeleteConfigurationMutation = { __typename?: 'Mutation', deleteConfiguration?: { __typename?: 'Configuration', id?: string | null } | null };

export type SubscribeConfigurationSubscriptionVariables = Exact<{
  where: ConfigurationUniqueFilter;
}>;


export type SubscribeConfigurationSubscription = { __typename?: 'Subscription', readConfiguration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null } | null };

export type SubscribeConfigurationsSubscriptionVariables = Exact<{
  where?: InputMaybe<ConfigurationFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<ConfigurationOrderBy> | ConfigurationOrderBy>;
  distinct?: InputMaybe<Array<ConfigurationFields> | ConfigurationFields>;
}>;


export type SubscribeConfigurationsSubscription = { __typename?: 'Subscription', readConfigurations?: Array<{ __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null }> | null };

export type ReadControlQueryVariables = Exact<{
  where: ControlUniqueFilter;
}>;


export type ReadControlQuery = { __typename?: 'Query', readControl?: { __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null } | null };

export type ReadControlsQueryVariables = Exact<{
  where?: InputMaybe<ControlFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<ControlOrderBy> | ControlOrderBy>;
  distinct?: InputMaybe<Array<ControlFields> | ControlFields>;
}>;


export type ReadControlsQuery = { __typename?: 'Query', readControls?: Array<{ __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null }> | null };

export type CreateControlMutationVariables = Exact<{
  create: ControlCreateInput;
}>;


export type CreateControlMutation = { __typename?: 'Mutation', createControl?: { __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateControlMutationVariables = Exact<{
  where: ControlUniqueFilter;
  update: ControlUpdateInput;
}>;


export type UpdateControlMutation = { __typename?: 'Mutation', updateControl?: { __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteControlMutationVariables = Exact<{
  where: ControlUniqueFilter;
}>;


export type DeleteControlMutation = { __typename?: 'Mutation', deleteControl?: { __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type SubscribeControlSubscriptionVariables = Exact<{
  where: ControlUniqueFilter;
}>;


export type SubscribeControlSubscription = { __typename?: 'Subscription', readControl?: { __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null } | null };

export type SubscribeControlsSubscriptionVariables = Exact<{
  where?: InputMaybe<ControlFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<ControlOrderBy> | ControlOrderBy>;
  distinct?: InputMaybe<Array<ControlFields> | ControlFields>;
}>;


export type SubscribeControlsSubscription = { __typename?: 'Subscription', readControls?: Array<{ __typename?: 'Control', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null }> | null };

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

export type ReadHolidayQueryVariables = Exact<{
  where: HolidayUniqueFilter;
}>;


export type ReadHolidayQuery = { __typename?: 'Query', readHoliday?: { __typename?: 'Holiday', id?: string | null, label?: string | null, day?: number | null, month?: number | null, observance?: string | null, type?: HolidayType | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadHolidaysQueryVariables = Exact<{
  where?: InputMaybe<HolidayFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<HolidayOrderBy> | HolidayOrderBy>;
  distinct?: InputMaybe<Array<HolidayFields> | HolidayFields>;
}>;


export type ReadHolidaysQuery = { __typename?: 'Query', countHolidays?: number | null, readHolidays?: Array<{ __typename?: 'Holiday', id?: string | null, label?: string | null, day?: number | null, month?: number | null, observance?: string | null, type?: HolidayType | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateHolidayMutationVariables = Exact<{
  create: HolidayCreateInput;
}>;


export type CreateHolidayMutation = { __typename?: 'Mutation', createHoliday?: { __typename?: 'Holiday', id?: string | null, label?: string | null, day?: number | null, month?: number | null, observance?: string | null, type?: HolidayType | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateHolidayMutationVariables = Exact<{
  where: HolidayUniqueFilter;
  update: HolidayUpdateInput;
}>;


export type UpdateHolidayMutation = { __typename?: 'Mutation', updateHoliday?: { __typename?: 'Holiday', id?: string | null, label?: string | null, day?: number | null, month?: number | null, observance?: string | null, type?: HolidayType | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteHolidayMutationVariables = Exact<{
  where: HolidayUniqueFilter;
}>;


export type DeleteHolidayMutation = { __typename?: 'Mutation', deleteHoliday?: { __typename?: 'Holiday', id?: string | null } | null };

export type ReadLocationQueryVariables = Exact<{
  where: LocationUniqueFilter;
}>;


export type ReadLocationQuery = { __typename?: 'Query', readLocation?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadLocationsQueryVariables = Exact<{
  where?: InputMaybe<LocationFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<LocationOrderBy> | LocationOrderBy>;
  distinct?: InputMaybe<Array<LocationFields> | LocationFields>;
}>;


export type ReadLocationsQuery = { __typename?: 'Query', countLocations?: number | null, readLocations?: Array<{ __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateLocationMutationVariables = Exact<{
  create: LocationCreateInput;
}>;


export type CreateLocationMutation = { __typename?: 'Mutation', createLocation?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateLocationMutationVariables = Exact<{
  where: LocationUniqueFilter;
  update: LocationUpdateInput;
}>;


export type UpdateLocationMutation = { __typename?: 'Mutation', updateLocation?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteLocationMutationVariables = Exact<{
  where: LocationUniqueFilter;
}>;


export type DeleteLocationMutation = { __typename?: 'Mutation', deleteLocation?: { __typename?: 'Location', id?: string | null } | null };

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

export type ReadOccupanciesQueryVariables = Exact<{
  distinct?: InputMaybe<Array<OccupancyFields> | OccupancyFields>;
  orderBy?: InputMaybe<Array<OccupancyOrderBy> | OccupancyOrderBy>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<OccupancyFilter>;
}>;


export type ReadOccupanciesQuery = { __typename?: 'Query', readOccupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, date?: string | null, stage?: ModelStage | null, configurationId?: string | null, scheduleId?: string | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null } | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null } | null }> | null };

export type ReadOccupancyQueryVariables = Exact<{
  where: OccupancyUniqueFilter;
}>;


export type ReadOccupancyQuery = { __typename?: 'Query', readOccupancy?: { __typename?: 'Occupancy', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, date?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null, configurationId?: string | null, scheduleId?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null } | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null } | null } | null };

export type CreateOccupancyMutationVariables = Exact<{
  create: OccupancyCreateInput;
}>;


export type CreateOccupancyMutation = { __typename?: 'Mutation', createOccupancy?: { __typename?: 'Occupancy', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, date?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null } | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null } | null } | null };

export type UpdateOccupancyMutationVariables = Exact<{
  where: OccupancyUniqueFilter;
  update: OccupancyUpdateInput;
}>;


export type UpdateOccupancyMutation = { __typename?: 'Mutation', updateOccupancy?: { __typename?: 'Occupancy', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, date?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null } | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null } | null } | null };

export type DeleteOccupancyMutationVariables = Exact<{
  where: OccupancyUniqueFilter;
}>;


export type DeleteOccupancyMutation = { __typename?: 'Mutation', deleteOccupancy?: { __typename?: 'Occupancy', id?: string | null, label?: string | null } | null };

export type ReadSchedulesQueryVariables = Exact<{
  distinct?: InputMaybe<Array<ScheduleFields> | ScheduleFields>;
  orderBy?: InputMaybe<Array<ScheduleOrderBy> | ScheduleOrderBy>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<ScheduleFilter>;
}>;


export type ReadSchedulesQuery = { __typename?: 'Query', readSchedules?: Array<{ __typename?: 'Schedule', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null, stage?: ModelStage | null, setpointId?: string | null, createdAt?: string | null, updatedAt?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null } | null }> | null };

export type ReadScheduleQueryVariables = Exact<{
  where: ScheduleUniqueFilter;
}>;


export type ReadScheduleQuery = { __typename?: 'Query', readSchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null, stage?: ModelStage | null, setpointId?: string | null, createdAt?: string | null, updatedAt?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null } | null } | null };

export type CreateScheduleMutationVariables = Exact<{
  create: ScheduleCreateInput;
}>;


export type CreateScheduleMutation = { __typename?: 'Mutation', createSchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null } | null } | null };

export type UpdateScheduleMutationVariables = Exact<{
  where: ScheduleUniqueFilter;
  update: ScheduleUpdateInput;
}>;


export type UpdateScheduleMutation = { __typename?: 'Mutation', updateSchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, message?: string | null, correlation?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null } | null } | null };

export type DeleteScheduleMutationVariables = Exact<{
  where: ScheduleUniqueFilter;
}>;


export type DeleteScheduleMutation = { __typename?: 'Mutation', deleteSchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null } | null };

export type ReadSetpointQueryVariables = Exact<{
  where: SetpointUniqueFilter;
}>;


export type ReadSetpointQuery = { __typename?: 'Query', readSetpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type ReadSetpointsQueryVariables = Exact<{
  where?: InputMaybe<SetpointFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<SetpointOrderBy> | SetpointOrderBy>;
  distinct?: InputMaybe<Array<SetpointFields> | SetpointFields>;
}>;


export type ReadSetpointsQuery = { __typename?: 'Query', countSetpoints?: number | null, readSetpoints?: Array<{ __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type CreateSetpointMutationVariables = Exact<{
  create: SetpointCreateInput;
}>;


export type CreateSetpointMutation = { __typename?: 'Mutation', createSetpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateSetpointMutationVariables = Exact<{
  where: SetpointUniqueFilter;
  update: SetpointUpdateInput;
}>;


export type UpdateSetpointMutation = { __typename?: 'Mutation', updateSetpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null, correlation?: string | null, message?: string | null, stage?: ModelStage | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteSetpointMutationVariables = Exact<{
  where: SetpointUniqueFilter;
}>;


export type DeleteSetpointMutation = { __typename?: 'Mutation', deleteSetpoint?: { __typename?: 'Setpoint', id?: string | null } | null };

export type ReadUnitQueryVariables = Exact<{
  where: UnitUniqueFilter;
}>;


export type ReadUnitQuery = { __typename?: 'Query', readUnit?: { __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null, mondaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, tuesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, wednesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, thursdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, fridaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, saturdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, sundaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, holidaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null } | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null } | null };

export type ReadUnitsQueryVariables = Exact<{
  where?: InputMaybe<UnitFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<UnitOrderBy> | UnitOrderBy>;
  distinct?: InputMaybe<Array<UnitFields> | UnitFields>;
}>;


export type ReadUnitsQuery = { __typename?: 'Query', readUnits?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null, mondaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, tuesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, wednesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, thursdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, fridaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, saturdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, sundaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, holidaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null } | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null };

export type CreateUnitMutationVariables = Exact<{
  create: UnitCreateInput;
}>;


export type CreateUnitMutation = { __typename?: 'Mutation', createUnit?: { __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type UpdateUnitMutationVariables = Exact<{
  where: UnitUniqueFilter;
  update: UnitUpdateInput;
}>;


export type UpdateUnitMutation = { __typename?: 'Mutation', updateUnit?: { __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null } | null };

export type DeleteUnitMutationVariables = Exact<{
  where: UnitUniqueFilter;
}>;


export type DeleteUnitMutation = { __typename?: 'Mutation', deleteUnit?: { __typename?: 'Unit', id?: string | null } | null };

export type SubscribeUnitSubscriptionVariables = Exact<{
  where: UnitUniqueFilter;
}>;


export type SubscribeUnitSubscription = { __typename?: 'Subscription', readUnit?: { __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null, mondaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, tuesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, wednesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, thursdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, fridaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, saturdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, sundaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, holidaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null } | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null } | null };

export type SubscribeUnitsSubscriptionVariables = Exact<{
  where?: InputMaybe<UnitFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<UnitOrderBy> | UnitOrderBy>;
  distinct?: InputMaybe<Array<UnitFields> | UnitFields>;
}>;


export type SubscribeUnitsSubscription = { __typename?: 'Subscription', readUnits?: Array<{ __typename?: 'Unit', id?: string | null, name?: string | null, campus?: string | null, building?: string | null, system?: string | null, timezone?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, coolingCapacity?: number | null, compressors?: number | null, coolingLockout?: number | null, optimalStartLockout?: number | null, optimalStartDeviation?: number | null, earliestStart?: number | null, latestStart?: number | null, zoneLocation?: string | null, zoneMass?: string | null, zoneOrientation?: string | null, zoneBuilding?: string | null, heatPump?: boolean | null, heatPumpBackup?: number | null, economizer?: boolean | null, heatPumpLockout?: number | null, coolingPeakOffset?: number | null, heatingPeakOffset?: number | null, peakLoadExclude?: boolean | null, economizerSetpoint?: number | null, configurationId?: string | null, controlId?: string | null, locationId?: string | null, createdAt?: string | null, updatedAt?: string | null, configuration?: { __typename?: 'Configuration', id?: string | null, label?: string | null, stage?: ModelStage | null, message?: string | null, correlation?: string | null, setpoint?: { __typename?: 'Setpoint', id?: string | null, label?: string | null, setpoint?: number | null, deadband?: number | null, heating?: number | null, cooling?: number | null, standbyTime?: number | null, standbyOffset?: number | null } | null, holidays?: Array<{ __typename?: 'Holiday', id?: string | null, type?: HolidayType | null, label?: string | null, month?: number | null, day?: number | null, observance?: string | null }> | null, occupancies?: Array<{ __typename?: 'Occupancy', id?: string | null, label?: string | null, date?: string | null, schedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null }> | null, mondaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, tuesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, wednesdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, thursdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, fridaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, saturdaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, sundaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null, holidaySchedule?: { __typename?: 'Schedule', id?: string | null, label?: string | null, startTime?: string | null, endTime?: string | null, occupied?: boolean | null } | null } | null, location?: { __typename?: 'Location', id?: string | null, name?: string | null, latitude?: number | null, longitude?: number | null } | null }> | null };

export type UserFieldsFragment = { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null } & { ' $fragmentName'?: 'UserFieldsFragment' };

export type ReadUserQueryVariables = Exact<{
  where: UserUniqueFilter;
}>;


export type ReadUserQuery = { __typename?: 'Query', readUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null } | null };

export type ReadUsersQueryVariables = Exact<{
  where?: InputMaybe<UserFilter>;
  paging?: InputMaybe<PagingInput>;
  orderBy?: InputMaybe<Array<UserOrderBy> | UserOrderBy>;
  distinct?: InputMaybe<Array<UserFields> | UserFields>;
}>;


export type ReadUsersQuery = { __typename?: 'Query', countUsers?: number | null, readUsers?: Array<{ __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null }> | null };

export type CreateUserMutationVariables = Exact<{
  create: UserCreateInput;
}>;


export type CreateUserMutation = { __typename?: 'Mutation', createUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null } | null };

export type UpdateUserMutationVariables = Exact<{
  where: UserUniqueFilter;
  update: UserUpdateInput;
}>;


export type UpdateUserMutation = { __typename?: 'Mutation', updateUser?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null, image?: string | null, role?: string | null, emailVerified?: string | null, preferences?: PrismaJson.UserPreferences | null, createdAt?: string | null, updatedAt?: string | null, units?: Array<{ __typename?: 'Unit', id?: string | null }> | null } | null };

export type DeleteUserMutationVariables = Exact<{
  where: UserUniqueFilter;
}>;


export type DeleteUserMutation = { __typename?: 'Mutation', deleteUser?: { __typename?: 'User', id?: string | null } | null };

export const BannerFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"BannerFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Banner"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<BannerFieldsFragment, unknown>;
export const ChangeFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"ChangeFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Change"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"table"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"mutation"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]} as unknown as DocumentNode<ChangeFieldsFragment, unknown>;
export const CurrentFragmentFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"CurrentFragment"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<CurrentFragmentFragment, unknown>;
export const GeographyFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"GeographyFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Geography"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"group"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"geojson"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<GeographyFieldsFragment, unknown>;
export const LogFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"LogFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"Log"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]} as unknown as DocumentNode<LogFieldsFragment, unknown>;
export const UserFieldsFragmentDoc = {"kind":"Document","definitions":[{"kind":"FragmentDefinition","name":{"kind":"Name","value":"UserFields"},"typeCondition":{"kind":"NamedType","name":{"kind":"Name","value":"User"}},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<UserFieldsFragment, unknown>;
export const ReadBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBannerQuery, ReadBannerQueryVariables>;
export const ReadBannersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBanners"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanners"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBannersQuery, ReadBannersQueryVariables>;
export const CreateBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateBannerMutation, CreateBannerMutationVariables>;
export const UpdateBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateBannerMutation, UpdateBannerMutationVariables>;
export const DeleteBannerDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBanner"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBanner"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteBannerMutation, DeleteBannerMutationVariables>;
export const SubscribeBannersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBanners"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BannerFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBanners"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"expiration"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubscribeBannersSubscription, SubscribeBannersSubscriptionVariables>;
export const ReadChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"table"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"mutation"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ReadChangeQuery, ReadChangeQueryVariables>;
export const ReadChangesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadChanges"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"table"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"mutation"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"countChanges"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadChangesQuery, ReadChangesQueryVariables>;
export const CreateChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"table"}},{"kind":"Field","name":{"kind":"Name","value":"key"}},{"kind":"Field","name":{"kind":"Name","value":"mutation"}},{"kind":"Field","name":{"kind":"Name","value":"data"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"user"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<CreateChangeMutation, CreateChangeMutationVariables>;
export const DeleteChangeDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteChange"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ChangeUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteChange"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteChangeMutation, DeleteChangeMutationVariables>;
export const ReadConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ReadConfigurationQuery, ReadConfigurationQueryVariables>;
export const ReadConfigurationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadConfigurations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readConfigurations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ReadConfigurationsQuery, ReadConfigurationsQueryVariables>;
export const CreateConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<CreateConfigurationMutation, CreateConfigurationMutationVariables>;
export const UpdateConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}}]}}]}}]} as unknown as DocumentNode<UpdateConfigurationMutation, UpdateConfigurationMutationVariables>;
export const DeleteConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteConfigurationMutation, DeleteConfigurationMutationVariables>;
export const SubscribeConfigurationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeConfiguration"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readConfiguration"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeConfigurationSubscription, SubscribeConfigurationSubscriptionVariables>;
export const SubscribeConfigurationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeConfigurations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ConfigurationFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readConfigurations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeConfigurationsSubscription, SubscribeConfigurationsSubscriptionVariables>;
export const ReadControlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadControl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readControl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ReadControlQuery, ReadControlQueryVariables>;
export const ReadControlsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadControls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readControls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ReadControlsQuery, ReadControlsQueryVariables>;
export const CreateControlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateControl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createControl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateControlMutation, CreateControlMutationVariables>;
export const UpdateControlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateControl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateControl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateControlMutation, UpdateControlMutationVariables>;
export const DeleteControlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteControl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteControl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<DeleteControlMutation, DeleteControlMutationVariables>;
export const SubscribeControlDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeControl"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readControl"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeControlSubscription, SubscribeControlSubscriptionVariables>;
export const SubscribeControlsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeControls"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ControlFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readControls"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeControlsSubscription, SubscribeControlsSubscriptionVariables>;
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
export const ReadHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadHolidayQuery, ReadHolidayQueryVariables>;
export const ReadHolidaysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadHolidays"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readHolidays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countHolidays"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadHolidaysQuery, ReadHolidaysQueryVariables>;
export const CreateHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateHolidayMutation, CreateHolidayMutationVariables>;
export const UpdateHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateHolidayMutation, UpdateHolidayMutationVariables>;
export const DeleteHolidayDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteHoliday"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"HolidayUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteHoliday"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteHolidayMutation, DeleteHolidayMutationVariables>;
export const ReadLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLocation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLocation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadLocationQuery, ReadLocationQueryVariables>;
export const ReadLocationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLocations"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLocations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countLocations"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadLocationsQuery, ReadLocationsQueryVariables>;
export const CreateLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLocation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLocation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateLocationMutation, CreateLocationMutationVariables>;
export const UpdateLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateLocation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateLocation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateLocationMutation, UpdateLocationMutationVariables>;
export const DeleteLocationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLocation"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LocationUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLocation"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteLocationMutation, DeleteLocationMutationVariables>;
export const ReadLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadLogQuery, ReadLogQueryVariables>;
export const ReadLogsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadLogs"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"LogFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countLogs"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadLogsQuery, ReadLogsQueryVariables>;
export const CreateLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateLogMutation, CreateLogMutationVariables>;
export const DeleteLogDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteLog"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"LogUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteLog"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteLogMutation, DeleteLogMutationVariables>;
export const ReadOccupanciesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadOccupancies"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyFields"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readOccupancies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<ReadOccupanciesQuery, ReadOccupanciesQueryVariables>;
export const ReadOccupancyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadOccupancy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readOccupancy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"scheduleId"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<ReadOccupancyQuery, ReadOccupancyQueryVariables>;
export const CreateOccupancyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateOccupancy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createOccupancy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<CreateOccupancyMutation, CreateOccupancyMutationVariables>;
export const UpdateOccupancyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateOccupancy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateOccupancy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateOccupancyMutation, UpdateOccupancyMutationVariables>;
export const DeleteOccupancyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteOccupancy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"OccupancyUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteOccupancy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]} as unknown as DocumentNode<DeleteOccupancyMutation, DeleteOccupancyMutationVariables>;
export const ReadSchedulesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSchedules"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleFields"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleFilter"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readSchedules"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"setpointId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<ReadSchedulesQuery, ReadSchedulesQueryVariables>;
export const ReadScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"setpointId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<ReadScheduleQuery, ReadScheduleQueryVariables>;
export const CreateScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<CreateScheduleMutation, CreateScheduleMutationVariables>;
export const UpdateScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateScheduleMutation, UpdateScheduleMutationVariables>;
export const DeleteScheduleDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSchedule"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"ScheduleUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSchedule"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}}]}}]}}]} as unknown as DocumentNode<DeleteScheduleMutation, DeleteScheduleMutationVariables>;
export const ReadSetpointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSetpoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readSetpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadSetpointQuery, ReadSetpointQueryVariables>;
export const ReadSetpointsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadSetpoints"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readSetpoints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"countSetpoints"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadSetpointsQuery, ReadSetpointsQueryVariables>;
export const CreateSetpointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateSetpoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createSetpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateSetpointMutation, CreateSetpointMutationVariables>;
export const UpdateSetpointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateSetpoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateSetpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateSetpointMutation, UpdateSetpointMutationVariables>;
export const DeleteSetpointDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteSetpoint"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"SetpointUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteSetpoint"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteSetpointMutation, DeleteSetpointMutationVariables>;
export const ReadUnitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUnit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mondaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tuesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wednesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thursdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fridaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"saturdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sundaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<ReadUnitQuery, ReadUnitQueryVariables>;
export const ReadUnitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUnits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUnits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mondaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tuesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wednesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thursdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fridaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"saturdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sundaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<ReadUnitsQuery, ReadUnitsQueryVariables>;
export const CreateUnitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUnit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<CreateUnitMutation, CreateUnitMutationVariables>;
export const UpdateUnitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUnit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateUnitMutation, UpdateUnitMutationVariables>;
export const DeleteUnitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUnit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteUnitMutation, DeleteUnitMutationVariables>;
export const SubscribeUnitDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeUnit"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUnit"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mondaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tuesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wednesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thursdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fridaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"saturdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sundaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeUnitSubscription, SubscribeUnitSubscriptionVariables>;
export const SubscribeUnitsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeUnits"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UnitFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUnits"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"campus"}},{"kind":"Field","name":{"kind":"Name","value":"building"}},{"kind":"Field","name":{"kind":"Name","value":"system"}},{"kind":"Field","name":{"kind":"Name","value":"timezone"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"coolingCapacity"}},{"kind":"Field","name":{"kind":"Name","value":"compressors"}},{"kind":"Field","name":{"kind":"Name","value":"coolingLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartLockout"}},{"kind":"Field","name":{"kind":"Name","value":"optimalStartDeviation"}},{"kind":"Field","name":{"kind":"Name","value":"earliestStart"}},{"kind":"Field","name":{"kind":"Name","value":"latestStart"}},{"kind":"Field","name":{"kind":"Name","value":"zoneLocation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneMass"}},{"kind":"Field","name":{"kind":"Name","value":"zoneOrientation"}},{"kind":"Field","name":{"kind":"Name","value":"zoneBuilding"}},{"kind":"Field","name":{"kind":"Name","value":"heatPump"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpBackup"}},{"kind":"Field","name":{"kind":"Name","value":"economizer"}},{"kind":"Field","name":{"kind":"Name","value":"heatPumpLockout"}},{"kind":"Field","name":{"kind":"Name","value":"coolingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"heatingPeakOffset"}},{"kind":"Field","name":{"kind":"Name","value":"peakLoadExclude"}},{"kind":"Field","name":{"kind":"Name","value":"economizerSetpoint"}},{"kind":"Field","name":{"kind":"Name","value":"configurationId"}},{"kind":"Field","name":{"kind":"Name","value":"controlId"}},{"kind":"Field","name":{"kind":"Name","value":"locationId"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"configuration"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"stage"}},{"kind":"Field","name":{"kind":"Name","value":"message"}},{"kind":"Field","name":{"kind":"Name","value":"correlation"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"setpoint"}},{"kind":"Field","name":{"kind":"Name","value":"deadband"}},{"kind":"Field","name":{"kind":"Name","value":"heating"}},{"kind":"Field","name":{"kind":"Name","value":"cooling"}},{"kind":"Field","name":{"kind":"Name","value":"standbyTime"}},{"kind":"Field","name":{"kind":"Name","value":"standbyOffset"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidays"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"month"}},{"kind":"Field","name":{"kind":"Name","value":"day"}},{"kind":"Field","name":{"kind":"Name","value":"observance"}}]}},{"kind":"Field","name":{"kind":"Name","value":"occupancies"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"date"}},{"kind":"Field","name":{"kind":"Name","value":"schedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"mondaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"tuesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"wednesdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"thursdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"fridaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"saturdaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"sundaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}},{"kind":"Field","name":{"kind":"Name","value":"holidaySchedule"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"label"}},{"kind":"Field","name":{"kind":"Name","value":"startTime"}},{"kind":"Field","name":{"kind":"Name","value":"endTime"}},{"kind":"Field","name":{"kind":"Name","value":"occupied"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"location"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"latitude"}},{"kind":"Field","name":{"kind":"Name","value":"longitude"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeUnitsSubscription, SubscribeUnitsSubscriptionVariables>;
export const ReadUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<ReadUserQuery, ReadUserQueryVariables>;
export const ReadUsersDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadUsers"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFilter"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"paging"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"PagingInput"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserOrderBy"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserFields"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"Variable","name":{"kind":"Name","value":"paging"}}},{"kind":"Argument","name":{"kind":"Name","value":"orderBy"},"value":{"kind":"Variable","name":{"kind":"Name","value":"orderBy"}}},{"kind":"Argument","name":{"kind":"Name","value":"distinct"},"value":{"kind":"Variable","name":{"kind":"Name","value":"distinct"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}},{"kind":"Field","name":{"kind":"Name","value":"countUsers"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}]}]}}]} as unknown as DocumentNode<ReadUsersQuery, ReadUsersQueryVariables>;
export const CreateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"create"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserCreateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"create"},"value":{"kind":"Variable","name":{"kind":"Name","value":"create"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<CreateUserMutation, CreateUserMutationVariables>;
export const UpdateUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"update"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUpdateInput"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}},{"kind":"Argument","name":{"kind":"Name","value":"update"},"value":{"kind":"Variable","name":{"kind":"Name","value":"update"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"role"}},{"kind":"Field","name":{"kind":"Name","value":"emailVerified"}},{"kind":"Field","name":{"kind":"Name","value":"preferences"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"units"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]}}]} as unknown as DocumentNode<UpdateUserMutation, UpdateUserMutationVariables>;
export const DeleteUserDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteUser"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"where"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"UserUniqueFilter"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteUser"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"Variable","name":{"kind":"Name","value":"where"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteUserMutation, DeleteUserMutationVariables>;