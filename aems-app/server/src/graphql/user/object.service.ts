import { Prisma, User } from "@prisma/client";
import { Injectable } from "@nestjs/common";
import { SchemaBuilderService } from "../builder.service";
import { PothosObject } from "../pothos.decorator";
import { GraphQLScalarType } from "graphql";
import { Scalars, Context } from "..";

// Non-admin sees others as id + name only; self is read in full. Admin reaches
// every field. Returned as a ScopeMap: pass admin for admin callers, pass user
// for self (every signed-in user has the user scope), otherwise require admin
// so a non-matching caller fails.
export function selfOrAdmin(parent: Pick<User, "id">, ctx: Context): { admin: true } | { user: true } {
  if (ctx.user?.id === parent.id) return { user: true };
  return { admin: true };
}

@Injectable()
@PothosObject()
export class UserObject {
  readonly UserPreferences;
  readonly UserObject;
  readonly UserFields;

  constructor(builder: SchemaBuilderService) {
    this.UserPreferences = builder.addScalarType(
      "UserPreferences",
      new GraphQLScalarType<Scalars["UserPreferences"]["Input"], Scalars["UserPreferences"]["Output"]>({
        name: "UserPreferences",
      }),
    );

    this.UserObject = builder.prismaObject("User", {
      subscribe(subscriptions, parent, _context, _info) {
        subscriptions.register(`User/${parent.id}`);
      },
      fields: (t) => ({
        // Visible to every signed-in user
        id: t.exposeString("id"),
        name: t.exposeString("name", { nullable: true }),
        // Self or admin only
        email: t.exposeString("email", { authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        image: t.exposeString("image", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        emailVerified: t.expose("emailVerified", { type: builder.DateTime, nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        role: t.exposeString("role", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        // password field is intentionally omitted
        preferences: t.expose("preferences", { type: this.UserPreferences, nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        createdAt: t.expose("createdAt", { type: builder.DateTime, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        updatedAt: t.expose("updatedAt", { type: builder.DateTime, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        // Indirect relations: self or admin
        comments: t.relation("comments", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        accounts: t.relation("accounts", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        banners: t.relation("banners", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
        units: t.relation("units", { nullable: true, authScopes: (parent, _args, ctx) => selfOrAdmin(parent, ctx) }),
      }),
    });

    this.UserFields = builder.enumType("UserFields", {
      values: Object.values(
        Object.fromEntries(Object.entries(Prisma.UserScalarFieldEnum).filter(([k]) => k !== "password"))
      ),
    });
  }
}
