package ulw.registry.allowlist

default allow := false

allow {
  image := input.review.object.spec.template.spec.containers[_].image
  allowed_registry(image)
}

allowed_registry(image) {
  startswith(image, "ghcr.io/ulw/")
}

allowed_registry(image) {
  startswith(image, "docker.io/library/")
  safe_image(image)
}

allowed_registry(image) {
  startswith(image, "postgres:")
}

allowed_registry(image) {
  startswith(image, "redis:")
}

allowed_registry(image) {
  startswith(image, "nats:")
}

allowed_registry(image) {
  startswith(image, "minio/minio:")
}

allowed_registry(image) {
  startswith(image, "quay.io/keycloak/")
}

safe_image(image) {
  not contains(image, "latest")
  not contains(image, "nightly")
}

violation[msg] {
  not allow
  image := input.review.object.spec.template.spec.containers[_].image
  msg := sprintf("Container image %v is not from an approved registry", [image])
}
