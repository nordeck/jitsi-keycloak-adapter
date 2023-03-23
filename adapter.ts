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
function methodNotAllowed(): Response {
  return new Response("Method Not Allowed", {
    status: Status.MethodNotAllowed,
  });
}

// ----------------------------------------------------------------------------
function notFound(): Response {
  return new Response("Not Found", {
    status: Status.NotFound,
  });
}

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
async function generateToken(
  keycloakUserInfo: Record<string, unknown>,
): Promise<string> {
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
        id: keycloakUserInfo.sub,
        name: keycloakUserInfo.preferred_username || "",
        email: keycloakUserInfo.email || "",
      },
    },
  };

  return await create(header, payload, cryptoKey);
}

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
  const jitsiToken = await generateToken(keycloakUserInfo);

  if (DEBUG) console.log(`tokenize token: ${jitsiToken}`);

  return new Response(JSON.stringify(jitsiToken), {
    status: Status.OK,
  });
}

// ----------------------------------------------------------------------------
function keycloakAuth(req: Request, prompt: string): Response {
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

  if (DEBUG) console.log(`keycloakAuth prompt: ${prompt}`);
  if (DEBUG) console.log(`keycloakAuth host: ${host}`);
  if (DEBUG) console.log(`keycloakAuth path: ${path}`);
  if (DEBUG) console.log(`keycloakAuth search: ${search}`);
  if (DEBUG) console.log(`keycloakAuth hash: ${hash}`);
  if (DEBUG) console.log(`keycloakAuth bundle: ${bundle}`);
  if (DEBUG) console.log(`keycloakAuth target: ${target}`);

  return Response.redirect(target, 302);
}

// ----------------------------------------------------------------------------
function redirect(req: Request): Response {
  return keycloakAuth(req, "none");
}

// ----------------------------------------------------------------------------
function auth(req: Request): Response {
  return keycloakAuth(req, "login");
}

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
function main() {
  serve(handler, {
    hostname: HOSTNAME,
    port: PORT,
  });
}

// ----------------------------------------------------------------------------
main();
