# TIM - The infos machine

Hier wird ein Bot-Format für die 1LIVE Infos entwickelt.

## Getting started

### Local development

You need to create a file called `.env.yml`

```yml
DEPLOY_ALIAS: <your name> # The suffix for your personal development deployment
FB_PAGETOKEN:             # Facebook API Token for the page
FB_VERIFYTOKEN:           # Facebook Webhook Verification Token
DF_PROJECTID:             # Dialogflow Project ID to use
CMS_API_URL:              # Base URL for CMS (https://github.com/wdr-data/tim-cms) REST API (with trailing slash)
CMS_API_TOKEN:            # Token to authenticate with CMS REST API (http://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication)
```

Also, you need to create a Service Account for Dialogflow and save it to `.df_id.json`. It needs the `client` permission for Dialogflow.
