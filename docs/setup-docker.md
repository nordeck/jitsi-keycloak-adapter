# Dockerized setup

The setup guide to integrate `Jitsi Keycloak Adapter` with a Dockerized Jitsi
setup.

This guide assumes that you have already a working `Jitsi` on a Docker
environment. See
[Jitsi-Meet Handbook](https://jitsi.github.io/handbook/docs/devops-guide/devops-guide-docker/)
for further details.

Tested with `stable-8719` images.

## 1. Token authentication

Enable the token authentication. Set the following environment variables:

- Enable authentication

  `ENABLE_AUTH=1`

- Select the authentication type

  `AUTH_TYPE=jwt`

- Application identifier

  `JWT_APP_ID=myappid`

- Application secret known only to your token generator and `keycloak-adapter`

  `JWT_APP_SECRET=myappsecret`
