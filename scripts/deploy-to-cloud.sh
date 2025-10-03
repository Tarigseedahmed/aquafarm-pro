#!/bin/bash

# AquaFarm Pro Cloud Deployment Script
# This script automates the deployment of AquaFarm Pro to cloud platforms

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="aquafarm-pro"
NAMESPACE="aquafarm-pro"
REGISTRY="ghcr.io"
USERNAME=""
VERSION="latest"
CLOUD_PLATFORM=""
REGION=""
CLUSTER_NAME=""

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    local missing_deps=()
    
    if ! command -v kubectl &> /dev/null; then
        missing_deps+=("kubectl")
    fi
    
    if ! command -v docker &> /dev/null; then
        missing_deps+=("docker")
    fi
    
    if ! command -v helm &> /dev/null; then
        missing_deps+=("helm")
    fi
    
    if [ ${#missing_deps[@]} -ne 0 ]; then
        log_error "Missing dependencies: ${missing_deps[*]}"
        log_info "Please install the missing dependencies and try again"
        exit 1
    fi
    
    log_success "All dependencies are installed"
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --platform)
                CLOUD_PLATFORM="$2"
                shift 2
                ;;
            --region)
                REGION="$2"
                shift 2
                ;;
            --cluster)
                CLUSTER_NAME="$2"
                shift 2
                ;;
            --username)
                USERNAME="$2"
                shift 2
                ;;
            --version)
                VERSION="$2"
                shift 2
                ;;
            --registry)
                REGISTRY="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Show help message
show_help() {
    cat << EOF
AquaFarm Pro Cloud Deployment Script

Usage: $0 [OPTIONS]

Options:
    --platform PLATFORM    Cloud platform (aws, gcp, azure, digitalocean)
    --region REGION        Cloud region (e.g., us-west-2, us-central1-a)
    --cluster CLUSTER      Kubernetes cluster name
    --username USERNAME    Docker registry username
    --version VERSION      Application version (default: latest)
    --registry REGISTRY    Docker registry URL (default: ghcr.io)
    --help                 Show this help message

Examples:
    $0 --platform aws --region us-west-2 --cluster aquafarm-pro --username myusername
    $0 --platform gcp --region us-central1-a --cluster aquafarm-pro --username myusername
    $0 --platform azure --region eastus --cluster aquafarm-pro --username myusername

EOF
}

# Validate configuration
validate_config() {
    log_info "Validating configuration..."
    
    if [ -z "$CLOUD_PLATFORM" ]; then
        log_error "Cloud platform is required"
        exit 1
    fi
    
    if [ -z "$REGION" ]; then
        log_error "Region is required"
        exit 1
    fi
    
    if [ -z "$CLUSTER_NAME" ]; then
        log_error "Cluster name is required"
        exit 1
    fi
    
    if [ -z "$USERNAME" ]; then
        log_error "Username is required"
        exit 1
    fi
    
    log_success "Configuration is valid"
}

# Setup cloud platform
setup_cloud_platform() {
    log_info "Setting up cloud platform: $CLOUD_PLATFORM"
    
    case $CLOUD_PLATFORM in
        aws)
            setup_aws
            ;;
        gcp)
            setup_gcp
            ;;
        azure)
            setup_azure
            ;;
        digitalocean)
            setup_digitalocean
            ;;
        *)
            log_error "Unsupported cloud platform: $CLOUD_PLATFORM"
            exit 1
            ;;
    esac
}

# Setup AWS
setup_aws() {
    log_info "Setting up AWS..."
    
    if ! command -v aws &> /dev/null; then
        log_error "AWS CLI is not installed"
        exit 1
    fi
    
    # Check if cluster exists
    if ! aws eks describe-cluster --name "$CLUSTER_NAME" --region "$REGION" &> /dev/null; then
        log_info "Creating EKS cluster: $CLUSTER_NAME"
        eksctl create cluster \
            --name "$CLUSTER_NAME" \
            --version 1.28 \
            --region "$REGION" \
            --nodegroup-name workers \
            --node-type t3.medium \
            --nodes 3 \
            --nodes-min 2 \
            --nodes-max 5 \
            --managed
    fi
    
    # Update kubeconfig
    aws eks update-kubeconfig --region "$REGION" --name "$CLUSTER_NAME"
    
    log_success "AWS setup completed"
}

# Setup Google Cloud
setup_gcp() {
    log_info "Setting up Google Cloud..."
    
    if ! command -v gcloud &> /dev/null; then
        log_error "Google Cloud SDK is not installed"
        exit 1
    fi
    
    # Check if cluster exists
    if ! gcloud container clusters describe "$CLUSTER_NAME" --zone "$REGION" &> /dev/null; then
        log_info "Creating GKE cluster: $CLUSTER_NAME"
        gcloud container clusters create "$CLUSTER_NAME" \
            --zone "$REGION" \
            --num-nodes 3 \
            --machine-type e2-medium \
            --enable-autoscaling \
            --min-nodes 2 \
            --max-nodes 5
    fi
    
    # Update kubeconfig
    gcloud container clusters get-credentials "$CLUSTER_NAME" --zone "$REGION"
    
    log_success "Google Cloud setup completed"
}

# Setup Azure
setup_azure() {
    log_info "Setting up Azure..."
    
    if ! command -v az &> /dev/null; then
        log_error "Azure CLI is not installed"
        exit 1
    fi
    
    # Check if cluster exists
    if ! az aks show --name "$CLUSTER_NAME" --resource-group "$CLUSTER_NAME" &> /dev/null; then
        log_info "Creating AKS cluster: $CLUSTER_NAME"
        az aks create \
            --resource-group "$CLUSTER_NAME" \
            --name "$CLUSTER_NAME" \
            --node-count 3 \
            --node-vm-size Standard_B2s \
            --enable-cluster-autoscaler \
            --min-count 2 \
            --max-count 5 \
            --location "$REGION"
    fi
    
    # Update kubeconfig
    az aks get-credentials --resource-group "$CLUSTER_NAME" --name "$CLUSTER_NAME"
    
    log_success "Azure setup completed"
}

# Setup DigitalOcean
setup_digitalocean() {
    log_info "Setting up DigitalOcean..."
    
    if ! command -v doctl &> /dev/null; then
        log_error "DigitalOcean CLI is not installed"
        exit 1
    fi
    
    # Check if cluster exists
    if ! doctl kubernetes cluster get "$CLUSTER_NAME" &> /dev/null; then
        log_info "Creating DigitalOcean Kubernetes cluster: $CLUSTER_NAME"
        doctl kubernetes cluster create "$CLUSTER_NAME" \
            --region "$REGION" \
            --node-pool "name=worker-pool;size=s-2vcpu-2gb;count=3;auto-scale=true;min-nodes=2;max-nodes=5"
    fi
    
    # Update kubeconfig
    doctl kubernetes cluster kubeconfig save "$CLUSTER_NAME"
    
    log_success "DigitalOcean setup completed"
}

# Build and push Docker images
build_and_push_images() {
    log_info "Building and pushing Docker images..."
    
    # Login to registry
    if [ "$REGISTRY" = "ghcr.io" ]; then
        if [ -z "$GITHUB_TOKEN" ]; then
            log_error "GITHUB_TOKEN environment variable is required for GitHub Container Registry"
            exit 1
        fi
        echo "$GITHUB_TOKEN" | docker login ghcr.io -u "$USERNAME" --password-stdin
    fi
    
    # Build backend image
    log_info "Building backend image..."
    docker build -f backend/Dockerfile.optimized -t "$REGISTRY/$USERNAME/aquafarm-pro-backend:$VERSION" ./backend
    
    # Build frontend image
    log_info "Building frontend image..."
    docker build -f frontend/Dockerfile.production -t "$REGISTRY/$USERNAME/aquafarm-pro-frontend:$VERSION" ./frontend
    
    # Push images
    log_info "Pushing images to registry..."
    docker push "$REGISTRY/$USERNAME/aquafarm-pro-backend:$VERSION"
    docker push "$REGISTRY/$USERNAME/aquafarm-pro-frontend:$VERSION"
    
    log_success "Images built and pushed successfully"
}

# Deploy to Kubernetes
deploy_to_kubernetes() {
    log_info "Deploying to Kubernetes..."
    
    # Create namespace
    kubectl create namespace "$NAMESPACE" --dry-run=client -o yaml | kubectl apply -f -
    
    # Update image references in deployment files
    sed -i.bak "s|ghcr.io/your-username/aquafarm-pro-backend:latest|$REGISTRY/$USERNAME/aquafarm-pro-backend:$VERSION|g" infra/k8s/backend-deployment.yaml
    sed -i.bak "s|ghcr.io/your-username/aquafarm-pro-frontend:latest|$REGISTRY/$USERNAME/aquafarm-pro-frontend:$VERSION|g" infra/k8s/frontend-deployment.yaml
    
    # Apply Kubernetes manifests
    kubectl apply -f infra/k8s/namespace.yaml
    kubectl apply -f infra/k8s/configmap.yaml
    kubectl apply -f infra/k8s/secrets.yaml
    kubectl apply -f infra/k8s/postgres-deployment.yaml
    kubectl apply -f infra/k8s/redis-deployment.yaml
    kubectl apply -f infra/k8s/backend-deployment.yaml
    kubectl apply -f infra/k8s/frontend-deployment.yaml
    kubectl apply -f infra/k8s/monitoring-deployment.yaml
    kubectl apply -f infra/k8s/backup-deployment.yaml
    kubectl apply -f infra/k8s/ingress.yaml
    kubectl apply -f infra/k8s/cert-manager.yaml
    
    # Restore original files
    mv infra/k8s/backend-deployment.yaml.bak infra/k8s/backend-deployment.yaml
    mv infra/k8s/frontend-deployment.yaml.bak infra/k8s/frontend-deployment.yaml
    
    log_success "Deployment completed"
}

# Wait for deployment
wait_for_deployment() {
    log_info "Waiting for deployment to be ready..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=postgres --timeout=300s --namespace="$NAMESPACE"
    kubectl wait --for=condition=ready pod -l app=redis --timeout=300s --namespace="$NAMESPACE"
    kubectl wait --for=condition=ready pod -l app=backend --timeout=300s --namespace="$NAMESPACE"
    kubectl wait --for=condition=ready pod -l app=frontend --timeout=300s --namespace="$NAMESPACE"
    
    log_success "All pods are ready"
}

# Setup Load Balancer
setup_load_balancer() {
    log_info "Setting up Load Balancer..."
    
    # Expose ingress service
    kubectl expose service nginx-ingress-service \
        --type=LoadBalancer \
        --name=aquafarm-lb \
        --namespace="$NAMESPACE"
    
    # Wait for Load Balancer IP
    log_info "Waiting for Load Balancer IP..."
    kubectl wait --for=condition=ready service aquafarm-lb --timeout=300s --namespace="$NAMESPACE"
    
    # Get Load Balancer IP
    LB_IP=$(kubectl get service aquafarm-lb --namespace="$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    
    if [ -z "$LB_IP" ]; then
        LB_IP=$(kubectl get service aquafarm-lb --namespace="$NAMESPACE" -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')
    fi
    
    log_success "Load Balancer IP: $LB_IP"
    log_info "Please update your DNS records to point to: $LB_IP"
}

# Run health checks
run_health_checks() {
    log_info "Running health checks..."
    
    # Wait for services to be ready
    sleep 30
    
    # Check backend health
    if kubectl get pods -l app=backend --namespace="$NAMESPACE" | grep -q Running; then
        log_success "Backend is running"
    else
        log_error "Backend is not running"
        exit 1
    fi
    
    # Check frontend health
    if kubectl get pods -l app=frontend --namespace="$NAMESPACE" | grep -q Running; then
        log_success "Frontend is running"
    else
        log_error "Frontend is not running"
        exit 1
    fi
    
    # Check database health
    if kubectl get pods -l app=postgres --namespace="$NAMESPACE" | grep -q Running; then
        log_success "Database is running"
    else
        log_error "Database is not running"
        exit 1
    fi
    
    # Check Redis health
    if kubectl get pods -l app=redis --namespace="$NAMESPACE" | grep -q Running; then
        log_success "Redis is running"
    else
        log_error "Redis is not running"
        exit 1
    fi
    
    log_success "All health checks passed"
}

# Show deployment information
show_deployment_info() {
    log_info "Deployment Information:"
    echo "=========================="
    echo "Project: $PROJECT_NAME"
    echo "Namespace: $NAMESPACE"
    echo "Cloud Platform: $CLOUD_PLATFORM"
    echo "Region: $REGION"
    echo "Cluster: $CLUSTER_NAME"
    echo "Registry: $REGISTRY"
    echo "Username: $USERNAME"
    echo "Version: $VERSION"
    echo ""
    
    log_info "Useful Commands:"
    echo "=================="
    echo "View pods: kubectl get pods --namespace=$NAMESPACE"
    echo "View services: kubectl get services --namespace=$NAMESPACE"
    echo "View ingress: kubectl get ingress --namespace=$NAMESPACE"
    echo "View logs: kubectl logs -f deployment/backend-deployment --namespace=$NAMESPACE"
    echo "Port forward: kubectl port-forward service/backend-service 3000:3000 --namespace=$NAMESPACE"
    echo ""
    
    log_info "Next Steps:"
    echo "============"
    echo "1. Update DNS records to point to Load Balancer IP"
    echo "2. Configure SSL certificates"
    echo "3. Set up monitoring and alerting"
    echo "4. Configure backup schedules"
    echo "5. Test the application"
}

# Main function
main() {
    log_info "Starting AquaFarm Pro Cloud Deployment..."
    
    check_dependencies
    parse_arguments "$@"
    validate_config
    setup_cloud_platform
    build_and_push_images
    deploy_to_kubernetes
    wait_for_deployment
    setup_load_balancer
    run_health_checks
    show_deployment_info
    
    log_success "Deployment completed successfully!"
}

# Run main function
main "$@"
