/* eslint-disable */
import type { Prisma, Account, Banner, Comment, Event, Feedback, File, Geography, Log, Seed, Session, User, VerificationToken } from "@prisma/client";
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
        Include: never;
        Select: Prisma.SessionSelect;
        OrderBy: Prisma.SessionOrderByWithRelationInput;
        WhereUnique: Prisma.SessionWhereUniqueInput;
        Where: Prisma.SessionWhereInput;
        Create: Prisma.SessionCreateInput;
        Update: Prisma.SessionUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
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
        RelationName: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files";
        ListRelations: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files";
        Relations: {
            accounts: {
                Shape: Account[];
                Name: "Account";
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
        };
    };
    VerificationToken: {
        Name: "VerificationToken";
        Shape: VerificationToken;
        Include: never;
        Select: Prisma.VerificationTokenSelect;
        OrderBy: Prisma.VerificationTokenOrderByWithRelationInput;
        WhereUnique: Prisma.VerificationTokenWhereUniqueInput;
        Where: Prisma.VerificationTokenWhereInput;
        Create: Prisma.VerificationTokenCreateInput;
        Update: Prisma.VerificationTokenUpdateInput;
        RelationName: never;
        ListRelations: never;
        Relations: {};
    };
}