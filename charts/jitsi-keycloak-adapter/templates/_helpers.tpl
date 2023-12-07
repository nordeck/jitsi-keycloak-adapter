{{/* vim: set filetype=mustache: */}}
{{- define "jitsi.keycloakAdapter.fullname" -}}
{{ include "jitsi-meet.fullname" . }}-keycloak-adapter
{{- end -}}
