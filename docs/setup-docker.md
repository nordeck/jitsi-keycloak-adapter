# Dockerized setup

- [1. Keycloak Adapter](#1-keycloak-adapter)
- [2. Jitsi](#2-jitsi)
  - [2.1 Adapter internal URL](#21-adapter-internal-url)
  - [2.2 Token authentication](#22-token-authentication)
  - [2.3 Guest users](#23-guest-users)
  - [2.4 Static files](#24-static-files)
  - [2.5 Custom meet.conf](#25-custom-meetconf)

The setup guide to integrate `Jitsi Keycloak Adapter` with a Dockerized Jitsi
setup.

This guide assumes that you have already a working `Jitsi` on a Docker
environment. See
[Jitsi Meet Handbook](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/)
for further details.

Tested with Jitsi `stable-8719` images.

## 1. Keycloak Adapter

```bash
docker run -d \
  -p "9000:9000/TCP" \
  -e KEYCLOAK_ORIGIN=https://ucs-sso-ng.mykeycloak.tld \
  -e KEYCLOAK_REALM=myrealm \
  -e KEYCLOAK_CLIENT_ID=myclientid \
  -e JWT_APP_ID=myappid \
  -e JWT_APP_SECRET=myappsecret \
  -e ALLOW_UNSECURE_CERT=true \
  ghcr.io/nordeck/jitsi-keycloak-adapter
```

`KEYCLOAK_ORIGIN` must be resolvable and accessible for the container.

`JWT_APP_ID` and `JWT_APP_SECRET` must be the same for both `keycloak-adapter`
and `jitsi`.

Set `ALLOW_UNSECURE_CERT` as `true` if `Keycloak` has not a trusted certificate.
For the production environment, `Keycloak` should have a trusted certificate and
this value should be `false` (_it is `false` by default_).

## 2. Jitsi

### 2.1 Adapter internal URL

Set `keycloak-adapter` internal URL for `jitsi-web` container by using the
environment variable `ADAPTER_INTERNAL_URL`. `jitsi-web` will use it as an
upstream in its own internal `nginx`.

_e.g._ `ADAPTER_INTERNAL_URL=http://172.18.18.1:9000`

### 2.2 Token authentication

Set the following environment variables to enable the token authentication for
`Jitsi`:

- Enable authentication

  `ENABLE_AUTH=1`

- Select the authentication type

  `AUTH_TYPE=jwt`

- Application identifier

  `JWT_APP_ID=myappid`

- Application secret known only to your token generators (_such as_
  `keycloak-adapter`)

  `JWT_APP_SECRET=myappsecret`

### 2.3 Guest users

Set the following environment variables if you want to allow guest users to join
the meeting after it's created by a moderator:

- Enable guest access

  `ENABLE_GUESTS=1`

- Disable auto login

  `ENABLE_AUTO_LOGIN=0`

- Allow anonymous users with no JWT

  `JWT_ALLOW_EMPTY=1`

- Select the authentication type for `jicofo`

  `AUTH_TYPE=internal`

- Select the authentication type for `prosody`

  `AUTH_TYPE=jwt`

### 2.4 Static files

Copy or mount the following files to `jitsi-web` container:

- [/usr/share/jitsi-meet/body.html](../templates/usr/share/jitsi-meet/body.html)
- [/usr/share/jitsi-meet/static/oidc-adapter.html](../templates/usr/share/jitsi-meet/static/oidc-adapter.html)
- [/usr/share/jitsi-meet/static/oidc-redirect.html](../templates/usr/share/jitsi-meet/static/oidc-redirect.html)

### 2.5 Custom meet.conf

Some customizations are needed for the internal `Nginx` of `jitsi-web`
container. Therefore mount the following custom `meet.conf` file to `jitsi-web`
container to overwrite the default one:

- [/defaults/meet.conf](../templates/jitsi-web-container/defaults/meet.conf)
