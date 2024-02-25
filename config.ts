// keycloak
export const KEYCLOAK_ORIGIN = Deno.env.get("KEYCLOAK_ORIGIN") ||
  "https://ucs-sso-ng.mydomain.corp";
export const KEYCLOAK_ORIGIN_INTERNAL =
  Deno.env.get("KEYCLOAK_ORIGIN_INTERNAL") || KEYCLOAK_ORIGIN;
export const KEYCLOAK_REALM = Deno.env.get("KEYCLOAK_REALM") || "ucs";
export const KEYCLOAK_CLIENT_ID = Deno.env.get("KEYCLOAK_CLIENT_ID") || "jitsi";
export const KEYCLOAK_MODE = Deno.env.get("KEYCLOAK_MODE") || "query";

// jwt
export const JWT_ALG = Deno.env.get("JWT_ALG") || "HS256";
export const JWT_HASH = Deno.env.get("JWT_HASH") || "SHA-256";
export const JWT_APP_ID = Deno.env.get("JWT_APP_ID") || "myappid";
export const JWT_APP_SECRET = Deno.env.get("JWT_APP_SECRET") || "myappsecret";
export const JWT_EXP_SECOND = Number(Deno.env.get("JWT_EXP_SECOND") || 3600);

// adapter
export const HOSTNAME = Deno.env.get("HOSTNAME") || "127.0.0.1";
export const PORT = Number(Deno.env.get("PORT") || 9000);
export const DEBUG = Deno.env.get("DEBUG") === "true";
