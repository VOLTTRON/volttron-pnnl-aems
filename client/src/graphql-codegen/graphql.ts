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
  BackupDestinationGroupBy: { input: PrismaJson.BackupDestinationGroupBy; output: PrismaJson.BackupDestinationGroupBy; }
  BackupKeyGroupBy: { input: PrismaJson.BackupKeyGroupBy; output: PrismaJson.BackupKeyGroupBy; }
  BackupPolicyGroupBy: { input: PrismaJson.BackupPolicyGroupBy; output: PrismaJson.BackupPolicyGroupBy; }
  BackupRunGroupBy: { input: PrismaJson.BackupRunGroupBy; output: PrismaJson.BackupRunGroupBy; }
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

export enum BackupArchiveAvailability {
  Available = 'Available',
  Missing = 'Missing',
  Removed = 'Removed'
}

export type BackupComponent = {
  __typename?: 'BackupComponent';
  bytes?: Maybe<Scalars['String']['output']>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  durationMs?: Maybe<Scalars['Int']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  run?: Maybe<BackupRun>;
  runId?: Maybe<Scalars['String']['output']>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<BackupComponentStatus>;
  type?: Maybe<BackupComponentType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export enum BackupComponentFields {
  Bytes = 'bytes',
  CreatedAt = 'createdAt',
  DurationMs = 'durationMs',
  Error = 'error',
  FinishedAt = 'finishedAt',
  Id = 'id',
  Name = 'name',
  RunId = 'runId',
  StartedAt = 'startedAt',
  Status = 'status',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export enum BackupComponentStatus {
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Skipped = 'Skipped',
  Success = 'Success'
}

export enum BackupComponentType {
  File = 'File',
  MariaDb = 'MariaDB',
  Path = 'Path',
  Postgres = 'Postgres',
  Volume = 'Volume'
}

export type BackupDestination = {
  __typename?: 'BackupDestination';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  order?: Maybe<Scalars['Int']['output']>;
  output?: Maybe<Scalars['String']['output']>;
  policy?: Maybe<BackupPolicy>;
  policyId?: Maybe<Scalars['String']['output']>;
  runs?: Maybe<Array<BackupRunDestination>>;
  sseKmsKeyId?: Maybe<Scalars['String']['output']>;
  sseMode?: Maybe<Scalars['String']['output']>;
  type?: Maybe<BackupDestinationType>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BackupDestinationAggregate = {
  average?: InputMaybe<Array<BackupDestinationFields>>;
  count?: InputMaybe<Array<BackupDestinationFields>>;
  maximum?: InputMaybe<Array<BackupDestinationFields>>;
  minimum?: InputMaybe<Array<BackupDestinationFields>>;
  sum?: InputMaybe<Array<BackupDestinationFields>>;
};

export enum BackupDestinationFields {
  CreatedAt = 'createdAt',
  Enabled = 'enabled',
  Id = 'id',
  Name = 'name',
  Order = 'order',
  Output = 'output',
  PolicyId = 'policyId',
  SseKmsKeyId = 'sseKmsKeyId',
  SseMode = 'sseMode',
  Type = 'type',
  UpdatedAt = 'updatedAt'
}

export type BackupDestinationFilter = {
  AND?: InputMaybe<Array<BackupDestinationFilter>>;
  NOT?: InputMaybe<BackupDestinationFilter>;
  OR?: InputMaybe<Array<BackupDestinationFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  enabled?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<StringFilter>;
  name?: InputMaybe<StringFilter>;
  output?: InputMaybe<StringFilter>;
  policyId?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type BackupDestinationOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  enabled?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  name?: InputMaybe<OrderBy>;
  order?: InputMaybe<OrderBy>;
  output?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export enum BackupDestinationType {
  Local = 'Local',
  S3 = 'S3'
}

export type BackupDestinationUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type BackupDiscoveredEnvFile = {
  __typename?: 'BackupDiscoveredEnvFile';
  autoExclude?: Maybe<Scalars['Boolean']['output']>;
  autoExcludeReason?: Maybe<Scalars['String']['output']>;
  exists?: Maybe<Scalars['Boolean']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  source?: Maybe<Scalars['String']['output']>;
};

export type BackupDiscoveredPath = {
  __typename?: 'BackupDiscoveredPath';
  autoExclude?: Maybe<Scalars['Boolean']['output']>;
  autoExcludeReason?: Maybe<Scalars['String']['output']>;
  path?: Maybe<Scalars['String']['output']>;
  services?: Maybe<Array<Scalars['String']['output']>>;
  type?: Maybe<Scalars['String']['output']>;
};

export type BackupDiscoveredService = {
  __typename?: 'BackupDiscoveredService';
  autoExclude?: Maybe<Scalars['Boolean']['output']>;
  autoExcludeReason?: Maybe<Scalars['String']['output']>;
  backupStrategy?: Maybe<Scalars['String']['output']>;
  engine?: Maybe<BackupComponentType>;
  hasVolume?: Maybe<Scalars['Boolean']['output']>;
  image?: Maybe<Scalars['String']['output']>;
  imageFamily?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
};

export type BackupDiscoveredVolume = {
  __typename?: 'BackupDiscoveredVolume';
  autoExclude?: Maybe<Scalars['Boolean']['output']>;
  autoExcludeReason?: Maybe<Scalars['String']['output']>;
  name?: Maybe<Scalars['String']['output']>;
  services?: Maybe<Array<Scalars['String']['output']>>;
};

export type BackupDiscovery = {
  __typename?: 'BackupDiscovery';
  envFiles?: Maybe<Array<BackupDiscoveredEnvFile>>;
  paths?: Maybe<Array<BackupDiscoveredPath>>;
  services?: Maybe<Array<BackupDiscoveredService>>;
  volumes?: Maybe<Array<BackupDiscoveredVolume>>;
};

export type BackupKey = {
  __typename?: 'BackupKey';
  acknowledged?: Maybe<Scalars['Boolean']['output']>;
  acknowledgedAt?: Maybe<Scalars['DateTime']['output']>;
  acknowledgedBy?: Maybe<User>;
  acknowledgedById?: Maybe<Scalars['String']['output']>;
  active?: Maybe<Scalars['Boolean']['output']>;
  algorithm?: Maybe<BackupKeyAlgorithm>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  fingerprint?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  publicKey?: Maybe<Scalars['String']['output']>;
  rotatedAt?: Maybe<Scalars['DateTime']['output']>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BackupKeyAggregate = {
  average?: InputMaybe<Array<BackupKeyFields>>;
  count?: InputMaybe<Array<BackupKeyFields>>;
  maximum?: InputMaybe<Array<BackupKeyFields>>;
  minimum?: InputMaybe<Array<BackupKeyFields>>;
  sum?: InputMaybe<Array<BackupKeyFields>>;
};

export enum BackupKeyAlgorithm {
  Age = 'Age',
  Gpg = 'Gpg'
}

export enum BackupKeyFields {
  Acknowledged = 'acknowledged',
  AcknowledgedAt = 'acknowledgedAt',
  AcknowledgedById = 'acknowledgedById',
  Active = 'active',
  Algorithm = 'algorithm',
  CreatedAt = 'createdAt',
  Fingerprint = 'fingerprint',
  Id = 'id',
  PrivateKeyPath = 'privateKeyPath',
  PublicKey = 'publicKey',
  RotatedAt = 'rotatedAt',
  UpdatedAt = 'updatedAt'
}

export type BackupKeyFilter = {
  AND?: InputMaybe<Array<BackupKeyFilter>>;
  NOT?: InputMaybe<BackupKeyFilter>;
  OR?: InputMaybe<Array<BackupKeyFilter>>;
  acknowledged?: InputMaybe<BooleanFilter>;
  active?: InputMaybe<BooleanFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  fingerprint?: InputMaybe<StringFilter>;
  id?: InputMaybe<StringFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type BackupKeyOrderBy = {
  acknowledged?: InputMaybe<OrderBy>;
  acknowledgedAt?: InputMaybe<OrderBy>;
  active?: InputMaybe<OrderBy>;
  createdAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  rotatedAt?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type BackupKeyUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type BackupPolicy = {
  __typename?: 'BackupPolicy';
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  cron?: Maybe<Scalars['String']['output']>;
  destinations?: Maybe<Array<BackupDestination>>;
  enabled?: Maybe<Scalars['Boolean']['output']>;
  excludeEnvFiles?: Maybe<Array<Scalars['String']['output']>>;
  excludePaths?: Maybe<Array<Scalars['String']['output']>>;
  excludeServices?: Maybe<Array<Scalars['String']['output']>>;
  excludeVolumes?: Maybe<Array<Scalars['String']['output']>>;
  extraEnvFiles?: Maybe<Array<Scalars['String']['output']>>;
  id?: Maybe<Scalars['String']['output']>;
  retentionDays?: Maybe<Scalars['Int']['output']>;
  runs?: Maybe<Array<BackupRun>>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BackupPolicyAggregate = {
  average?: InputMaybe<Array<BackupPolicyFields>>;
  count?: InputMaybe<Array<BackupPolicyFields>>;
  maximum?: InputMaybe<Array<BackupPolicyFields>>;
  minimum?: InputMaybe<Array<BackupPolicyFields>>;
  sum?: InputMaybe<Array<BackupPolicyFields>>;
};

export enum BackupPolicyFields {
  CreatedAt = 'createdAt',
  Cron = 'cron',
  Enabled = 'enabled',
  ExcludeEnvFiles = 'excludeEnvFiles',
  ExcludePaths = 'excludePaths',
  ExcludeServices = 'excludeServices',
  ExcludeVolumes = 'excludeVolumes',
  ExtraEnvFiles = 'extraEnvFiles',
  Id = 'id',
  RetentionDays = 'retentionDays',
  UpdatedAt = 'updatedAt'
}

export type BackupPolicyFilter = {
  AND?: InputMaybe<Array<BackupPolicyFilter>>;
  NOT?: InputMaybe<BackupPolicyFilter>;
  OR?: InputMaybe<Array<BackupPolicyFilter>>;
  createdAt?: InputMaybe<DateTimeFilter>;
  cron?: InputMaybe<StringFilter>;
  enabled?: InputMaybe<BooleanFilter>;
  id?: InputMaybe<StringFilter>;
  retentionDays?: InputMaybe<IntFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type BackupPolicyOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  cron?: InputMaybe<OrderBy>;
  enabled?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  retentionDays?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export type BackupPolicyUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
};

export type BackupRun = {
  __typename?: 'BackupRun';
  archiveAvailability: BackupArchiveAvailability;
  archiveBytes?: Maybe<Scalars['String']['output']>;
  archivePath?: Maybe<Scalars['String']['output']>;
  archiveSha256?: Maybe<Scalars['String']['output']>;
  cancelRequested?: Maybe<Scalars['Boolean']['output']>;
  components?: Maybe<Array<BackupComponent>>;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  destinations?: Maybe<Array<BackupRunDestination>>;
  errorMessage?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  heartbeatAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  keyFingerprint?: Maybe<Scalars['String']['output']>;
  /** [BackupManifest] */
  manifest?: Maybe<Scalars['Json']['output']>;
  policy?: Maybe<BackupPolicy>;
  policyId?: Maybe<Scalars['String']['output']>;
  requestedBy?: Maybe<User>;
  requestedById?: Maybe<Scalars['String']['output']>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<BackupRunStatus>;
  trigger?: Maybe<BackupRunTrigger>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
};

export type BackupRunAggregate = {
  average?: InputMaybe<Array<BackupRunFields>>;
  count?: InputMaybe<Array<BackupRunFields>>;
  maximum?: InputMaybe<Array<BackupRunFields>>;
  minimum?: InputMaybe<Array<BackupRunFields>>;
  sum?: InputMaybe<Array<BackupRunFields>>;
};

export type BackupRunDestination = {
  __typename?: 'BackupRunDestination';
  archiveDeletedAt?: Maybe<Scalars['DateTime']['output']>;
  availability: BackupArchiveAvailability;
  createdAt?: Maybe<Scalars['DateTime']['output']>;
  destination?: Maybe<BackupDestination>;
  destinationId?: Maybe<Scalars['String']['output']>;
  error?: Maybe<Scalars['String']['output']>;
  finalPath?: Maybe<Scalars['String']['output']>;
  finishedAt?: Maybe<Scalars['DateTime']['output']>;
  id?: Maybe<Scalars['String']['output']>;
  run?: Maybe<BackupRun>;
  runId?: Maybe<Scalars['String']['output']>;
  startedAt?: Maybe<Scalars['DateTime']['output']>;
  status?: Maybe<BackupComponentStatus>;
  updatedAt?: Maybe<Scalars['DateTime']['output']>;
  uploadedBytes?: Maybe<Scalars['String']['output']>;
};

export enum BackupRunDestinationFields {
  ArchiveDeletedAt = 'archiveDeletedAt',
  CreatedAt = 'createdAt',
  DestinationId = 'destinationId',
  Error = 'error',
  FinalPath = 'finalPath',
  FinishedAt = 'finishedAt',
  Id = 'id',
  RunId = 'runId',
  StartedAt = 'startedAt',
  Status = 'status',
  UpdatedAt = 'updatedAt',
  UploadedBytes = 'uploadedBytes'
}

export enum BackupRunFields {
  ArchiveBytes = 'archiveBytes',
  ArchivePath = 'archivePath',
  ArchiveSha256 = 'archiveSha256',
  CancelRequested = 'cancelRequested',
  CreatedAt = 'createdAt',
  ErrorMessage = 'errorMessage',
  FinishedAt = 'finishedAt',
  HeartbeatAt = 'heartbeatAt',
  Id = 'id',
  KeyFingerprint = 'keyFingerprint',
  Manifest = 'manifest',
  PolicyId = 'policyId',
  RequestedById = 'requestedById',
  StartedAt = 'startedAt',
  Status = 'status',
  Trigger = 'trigger',
  UpdatedAt = 'updatedAt'
}

export type BackupRunFilter = {
  AND?: InputMaybe<Array<BackupRunFilter>>;
  NOT?: InputMaybe<BackupRunFilter>;
  OR?: InputMaybe<Array<BackupRunFilter>>;
  cancelRequested?: InputMaybe<BooleanFilter>;
  createdAt?: InputMaybe<DateTimeFilter>;
  finishedAt?: InputMaybe<DateTimeFilter>;
  id?: InputMaybe<StringFilter>;
  keyFingerprint?: InputMaybe<StringFilter>;
  policyId?: InputMaybe<StringFilter>;
  requestedBy?: InputMaybe<UserUniqueFilter>;
  requestedById?: InputMaybe<StringFilter>;
  startedAt?: InputMaybe<DateTimeFilter>;
  updatedAt?: InputMaybe<DateTimeFilter>;
};

export type BackupRunOrderBy = {
  createdAt?: InputMaybe<OrderBy>;
  finishedAt?: InputMaybe<OrderBy>;
  id?: InputMaybe<OrderBy>;
  startedAt?: InputMaybe<OrderBy>;
  updatedAt?: InputMaybe<OrderBy>;
};

export enum BackupRunStatus {
  Cancelled = 'Cancelled',
  Failed = 'Failed',
  Queued = 'Queued',
  Running = 'Running',
  Success = 'Success'
}

export enum BackupRunTrigger {
  Manual = 'Manual',
  Retry = 'Retry',
  Scheduled = 'Scheduled',
  Test = 'Test'
}

export type BackupRunUniqueFilter = {
  id?: InputMaybe<Scalars['String']['input']>;
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
  /** Acknowledge that the backup encryption key has been securely stored offline. */
  acknowledgeBackupKey?: Maybe<BackupKey>;
  /** Request cancellation of an in-flight backup run. */
  cancelBackupRun?: Maybe<BackupRun>;
  /** Create a new account. */
  createAccount?: Maybe<Account>;
  /** Create a new backup destination. */
  createBackupDestination?: Maybe<BackupDestination>;
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
  /** Delete the archive file for a specific backup run destination. The DB record is retained so the run remains visible as an audit trail; only the archive file itself is removed. */
  deleteBackupArchive?: Maybe<BackupRunDestination>;
  /** Delete a backup destination. */
  deleteBackupDestination?: Maybe<BackupDestination>;
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
  /** Return the private key material for an acknowledged BackupKey. Rate limited to one call per minute per user and audited via the Log service. */
  downloadBackupPrivateKey?: Maybe<Scalars['String']['output']>;
  /** Rotate the active backup encryption key. Retires the current key (sets active=false, rotatedAt=now) and lets the sidecar worker generate a fresh keypair on its next poll. The old key row is retained so historical archives remain decryptable. */
  rotateBackupKey?: Maybe<BackupKey>;
  /** Enqueue a manual backup run for immediate execution by the sidecar worker. */
  triggerBackupRun?: Maybe<BackupRun>;
  /** Update the specified account. */
  updateAccount?: Maybe<Account>;
  /** Update a backup destination. */
  updateBackupDestination?: Maybe<BackupDestination>;
  /** Upsert the single BackupPolicy. */
  updateBackupPolicy?: Maybe<BackupPolicy>;
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


export type MutationAcknowledgeBackupKeyArgs = {
  id: Scalars['String']['input'];
};


export type MutationCancelBackupRunArgs = {
  id: Scalars['String']['input'];
};


export type MutationCreateAccountArgs = {
  create: AccountCreateInput;
};


export type MutationCreateBackupDestinationArgs = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  name: Scalars['String']['input'];
  order?: InputMaybe<Scalars['Int']['input']>;
  output?: InputMaybe<Scalars['String']['input']>;
  sseKmsKeyId?: InputMaybe<Scalars['String']['input']>;
  sseMode?: InputMaybe<Scalars['String']['input']>;
  type: BackupDestinationType;
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


export type MutationDeleteBackupArchiveArgs = {
  runDestinationId: Scalars['String']['input'];
};


export type MutationDeleteBackupDestinationArgs = {
  id: Scalars['String']['input'];
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


export type MutationDownloadBackupPrivateKeyArgs = {
  id: Scalars['String']['input'];
};


export type MutationUpdateAccountArgs = {
  update: AccountUpdateInput;
  where: AccountUniqueFilter;
};


export type MutationUpdateBackupDestinationArgs = {
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  output?: InputMaybe<Scalars['String']['input']>;
  sseKmsKeyId?: InputMaybe<Scalars['String']['input']>;
  sseMode?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<BackupDestinationType>;
};


export type MutationUpdateBackupPolicyArgs = {
  cron?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  excludeEnvFiles?: InputMaybe<Array<Scalars['String']['input']>>;
  excludePaths?: InputMaybe<Array<Scalars['String']['input']>>;
  excludeServices?: InputMaybe<Array<Scalars['String']['input']>>;
  excludeVolumes?: InputMaybe<Array<Scalars['String']['input']>>;
  extraEnvFiles?: InputMaybe<Array<Scalars['String']['input']>>;
  retentionDays?: InputMaybe<Scalars['Int']['input']>;
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
  /** Count the number of backup destinations. */
  countBackupDestinations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup keys. */
  countBackupKeys?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup policies. */
  countBackupPolicies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup runs. */
  countBackupRuns?: Maybe<Scalars['Int']['output']>;
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
  /** Enumerate backup-capable services, volumes, bind paths, and env files from the live workspace. */
  discoverBackupSources?: Maybe<BackupDiscovery>;
  /** Group a list of accounts. */
  groupAccounts?: Maybe<Array<Scalars['AccountGroupBy']['output']>>;
  /** Group a list of backup destinations. */
  groupBackupDestinations?: Maybe<Array<Scalars['BackupDestinationGroupBy']['output']>>;
  /** Group a list of backup keys. */
  groupBackupKeys?: Maybe<Array<Scalars['BackupKeyGroupBy']['output']>>;
  /** Group a list of backup policies. */
  groupBackupPolicies?: Maybe<Array<Scalars['BackupPolicyGroupBy']['output']>>;
  /** Group a list of backup runs. */
  groupBackupRuns?: Maybe<Array<Scalars['BackupRunGroupBy']['output']>>;
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
  /** Paginate through backup destinations. */
  pageBackupDestination?: Maybe<QueryPageBackupDestinationConnection>;
  /** Paginate through backup keys. */
  pageBackupKey?: Maybe<QueryPageBackupKeyConnection>;
  /** Paginate through backup policies. */
  pageBackupPolicy?: Maybe<QueryPageBackupPolicyConnection>;
  /** Paginate through backup runs. */
  pageBackupRun?: Maybe<QueryPageBackupRunConnection>;
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
  /** Read a unique backup destination. */
  readBackupDestination?: Maybe<BackupDestination>;
  /** Read a list of backup destinations. */
  readBackupDestinations?: Maybe<Array<BackupDestination>>;
  /** Read a unique backup key. */
  readBackupKey?: Maybe<BackupKey>;
  /** Read a list of backup keys (active and historical). */
  readBackupKeys?: Maybe<Array<BackupKey>>;
  /** Read a list of backup policies. */
  readBackupPolicies?: Maybe<Array<BackupPolicy>>;
  /** Read a unique backup policy. */
  readBackupPolicy?: Maybe<BackupPolicy>;
  /** Read a unique backup run. */
  readBackupRun?: Maybe<BackupRun>;
  /** Read a list of backup runs. */
  readBackupRuns?: Maybe<Array<BackupRun>>;
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


export type QueryCountBackupDestinationsArgs = {
  where?: InputMaybe<BackupDestinationFilter>;
};


export type QueryCountBackupKeysArgs = {
  where?: InputMaybe<BackupKeyFilter>;
};


export type QueryCountBackupPoliciesArgs = {
  where?: InputMaybe<BackupPolicyFilter>;
};


export type QueryCountBackupRunsArgs = {
  where?: InputMaybe<BackupRunFilter>;
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


export type QueryGroupBackupDestinationsArgs = {
  aggregate?: InputMaybe<BackupDestinationAggregate>;
  by: Array<BackupDestinationFields>;
  where?: InputMaybe<BackupDestinationFilter>;
};


export type QueryGroupBackupKeysArgs = {
  aggregate?: InputMaybe<BackupKeyAggregate>;
  by: Array<BackupKeyFields>;
  where?: InputMaybe<BackupKeyFilter>;
};


export type QueryGroupBackupPoliciesArgs = {
  aggregate?: InputMaybe<BackupPolicyAggregate>;
  by: Array<BackupPolicyFields>;
  where?: InputMaybe<BackupPolicyFilter>;
};


export type QueryGroupBackupRunsArgs = {
  aggregate?: InputMaybe<BackupRunAggregate>;
  by: Array<BackupRunFields>;
  where?: InputMaybe<BackupRunFilter>;
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


export type QueryPageBackupDestinationArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BackupDestinationFilter>;
};


export type QueryPageBackupKeyArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BackupKeyFilter>;
};


export type QueryPageBackupPolicyArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BackupPolicyFilter>;
};


export type QueryPageBackupRunArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  where?: InputMaybe<BackupRunFilter>;
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


export type QueryReadBackupDestinationArgs = {
  where: BackupDestinationUniqueFilter;
};


export type QueryReadBackupDestinationsArgs = {
  distinct?: InputMaybe<Array<BackupDestinationFields>>;
  orderBy?: InputMaybe<Array<BackupDestinationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupDestinationFilter>;
};


export type QueryReadBackupKeyArgs = {
  where: BackupKeyUniqueFilter;
};


export type QueryReadBackupKeysArgs = {
  distinct?: InputMaybe<Array<BackupKeyFields>>;
  orderBy?: InputMaybe<Array<BackupKeyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupKeyFilter>;
};


export type QueryReadBackupPoliciesArgs = {
  distinct?: InputMaybe<Array<BackupPolicyFields>>;
  orderBy?: InputMaybe<Array<BackupPolicyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupPolicyFilter>;
};


export type QueryReadBackupPolicyArgs = {
  where: BackupPolicyUniqueFilter;
};


export type QueryReadBackupRunArgs = {
  where: BackupRunUniqueFilter;
};


export type QueryReadBackupRunsArgs = {
  distinct?: InputMaybe<Array<BackupRunFields>>;
  orderBy?: InputMaybe<Array<BackupRunOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupRunFilter>;
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

export type QueryPageBackupDestinationConnection = {
  __typename?: 'QueryPageBackupDestinationConnection';
  edges?: Maybe<Array<Maybe<QueryPageBackupDestinationConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageBackupDestinationConnectionEdge = {
  __typename?: 'QueryPageBackupDestinationConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<BackupDestination>;
};

export type QueryPageBackupKeyConnection = {
  __typename?: 'QueryPageBackupKeyConnection';
  edges?: Maybe<Array<Maybe<QueryPageBackupKeyConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageBackupKeyConnectionEdge = {
  __typename?: 'QueryPageBackupKeyConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<BackupKey>;
};

export type QueryPageBackupPolicyConnection = {
  __typename?: 'QueryPageBackupPolicyConnection';
  edges?: Maybe<Array<Maybe<QueryPageBackupPolicyConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageBackupPolicyConnectionEdge = {
  __typename?: 'QueryPageBackupPolicyConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<BackupPolicy>;
};

export type QueryPageBackupRunConnection = {
  __typename?: 'QueryPageBackupRunConnection';
  edges?: Maybe<Array<Maybe<QueryPageBackupRunConnectionEdge>>>;
  pageInfo: PageInfo;
};

export type QueryPageBackupRunConnectionEdge = {
  __typename?: 'QueryPageBackupRunConnectionEdge';
  cursor: Scalars['String']['output'];
  node?: Maybe<BackupRun>;
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
  /** Count the number of backup destinations. */
  countBackupDestinations?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup keys. */
  countBackupKeys?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup policies. */
  countBackupPolicies?: Maybe<Scalars['Int']['output']>;
  /** Count the number of backup runs. */
  countBackupRuns?: Maybe<Scalars['Int']['output']>;
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
  /** Group a list of backup destinations. */
  groupBackupDestinations?: Maybe<Array<Scalars['BackupDestinationGroupBy']['output']>>;
  /** Group a list of backup keys. */
  groupBackupKeys?: Maybe<Array<Scalars['BackupKeyGroupBy']['output']>>;
  /** Group a list of backup policies. */
  groupBackupPolicies?: Maybe<Array<Scalars['BackupPolicyGroupBy']['output']>>;
  /** Group a list of backup runs. */
  groupBackupRuns?: Maybe<Array<Scalars['BackupRunGroupBy']['output']>>;
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
  /** Read a unique backup destination. */
  readBackupDestination?: Maybe<BackupDestination>;
  /** Read a list of backup destinations. */
  readBackupDestinations?: Maybe<Array<BackupDestination>>;
  /** Read a unique backup key. */
  readBackupKey?: Maybe<BackupKey>;
  /** Read a list of backup keys (active and historical). */
  readBackupKeys?: Maybe<Array<BackupKey>>;
  /** Read a list of backup policies. */
  readBackupPolicies?: Maybe<Array<BackupPolicy>>;
  /** Read a unique backup policy. */
  readBackupPolicy?: Maybe<BackupPolicy>;
  /** Read a unique backup run. */
  readBackupRun?: Maybe<BackupRun>;
  /** Read a list of backup runs. */
  readBackupRuns?: Maybe<Array<BackupRun>>;
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


export type SubscriptionCountBackupDestinationsArgs = {
  where?: InputMaybe<BackupDestinationFilter>;
};


export type SubscriptionCountBackupKeysArgs = {
  where?: InputMaybe<BackupKeyFilter>;
};


export type SubscriptionCountBackupPoliciesArgs = {
  where?: InputMaybe<BackupPolicyFilter>;
};


export type SubscriptionCountBackupRunsArgs = {
  where?: InputMaybe<BackupRunFilter>;
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


export type SubscriptionGroupBackupDestinationsArgs = {
  aggregate?: InputMaybe<BackupDestinationAggregate>;
  by: Array<BackupDestinationFields>;
  where?: InputMaybe<BackupDestinationFilter>;
};


export type SubscriptionGroupBackupKeysArgs = {
  aggregate?: InputMaybe<BackupKeyAggregate>;
  by: Array<BackupKeyFields>;
  where?: InputMaybe<BackupKeyFilter>;
};


export type SubscriptionGroupBackupPoliciesArgs = {
  aggregate?: InputMaybe<BackupPolicyAggregate>;
  by: Array<BackupPolicyFields>;
  where?: InputMaybe<BackupPolicyFilter>;
};


export type SubscriptionGroupBackupRunsArgs = {
  aggregate?: InputMaybe<BackupRunAggregate>;
  by: Array<BackupRunFields>;
  where?: InputMaybe<BackupRunFilter>;
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


export type SubscriptionReadBackupDestinationArgs = {
  where: BackupDestinationUniqueFilter;
};


export type SubscriptionReadBackupDestinationsArgs = {
  distinct?: InputMaybe<Array<BackupDestinationFields>>;
  orderBy?: InputMaybe<Array<BackupDestinationOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupDestinationFilter>;
};


export type SubscriptionReadBackupKeyArgs = {
  where: BackupKeyUniqueFilter;
};


export type SubscriptionReadBackupKeysArgs = {
  distinct?: InputMaybe<Array<BackupKeyFields>>;
  orderBy?: InputMaybe<Array<BackupKeyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupKeyFilter>;
};


export type SubscriptionReadBackupPoliciesArgs = {
  distinct?: InputMaybe<Array<BackupPolicyFields>>;
  orderBy?: InputMaybe<Array<BackupPolicyOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupPolicyFilter>;
};


export type SubscriptionReadBackupPolicyArgs = {
  where: BackupPolicyUniqueFilter;
};


export type SubscriptionReadBackupRunArgs = {
  where: BackupRunUniqueFilter;
};


export type SubscriptionReadBackupRunsArgs = {
  distinct?: InputMaybe<Array<BackupRunFields>>;
  orderBy?: InputMaybe<Array<BackupRunOrderBy>>;
  paging?: InputMaybe<PagingInput>;
  where?: InputMaybe<BackupRunFilter>;
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

export type ReadBackupPolicyQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadBackupPolicyQuery = { __typename?: 'Query', readBackupPolicies?: Array<{ __typename?: 'BackupPolicy', id?: string | null, enabled?: boolean | null, cron?: string | null, retentionDays?: number | null, excludeVolumes?: Array<string> | null, excludePaths?: Array<string> | null, excludeServices?: Array<string> | null, excludeEnvFiles?: Array<string> | null, extraEnvFiles?: Array<string> | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type DiscoverBackupSourcesQueryVariables = Exact<{ [key: string]: never; }>;


export type DiscoverBackupSourcesQuery = { __typename?: 'Query', discoverBackupSources?: { __typename?: 'BackupDiscovery', services?: Array<{ __typename?: 'BackupDiscoveredService', name?: string | null, hasVolume?: boolean | null, image?: string | null, engine?: BackupComponentType | null, imageFamily?: string | null, backupStrategy?: string | null, autoExclude?: boolean | null, autoExcludeReason?: string | null }> | null, volumes?: Array<{ __typename?: 'BackupDiscoveredVolume', name?: string | null, services?: Array<string> | null, autoExclude?: boolean | null, autoExcludeReason?: string | null }> | null, paths?: Array<{ __typename?: 'BackupDiscoveredPath', path?: string | null, type?: string | null, services?: Array<string> | null, autoExclude?: boolean | null, autoExcludeReason?: string | null }> | null, envFiles?: Array<{ __typename?: 'BackupDiscoveredEnvFile', path?: string | null, exists?: boolean | null, source?: string | null, autoExclude?: boolean | null, autoExcludeReason?: string | null }> | null } | null };

export type ReadBackupDestinationsQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadBackupDestinationsQuery = { __typename?: 'Query', readBackupDestinations?: Array<{ __typename?: 'BackupDestination', id?: string | null, policyId?: string | null, name?: string | null, type?: BackupDestinationType | null, output?: string | null, enabled?: boolean | null, sseMode?: string | null, sseKmsKeyId?: string | null, order?: number | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ReadBackupRunsQueryVariables = Exact<{
  skip?: Scalars['Int']['input'];
  take?: Scalars['Int']['input'];
}>;


export type ReadBackupRunsQuery = { __typename?: 'Query', readBackupRuns?: Array<{ __typename?: 'BackupRun', id?: string | null, policyId?: string | null, status?: BackupRunStatus | null, trigger?: BackupRunTrigger | null, keyFingerprint?: string | null, startedAt?: string | null, finishedAt?: string | null, heartbeatAt?: string | null, archivePath?: string | null, archiveBytes?: string | null, archiveAvailability: BackupArchiveAvailability, cancelRequested?: boolean | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type ReadBackupRunQueryVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type ReadBackupRunQuery = { __typename?: 'Query', readBackupRun?: { __typename?: 'BackupRun', id?: string | null, policyId?: string | null, status?: BackupRunStatus | null, trigger?: BackupRunTrigger | null, requestedById?: string | null, keyFingerprint?: string | null, startedAt?: string | null, finishedAt?: string | null, heartbeatAt?: string | null, archivePath?: string | null, archiveBytes?: string | null, archiveSha256?: string | null, manifest?: any | null, errorMessage?: string | null, cancelRequested?: boolean | null, createdAt?: string | null, updatedAt?: string | null, archiveAvailability: BackupArchiveAvailability, requestedBy?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null } | null, components?: Array<{ __typename?: 'BackupComponent', id?: string | null, runId?: string | null, type?: BackupComponentType | null, name?: string | null, status?: BackupComponentStatus | null, bytes?: string | null, durationMs?: number | null, error?: string | null, startedAt?: string | null, finishedAt?: string | null, createdAt?: string | null, updatedAt?: string | null }> | null, destinations?: Array<{ __typename?: 'BackupRunDestination', id?: string | null, runId?: string | null, destinationId?: string | null, status?: BackupComponentStatus | null, uploadedBytes?: string | null, finalPath?: string | null, archiveDeletedAt?: string | null, availability: BackupArchiveAvailability, error?: string | null, startedAt?: string | null, finishedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, destination?: { __typename?: 'BackupDestination', id?: string | null, name?: string | null, type?: BackupDestinationType | null, output?: string | null } | null }> | null } | null };

export type ReadBackupKeysQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadBackupKeysQuery = { __typename?: 'Query', readBackupKeys?: Array<{ __typename?: 'BackupKey', id?: string | null, algorithm?: BackupKeyAlgorithm | null, publicKey?: string | null, fingerprint?: string | null, active?: boolean | null, acknowledged?: boolean | null, acknowledgedAt?: string | null, acknowledgedById?: string | null, rotatedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, acknowledgedBy?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null } | null }> | null };

export type ReadActiveBackupKeyQueryVariables = Exact<{ [key: string]: never; }>;


export type ReadActiveBackupKeyQuery = { __typename?: 'Query', readBackupKeys?: Array<{ __typename?: 'BackupKey', id?: string | null, algorithm?: BackupKeyAlgorithm | null, publicKey?: string | null, fingerprint?: string | null, active?: boolean | null, acknowledged?: boolean | null, acknowledgedAt?: string | null, acknowledgedById?: string | null, rotatedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, acknowledgedBy?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null } | null }> | null };

export type UpdateBackupPolicyMutationVariables = Exact<{
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  cron?: InputMaybe<Scalars['String']['input']>;
  retentionDays?: InputMaybe<Scalars['Int']['input']>;
  excludeVolumes?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  excludePaths?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  excludeServices?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  excludeEnvFiles?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
  extraEnvFiles?: InputMaybe<Array<Scalars['String']['input']> | Scalars['String']['input']>;
}>;


export type UpdateBackupPolicyMutation = { __typename?: 'Mutation', updateBackupPolicy?: { __typename?: 'BackupPolicy', id?: string | null, enabled?: boolean | null, cron?: string | null, retentionDays?: number | null, excludeVolumes?: Array<string> | null, excludePaths?: Array<string> | null, excludeServices?: Array<string> | null, excludeEnvFiles?: Array<string> | null, extraEnvFiles?: Array<string> | null, updatedAt?: string | null } | null };

export type CreateBackupDestinationMutationVariables = Exact<{
  name: Scalars['String']['input'];
  type: BackupDestinationType;
  output?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  sseMode?: InputMaybe<Scalars['String']['input']>;
  sseKmsKeyId?: InputMaybe<Scalars['String']['input']>;
}>;


export type CreateBackupDestinationMutation = { __typename?: 'Mutation', createBackupDestination?: { __typename?: 'BackupDestination', id?: string | null, name?: string | null, type?: BackupDestinationType | null, output?: string | null, enabled?: boolean | null, order?: number | null, sseMode?: string | null, sseKmsKeyId?: string | null } | null };

export type UpdateBackupDestinationMutationVariables = Exact<{
  id: Scalars['String']['input'];
  name?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<BackupDestinationType>;
  output?: InputMaybe<Scalars['String']['input']>;
  enabled?: InputMaybe<Scalars['Boolean']['input']>;
  order?: InputMaybe<Scalars['Int']['input']>;
  sseMode?: InputMaybe<Scalars['String']['input']>;
  sseKmsKeyId?: InputMaybe<Scalars['String']['input']>;
}>;


export type UpdateBackupDestinationMutation = { __typename?: 'Mutation', updateBackupDestination?: { __typename?: 'BackupDestination', id?: string | null, name?: string | null, type?: BackupDestinationType | null, output?: string | null, enabled?: boolean | null, order?: number | null, sseMode?: string | null, sseKmsKeyId?: string | null } | null };

export type DeleteBackupDestinationMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DeleteBackupDestinationMutation = { __typename?: 'Mutation', deleteBackupDestination?: { __typename?: 'BackupDestination', id?: string | null } | null };

export type TriggerBackupRunMutationVariables = Exact<{ [key: string]: never; }>;


export type TriggerBackupRunMutation = { __typename?: 'Mutation', triggerBackupRun?: { __typename?: 'BackupRun', id?: string | null, status?: BackupRunStatus | null, trigger?: BackupRunTrigger | null } | null };

export type CancelBackupRunMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type CancelBackupRunMutation = { __typename?: 'Mutation', cancelBackupRun?: { __typename?: 'BackupRun', id?: string | null, status?: BackupRunStatus | null, cancelRequested?: boolean | null } | null };

export type DeleteBackupArchiveMutationVariables = Exact<{
  runDestinationId: Scalars['String']['input'];
}>;


export type DeleteBackupArchiveMutation = { __typename?: 'Mutation', deleteBackupArchive?: { __typename?: 'BackupRunDestination', id?: string | null, runId?: string | null, finalPath?: string | null, archiveDeletedAt?: string | null, availability: BackupArchiveAvailability } | null };

export type RotateBackupKeyMutationVariables = Exact<{ [key: string]: never; }>;


export type RotateBackupKeyMutation = { __typename?: 'Mutation', rotateBackupKey?: { __typename?: 'BackupKey', id?: string | null, fingerprint?: string | null, active?: boolean | null, acknowledged?: boolean | null, publicKey?: string | null } | null };

export type AcknowledgeBackupKeyMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type AcknowledgeBackupKeyMutation = { __typename?: 'Mutation', acknowledgeBackupKey?: { __typename?: 'BackupKey', id?: string | null, acknowledged?: boolean | null, acknowledgedAt?: string | null, acknowledgedById?: string | null } | null };

export type DownloadBackupPrivateKeyMutationVariables = Exact<{
  id: Scalars['String']['input'];
}>;


export type DownloadBackupPrivateKeyMutation = { __typename?: 'Mutation', downloadBackupPrivateKey?: string | null };

export type SubscribeBackupPolicySubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SubscribeBackupPolicySubscription = { __typename?: 'Subscription', readBackupPolicies?: Array<{ __typename?: 'BackupPolicy', id?: string | null, enabled?: boolean | null, cron?: string | null, retentionDays?: number | null, excludeVolumes?: Array<string> | null, excludePaths?: Array<string> | null, excludeServices?: Array<string> | null, excludeEnvFiles?: Array<string> | null, extraEnvFiles?: Array<string> | null, updatedAt?: string | null }> | null };

export type SubscribeBackupDestinationsSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SubscribeBackupDestinationsSubscription = { __typename?: 'Subscription', readBackupDestinations?: Array<{ __typename?: 'BackupDestination', id?: string | null, policyId?: string | null, name?: string | null, type?: BackupDestinationType | null, output?: string | null, enabled?: boolean | null, sseMode?: string | null, sseKmsKeyId?: string | null, order?: number | null, updatedAt?: string | null }> | null };

export type SubscribeBackupRunsSubscriptionVariables = Exact<{
  skip?: Scalars['Int']['input'];
  take?: Scalars['Int']['input'];
}>;


export type SubscribeBackupRunsSubscription = { __typename?: 'Subscription', readBackupRuns?: Array<{ __typename?: 'BackupRun', id?: string | null, policyId?: string | null, status?: BackupRunStatus | null, trigger?: BackupRunTrigger | null, keyFingerprint?: string | null, startedAt?: string | null, finishedAt?: string | null, heartbeatAt?: string | null, archivePath?: string | null, archiveBytes?: string | null, archiveAvailability: BackupArchiveAvailability, cancelRequested?: boolean | null, createdAt?: string | null, updatedAt?: string | null }> | null };

export type SubscribeBackupKeysSubscriptionVariables = Exact<{ [key: string]: never; }>;


export type SubscribeBackupKeysSubscription = { __typename?: 'Subscription', readBackupKeys?: Array<{ __typename?: 'BackupKey', id?: string | null, algorithm?: BackupKeyAlgorithm | null, publicKey?: string | null, fingerprint?: string | null, active?: boolean | null, acknowledged?: boolean | null, acknowledgedAt?: string | null, acknowledgedById?: string | null, rotatedAt?: string | null, createdAt?: string | null, updatedAt?: string | null, acknowledgedBy?: { __typename?: 'User', id?: string | null, name?: string | null, email?: string | null } | null }> | null };

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
export const ReadBackupPolicyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBackupPolicy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupPolicies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skip"},"value":{"kind":"IntValue","value":"0"}},{"kind":"ObjectField","name":{"kind":"Name","value":"take"},"value":{"kind":"IntValue","value":"1"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"retentionDays"}},{"kind":"Field","name":{"kind":"Name","value":"excludeVolumes"}},{"kind":"Field","name":{"kind":"Name","value":"excludePaths"}},{"kind":"Field","name":{"kind":"Name","value":"excludeServices"}},{"kind":"Field","name":{"kind":"Name","value":"excludeEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"extraEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBackupPolicyQuery, ReadBackupPolicyQueryVariables>;
export const DiscoverBackupSourcesDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"DiscoverBackupSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"discoverBackupSources"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"services"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"hasVolume"}},{"kind":"Field","name":{"kind":"Name","value":"image"}},{"kind":"Field","name":{"kind":"Name","value":"engine"}},{"kind":"Field","name":{"kind":"Name","value":"imageFamily"}},{"kind":"Field","name":{"kind":"Name","value":"backupStrategy"}},{"kind":"Field","name":{"kind":"Name","value":"autoExclude"}},{"kind":"Field","name":{"kind":"Name","value":"autoExcludeReason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"volumes"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"services"}},{"kind":"Field","name":{"kind":"Name","value":"autoExclude"}},{"kind":"Field","name":{"kind":"Name","value":"autoExcludeReason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"paths"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"services"}},{"kind":"Field","name":{"kind":"Name","value":"autoExclude"}},{"kind":"Field","name":{"kind":"Name","value":"autoExcludeReason"}}]}},{"kind":"Field","name":{"kind":"Name","value":"envFiles"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"path"}},{"kind":"Field","name":{"kind":"Name","value":"exists"}},{"kind":"Field","name":{"kind":"Name","value":"source"}},{"kind":"Field","name":{"kind":"Name","value":"autoExclude"}},{"kind":"Field","name":{"kind":"Name","value":"autoExcludeReason"}}]}}]}}]}}]} as unknown as DocumentNode<DiscoverBackupSourcesQuery, DiscoverBackupSourcesQueryVariables>;
export const ReadBackupDestinationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBackupDestinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupDestinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policyId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"output"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sseMode"}},{"kind":"Field","name":{"kind":"Name","value":"sseKmsKeyId"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBackupDestinationsQuery, ReadBackupDestinationsQueryVariables>;
export const ReadBackupRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBackupRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policyId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}},{"kind":"Field","name":{"kind":"Name","value":"keyFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"heartbeatAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivePath"}},{"kind":"Field","name":{"kind":"Name","value":"archiveBytes"}},{"kind":"Field","name":{"kind":"Name","value":"archiveAvailability"}},{"kind":"Field","name":{"kind":"Name","value":"cancelRequested"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<ReadBackupRunsQuery, ReadBackupRunsQueryVariables>;
export const ReadBackupRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBackupRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policyId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}},{"kind":"Field","name":{"kind":"Name","value":"requestedById"}},{"kind":"Field","name":{"kind":"Name","value":"keyFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"heartbeatAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivePath"}},{"kind":"Field","name":{"kind":"Name","value":"archiveBytes"}},{"kind":"Field","name":{"kind":"Name","value":"archiveSha256"}},{"kind":"Field","name":{"kind":"Name","value":"manifest"}},{"kind":"Field","name":{"kind":"Name","value":"errorMessage"}},{"kind":"Field","name":{"kind":"Name","value":"cancelRequested"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"requestedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}},{"kind":"Field","name":{"kind":"Name","value":"components"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"bytes"}},{"kind":"Field","name":{"kind":"Name","value":"durationMs"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}},{"kind":"Field","name":{"kind":"Name","value":"archiveAvailability"}},{"kind":"Field","name":{"kind":"Name","value":"destinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"destinationId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"uploadedBytes"}},{"kind":"Field","name":{"kind":"Name","value":"finalPath"}},{"kind":"Field","name":{"kind":"Name","value":"archiveDeletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}},{"kind":"Field","name":{"kind":"Name","value":"error"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"destination"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"output"}}]}}]}}]}}]}}]} as unknown as DocumentNode<ReadBackupRunQuery, ReadBackupRunQueryVariables>;
export const ReadBackupKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadBackupKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"algorithm"}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledged"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedById"}},{"kind":"Field","name":{"kind":"Name","value":"rotatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ReadBackupKeysQuery, ReadBackupKeysQueryVariables>;
export const ReadActiveBackupKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"query","name":{"kind":"Name","value":"ReadActiveBackupKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupKeys"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"where"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"active"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"equals"},"value":{"kind":"BooleanValue","value":true}}]}}]}},{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skip"},"value":{"kind":"IntValue","value":"0"}},{"kind":"ObjectField","name":{"kind":"Name","value":"take"},"value":{"kind":"IntValue","value":"1"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"algorithm"}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledged"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedById"}},{"kind":"Field","name":{"kind":"Name","value":"rotatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<ReadActiveBackupKeyQuery, ReadActiveBackupKeyQueryVariables>;
export const UpdateBackupPolicyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBackupPolicy"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"cron"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"retentionDays"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeVolumes"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludePaths"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeServices"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"excludeEnvFiles"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"extraEnvFiles"}},"type":{"kind":"ListType","type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBackupPolicy"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"cron"},"value":{"kind":"Variable","name":{"kind":"Name","value":"cron"}}},{"kind":"Argument","name":{"kind":"Name","value":"retentionDays"},"value":{"kind":"Variable","name":{"kind":"Name","value":"retentionDays"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeVolumes"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeVolumes"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludePaths"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludePaths"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeServices"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeServices"}}},{"kind":"Argument","name":{"kind":"Name","value":"excludeEnvFiles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"excludeEnvFiles"}}},{"kind":"Argument","name":{"kind":"Name","value":"extraEnvFiles"},"value":{"kind":"Variable","name":{"kind":"Name","value":"extraEnvFiles"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"retentionDays"}},{"kind":"Field","name":{"kind":"Name","value":"excludeVolumes"}},{"kind":"Field","name":{"kind":"Name","value":"excludePaths"}},{"kind":"Field","name":{"kind":"Name","value":"excludeServices"}},{"kind":"Field","name":{"kind":"Name","value":"excludeEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"extraEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<UpdateBackupPolicyMutation, UpdateBackupPolicyMutationVariables>;
export const CreateBackupDestinationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CreateBackupDestination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"BackupDestinationType"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"output"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sseMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sseKmsKeyId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"createBackupDestination"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"output"},"value":{"kind":"Variable","name":{"kind":"Name","value":"output"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}},{"kind":"Argument","name":{"kind":"Name","value":"sseMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sseMode"}}},{"kind":"Argument","name":{"kind":"Name","value":"sseKmsKeyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sseKmsKeyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"output"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"sseMode"}},{"kind":"Field","name":{"kind":"Name","value":"sseKmsKeyId"}}]}}]}}]} as unknown as DocumentNode<CreateBackupDestinationMutation, CreateBackupDestinationMutationVariables>;
export const UpdateBackupDestinationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"UpdateBackupDestination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"name"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"type"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"BackupDestinationType"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"output"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Boolean"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"order"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sseMode"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"sseKmsKeyId"}},"type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"updateBackupDestination"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}},{"kind":"Argument","name":{"kind":"Name","value":"name"},"value":{"kind":"Variable","name":{"kind":"Name","value":"name"}}},{"kind":"Argument","name":{"kind":"Name","value":"type"},"value":{"kind":"Variable","name":{"kind":"Name","value":"type"}}},{"kind":"Argument","name":{"kind":"Name","value":"output"},"value":{"kind":"Variable","name":{"kind":"Name","value":"output"}}},{"kind":"Argument","name":{"kind":"Name","value":"enabled"},"value":{"kind":"Variable","name":{"kind":"Name","value":"enabled"}}},{"kind":"Argument","name":{"kind":"Name","value":"order"},"value":{"kind":"Variable","name":{"kind":"Name","value":"order"}}},{"kind":"Argument","name":{"kind":"Name","value":"sseMode"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sseMode"}}},{"kind":"Argument","name":{"kind":"Name","value":"sseKmsKeyId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"sseKmsKeyId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"output"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"sseMode"}},{"kind":"Field","name":{"kind":"Name","value":"sseKmsKeyId"}}]}}]}}]} as unknown as DocumentNode<UpdateBackupDestinationMutation, UpdateBackupDestinationMutationVariables>;
export const DeleteBackupDestinationDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBackupDestination"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBackupDestination"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}}]}}]}}]} as unknown as DocumentNode<DeleteBackupDestinationMutation, DeleteBackupDestinationMutationVariables>;
export const TriggerBackupRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"TriggerBackupRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"triggerBackupRun"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}}]}}]}}]} as unknown as DocumentNode<TriggerBackupRunMutation, TriggerBackupRunMutationVariables>;
export const CancelBackupRunDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"CancelBackupRun"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"cancelBackupRun"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"cancelRequested"}}]}}]}}]} as unknown as DocumentNode<CancelBackupRunMutation, CancelBackupRunMutationVariables>;
export const DeleteBackupArchiveDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DeleteBackupArchive"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"runDestinationId"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"deleteBackupArchive"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"runDestinationId"},"value":{"kind":"Variable","name":{"kind":"Name","value":"runDestinationId"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"runId"}},{"kind":"Field","name":{"kind":"Name","value":"finalPath"}},{"kind":"Field","name":{"kind":"Name","value":"archiveDeletedAt"}},{"kind":"Field","name":{"kind":"Name","value":"availability"}}]}}]}}]} as unknown as DocumentNode<DeleteBackupArchiveMutation, DeleteBackupArchiveMutationVariables>;
export const RotateBackupKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"RotateBackupKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"rotateBackupKey"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledged"}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}}]}}]}}]} as unknown as DocumentNode<RotateBackupKeyMutation, RotateBackupKeyMutationVariables>;
export const AcknowledgeBackupKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"AcknowledgeBackupKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"acknowledgeBackupKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledged"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedById"}}]}}]}}]} as unknown as DocumentNode<AcknowledgeBackupKeyMutation, AcknowledgeBackupKeyMutationVariables>;
export const DownloadBackupPrivateKeyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"mutation","name":{"kind":"Name","value":"DownloadBackupPrivateKey"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"id"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"String"}}}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"downloadBackupPrivateKey"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"id"},"value":{"kind":"Variable","name":{"kind":"Name","value":"id"}}}]}]}}]} as unknown as DocumentNode<DownloadBackupPrivateKeyMutation, DownloadBackupPrivateKeyMutationVariables>;
export const SubscribeBackupPolicyDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBackupPolicy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupPolicies"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skip"},"value":{"kind":"IntValue","value":"0"}},{"kind":"ObjectField","name":{"kind":"Name","value":"take"},"value":{"kind":"IntValue","value":"1"}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"cron"}},{"kind":"Field","name":{"kind":"Name","value":"retentionDays"}},{"kind":"Field","name":{"kind":"Name","value":"excludeVolumes"}},{"kind":"Field","name":{"kind":"Name","value":"excludePaths"}},{"kind":"Field","name":{"kind":"Name","value":"excludeServices"}},{"kind":"Field","name":{"kind":"Name","value":"excludeEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"extraEnvFiles"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubscribeBackupPolicySubscription, SubscribeBackupPolicySubscriptionVariables>;
export const SubscribeBackupDestinationsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBackupDestinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupDestinations"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policyId"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"type"}},{"kind":"Field","name":{"kind":"Name","value":"output"}},{"kind":"Field","name":{"kind":"Name","value":"enabled"}},{"kind":"Field","name":{"kind":"Name","value":"sseMode"}},{"kind":"Field","name":{"kind":"Name","value":"sseKmsKeyId"}},{"kind":"Field","name":{"kind":"Name","value":"order"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubscribeBackupDestinationsSubscription, SubscribeBackupDestinationsSubscriptionVariables>;
export const SubscribeBackupRunsDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBackupRuns"},"variableDefinitions":[{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"skip"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"0"}},{"kind":"VariableDefinition","variable":{"kind":"Variable","name":{"kind":"Name","value":"take"}},"type":{"kind":"NonNullType","type":{"kind":"NamedType","name":{"kind":"Name","value":"Int"}}},"defaultValue":{"kind":"IntValue","value":"50"}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupRuns"},"arguments":[{"kind":"Argument","name":{"kind":"Name","value":"paging"},"value":{"kind":"ObjectValue","fields":[{"kind":"ObjectField","name":{"kind":"Name","value":"skip"},"value":{"kind":"Variable","name":{"kind":"Name","value":"skip"}}},{"kind":"ObjectField","name":{"kind":"Name","value":"take"},"value":{"kind":"Variable","name":{"kind":"Name","value":"take"}}}]}}],"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"policyId"}},{"kind":"Field","name":{"kind":"Name","value":"status"}},{"kind":"Field","name":{"kind":"Name","value":"trigger"}},{"kind":"Field","name":{"kind":"Name","value":"keyFingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"startedAt"}},{"kind":"Field","name":{"kind":"Name","value":"finishedAt"}},{"kind":"Field","name":{"kind":"Name","value":"heartbeatAt"}},{"kind":"Field","name":{"kind":"Name","value":"archivePath"}},{"kind":"Field","name":{"kind":"Name","value":"archiveBytes"}},{"kind":"Field","name":{"kind":"Name","value":"archiveAvailability"}},{"kind":"Field","name":{"kind":"Name","value":"cancelRequested"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}}]}}]}}]} as unknown as DocumentNode<SubscribeBackupRunsSubscription, SubscribeBackupRunsSubscriptionVariables>;
export const SubscribeBackupKeysDocument = {"kind":"Document","definitions":[{"kind":"OperationDefinition","operation":"subscription","name":{"kind":"Name","value":"SubscribeBackupKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"readBackupKeys"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"algorithm"}},{"kind":"Field","name":{"kind":"Name","value":"publicKey"}},{"kind":"Field","name":{"kind":"Name","value":"fingerprint"}},{"kind":"Field","name":{"kind":"Name","value":"active"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledged"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedById"}},{"kind":"Field","name":{"kind":"Name","value":"rotatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"createdAt"}},{"kind":"Field","name":{"kind":"Name","value":"updatedAt"}},{"kind":"Field","name":{"kind":"Name","value":"acknowledgedBy"},"selectionSet":{"kind":"SelectionSet","selections":[{"kind":"Field","name":{"kind":"Name","value":"id"}},{"kind":"Field","name":{"kind":"Name","value":"name"}},{"kind":"Field","name":{"kind":"Name","value":"email"}}]}}]}}]}}]} as unknown as DocumentNode<SubscribeBackupKeysSubscription, SubscribeBackupKeysSubscriptionVariables>;
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