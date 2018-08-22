# Deployment

```bash
# Staging
aws s3 mb s3://hackingstudio-informant-bot-staging-serverlessdeployment --region eu-central-1

# Production
aws s3 mb s3://hackingstudio-informant-bot-prod-serverlessdeployment --region eu-central-1
```

```bash
export SLS_STAGE=prod
sls package
sls create_domain
sls deploy -p .serverless
```
