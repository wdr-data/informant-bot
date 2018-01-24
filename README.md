# TIM - The infos machine

Hier wird ein Bot-Format für die 1LIVE Infos entwickelt.

## Getting started

### Local development

You need to create a file called `.env.yml`

```yml
DEPLOY_ALIAS: <your name> # the suffix for your personal development deployment
FB_PAGETOKEN:             # Facebook API Token for the page
FB_VERIFYTOKEN:           # Facebook Webhook Verification Token
DF_PROJECTID:             # Dialogflow Project ID to use
```

Also, you need to create a Service Account for Dialogflow and save it to `.df_id.json`. It needs the `client` permission for Dialogflow.