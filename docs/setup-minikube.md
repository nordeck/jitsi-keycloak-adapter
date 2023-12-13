# Setup on Minikube

This is for the local testing on `Minikube`.

```bash
minikube start
cd charts/jitsi-keycloak-adapter

helm dependency build .
helm upgrade --install --values ../../docs/values-minikube.yaml --wait --debug \
  jka .

kubectl get pods
helm uninstall jka
```
