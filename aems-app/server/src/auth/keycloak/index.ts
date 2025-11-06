export const Provider = "keycloak";

export interface KeycloakUser {
  // keys
  id: string;
  sub: string;
  // email
  email: string;
  email_verified: boolean;
  // name
  username: string;
  name?: string;
  preferred_username?: string;
  given_name?: string;
  family_name?: string;
  full_name?: string;
}
