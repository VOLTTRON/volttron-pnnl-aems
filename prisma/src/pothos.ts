/* eslint-disable */
import type { Prisma, Account, BackupPolicy, BackupDestination, BackupRun, BackupComponent, BackupRunDestination, BackupKey, Banner, Comment, Event, Feedback, File, Geography, Log, Seed, Session, User, VerificationToken } from "@prisma/client";
export default interface PrismaTypes {
    Account: {
        Name: "Account";
        Shape: Account;
        Include: Prisma.AccountInclude;
        Select: Prisma.AccountSelect;
        OrderBy: Prisma.AccountOrderByWithRelationInput;
        WhereUnique: Prisma.AccountWhereUniqueInput;
        Where: Prisma.AccountWhereInput;
        Create: Prisma.AccountCreateInput;
        Update: Prisma.AccountUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    BackupPolicy: {
        Name: "BackupPolicy";
        Shape: BackupPolicy;
        Include: Prisma.BackupPolicyInclude;
        Select: Prisma.BackupPolicySelect;
        OrderBy: Prisma.BackupPolicyOrderByWithRelationInput;
        WhereUnique: Prisma.BackupPolicyWhereUniqueInput;
        Where: Prisma.BackupPolicyWhereInput;
        Create: Prisma.BackupPolicyCreateInput;
        Update: Prisma.BackupPolicyUpdateInput;
        RelationName: "destinations" | "runs";
        ListRelations: "destinations" | "runs";
        Relations: {
            destinations: {
                Shape: BackupDestination[];
                Name: "BackupDestination";
                Nullable: false;
            };
            runs: {
                Shape: BackupRun[];
                Name: "BackupRun";
                Nullable: false;
            };
        };
    };
    BackupDestination: {
        Name: "BackupDestination";
        Shape: BackupDestination;
        Include: Prisma.BackupDestinationInclude;
        Select: Prisma.BackupDestinationSelect;
        OrderBy: Prisma.BackupDestinationOrderByWithRelationInput;
        WhereUnique: Prisma.BackupDestinationWhereUniqueInput;
        Where: Prisma.BackupDestinationWhereInput;
        Create: Prisma.BackupDestinationCreateInput;
        Update: Prisma.BackupDestinationUpdateInput;
        RelationName: "policy" | "runs";
        ListRelations: "runs";
        Relations: {
            policy: {
                Shape: BackupPolicy;
                Name: "BackupPolicy";
                Nullable: false;
            };
            runs: {
                Shape: BackupRunDestination[];
                Name: "BackupRunDestination";
                Nullable: false;
            };
        };
    };
    BackupRun: {
        Name: "BackupRun";
        Shape: BackupRun;
        Include: Prisma.BackupRunInclude;
        Select: Prisma.BackupRunSelect;
        OrderBy: Prisma.BackupRunOrderByWithRelationInput;
        WhereUnique: Prisma.BackupRunWhereUniqueInput;
        Where: Prisma.BackupRunWhereInput;
        Create: Prisma.BackupRunCreateInput;
        Update: Prisma.BackupRunUpdateInput;
        RelationName: "policy" | "requestedBy" | "components" | "destinations";
        ListRelations: "components" | "destinations";
        Relations: {
            policy: {
                Shape: BackupPolicy;
                Name: "BackupPolicy";
                Nullable: false;
            };
            requestedBy: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            components: {
                Shape: BackupComponent[];
                Name: "BackupComponent";
                Nullable: false;
            };
            destinations: {
                Shape: BackupRunDestination[];
                Name: "BackupRunDestination";
                Nullable: false;
            };
        };
    };
    BackupComponent: {
        Name: "BackupComponent";
        Shape: BackupComponent;
        Include: Prisma.BackupComponentInclude;
        Select: Prisma.BackupComponentSelect;
        OrderBy: Prisma.BackupComponentOrderByWithRelationInput;
        WhereUnique: Prisma.BackupComponentWhereUniqueInput;
        Where: Prisma.BackupComponentWhereInput;
        Create: Prisma.BackupComponentCreateInput;
        Update: Prisma.BackupComponentUpdateInput;
        RelationName: "run";
        ListRelations: never;
        Relations: {
            run: {
                Shape: BackupRun;
                Name: "BackupRun";
                Nullable: false;
            };
        };
    };
    BackupRunDestination: {
        Name: "BackupRunDestination";
        Shape: BackupRunDestination;
        Include: Prisma.BackupRunDestinationInclude;
        Select: Prisma.BackupRunDestinationSelect;
        OrderBy: Prisma.BackupRunDestinationOrderByWithRelationInput;
        WhereUnique: Prisma.BackupRunDestinationWhereUniqueInput;
        Where: Prisma.BackupRunDestinationWhereInput;
        Create: Prisma.BackupRunDestinationCreateInput;
        Update: Prisma.BackupRunDestinationUpdateInput;
        RelationName: "run" | "destination";
        ListRelations: never;
        Relations: {
            run: {
                Shape: BackupRun;
                Name: "BackupRun";
                Nullable: false;
            };
            destination: {
                Shape: BackupDestination;
                Name: "BackupDestination";
                Nullable: false;
            };
        };
    };
    BackupKey: {
        Name: "BackupKey";
        Shape: BackupKey;
        Include: Prisma.BackupKeyInclude;
        Select: Prisma.BackupKeySelect;
        OrderBy: Prisma.BackupKeyOrderByWithRelationInput;
        WhereUnique: Prisma.BackupKeyWhereUniqueInput;
        Where: Prisma.BackupKeyWhereInput;
        Create: Prisma.BackupKeyCreateInput;
        Update: Prisma.BackupKeyUpdateInput;
        RelationName: "acknowledgedBy";
        ListRelations: never;
        Relations: {
            acknowledgedBy: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    Banner: {
        Name: "Banner";
        Shape: Banner;
        Include: Prisma.BannerInclude;
        Select: Prisma.BannerSelect;
        OrderBy: Prisma.BannerOrderByWithRelationInput;
        WhereUnique: Prisma.BannerWhereUniqueInput;
        Where: Prisma.BannerWhereInput;
        Create: Prisma.BannerCreateInput;
        Update: Prisma.BannerUpdateInput;
        RelationName: "users";
        ListRelations: "users";
        Relations: {
            users: {
                Shape: User[];
                Name: "User";
                Nullable: false;
            };
        };
    };
    Comment: {
        Name: "Comment";
        Shape: Comment;
        Include: Prisma.CommentInclude;
        Select: Prisma.CommentSelect;
        OrderBy: Prisma.CommentOrderByWithRelationInput;
        WhereUnique: Prisma.CommentWhereUniqueInput;
        Where: Prisma.CommentWhereInput;
        Create: Prisma.CommentCreateInput;
        Update: Prisma.CommentUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
        };
    };
    Event: {
        Name: "Event";
        Shape: Event;
        Include: never;
        Select: Prisma.EventSelect;
        OrderBy: Prisma.EventOrderByWithRelationInput;
        WhereUnique: Prisma.EventWhereUniqueInput;
        Where: Prisma.EventWhereInput;
        Create: Prisma.EventCreateInput;
        Update: Prisma.EventUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    Feedback: {
        Name: "Feedback";
        Shape: Feedback;
        Include: Prisma.FeedbackInclude;
        Select: Prisma.FeedbackSelect;
        OrderBy: Prisma.FeedbackOrderByWithRelationInput;
        WhereUnique: Prisma.FeedbackWhereUniqueInput;
        Where: Prisma.FeedbackWhereInput;
        Create: Prisma.FeedbackCreateInput;
        Update: Prisma.FeedbackUpdateInput;
        RelationName: "user" | "assignee" | "files";
        ListRelations: "files";
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
            assignee: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            files: {
                Shape: File[];
                Name: "File";
                Nullable: false;
            };
        };
    };
    File: {
        Name: "File";
        Shape: File;
        Include: Prisma.FileInclude;
        Select: Prisma.FileSelect;
        OrderBy: Prisma.FileOrderByWithRelationInput;
        WhereUnique: Prisma.FileWhereUniqueInput;
        Where: Prisma.FileWhereInput;
        Create: Prisma.FileCreateInput;
        Update: Prisma.FileUpdateInput;
        RelationName: "user" | "feedback";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User | null;
                Name: "User";
                Nullable: true;
            };
            feedback: {
                Shape: Feedback | null;
                Name: "Feedback";
                Nullable: true;
            };
        };
    };
    Geography: {
        Name: "Geography";
        Shape: Geography;
        Include: never;
        Select: Prisma.GeographySelect;
        OrderBy: Prisma.GeographyOrderByWithRelationInput;
        WhereUnique: Prisma.GeographyWhereUniqueInput;
        Where: Prisma.GeographyWhereInput;
        Create: Prisma.GeographyCreateInput;
        Update: Prisma.GeographyUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    Log: {
        Name: "Log";
        Shape: Log;
        Include: never;
        Select: Prisma.LogSelect;
        OrderBy: Prisma.LogOrderByWithRelationInput;
        WhereUnique: Prisma.LogWhereUniqueInput;
        Where: Prisma.LogWhereInput;
        Create: Prisma.LogCreateInput;
        Update: Prisma.LogUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    Seed: {
        Name: "Seed";
        Shape: Seed;
        Include: never;
        Select: Prisma.SeedSelect;
        OrderBy: Prisma.SeedOrderByWithRelationInput;
        WhereUnique: Prisma.SeedWhereUniqueInput;
        Where: Prisma.SeedWhereInput;
        Create: Prisma.SeedCreateInput;
        Update: Prisma.SeedUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
    Session: {
        Name: "Session";
        Shape: Session;
        Include: Prisma.SessionInclude;
        Select: Prisma.SessionSelect;
        OrderBy: Prisma.SessionOrderByWithRelationInput;
        WhereUnique: Prisma.SessionWhereUniqueInput;
        Where: Prisma.SessionWhereInput;
        Create: Prisma.SessionCreateInput;
        Update: Prisma.SessionUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
    User: {
        Name: "User";
        Shape: User;
        Include: Prisma.UserInclude;
        Select: Prisma.UserSelect;
        OrderBy: Prisma.UserOrderByWithRelationInput;
        WhereUnique: Prisma.UserWhereUniqueInput;
        Where: Prisma.UserWhereInput;
        Create: Prisma.UserCreateInput;
        Update: Prisma.UserUpdateInput;
        RelationName: "accounts" | "verificationTokens" | "sessions" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "requestedBackupRuns" | "acknowledgedBackupKeys";
        ListRelations: "accounts" | "verificationTokens" | "sessions" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "requestedBackupRuns" | "acknowledgedBackupKeys";
        Relations: {
            accounts: {
                Shape: Account[];
                Name: "Account";
                Nullable: false;
            };
            verificationTokens: {
                Shape: VerificationToken[];
                Name: "VerificationToken";
                Nullable: false;
            };
            sessions: {
                Shape: Session[];
                Name: "Session";
                Nullable: false;
            };
            comments: {
                Shape: Comment[];
                Name: "Comment";
                Nullable: false;
            };
            banners: {
                Shape: Banner[];
                Name: "Banner";
                Nullable: false;
            };
            feedbacks: {
                Shape: Feedback[];
                Name: "Feedback";
                Nullable: false;
            };
            assignedFeedbacks: {
                Shape: Feedback[];
                Name: "Feedback";
                Nullable: false;
            };
            files: {
                Shape: File[];
                Name: "File";
                Nullable: false;
            };
            requestedBackupRuns: {
                Shape: BackupRun[];
                Name: "BackupRun";
                Nullable: false;
            };
            acknowledgedBackupKeys: {
                Shape: BackupKey[];
                Name: "BackupKey";
                Nullable: false;
            };
        };
    };
    VerificationToken: {
        Name: "VerificationToken";
        Shape: VerificationToken;
        Include: Prisma.VerificationTokenInclude;
        Select: Prisma.VerificationTokenSelect;
        OrderBy: Prisma.VerificationTokenOrderByWithRelationInput;
        WhereUnique: Prisma.VerificationTokenWhereUniqueInput;
        Where: Prisma.VerificationTokenWhereInput;
        Create: Prisma.VerificationTokenCreateInput;
        Update: Prisma.VerificationTokenUpdateInput;
        RelationName: "user";
        ListRelations: never;
        Relations: {
            user: {
                Shape: User;
                Name: "User";
                Nullable: false;
            };
        };
    };
}