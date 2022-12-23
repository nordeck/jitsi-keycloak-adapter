# Jitsi-Keycloak Adapter

Allow `Jitsi` to use `Keycloak` as an identity and `OIDC` provider.

## Features

- SSO support for `Jitsi`
- Allows `guest` user if needed
- Not based on `the external JWT` which will be deprecated in the near future.
- Not based on `tokenAuthUrl`

## Setup

### Token authentication

Enable the token authentication for `prosody`

```bash
apt-get install jitsi-meet-tokens
```

## Similar projects

- [jitsi-keycloak](https://github.com/D3473R/jitsi-keycloak)
- [Jitsi-SAML2JWT](https://github.com/Renater/Jitsi-SAML2JWT)
