#!/bin/bash
set -e

BASEDIR=$(dirname $0)

deno run --allow-net --unsafely-ignore-certificate-errors $BASEDIR/adapter.ts
