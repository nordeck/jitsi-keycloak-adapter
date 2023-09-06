#!/bin/bash
set -e

BASEDIR=$(dirname $0)

# testing
# allow self-signed certificate if Keycloak has not a trusted certificate
deno run --allow-net --allow-env --unsafely-ignore-certificate-errors $BASEDIR/adapter.ts

# production
# deno run --allow-net --allow-env $BASEDIR/adapter.ts
