import { STATUS_CODE } from "jsr:@std/http@^1.0.20/status";
import { encodeBase64 } from "jsr:@std/encoding@^1.0.10/base64";
import { create, getNumericDate } from "jsr:@emrahcom/jwt@^0.4.7";
import type { Algorithm } from "jsr:@emrahcom/jwt@^0.4.7/algorithm";
import {
  DEBUG,
  HOSTNAME,
  JWT_ALG,
  JWT_APP_ID,
  JWT_APP_SECRET,
  JWT_EXP_SECOND,
  JWT_HASH,
  KEYCLOAK_CLIENT_ID,
  KEYCLOAK_CLIENT_SECRET,
  KEYCLOAK_MODE,
  KEYCLOAK_ORIGIN,
  KEYCLOAK_ORIGIN_INTERNAL,
  KEYCLOAK_REALM,
  PORT,
} from "./config.ts";
import { createContext } from "./context.ts";

// -----------------------------------------------------------------------------
// HTTP response for OK
// -----------------------------------------------------------------------------
function ok(body: string): Response {
  return new Response(body, {
    status: STATUS_CODE.OK,
  });
}

// -----------------------------------------------------------------------------
// HTTP response for NotFound
// -----------------------------------------------------------------------------
function notFound(): Response {
  return new Response(null, {
    status: STATUS_CODE.NotFound,
  });
}

// -----------------------------------------------------------------------------
// HTTP response for MethodNotAllowed
// -----------------------------------------------------------------------------
function methodNotAllowed(): Response {
  return new Response(null, {
    status: STATUS_CODE.MethodNotAllowed,
  });
}

// -----------------------------------------------------------------------------
// HTTP response for Unauthorized
// -----------------------------------------------------------------------------
function unauthorized(): Response {
  return new Response(null, {
    status: STATUS_CODE.Unauthorized,
  });
}

// -----------------------------------------------------------------------------
// Generate JWT (Jitsi token)
// -----------------------------------------------------------------------------
async function generateJWT(
  userInfo: Record<string, unknown>,
  sub: string,
  room: string,
): Promise<string | undefined> {
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

    const alg = JWT_ALG as Algorithm;
    const header = { alg: alg, typ: "JWT" };
    const payload = {
      aud: JWT_APP_ID,
      iss: JWT_APP_ID,
      sub: sub,
      room: room,
      iat: getNumericDate(0),
      nbf: getNumericDate(0),
      exp: getNumericDate(JWT_EXP_SECOND),
      context: createContext(userInfo),
    };

    return await create(header, payload, cryptoKey);
  } catch {
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Get the access token from Keycloak by using the short-term auth code
//
// redirect_uri should be the same with URI which is set while getting the
// short-term authorization code but actually there is no redirection at this
// stage. This is for security check only.
// -----------------------------------------------------------------------------
async function getToken(
  host: string,
  code: string,
  path: string,
  search: string,
  hash: string,
): Promise<string | undefined> {
  const url = `${KEYCLOAK_ORIGIN_INTERNAL}/realms/${KEYCLOAK_REALM}` +
    `/protocol/openid-connect/token`;
  const bundle = `path=${encodeURIComponent(path)}` +
    `&search=${encodeURIComponent(search)}` +
    `&hash=${encodeURIComponent(hash)}`;
  const redirectURI = `https://${host}/static/oidc-adapter.html` +
    `?${bundle}`;

  const headers = new Headers();
  headers.append("Accept", "application/json");

  const data = new URLSearchParams();
  data.append("grant_type", "authorization_code");
  data.append("redirect_uri", redirectURI);
  data.append("code", code);

  if (KEYCLOAK_CLIENT_SECRET) {
    headers.append(
      "Authorization",
      "Basic " +
        encodeBase64(`${KEYCLOAK_CLIENT_ID}:${KEYCLOAK_CLIENT_SECRET}`),
    );
  } else {
    data.append("client_id", KEYCLOAK_CLIENT_ID);
  }

  if (DEBUG) console.log(`getToken url: ${url}`);
  if (DEBUG) console.log(`getToken redirectURI: ${redirectURI}`);
  if (DEBUG) console.log(`getToken headers:`);
  if (DEBUG) console.log(headers);
  if (DEBUG) console.log(`getToken data:`);
  if (DEBUG) console.log(data);

  try {
    const res = await fetch(url, {
      headers: headers,
      method: "POST",
      body: data,
    });
    const json = await res.json();
    const token = json.access_token;

    if (DEBUG) console.log(`getToken json:`);
    if (DEBUG) console.log(json);

    if (!token) throw ("cannot get Keycloak token");

    return token;
  } catch {
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Get the user info from Keycloak by using the access token
// -----------------------------------------------------------------------------
async function getUserInfo(
  token: string,
): Promise<Record<string, unknown> | undefined> {
  try {
    const url = `${KEYCLOAK_ORIGIN_INTERNAL}/realms/${KEYCLOAK_REALM}` +
      `/protocol/openid-connect/userinfo`;
    const res = await fetch(url, {
      headers: {
        "Accept": "application/json",
        "Authorization": `Bearer ${token}`,
      },
      method: "GET",
    });
    const userInfo = await res.json();

    if (DEBUG) console.log(`getUserInfo userInfo:`);
    if (DEBUG) console.log(userInfo);

    // sub is the mandotary field for successful request
    if (!userInfo.sub) throw ("no user info");

    return await userInfo;
  } catch {
    return undefined;
  }
}

// -----------------------------------------------------------------------------
// Send the Jitsi token if auth is OK
// -----------------------------------------------------------------------------
async function tokenize(req: Request): Promise<Response> {
  const host = req.headers.get("host");
  const url = new URL(req.url);
  const qs = new URLSearchParams(url.search);
  const code = qs.get("code");
  const path = qs.get("path") || "";
  const search = qs.get("search") || "";
  const hash = qs.get("hash") || "";
  const room = path.split("/").reverse()[0];
  const tenant = path.split("/").reverse()[1]?.toLowerCase();

  if (DEBUG) console.log(`tokenize code: ${code}`);

  // host is needed for redirection. If no host, this is not a valid request.
  if (!host) return unauthorized();

  // only the currently logged in user has a short-term auth code
  if (!code) return unauthorized();

  // get the access token from Keycloak if the short-term auth code is valid
  const token = await getToken(host, code, path, search, hash);
  if (!token) {
    if (DEBUG) console.log(`Could not get Keycloak's access token`);
    return unauthorized();
  }

  // get the user info from Keycloak by using the access token
  const userInfo = await getUserInfo(token);
  if (!userInfo) return unauthorized();

  // generate JWT
  const jwt = await generateJWT(userInfo, tenant || host, room);

  if (DEBUG) console.log(`tokenize token: ${jwt}`);

  return new Response(JSON.stringify(jwt), {
    status: STATUS_CODE.OK,
  });
}

// -----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
//
// If successful, Keycloak will redirect the request to oidc-adapter.html
// (redirect_uri) with a short-term authorization code.
// -----------------------------------------------------------------------------
function oidcRedirectForCode(req: Request, prompt: string): Response {
  const host = req.headers.get("host");
  const url = new URL(req.url);
  const qs = new URLSearchParams(url.search);
  const path = qs.get("path");
  const search = qs.get("search") || "";
  const hash = qs.get("hash") || "";

  if (!host) throw ("missing host");
  if (!path) throw ("missing path");

  const sanitizedPath = path.replace(/\/+/g, "/");
  if (!sanitizedPath.match("^/")) throw ("invalid path");

  const bundle = `path=${encodeURIComponent(sanitizedPath)}` +
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
  if (DEBUG) console.log(`oidcRedirectForCode sanitized: ${sanitizedPath}`);
  if (DEBUG) console.log(`oidcRedirectForCode search: ${search}`);
  if (DEBUG) console.log(`oidcRedirectForCode hash: ${hash}`);
  if (DEBUG) console.log(`oidcRedirectForCode bundle: ${bundle}`);
  if (DEBUG) console.log(`oidcRedirectForCode target: ${target}`);

  return Response.redirect(target, STATUS_CODE.Found);
}

// -----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
// Don't ask for a credential if auth fails
// -----------------------------------------------------------------------------
function redirect(req: Request): Response {
  try {
    return oidcRedirectForCode(req, "none");
  } catch {
    return unauthorized();
  }
}

// -----------------------------------------------------------------------------
// Redirect to Keycloak auth service to get a short-term authorization code.
// Ask for a credential if auth fails
// -----------------------------------------------------------------------------
function auth(req: Request): Response {
  try {
    return oidcRedirectForCode(req, "login");
  } catch {
    return unauthorized();
  }
}

// -----------------------------------------------------------------------------
// handler
// -----------------------------------------------------------------------------
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  if (req.method !== "GET") return methodNotAllowed();

  if (path === "/health") {
    return ok("healthy");
  } else if (path === "/oidc/health") {
    return ok("healthy");
  } else if (path === "/oidc/redirect") {
    return redirect(req);
  } else if (path === "/oidc/tokenize") {
    return await tokenize(req);
  } else if (path === "/oidc/auth") {
    return await auth(req);
  } else {
    return notFound();
  }
}

// -----------------------------------------------------------------------------
// main
// -----------------------------------------------------------------------------
function main() {
  console.log(`KEYCLOAK_ORIGIN: ${KEYCLOAK_ORIGIN}`);
  console.log(`KEYCLOAK_ORIGIN_INTERNAL: ${KEYCLOAK_ORIGIN_INTERNAL}`);
  console.log(`KEYCLOAK_REALM: ${KEYCLOAK_REALM}`);
  console.log(`KEYCLOAK_CLIENT_ID: ${KEYCLOAK_CLIENT_ID}`);
  console.log(
    `KEYCLOAK_CLIENT_SECRET: ${
      KEYCLOAK_CLIENT_SECRET ? "*** masked ***" : "not used"
    }`,
  );
  console.log(`KEYCLOAK_MODE: ${KEYCLOAK_MODE}`);
  console.log(`JWT_ALG: ${JWT_ALG}`);
  console.log(`JWT_HASH: ${JWT_HASH}`);
  console.log(`JWT_APP_ID: ${JWT_APP_ID}`);
  console.log(`JWT_APP_SECRET: *** masked ***`);
  console.log(`JWT_EXP_SECOND: ${JWT_EXP_SECOND}`);
  console.log(`HOSTNAME: ${HOSTNAME}`);
  console.log(`PORT: ${PORT}`);
  console.log(`DEBUG: ${DEBUG}`);

  Deno.serve({
    hostname: HOSTNAME,
    port: PORT,
  }, handler);
}

// -----------------------------------------------------------------------------
main();
