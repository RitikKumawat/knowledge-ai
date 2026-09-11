# Part 1 — Create the Kind cluster

## 1. Create `kind-config.yaml`

Use:

```
kind: Cluster
apiVersion: kind.x-k8s.io/v1alpha4

nodes:
  - role: control-plane
    image: kindest/node:v1.31.2
    extraPortMappings:
      - containerPort: 30778
        hostPort: 30778
        protocol: TCP

  - role: worker
    image: kindest/node:v1.31.2

  - role: worker
    image: kindest/node:v1.31.2

  - role: worker
    image: kindest/node:v1.31.2

    extraPortMappings:
      - containerPort: 80
        hostPort: 80
        protocol: TCP

      - containerPort: 443
        hostPort: 443
        protocol: TCP
```

Then:

```
kind create cluster --name kind-cluster --config kind-config.yaml
```

Verify:

```
kubectl get nodes
```

Expected:

```
kind-cluster-control-plane
kind-cluster-worker
kind-cluster-worker2
kind-cluster-worker3
```

---

# Part 2 — Install MetalLB

This is required because Envoy creates a:

```
type: LoadBalancer
```

Service.

Without MetalLB:

```
EXTERNAL-IP: <pending>
```

With MetalLB:

```
EXTERNAL-IP: 172.18.0.200
```

## 2.1 Install MetalLB

Use the current MetalLB installation appropriate for your cluster.

Then verify:

```
kubectl get pods -n metallb-system
```

You want the controller and speakers running.

---

# Part 3 — Find the Kind Docker network

Run:

```
docker network inspect kind \
  --format '{{range .Containers}}{{.Name}} {{.IPv4Address}}{{"\n"}}{{end}}'
```

You previously got:

```
kind-cluster-control-plane 172.18.0.2/16
kind-cluster-worker         172.18.0.3/16
kind-cluster-worker2        172.18.0.4/16
kind-cluster-worker3        172.18.0.5/16
```

This tells you the Docker network range.

For your setup, we used:

```
172.18.0.0/16
```

and reserved:

```
172.18.0.200
```

for MetalLB.

---

# Part 4 — Configure MetalLB

Create:

```
apiVersion: metallb.io/v1beta1
kind: IPAddressPool
metadata:
  name: kind-pool
  namespace: metallb-system
spec:
  addresses:
    - 172.18.0.200-172.18.0.250

---
apiVersion: metallb.io/v1beta1
kind: L2Advertisement
metadata:
  name: kind-advertisement
  namespace: metallb-system
spec:
  ipAddressPools:
    - kind-pool
```

Apply:

```
kubectl apply -f metallb-config.yaml
```

Check:

```
kubectl get ipaddresspool -n metallb-system
kubectl get l2advertisement -n metallb-system
```

### Why?

This tells MetalLB:

> You may assign LoadBalancer IPs from this range.

So later:

```
Envoy LoadBalancer Service
          │
          ▼
       MetalLB
          │
          ▼
   172.18.0.200
```

---

# Part 5 — Install Envoy Gateway

We used:

```
helm install eg \
  oci://docker.io/envoyproxy/gateway-helm \
  --version v1.9.0 \
  -n envoy-gateway-system \
  --create-namespace
```

Envoy Gateway's official quickstart uses the Helm chart and recommends a LoadBalancer implementation such as MetalLB where necessary.

Verify:

```
kubectl get pods -n envoy-gateway-system
```

You should have:

```
envoy-gateway-xxxxx   1/1 Running
```

---

# Part 6 — Create the GatewayClass

Create:

```
apiVersion: gateway.networking.k8s.io/v1
kind: GatewayClass

metadata:
  name: eg

spec:
  controllerName: gateway.envoyproxy.io/gatewayclass-controller
```

Apply:

```
kubectl apply -f gatewayclass.yaml
```

Check:

```
kubectl get gatewayclass
```

Expected:

```
NAME   CONTROLLER
eg     gateway.envoyproxy.io/gatewayclass-controller
```

and:

```
ACCEPTED: True
```

### Why?

GatewayClass tells Kubernetes:

> Envoy Gateway is responsible for managing this Gateway.

---

# Part 7 — Prepare your Helm chart

Your chart should contain:

```
knowledge-ai-frontend/
├── Chart.yaml
├── values.yaml
└── templates/
    ├── canary-service.yaml
    ├── stable-service.yaml
    ├── gateway.yaml
    ├── httproute.yaml
    └── rollout.yaml
```

---

# Part 8 — Configure your Services correctly

This was an important issue we discovered.

Your stable/canary Services should **NOT have a selector in the Helm template**.

### `stable-service.yaml`

```
apiVersion: v1
kind: Service

metadata:
  name: {{ .Values.strategy.canary.stableService | default (printf "%s-stable" (include "knowledge-ai-frontend.fullname" .)) }}

  labels:
    {{- include "knowledge-ai-frontend.labels" . | nindent 4 }}

spec:
  type: {{ .Values.service.type }}

  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
```

### `canary-service.yaml`

```
apiVersion: v1
kind: Service

metadata:
  name: {{ .Values.strategy.canary.canaryService | default (printf "%s-canary" (include "knowledge-ai-frontend.fullname" .)) }}

  labels:
    {{- include "knowledge-ai-frontend.labels" . | nindent 4 }}

spec:
  type: {{ .Values.service.type }}

  ports:
    - port: {{ .Values.service.port }}
      targetPort: {{ .Values.service.targetPort }}
      protocol: TCP
      name: http
```

### Why no selector?

Because Argo Rollouts manages:

```
rollouts-pod-template-hash: <hash>
```

on these Services.

If Helm also manages `.spec.selector`, you get:

```
conflict with "rollouts-controller"
```

which is exactly the error we encountered.

---

# Part 9 — Use ClusterIP for application Services

In `values.yaml`:

```
service:
  type: ClusterIP
  port: 3000
  targetPort: 3000
```

### Why?

You don't need:

```
NodePort
```

for your application Services.

Your external path is:

```
MetalLB
   ↓
Envoy LoadBalancer
   ↓
HTTPRoute
   ↓
ClusterIP Service
   ↓
Next.js Pods
```

So:

```
nextjs-stable  → ClusterIP
nextjs-canary  → ClusterIP
```

is cleaner.

---

# Part 10 — Gateway Helm template

Your `gateway.yaml` is good:

```
{{- if .Values.gateway.enabled -}}

apiVersion: gateway.networking.k8s.io/v1

kind: Gateway

metadata:
  name: {{ .Values.gateway.name | default (include "knowledge-ai-frontend.fullname" .) }}

  labels:
    {{- include "knowledge-ai-frontend.labels" . | nindent 4 }}

spec:
  gatewayClassName: {{ .Values.gateway.gatewayClassName }}

  listeners:
    {{- toYaml .Values.gateway.listeners | nindent 4 }}

{{- end }}
```

Values:

```
gateway:
  enabled: true
  name: nextjs-gateway
  gatewayClassName: eg

  listeners:
    - name: http
      protocol: HTTP
      port: 80
```

### Why?

This creates:

```
GatewayClass: eg
       │
       ▼
nextjs-gateway
       │
       ▼
HTTP :80
```

---

# Part 11 — HTTPRoute

Your template:

```
{{- if .Values.httpRoute.enabled -}}

apiVersion: gateway.networking.k8s.io/v1

kind: HTTPRoute

metadata:
  name: {{ .Values.httpRoute.name | default (include "knowledge-ai-frontend.fullname" .) }}

  labels:
    {{- include "knowledge-ai-frontend.labels" . | nindent 4 }}

spec:

  {{- with .Values.httpRoute.parentRefs }}
  parentRefs:
    {{- toYaml . | nindent 4 }}
  {{- end }}

  {{- with .Values.httpRoute.rules }}
  rules:
    {{- toYaml . | nindent 4 }}
  {{- end }}

{{- end }}
```

Values:

```
httpRoute:
  enabled: true
  name: nextjs

  parentRefs:
    - name: nextjs-gateway

  rules:
    - backendRefs:
        - name: nextjs-stable
          port: 3000
          weight: 100

        - name: nextjs-canary
          port: 3000
          weight: 0
```

Initially:

```
stable = 100
canary = 0
```

Argo will later modify these weights.

---

# Part 12 — Install Argo Rollouts

You installed yours using the standard manifest.

That's perfectly valid.

Official installation supports:

```
kubectl create namespace argo-rollouts

kubectl apply -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml
```

The standard installation creates the `argo-rollouts` namespace and controller.

Verify:

```
kubectl get pods -n argo-rollouts
```

---

# Part 13 — Install the kubectl Argo plugin

You used:

```
kubectl argo rollouts version
```

Verify:

```
kubectl argo rollouts version
```

---

# Part 14 — Install the Gateway API traffic plugin

This is the part that makes the whole thing work.

The Gateway API plugin is:

```
argoproj-labs/rollouts-plugin-trafficrouter-gatewayapi
```

The current release line includes `v0.16.0`.

Create:

```
apiVersion: v1
kind: ConfigMap

metadata:
  name: argo-rollouts-config
  namespace: argo-rollouts

data:
  trafficRouterPlugins: |-
    - name: "argoproj-labs/gatewayAPI"
      location: "https://github.com/argoproj-labs/rollouts-plugin-trafficrouter-gatewayapi/releases/download/v0.16.0/gatewayapi-plugin-linux-amd64"
```

Apply:

```
kubectl apply -f gateway-plugin.yaml
```

Argo supports third-party traffic-router plugins through this configuration mechanism.

---

# Part 15 — Give Argo permission to modify HTTPRoutes

Create:

```
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole

metadata:
  name: argo-rollouts-gateway-api

rules:
  - apiGroups:
      - gateway.networking.k8s.io
    resources:
      - httproutes
    verbs:
      - get
      - patch
      - update

---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding

metadata:
  name: argo-rollouts-gateway-api

roleRef:
  apiGroup: rbac.authorization.k8s.io
  kind: ClusterRole
  name: argo-rollouts-gateway-api

subjects:
  - kind: ServiceAccount
    name: argo-rollouts
    namespace: argo-rollouts
```

Apply:

```
kubectl apply -f gateway-api-rbac.yaml
```

### Why?

Argo needs to do:

```
HTTPRoute
   │
   ├── GET
   ├── PATCH
   └── UPDATE
```

Otherwise it knows it should change the weight but Kubernetes will reject the modification.

---

# Part 16 — Restart Argo Rollouts

```
kubectl rollout restart deployment argo-rollouts \
  -n argo-rollouts
```

Then:

```
kubectl rollout status deployment argo-rollouts \
  -n argo-rollouts
```

Check plugin:

```
kubectl exec -n argo-rollouts \
  deployment/argo-rollouts -- \
  ls -lah /home/argo-rollouts/plugin-bin
```

And:

```
kubectl logs -n argo-rollouts deployment/argo-rollouts \
  | grep -Ei "plugin|gateway"
```

Argo's plugin documentation supports loading third-party plugin executables into the Rollouts controller and configuring them through `argo-rollouts-config`.

---

# Part 17 — Configure the Rollout

Your `values.yaml` should have:

```
replicaCount: 4

strategy:
  canary:
    stableService: nextjs-stable
    canaryService: nextjs-canary

    trafficRouting:
      plugins:
        argoproj-labs/gatewayAPI:
          httpRoute: nextjs
          namespace: knowledge-ai

    steps:
      - setWeight: 10
      - pause: {}

      - setWeight: 25
      - pause: {}

      - setWeight: 50
      - pause: {}

      - setWeight: 75
      - pause: {}

      - setWeight: 100
```

### What this means

```
10% → pause
       ↓
25% → pause
       ↓
50% → pause
       ↓
75% → pause
       ↓
100%
```

The `pause: {}` means:

> Stop here until I explicitly promote the rollout.

That makes this excellent for testing.

---

# Part 18 — Verify your Helm output BEFORE installing

Always do:

```
helm template knowledge-ai-frontend . \
  -n knowledge-ai
```

Check the generated Services.

You want:

```
spec:
  type: ClusterIP
```

and **no `selector:`**.

Check the Rollout.

You want:

```
trafficRouting:
  plugins:
    argoproj-labs/gatewayAPI:
      httpRoute: nextjs
      namespace: knowledge-ai
```

Check HTTPRoute:

```
backendRefs:
  - name: nextjs-stable
    port: 3000
    weight: 100

  - name: nextjs-canary
    port: 3000
    weight: 0
```

---

# Part 19 — Install your application

```
kubectl create namespace knowledge-ai
```

Then:

```
helm install knowledge-ai-frontend . \
  -n knowledge-ai
```

Or if it already exists:

```
helm upgrade knowledge-ai-frontend . \
  -n knowledge-ai
```

---

# Part 20 — Verify everything

Run these:

```
kubectl get rollout -n knowledge-ai
```

```
kubectl get gatewayclass
```

```
kubectl get gateway -n knowledge-ai
```

```
kubectl get httproute -n knowledge-ai
```

```
kubectl get svc -n knowledge-ai
```

```
kubectl get svc -n envoy-gateway-system
```

You want approximately:

```
GatewayClass
eg    Accepted=True
```

```
Gateway
nextjs-gateway
ADDRESS: 172.18.0.200
PROGRAMMED: True
```

and:

```
Envoy Service
TYPE: LoadBalancer
EXTERNAL-IP: 172.18.0.200
```

---

# Part 21 — Test Envoy

Because you're on Mac + Kind, we discovered that your Mac couldn't directly route to the Docker network IP.

So the easiest testing method is:

```
kubectl port-forward \
  -n envoy-gateway-system \
  svc/<envoy-service-name> \
  8080:80
```

For your current setup:

```
kubectl port-forward \
  -n envoy-gateway-system \
  svc/envoy-knowledge-ai-nextjs-gateway-a63680c3 \
  8080:80
```

Then:

```
curl http://localhost:8080/
```

Envoy Gateway's own quickstart documents port-forwarding the Envoy Service for local testing.

---

# Part 22 — Build your first version

Suppose your current image is:

```
image:
  repository: ritikkumawat123/knowledge-ai-frontend
  tag: "1.0.0"
```

Build:

```
docker build \
  -t ritikkumawat123/knowledge-ai-frontend:1.0.0 .
```

Push:

```
docker push \
  ritikkumawat123/knowledge-ai-frontend:1.0.0
```

---

# Part 23 — Make a visible Canary change

For example:

### Version 1

```
Knowledge AI
STABLE v1.0.0
```

Build/push `1.0.0`.

Then change your application:

### Version 2

```
Knowledge AI
🚀 CANARY v1.0.1
```

Build:

```
docker build \
  -t ritikkumawat123/knowledge-ai-frontend:1.0.1 .
```

Push:

```
docker push \
  ritikkumawat123/knowledge-ai-frontend:1.0.1
```

Then:

```
image:
  repository: ritikkumawat123/knowledge-ai-frontend
  tag: "1.0.1"
```

---

# Part 24 — Trigger Canary

Run:

```
helm upgrade knowledge-ai-frontend . \
  -n knowledge-ai
```

Then:

```
kubectl argo rollouts get rollout \
  knowledge-ai-frontend \
  -n knowledge-ai \
  --watch
```

You should eventually get:

```
Status: Paused

Step: 1/9
SetWeight: 10
ActualWeight: 10
```

And:

```
stable → 1.0.0
canary → 1.0.1
```

---

# Part 25 — Verify the actual HTTPRoute

This is **the most important verification**.

Run:

```
kubectl get httproute nextjs \
  -n knowledge-ai -o yaml
```

At 10% you should see:

```
backendRefs:
  - name: nextjs-stable
    port: 3000
    weight: 90

  - name: nextjs-canary
    port: 3000
    weight: 10
```

This proves:

```
Argo
 ↓
Gateway API plugin
 ↓
HTTPRoute
 ↓
Envoy
```

is working.

---

# Part 26 — Test the actual application

Keep:

```
kubectl port-forward \
  -n envoy-gateway-system \
  svc/<envoy-service> \
  8080:80
```

running.

Then:

```
curl http://localhost:8080/
```

For a proper test, send many requests:

```
for i in {1..100}; do
  curl -s http://localhost:8080/
done
```

If your versions have visible text:

```
for i in {1..100}; do
  curl -s http://localhost:8080/ \
    | grep -oE "STABLE v1.0.0|CANARY v1.0.1"
done
```

Remember: 10% means **probabilistic traffic distribution**, not exactly one canary response every ten requests.

---

# Part 27 — Promote

At:

```
10%
```

test everything.

Then:

```
kubectl argo rollouts promote \
  knowledge-ai-frontend \
  -n knowledge-ai
```

It moves to:

```
25%
```

and pauses.

Test again.

Then:

```
kubectl argo rollouts promote \
  knowledge-ai-frontend \
  -n knowledge-ai
```

Repeat for:

```
50%
75%
100%
```

You can also watch continuously:

```
kubectl argo rollouts get rollout \
  knowledge-ai-frontend \
  -n knowledge-ai \
  --watch
```

---

# Part 28 — Final state

At the end:

```
Status:       Healthy
Step:         9/9
SetWeight:    100
ActualWeight: 100
```

and:

```
1.0.1 → stable
```

Old ReplicaSet:

```
ScaledDown
```

New ReplicaSet:

```
4 Pods
4 Ready
```

Exactly what you saw in your successful test.




# Your "5-minute checklist"

Once you've done this a few times, you don't need to read the whole guide.

## Infrastructure

```
# 1. Kind
kind create cluster --name kind-cluster --config kind-config.yaml

# 2. MetalLB
kubectl apply -f metallb-config.yaml

# 3. Envoy
helm install eg \
  oci://docker.io/envoyproxy/gateway-helm \
  --version v1.9.0 \
  -n envoy-gateway-system \
  --create-namespace

# 4. GatewayClass
kubectl apply -f gatewayclass.yaml

# 5. Argo
kubectl create namespace argo-rollouts
kubectl apply -n argo-rollouts \
  -f https://github.com/argoproj/argo-rollouts/releases/latest/download/install.yaml

# 6. Plugin
kubectl apply -f gateway-plugin.yaml

# 7. RBAC
kubectl apply -f gateway-api-rbac.yaml

# 8. Restart Argo
kubectl rollout restart deployment argo-rollouts \
  -n argo-rollouts
```

## Application

```
# 9. Verify Helm
helm template knowledge-ai-frontend . -n knowledge-ai

# 10. Install
helm upgrade --install knowledge-ai-frontend . \
  -n knowledge-ai \
  --create-namespace
```

## Verify

```
kubectl get nodes

kubectl get gatewayclass

kubectl get gateway -n knowledge-ai

kubectl get httproute -n knowledge-ai

kubectl get svc -n envoy-gateway-system

kubectl get rollout -n knowledge-ai
```

## Deploy Canary

```
# Build
docker build \
  -t ritikkumawat123/knowledge-ai-frontend:1.0.1 .

# Push
docker push \
  ritikkumawat123/knowledge-ai-frontend:1.0.1

# Change values.yaml to 1.0.1

# Deploy
helm upgrade knowledge-ai-frontend . \
  -n knowledge-ai

# Watch
kubectl argo rollouts get rollout \
  knowledge-ai-frontend \
  -n knowledge-ai \
  --watch
```

## Verify 10%

```
kubectl get httproute nextjs \
  -n knowledge-ai -o yaml
```

Expected:

```
stable = 90
canary = 10
```

Then test:

```
kubectl port-forward \
  -n envoy-gateway-system \
  svc/<envoy-service> \
  8080:80
```

```
curl http://localhost:8080/
```

---

# The one diagram to remember

If you forget everything else, remember this:

```
                         USER
                          │
                          ▼
                    ┌───────────┐
                    │  MetalLB  │
                    │ 172.18... │
                    └─────┬─────┘
                          │
                          ▼
                   ┌─────────────┐
                   │    Envoy    │
                   │   Gateway   │
                   └──────┬──────┘
                          │
                          ▼
                   ┌─────────────┐
                   │  HTTPRoute  │◄──────────────┐
                   └──────┬──────┘               │
                          │                      │
                    ┌─────┴─────┐          Gateway API
                    │           │            Plugin
                  90%          10%                ▲
                    │           │                 │
                    ▼           ▼                 │
                STABLE       CANARY               │
                Service       Service             │
                    │           │                 │
                    ▼           ▼                 │
                 v1 Pods      v2 Pods             │
                    ▲           ▲                 │
                    │           │                 │
                    └─────┬─────┘                 │
                          │                       │
                    Argo Rollouts ───────────────-┘
                          │
                    setWeight()
                          │
                    pause / promote
```