#!/bin/bash
set -e

BASEDIR=$(dirname $0)

# testing: allow self-signed certificate
#deno run --allow-net --unsafely-ignore-certificate-errors $BASEDIR/adapter.ts

# prod
deno run --allow-net $BASEDIR/adapter.ts
