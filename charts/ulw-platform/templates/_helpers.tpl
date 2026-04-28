{{/*
Expand the name of the chart.
*/}}
{{- define "ulw-platform.name" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Create a default fully qualified app name.
*/}}
{{- define "ulw-platform.fullname" -}}
{{- if .Values.fullnameOverride }}
{{- .Values.fullnameOverride | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- $name := default .Chart.Name .Values.nameOverride }}
{{- if contains $name .Release.Name }}
{{- .Release.Name | trunc 63 | trimSuffix "-" }}
{{- else }}
{{- printf "%s-%s" .Release.Name $name | trunc 63 | trimSuffix "-" }}
{{- end }}
{{- end }}
{{- end }}

{{/*
Create chart name and version as used by the chart label.
*/}}
{{- define "ulw-platform.chart" -}}
{{- printf "%s-%s" .Chart.Name .Chart.Version | replace "+" "_" | trunc 63 | trimSuffix "-" }}
{{- end }}

{{/*
Common labels
*/}}
{{- define "ulw-platform.labels" -}}
helm.sh/chart: {{ include "ulw-platform.chart" . }}
{{ include "ulw-platform.selectorLabels" . }}
{{- if .Chart.AppVersion }}
app.kubernetes.io/version: {{ .Chart.AppVersion | quote }}
{{- end }}
app.kubernetes.io/managed-by: {{ .Release.Service }}
{{- end }}

{{/*
Selector labels
*/}}
{{- define "ulw-platform.selectorLabels" -}}
app.kubernetes.io/name: {{ include "ulw-platform.name" . }}
app.kubernetes.io/instance: {{ .Release.Name }}
{{- end }}

{{/*
Environment variable helper from config
*/}}
{{- define "ulw-platform.env" -}}
- name: NODE_ENV
  value: {{ .Values.global.environment | quote }}
- name: NATS_URL
  value: "nats://nats:4222"
- name: REDIS_URL
  value: "redis://redis:6379"
- name: MINIO_ENDPOINT
  value: "http://minio:9000"
- name: POSTGRES_HOST
  value: "postgresql"
- name: POSTGRES_PORT
  value: "5432"
- name: POSTGRES_DATABASE
  value: {{ .Values.postgresql.auth.database | quote }}
- name: POSTGRES_USERNAME
  value: {{ .Values.postgresql.auth.username | quote }}
- name: POSTGRES_PASSWORD
  valueFrom:
    secretKeyRef:
      name: ulw-secrets
      key: postgres-password
{{- end }}

{{/*
Full image reference
*/}}
{{- define "ulw-platform.image" -}}
{{- $tag := .tag | default "latest" }}
{{- printf "%s:%s" .repository $tag }}
{{- end }}
