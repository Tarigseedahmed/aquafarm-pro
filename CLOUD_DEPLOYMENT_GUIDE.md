# دليل النشر السحابي - AquaFarm Pro

## نظرة عامة
هذا الدليل يوضح كيفية نشر AquaFarm Pro على الاستضافة السحابية باستخدام Kubernetes. النظام يدعم النشر على AWS, Google Cloud, Azure, و DigitalOcean.

## المتطلبات الأساسية

### 1. أدوات مطلوبة
```bash
# Kubernetes CLI
kubectl version --client

# Docker
docker --version

# Helm (اختياري)
helm version

# AWS CLI (للنشر على AWS)
aws --version

# Google Cloud SDK (للنشر على GCP)
gcloud --version

# Azure CLI (للنشر على Azure)
az --version
```

### 2. حساب سحابي
- AWS Account مع EKS
- Google Cloud Account مع GKE
- Azure Account مع AKS
- DigitalOcean Account مع Kubernetes

## خطوات النشر

### 1. إعداد Kubernetes Cluster

#### AWS EKS
```bash
# إنشاء EKS cluster
eksctl create cluster \
  --name aquafarm-pro \
  --version 1.28 \
  --region us-west-2 \
  --nodegroup-name workers \
  --node-type t3.medium \
  --nodes 3 \
  --nodes-min 2 \
  --nodes-max 5 \
  --managed

# تحديث kubeconfig
aws eks update-kubeconfig --region us-west-2 --name aquafarm-pro
```

#### Google GKE
```bash
# إنشاء GKE cluster
gcloud container clusters create aquafarm-pro \
  --zone us-central1-a \
  --num-nodes 3 \
  --machine-type e2-medium \
  --enable-autoscaling \
  --min-nodes 2 \
  --max-nodes 5

# تحديث kubeconfig
gcloud container clusters get-credentials aquafarm-pro --zone us-central1-a
```

#### Azure AKS
```bash
# إنشاء AKS cluster
az aks create \
  --resource-group aquafarm-pro \
  --name aquafarm-pro \
  --node-count 3 \
  --node-vm-size Standard_B2s \
  --enable-cluster-autoscaler \
  --min-count 2 \
  --max-count 5

# تحديث kubeconfig
az aks get-credentials --resource-group aquafarm-pro --name aquafarm-pro
```

### 2. إعداد Docker Registry

#### GitHub Container Registry
```bash
# تسجيل الدخول إلى GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u USERNAME --password-stdin

# بناء وتشغيل الصور
docker build -f backend/Dockerfile.optimized -t ghcr.io/USERNAME/aquafarm-pro-backend:latest ./backend
docker build -f frontend/Dockerfile.production -t ghcr.io/USERNAME/aquafarm-pro-frontend:latest ./frontend

# دفع الصور
docker push ghcr.io/USERNAME/aquafarm-pro-backend:latest
docker push ghcr.io/USERNAME/aquafarm-pro-frontend:latest
```

#### AWS ECR
```bash
# إنشاء ECR repository
aws ecr create-repository --repository-name aquafarm-pro-backend
aws ecr create-repository --repository-name aquafarm-pro-frontend

# تسجيل الدخول إلى ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com

# بناء وتشغيل الصور
docker build -f backend/Dockerfile.optimized -t ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/aquafarm-pro-backend:latest ./backend
docker build -f frontend/Dockerfile.production -t ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/aquafarm-pro-frontend:latest ./frontend

# دفع الصور
docker push ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/aquafarm-pro-backend:latest
docker push ACCOUNT_ID.dkr.ecr.us-west-2.amazonaws.com/aquafarm-pro-frontend:latest
```

### 3. إعداد Secrets

#### إنشاء Secrets
```bash
# إنشاء namespace
kubectl create namespace aquafarm-pro

# إنشاء secrets
kubectl create secret generic aquafarm-secrets \
  --from-literal=DB_USER=aquafarm_user \
  --from-literal=DB_PASSWORD=your_secure_password \
  --from-literal=JWT_SECRET=your_jwt_secret_key \
  --from-literal=JWT_REFRESH_SECRET=your_refresh_secret_key \
  --from-literal=REDIS_PASSWORD=your_redis_password \
  --from-literal=API_KEY=your_api_key \
  --from-literal=SMTP_USER=alerts@aquafarm.cloud \
  --from-literal=SMTP_PASSWORD=your_smtp_password \
  --from-literal=SLACK_WEBHOOK=your_slack_webhook \
  --from-literal=GRAFANA_ADMIN_PASSWORD=your_grafana_password \
  --namespace=aquafarm-pro
```

#### إعداد SSL Certificates
```bash
# إنشاء SSL certificate secret
kubectl create secret tls aquafarm-tls \
  --cert=path/to/certificate.crt \
  --key=path/to/private.key \
  --namespace=aquafarm-pro
```

### 4. نشر التطبيق

#### نشر جميع المكونات
```bash
# نشر namespace
kubectl apply -f infra/k8s/namespace.yaml

# نشر configmap
kubectl apply -f infra/k8s/configmap.yaml

# نشر secrets
kubectl apply -f infra/k8s/secrets.yaml

# نشر PostgreSQL
kubectl apply -f infra/k8s/postgres-deployment.yaml

# نشر Redis
kubectl apply -f infra/k8s/redis-deployment.yaml

# نشر Backend
kubectl apply -f infra/k8s/backend-deployment.yaml

# نشر Frontend
kubectl apply -f infra/k8s/frontend-deployment.yaml

# نشر Monitoring
kubectl apply -f infra/k8s/monitoring-deployment.yaml

# نشر Backup
kubectl apply -f infra/k8s/backup-deployment.yaml

# نشر Ingress
kubectl apply -f infra/k8s/ingress.yaml

# نشر SSL/TLS
kubectl apply -f infra/k8s/cert-manager.yaml
```

### 5. إعداد Load Balancer

#### AWS ELB
```bash
# إنشاء Load Balancer
kubectl expose service nginx-ingress-service \
  --type=LoadBalancer \
  --name=aquafarm-lb \
  --namespace=aquafarm-pro
```

#### Google Cloud Load Balancer
```bash
# إنشاء Load Balancer
kubectl expose service nginx-ingress-service \
  --type=LoadBalancer \
  --name=aquafarm-lb \
  --namespace=aquafarm-pro
```

### 6. إعداد Domain و DNS

#### إعداد DNS Records
```bash
# الحصول على Load Balancer IP
kubectl get service aquafarm-lb --namespace=aquafarm-pro

# إعداد DNS records
# A record: aquafarm.cloud -> Load Balancer IP
# A record: api.aquafarm.cloud -> Load Balancer IP
# A record: admin.aquafarm.cloud -> Load Balancer IP
# A record: monitoring.aquafarm.cloud -> Load Balancer IP
```

### 7. إعداد SSL/TLS

#### Let's Encrypt
```bash
# تثبيت cert-manager
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# إنشاء ClusterIssuer
kubectl apply -f infra/k8s/cert-manager.yaml

# التحقق من SSL certificates
kubectl get certificates --namespace=aquafarm-pro
```

### 8. إعداد Monitoring

#### Prometheus و Grafana
```bash
# نشر Prometheus
kubectl apply -f infra/k8s/monitoring-deployment.yaml

# التحقق من Monitoring
kubectl get pods --namespace=aquafarm-pro | grep prometheus
kubectl get pods --namespace=aquafarm-pro | grep grafana

# الوصول إلى Grafana
kubectl port-forward service/grafana-service 3000:3000 --namespace=aquafarm-pro
```

### 9. إعداد Backup

#### Database Backup
```bash
# نشر Backup jobs
kubectl apply -f infra/k8s/backup-deployment.yaml

# التحقق من Backup jobs
kubectl get cronjobs --namespace=aquafarm-pro

# تشغيل backup يدوياً
kubectl create job --from=cronjob/database-backup manual-backup --namespace=aquafarm-pro
```

### 10. اختبار النشر

#### Health Checks
```bash
# فحص صحة التطبيق
kubectl get pods --namespace=aquafarm-pro

# فحص services
kubectl get services --namespace=aquafarm-pro

# فحص ingress
kubectl get ingress --namespace=aquafarm-pro

# اختبار endpoints
curl -k https://api.aquafarm.cloud/health
curl -k https://aquafarm.cloud
```

#### Load Testing
```bash
# استخدام Apache Bench
ab -n 1000 -c 10 https://api.aquafarm.cloud/health

# استخدام wrk
wrk -t12 -c400 -d30s https://api.aquafarm.cloud/health
```

## إدارة النشر

### 1. تحديث التطبيق
```bash
# بناء صورة جديدة
docker build -f backend/Dockerfile.optimized -t ghcr.io/USERNAME/aquafarm-pro-backend:v1.1.0 ./backend

# دفع الصورة الجديدة
docker push ghcr.io/USERNAME/aquafarm-pro-backend:v1.1.0

# تحديث deployment
kubectl set image deployment/backend-deployment backend=ghcr.io/USERNAME/aquafarm-pro-backend:v1.1.0 --namespace=aquafarm-pro

# مراقبة التحديث
kubectl rollout status deployment/backend-deployment --namespace=aquafarm-pro
```

### 2. Scaling
```bash
# زيادة عدد replicas
kubectl scale deployment backend-deployment --replicas=5 --namespace=aquafarm-pro

# استخدام HPA
kubectl autoscale deployment backend-deployment --cpu-percent=70 --min=2 --max=10 --namespace=aquafarm-pro
```

### 3. Logs
```bash
# عرض logs
kubectl logs -f deployment/backend-deployment --namespace=aquafarm-pro

# عرض logs لـ pod معين
kubectl logs -f pod/POD_NAME --namespace=aquafarm-pro
```

### 4. Debugging
```bash
# الوصول إلى pod
kubectl exec -it pod/POD_NAME --namespace=aquafarm-pro -- /bin/bash

# وصف pod
kubectl describe pod POD_NAME --namespace=aquafarm-pro

# وصف service
kubectl describe service SERVICE_NAME --namespace=aquafarm-pro
```

## الأمان

### 1. Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: aquafarm-network-policy
  namespace: aquafarm-pro
spec:
  podSelector: {}
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: aquafarm-pro
  egress:
  - to:
    - namespaceSelector:
        matchLabels:
          name: aquafarm-pro
```

### 2. Pod Security Policies
```yaml
apiVersion: policy/v1beta1
kind: PodSecurityPolicy
metadata:
  name: aquafarm-psp
spec:
  privileged: false
  allowPrivilegeEscalation: false
  requiredDropCapabilities:
    - ALL
  volumes:
    - 'configMap'
    - 'emptyDir'
    - 'projected'
    - 'secret'
    - 'downwardAPI'
    - 'persistentVolumeClaim'
  runAsUser:
    rule: 'MustRunAsNonRoot'
  seLinux:
    rule: 'RunAsAny'
  fsGroup:
    rule: 'RunAsAny'
```

### 3. RBAC
```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  namespace: aquafarm-pro
  name: aquafarm-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "configmaps", "secrets"]
  verbs: ["get", "list", "watch"]
```

## Monitoring و Alerting

### 1. Prometheus Alerts
```yaml
groups:
- name: aquafarm-alerts
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: "High error rate detected"
      description: "Error rate is {{ $value }} errors per second"
```

### 2. Grafana Dashboards
```json
{
  "dashboard": {
    "title": "AquaFarm Pro Dashboard",
    "panels": [
      {
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{ method }} {{ endpoint }}"
          }
        ]
      }
    ]
  }
}
```

## Backup و Recovery

### 1. Database Backup
```bash
# إنشاء backup
kubectl create job --from=cronjob/database-backup manual-backup --namespace=aquafarm-pro

# استعادة backup
kubectl exec -it postgres-deployment-xxx --namespace=aquafarm-pro -- pg_restore -d aquafarm_prod /backups/backup.sql
```

### 2. Disaster Recovery
```bash
# إنشاء snapshot
kubectl create job --from=cronjob/database-backup disaster-recovery-snapshot --namespace=aquafarm-pro

# استعادة من snapshot
kubectl apply -f infra/k8s/disaster-recovery.yaml
```

## التكلفة

### 1. AWS EKS
- EKS Cluster: $73/month
- EC2 Instances (3x t3.medium): $150/month
- Load Balancer: $20/month
- EBS Storage: $50/month
- **Total: ~$293/month**

### 2. Google GKE
- GKE Cluster: $73/month
- Compute Engine (3x e2-medium): $120/month
- Load Balancer: $20/month
- Persistent Disk: $40/month
- **Total: ~$253/month**

### 3. Azure AKS
- AKS Cluster: $73/month
- Virtual Machines (3x Standard_B2s): $140/month
- Load Balancer: $20/month
- Managed Disks: $45/month
- **Total: ~$278/month**

## الدعم

### 1. المشاكل الشائعة
- **Pod لا يبدأ**: تحقق من logs و resources
- **Service لا يعمل**: تحقق من labels و selectors
- **Ingress لا يعمل**: تحقق من DNS و SSL certificates
- **Database connection**: تحقق من secrets و network policies

### 2. الأدوات المفيدة
- **kubectl**: إدارة Kubernetes
- **kubectx**: تبديل contexts
- **kubens**: تبديل namespaces
- **k9s**: واجهة مستخدم لـ Kubernetes
- **Lens**: IDE لـ Kubernetes

### 3. الموارد
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [AWS EKS Documentation](https://docs.aws.amazon.com/eks/)
- [Google GKE Documentation](https://cloud.google.com/kubernetes-engine/docs)
- [Azure AKS Documentation](https://docs.microsoft.com/en-us/azure/aks/)

## الخلاصة

هذا الدليل يوفر إرشادات شاملة لنشر AquaFarm Pro على الاستضافة السحابية. النظام يدعم النشر على جميع المنصات السحابية الرئيسية مع مراقبة شاملة و backup تلقائي.

للحصول على الدعم، يرجى التواصل مع فريق التطوير أو مراجعة الوثائق الرسمية.
