FROM denoland/deno

WORKDIR /app

COPY config.ts adapter.ts /app/
RUN deno cache /app/adapter.ts
RUN chown deno:deno /app/config.ts

ENV KEYCLOAK_ORIGIN "https://ucs-sso-ng.mydomain.corp"
ENV KEYCLOAK_REALM "ucs"
ENV KEYCLOAK_CLIENT_ID "jitsi"
ENV JWT_ALG "HS256"
ENV JWT_HASH "SHA-256"
ENV JWT_APP_ID "myappid"
ENV JWT_APP_SECRET "myappsecret"
ENV JWT_EXP_SECOND 3600
ENV ALLOW_UNSECURE_CERT false

USER deno
EXPOSE 9000

CMD \
    TMP_CONFIG="/tmp/config.ts"; \
    cp /app/config.ts $TMP_CONFIG; \
    sed -i "/KEYCLOAK_ORIGIN/ s~=.*~= \"$KEYCLOAK_ORIGIN\"~" $TMP_CONFIG; \
    sed -i "/KEYCLOAK_REALM/ s~=.*~= \"$KEYCLOAK_REALM\"~" $TMP_CONFIG; \
    sed -i "/KEYCLOAK_CLIENT_ID/ s~=.*~= \"$KEYCLOAK_CLIENT_ID\"~" $TMP_CONFIG; \
    sed -i "/JWT_ALG/ s~=.*~= \"$JWT_ALG\"~" $TMP_CONFIG; \
    sed -i "/JWT_HASH/ s~=.*~= \"$JWT_HASH\"~" $TMP_CONFIG; \
    sed -i "/JWT_APP_ID/ s~=.*~= \"$JWT_APP_ID\"~" $TMP_CONFIG; \
    sed -i "/JWT_APP_SECRET/ s~=.*~= \"$JWT_APP_SECRET\"~" $TMP_CONFIG; \
    sed -i "/JWT_EXP_SECOND/ s~=.*~= $JWT_EXP_SECOND~" $TMP_CONFIG; \
    sed -i "/HOSTNAME/ s~=.*~= \"0.0.0.0\"~" $TMP_CONFIG; \
    cp $TMP_CONFIG /app/; \
\
    [ "$(echo $ALLOW_UNSECURE_CERT | tr '[:upper:]' '[:lower:]')" = true ] && \
        IGNORE_CERT="--unsafely-ignore-certificate-errors"; \
\
    deno run --allow-net $IGNORE_CERT /app/adapter.ts
