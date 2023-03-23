import { serve } from "https://deno.land/std/http/server.ts";
import { Status } from "https://deno.land/std/http/http_status.ts";
import { create, getNumericDate } from "https://deno.land/x/djwt/mod.ts";
import {
  DEBUG,
  HOSTNAME,
  JWT_ALG,
  JWT_APP_ID,
  JWT_APP_SECRET,
  JWT_EXP_SECOND,
  JWT_HASH,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_MODE,
  KEYCLOAK_ORIGIN,
  KEYCLOAK_REALM,
  PORT,
} from "./config.ts";

// ----------------------------------------------------------------------------
// HTTP response for NotFound
// ----------------------------------------------------------------------------
function notFound(): Response {
  return new Response(null, {
    status: Status.NotFound,
  });
}

// ----------------------------------------------------------------------------
// HTTP response for MethodNotAllowed
// ----------------------------------------------------------------------------
function methodNotAllowed(): Response {
  return new Response(null, {
    status: Status.MethodNotAllowed,
  });
}

// ----------------------------------------------------------------------------
// Generate JWT (Jitsi token)
// ----------------------------------------------------------------------------
async function generateJWT(
  userInfo: Record<string, unknown>,
): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(JWT_APP_SECRET);
    const cryptoKey = await crypto.subtle.importKey(
      "raw",
      keyData,
      {
        name: "HMAC",
        hash: JWT_HASH,
      },
      true,
      ["sign", "verify"],
    );

    const header = { alg: JWT_ALG, typ: "JWT" };
    const payload = {
      aud: JWT_APP_ID,
      iss: JWT_APP_ID,
      sub: "*",
      room: "*",
      iat: getNumericDate(0),
      nbf: getNumericDate(0),
      exp: getNumericDate(JWT_EXP_SECOND),
      context: {
        user: {
          id: userInfo.sub,
          name: userInfo.preferred_username || "",
          email: userInfo.email || "",
          lobby_bypass: true,
        },
      },
    };

    return await create(header, payload, cryptoKey);
  } catch {
    return undefined;
  }
}

// ----------------------------------------------------------------------------
// Get the Keycloak token using a shot-term access code
// ----------------------------------------------------------------------------
async function getKeycloakToken(
  host: string,
  code: string,
  path: string,
  search: string,
  hash: string,
): Promise<string> {
  const url = `${KEYCLOAK_ORIGIN}/realms/${KEYCLOAK_REALM}` +
    `/protocol/openid-connect/token`;
  const bundle = `path=${encodeURIComponent(path)}` +
    `&search=${encodeURIComponent(search)}` +
    `&hash=${encodeURIComponent(hash)}`;
  const redirectURI = `https://${host}/static/oidc-adapter.html` +
    `?${bundle}`;
  const data = new URLSearchParams();
  data.append("client_id", KEYCLOAK_CLIENT_ID);
  data.append("grant_type", "authorization_code");
  data.append("redirect_uri", redirectURI);
  data.append("code", code);

  if (DEBUG) console.log(`getKeycloakToken data:`);
  if (DEBUG) console.log(data);

  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
    },
    method: "POST",
    body: data,
  });
  const json = await res.json();
  const keycloakToken = json.access_token;

  if (DEBUG) console.log(`getKeycloakToken json:`);
  if (DEBUG) console.log(json);

  if (!keycloakToken) throw ("cannot get Keycloak token");

  return keycloakToken;
}

// ----------------------------------------------------------------------------
// Get the user info by using Keycloak token
// ----------------------------------------------------------------------------
async function getKeycloakUserInfo(
  keycloakToken: string,
): Promise<Record<string, unknown>> {
  const url = `${KEYCLOAK_ORIGIN}/realms/${KEYCLOAK_REALM}` +
    `/protocol/openid-connect/userinfo`;
  const res = await fetch(url, {
    headers: {
      "Accept": "application/json",
      "Authorization": `Bearer ${keycloakToken}`,
    },
    method: "POST",
  });
  const keycloakUserInfo = await res.json();

  if (DEBUG) console.log(`getKeycloakUserInfo keycloakUserInfo:`);
  if (DEBUG) console.log(keycloakUserInfo);

  if (!keycloakUserInfo.sub) throw ("cannot get user info");

  return await keycloakUserInfo;
}

// ----------------------------------------------------------------------------
// Send the Jitsi token if auth is OK
// ----------------------------------------------------------------------------
async function tokenize(req: Request): Promise<Response> {
  const host = req.headers.get("host");
  const url = new URL(req.url);
  const qs = new URLSearchParams(url.search);
  const code = qs.get("code");
  const path = qs.get("path");
  const search = qs.get("search");
  const hash = qs.get("hash");

  if (DEBUG) console.log(`tokenize code: ${code}`);
  if (!code) throw ("no authorization code");

  const keycloakToken = await getKeycloakToken(host, code, path, search, hash);
  const keycloakUserInfo = await getKeycloakUserInfo(keycloakToken);
  const jitsiToken = await generateJWT(keycloakUserInfo);

  if (DEBUG) console.log(`tokenize token: ${jitsiToken}`);

  return new Response(JSON.stringify(jitsiToken), {
    status: Status.OK,
  });
}

// ----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
//
// If successful, Keycloak will redirect the request to oidc-adapter.html
// (redirect_uri) with a short-term authorization code.
// ----------------------------------------------------------------------------
function oidcRedirectForCode(req: Request, prompt: string): Response {
  const host = req.headers.get("host");
  const url = new URL(req.url);
  const qs = new URLSearchParams(url.search);
  const path = qs.get("path");
  const search = qs.get("search") || "";
  const hash = qs.get("hash") || "";

  if (!path) throw ("missing path");

  const bundle = `path=${encodeURIComponent(path)}` +
    `&search=${encodeURIComponent(search)}` +
    `&hash=${encodeURIComponent(hash)}`;
  const target = `${KEYCLOAK_ORIGIN}/realms/${KEYCLOAK_REALM}` +
    `/protocol/openid-connect/auth?client_id=${KEYCLOAK_CLIENT_ID}` +
    `&response_mode=${KEYCLOAK_MODE}&response_type=code&scope=openid` +
    `&prompt=${prompt}&redirect_uri=https://${host}/static/oidc-adapter.html` +
    `?${encodeURIComponent(bundle)}`;

  if (DEBUG) console.log(`oidcRedirectForCode prompt: ${prompt}`);
  if (DEBUG) console.log(`oidcRedirectForCode host: ${host}`);
  if (DEBUG) console.log(`oidcRedirectForCode path: ${path}`);
  if (DEBUG) console.log(`oidcRedirectForCode search: ${search}`);
  if (DEBUG) console.log(`oidcRedirectForCode hash: ${hash}`);
  if (DEBUG) console.log(`oidcRedirectForCode bundle: ${bundle}`);
  if (DEBUG) console.log(`oidcRedirectForCode target: ${target}`);

  return Response.redirect(target, Status.Found);
}

// ----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
// Don't ask for a credential if auth fails
// ----------------------------------------------------------------------------
function redirect(req: Request): Response {
  return oidcRedirectForCode(req, "none");
}

// ----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
// Ask for a credential if auth fails
// ----------------------------------------------------------------------------
function auth(req: Request): Response {
  return oidcRedirectForCode(req, "login");
}

// ----------------------------------------------------------------------------
// handler
// ----------------------------------------------------------------------------
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method !== "GET") return methodNotAllowed();

  if (path === "/oidc/redirect") {
    return redirect(req);
  } else if (path === "/oidc/tokenize") {
    return await tokenize(req);
  } else if (path === "/oidc/auth") {
    return await auth(req);
  } else {
    return notFound();
  }
}

// ----------------------------------------------------------------------------
// main
// ----------------------------------------------------------------------------
function main() {
  serve(handler, {
    hostname: HOSTNAME,
    port: PORT,
  });
}

// ----------------------------------------------------------------------------
main();
