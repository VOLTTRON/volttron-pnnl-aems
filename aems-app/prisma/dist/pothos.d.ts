import type { Prisma, Unit, Configuration, Occupancy, Schedule, Setpoint, Holiday, Control, Location, Change, Feedback, File, Comment, User, Account, Session, VerificationToken, Seed, Event, Log, Banner, Geography } from "@prisma/client";
export default interface PrismaTypes {
    Unit: {
        Name: "Unit";
        Shape: Unit;
        Include: Prisma.UnitInclude;
        Select: Prisma.UnitSelect;
        OrderBy: Prisma.UnitOrderByWithRelationInput;
        WhereUnique: Prisma.UnitWhereUniqueInput;
        Where: Prisma.UnitWhereInput;
        Create: Prisma.UnitCreateInput;
        Update: Prisma.UnitUpdateInput;
        RelationName: "configuration" | "control" | "location" | "users";
        ListRelations: "users";
        Relations: {
            configuration: {
                Shape: Configuration | null;
                Name: "Configuration";
                Nullable: true;
            };
            control: {
                Shape: Control | null;
                Name: "Control";
                Nullable: true;
            };
            location: {
                Shape: Location | null;
                Name: "Location";
                Nullable: true;
            };
            users: {
                Shape: User[];
                Name: "User";
                Nullable: false;
            };
        };
    };
    Configuration: {
        Name: "Configuration";
        Shape: Configuration;
        Include: Prisma.ConfigurationInclude;
        Select: Prisma.ConfigurationSelect;
        OrderBy: Prisma.ConfigurationOrderByWithRelationInput;
        WhereUnique: Prisma.ConfigurationWhereUniqueInput;
        Where: Prisma.ConfigurationWhereInput;
        Create: Prisma.ConfigurationCreateInput;
        Update: Prisma.ConfigurationUpdateInput;
        RelationName: "setpoint" | "mondaySchedule" | "tuesdaySchedule" | "wednesdaySchedule" | "thursdaySchedule" | "fridaySchedule" | "saturdaySchedule" | "sundaySchedule" | "holidaySchedule" | "units" | "occupancies" | "holidays";
        ListRelations: "units" | "occupancies" | "holidays";
        Relations: {
            setpoint: {
                Shape: Setpoint | null;
                Name: "Setpoint";
                Nullable: true;
            };
            mondaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            tuesdaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            wednesdaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            thursdaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            fridaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            saturdaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            sundaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            holidaySchedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            units: {
                Shape: Unit[];
                Name: "Unit";
                Nullable: false;
            };
            occupancies: {
                Shape: Occupancy[];
                Name: "Occupancy";
                Nullable: false;
            };
            holidays: {
                Shape: Holiday[];
                Name: "Holiday";
                Nullable: false;
            };
        };
    };
    Occupancy: {
        Name: "Occupancy";
        Shape: Occupancy;
        Include: Prisma.OccupancyInclude;
        Select: Prisma.OccupancySelect;
        OrderBy: Prisma.OccupancyOrderByWithRelationInput;
        WhereUnique: Prisma.OccupancyWhereUniqueInput;
        Where: Prisma.OccupancyWhereInput;
        Create: Prisma.OccupancyCreateInput;
        Update: Prisma.OccupancyUpdateInput;
        RelationName: "schedule" | "configuration";
        ListRelations: never;
        Relations: {
            schedule: {
                Shape: Schedule | null;
                Name: "Schedule";
                Nullable: true;
            };
            configuration: {
                Shape: Configuration | null;
                Name: "Configuration";
                Nullable: true;
            };
        };
    };
    Schedule: {
        Name: "Schedule";
        Shape: Schedule;
        Include: Prisma.ScheduleInclude;
        Select: Prisma.ScheduleSelect;
        OrderBy: Prisma.ScheduleOrderByWithRelationInput;
        WhereUnique: Prisma.ScheduleWhereUniqueInput;
        Where: Prisma.ScheduleWhereInput;
        Create: Prisma.ScheduleCreateInput;
        Update: Prisma.ScheduleUpdateInput;
        RelationName: "setpoint" | "mondayConfigurations" | "tuesdayConfigurations" | "wednesdayConfigurations" | "thursdayConfigurations" | "fridayConfigurations" | "saturdayConfigurations" | "sundayConfigurations" | "holidayConfigurations" | "occupancies";
        ListRelations: "mondayConfigurations" | "tuesdayConfigurations" | "wednesdayConfigurations" | "thursdayConfigurations" | "fridayConfigurations" | "saturdayConfigurations" | "sundayConfigurations" | "holidayConfigurations" | "occupancies";
        Relations: {
            setpoint: {
                Shape: Setpoint | null;
                Name: "Setpoint";
                Nullable: true;
            };
            mondayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            tuesdayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            wednesdayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            thursdayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            fridayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            saturdayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            sundayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            holidayConfigurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            occupancies: {
                Shape: Occupancy[];
                Name: "Occupancy";
                Nullable: false;
            };
        };
    };
    Setpoint: {
        Name: "Setpoint";
        Shape: Setpoint;
        Include: Prisma.SetpointInclude;
        Select: Prisma.SetpointSelect;
        OrderBy: Prisma.SetpointOrderByWithRelationInput;
        WhereUnique: Prisma.SetpointWhereUniqueInput;
        Where: Prisma.SetpointWhereInput;
        Create: Prisma.SetpointCreateInput;
        Update: Prisma.SetpointUpdateInput;
        RelationName: "configurations" | "schedules";
        ListRelations: "configurations" | "schedules";
        Relations: {
            configurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
            schedules: {
                Shape: Schedule[];
                Name: "Schedule";
                Nullable: false;
            };
        };
    };
    Holiday: {
        Name: "Holiday";
        Shape: Holiday;
        Include: Prisma.HolidayInclude;
        Select: Prisma.HolidaySelect;
        OrderBy: Prisma.HolidayOrderByWithRelationInput;
        WhereUnique: Prisma.HolidayWhereUniqueInput;
        Where: Prisma.HolidayWhereInput;
        Create: Prisma.HolidayCreateInput;
        Update: Prisma.HolidayUpdateInput;
        RelationName: "configurations";
        ListRelations: "configurations";
        Relations: {
            configurations: {
                Shape: Configuration[];
                Name: "Configuration";
                Nullable: false;
            };
        };
    };
    Control: {
        Name: "Control";
        Shape: Control;
        Include: Prisma.ControlInclude;
        Select: Prisma.ControlSelect;
        OrderBy: Prisma.ControlOrderByWithRelationInput;
        WhereUnique: Prisma.ControlWhereUniqueInput;
        Where: Prisma.ControlWhereInput;
        Create: Prisma.ControlCreateInput;
        Update: Prisma.ControlUpdateInput;
        RelationName: "units";
        ListRelations: "units";
        Relations: {
            units: {
                Shape: Unit[];
                Name: "Unit";
                Nullable: false;
            };
        };
    };
    Location: {
        Name: "Location";
        Shape: Location;
        Include: Prisma.LocationInclude;
        Select: Prisma.LocationSelect;
        OrderBy: Prisma.LocationOrderByWithRelationInput;
        WhereUnique: Prisma.LocationWhereUniqueInput;
        Where: Prisma.LocationWhereInput;
        Create: Prisma.LocationCreateInput;
        Update: Prisma.LocationUpdateInput;
        RelationName: "units";
        ListRelations: "units";
        Relations: {
            units: {
                Shape: Unit[];
                Name: "Unit";
                Nullable: false;
            };
        };
    };
    Change: {
        Name: "Change";
        Shape: Change;
        Include: Prisma.ChangeInclude;
        Select: Prisma.ChangeSelect;
        OrderBy: Prisma.ChangeOrderByWithRelationInput;
        WhereUnique: Prisma.ChangeWhereUniqueInput;
        Where: Prisma.ChangeWhereInput;
        Create: Prisma.ChangeCreateInput;
        Update: Prisma.ChangeUpdateInput;
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
        RelationName: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "units" | "changes";
        ListRelations: "accounts" | "comments" | "banners" | "feedbacks" | "assignedFeedbacks" | "files" | "units" | "changes";
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
            units: {
                Shape: Unit[];
                Name: "Unit";
                Nullable: false;
            };
            changes: {
                Shape: Change[];
                Name: "Change";
                Nullable: false;
            };
        };
    };
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
}
