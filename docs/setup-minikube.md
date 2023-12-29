# Setup on Minikube

This is for the local testing on `Minikube`.

```bash
minikube start
cd charts/jitsi-keycloak-adapter

helm dependency build .
helm upgrade --install \
  --set image.tag="latest" \
  --set patchJVB.enabled=false \
  --set jitsi.publicURL="https://jitsi.ucs.nordeck.io" \
  --set jitsi.web.image.tag="stable-9111" \
  --set jitsi.prosody.image.tag="stable-9111" \
  --set jitsi.jicofo.image.tag="stable-9111" \
  --set jitsi.jvb.image.tag="stable-9111" \
  --set jitsi.jibri.image.tag="stable-9111" \
  --set jitsi.web.ingress.enabled=true \
  --set jitsi.web.ingress.hosts[0].host="jitsi.ucs.nordeck.io" \
  --set jitsi.web.ingress.hosts[0].paths[0]="/" \
  --set jitsi.prosody.extraEnvs[0].name="AUTH_TYPE" \
  --set jitsi.prosody.extraEnvs[0].value="jwt" \
  --set jitsi.prosody.extraEnvs[1].name="JWT_APP_ID" \
  --set jitsi.prosody.extraEnvs[1].value="myappid" \
  --set jitsi.prosody.extraEnvs[2].name="JWT_APP_SECRET" \
  --set jitsi.prosody.extraEnvs[2].value="myappsecret" \
  --set jitsi.jvb.publicIPs[0]="192.168.49.2" \
  --set jitsi.jvb.UDPPort=30011 \
  --set jitsi.jvb.nodePort=30011 \
  --set jitsi.jvb.service.type="NodePort" \
  --set settings.keycloakOrigin="https://ucs-sso-ng.mydomain.corp" \
  --set settings.keycloakRealm="ucs" \
  --set settings.keycloakClientId="jitsi" \
  --set settings.jwtAppId="myappid" \
  --set settings.jwtAppSecret="myappsecret" \
  --set settings.allowUnsecureCert="true" \
  --wait --debug jka .

kubectl get pods
helm uninstall jka
```
