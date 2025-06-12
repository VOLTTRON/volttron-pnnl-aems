export declare const Provider = "keycloak";
export interface KeycloakUser {
    id: string;
    sub: string;
    email: string;
    email_verified: boolean;
    username: string;
    name?: string;
    preferred_username?: string;
    given_name?: string;
    family_name?: string;
    full_name?: string;
}
