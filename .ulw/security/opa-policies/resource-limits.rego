package ulw.agent.resources

violation[name] {
  input.review.object.kind == "Job"
  container := input.review.object.spec.template.spec.containers[_]
  not container.resources.limits.cpu
  not container.resources.limits.memory
  name := sprintf("Agent pod %v missing CPU/memory limits", [container.name])
}

violation[name] {
  input.review.object.kind == "Job"
  container := input.review.object.spec.template.spec.containers[_]
  cpu_limit := parse_quantity(container.resources.limits.cpu)
  cpu_limit > to_number("4")
  name := sprintf("Agent pod %v CPU limit %v exceeds 4 cores", [container.name, container.resources.limits.cpu])
}

violation[name] {
  input.review.object.kind == "Job"
  container := input.review.object.spec.template.spec.containers[_]
  mem_limit := parse_quantity(container.resources.limits.memory)
  mem_limit > to_number("8Gi")
  name := sprintf("Agent pod %v memory limit %v exceeds 8Gi", [container.name, container.resources.limits.memory])
}

parse_quantity(q) = num {
  not contains(any({q}), "Gi")
  num := to_number(q)
}

parse_quantity(q) = num {
  gi_val := trim_suffix(q, "Gi")
  num := to_number(gi_val) * 1073741824
}

parse_quantity(q) = num {
  mi_val := trim_suffix(q, "Mi")
  num := to_number(mi_val) * 1048576
}

# Require security context
violation[name] {
  not input.review.object.spec.template.spec.securityContext.runAsNonRoot
  name := "Agent pod must run as non-root"
}

violation[name] {
  sc := input.review.object.spec.template.spec.containers[_].securityContext
  not sc.readOnlyRootFilesystem
  name := "Agent container must use readOnlyRootFilesystem"
}

violation[name] {
  sc := input.review.object.spec.template.spec.containers[_].securityContext
  sc.allowPrivilegeEscalation == true
  name := "Agent container must not allow privilege escalation"
}
