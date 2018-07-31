# Deployment

```bash
aws s3 mb s3://hackingstudio-informant-bot-prod-serverlessdeploymentbucket --region eu-central-1
```

```bash
export SLS_STAGE=prod
sls package
sls deploy -p .serverless
```
