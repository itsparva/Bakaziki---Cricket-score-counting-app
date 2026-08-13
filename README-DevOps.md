# Bakaziki - Cricket Score Counting App (DevSecOps Deployment)

A production-style DevSecOps implementation of the **Bakaziki Cricket Score Counting App**.

The application was originally developed by **Parva Khandla**. This repository demonstrates the complete **containerization, Kubernetes deployment, CI/CD automation, security scanning, and GitOps-based continuous deployment** workflow implemented by **Riya**.

## Project Overview

This project focuses on deploying a real-world web application using modern DevOps and DevSecOps practices.

### Application Stack

* **Frontend:** React.js + Tailwind CSS
* **Backend:** Node.js + Express.js
* **Database:** MongoDB Atlas
* **Containerization:** Docker
* **Orchestration:** Kubernetes (KIND)
* **CI:** GitHub Actions
* **CD:** Argo CD (GitOps)
* **Container Registry:** Docker Hub
* **Security Tools:** Gitleaks, CodeQL, Trivy, Checkov

## Architecture

```text
Developer
    |
    v
GitHub Repository
    |
    v
GitHub Actions CI Pipeline
    |
    +--> Code Quality
    +--> Secret Scan (Gitleaks)
    +--> CodeQL Analysis
    +--> Dependency Scan
    +--> Docker Build
    +--> Trivy Image Scan
    +--> Checkov / K8s Scan
    |
    v
Docker Hub
    |
    v
Argo CD
    |
    v
Kubernetes Cluster
    |
    v
Frontend + Backend Services
```

## Features Implemented

### DevOps

* Dockerized frontend and backend applications
* Multi-stage Docker builds
* Kubernetes Deployments and Services
* Environment configuration using ConfigMaps and Secrets
* GitHub Actions CI pipeline
* Docker image versioning using GitHub SHA
* Automated image publishing to Docker Hub

### DevSecOps

* **Gitleaks** for secret scanning
* **CodeQL** for static code analysis
* **Trivy** for container image and Kubernetes manifest scanning
* **Checkov** for infrastructure-as-code security analysis

### GitOps

* **Argo CD** for continuous deployment
* Automatic synchronization of Kubernetes manifests
* Declarative deployment management

## Repository Structure

```text
.
├── Client/                 # React frontend
├── Server/                 # Node.js backend
├── K8S/                    # Kubernetes manifests
├── argocd/                 # Argo CD application manifests
├── .github/
│   └── workflows/
│       ├── ci.yml          # DevSecOps CI pipeline
│       └── cd.yml          # Deployment workflow
├── Dockerfile
├── docker-compose.yml
└── README.md
```

## CI Pipeline

The GitHub Actions pipeline performs the following steps:

1. Code quality checks
2. Secret scanning (Gitleaks)
3. CodeQL security analysis
4. Dependency vulnerability scanning
5. Docker image build
6. Trivy image scanning
7. Docker image push to Docker Hub
8. Kubernetes manifest security scanning
9. Checkov infrastructure validation

## Deployment Workflow

```text
Git Push
   |
   v
GitHub Actions
   |
   v
Build & Scan Docker Images
   |
   v
Push Images to Docker Hub
   |
   v
Update Kubernetes Manifests
   |
   v
Argo CD Sync
   |
   v
Kubernetes Deployment
```

## Challenges Solved

During this project, several real deployment issues were diagnosed and resolved:

* ImagePullBackOff
* CrashLoopBackOff
* MongoDB connection timeouts
* Kubernetes networking issues
* Port-forwarding failures
* Argo CD synchronization errors
* Docker image tagging inconsistencies
* Kubernetes manifest updates in CI/CD

## What I Learned

This project provided hands-on experience with:

* Containerization
* Kubernetes architecture
* CI/CD pipeline design
* GitOps workflows
* DevSecOps security tooling
* Infrastructure troubleshooting
* Production-style deployment debugging

## Connect

If you have suggestions, feedback, or would like to collaborate on DevOps or cloud projects, feel free to connect on LinkedIn - Riya Nandasana

---

⭐ If you found this project interesting, consider giving the repository a star.
