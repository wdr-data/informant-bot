Informant Step-by-Step
---
# Der 1LIVE Informant - Deine Infos aus NRW und der digitalen Welt. Täglich aufs Handy.


[![Build Status](https://travis-ci.org/wdr-data/informant-bot.svg?branch=master)](https://travis-ci.org/wdr-data/informant-bot)
[![Facebook Messenger](https://img.shields.io/badge/Facebook-Messenger-blue.svg)](https://m.me/1LIVE.Informant)

## Über den 1LIVE Informant 🕶️

- Wird gemacht von den 1LIVE Infos
- Schickt dir morgens oder abends deine Nachrichten
- Lässt dich auswählen, welche News du lesen willst
- Antwortet dir, wenn du ihn nach Infos-Themen fragst
- Quatscht gerne mit dir

Der 1LIVE Informant ist ein ChatBot. Also ein Computerprogramm, das Nachrichten versenden und Fragen beantworten kann.

Im Facebook-Messenger nutzen: [m.me/1LIVE.Informant](https://m.me/1LIVE.Informant)

## Impressum / Team 🕵️

- Redaktion: 1LIVE Infos, Jessica Häusler, Susanne Schwarzbach, Moritz Cremers
- Grafik: Mirko Schweikert
- Umsetzung: Lisa Achenbach, Patricia Ennenbach, Christine Gotthardt, Jannes Höke, Christian Jörres, Marcus Weiner

[**Impressum**](https://www1.wdr.de/radio/1live/einslive-impressum-100.html)


## Nutzung

### Vorraussetzungen

- [Facebook Developer](https://developer.facebook.com/) App mit Messenger Integration: [Anleitung](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
- [Dialogflow](https://dialogflow.com/) Agent (früher api.ai)

Zunächst sollte der Source-Code lokal vorhanden sein. Dieses Git Kommando legt einen neuen Ordner mit dem Source an.

```
git clone https://github.com/wdr-data/informant-bot.git
git clone https://github.com/wdr-data/informant-cms.git
```

Use `clone with ssh`-URL. 
To `push` to repository, make sure you associate your ssh-key with you github account: https://help.github.com/articles/adding-a-new-ssh-key-to-your-github-account/
In case you need to create an 
`ssh-key`: https://help.github.com/articles/generating-a-new-ssh-key-and-adding-it-to-the-ssh-agent/


## Informant-Bot

### Local development

You need to create a file called `.env.yml` in the root folder of the informant-bot directory. 
We will show you how to fill in the variables later in this text.

```yml
DEPLOY_ALIAS: <your name> # The suffix for your personal development deployment
FB_PAGETOKEN:             # Facebook API Token for the page
FB_VERIFYTOKEN:           # Facebook Webhook Verification Token
DF_PROJECTID:             # Dialogflow Project ID to use
CMS_API_URL:              # Base URL for CMS (https://github.com/wdr-data/tim-cms) REST API (with trailing slash)
CMS_API_TOKEN:            # Token to authenticate with CMS REST API (http://www.django-rest-framework.org/api-guide/authentication/#tokenauthentication)
SENTRY_DSN:               # Sentry
PROM_PUSH_API_KEY: ''     # Prometheus
PROM_PUSH_TARGET: ''      # Prometheus
INFOS_AUDIO_URL:          # RSS audio feed of current radio news
```

Also, you need to create a Service Account for Dialogflow and save it to `.df_id.json`. It needs the `client` permission for Dialogflow.

### How to start using your local INFORMANT-BOT

If not already installed, install `yarn`: https://yarnpkg.com/lang/en/docs/install/
Go to your local repository and run:

```
yarn  OR  yarn install
```

To start with local development: 
```
yarn sls deploy
```
If you do this for the first time, you will get a lot of errors. Don't worry, we will fix them step by step by adding the necessary variables to the .env.yml file.

`SENTRY_DSN` 
Sentry is a helpful tool to ducument errors. You'll need to signup for a free account and get a link as a token: 
https://sentry.io/welcome/ 

`.df_id.json` 
Dialogflow is a google tool to manage conversations with your bot. 
You'll have to go to [dialogflow.com](https://dialogflow.com/) and sign in with your google account. 
You'll need to set up a new dialogflow agent for your project.
You'll also need to create a project on google-cloud-platform and set up a service account and create a key for your project.

To do this follow the link in the Dialogflow-Agent-Settings to `Google-Cloud` 
--> IAM & admin 
--> Service accounts 
--> actions 
--> create a key 
--> safe `json`. Call the file `.df_id.json` and save it at same place as `.env.yml`

`DF_PROJECTID`  
--> Dialogflow-Agent-Settings -> GoogleProjectID

`AWS_Credentials`
ServerlessError: AWS provider credentials not found. Learn how to set up AWS provider credentials in our docs here: <http://bit.ly/aws-creds-setup>.
For easy handling of AWS account use `aws-cli`: https://github.com/aws/aws-cli

Then do:
```aws configure```
AWS Access Key ID [None]: 
AWS Secret Access Key [None]: 
Default region name [None]:
Default output format [None]:

`FB_PAGETOKEN`
- Create a Page in Facebook.
- Create an `Messenger-App` in Facebook-Developer and generate a `key` for you Page

`CMS_API_TOKEN` 
You will need a cms to handle your news content. Set it up as described in ```informant-cms```, then login as admin, generate a token. 

`CMS_API_URL`
In `informant-cms` you create an api for your content, provide the url:
CMS_BASE_URL/api/v1 

`INFO_AUDIO_URL` 
As a feature we provide audio news from a podcast feed.
--> https://www1.wdr.de/mediathek/audio/1live/infos/infos-1-100.podcast


## Datenschutz
Es gelten die Facebook-Datenschutz-Regeln. Falls Nutzer sich für Push-Nachrichten anmelden, speichert der Bot eine PSID (page specific id). Diese ID identifiziert den User nur im Chat und hat sonst keine Bedeutung für Facebook.
Um entscheiden zu können, welche Antwort dem Nutzer gesendet werden, schickt der Bot den Text der Nachricht und die psid zum Dialogflow-Agent (Google Service).
Alleine kann der Bot nichts lernen. Deshalb schauen sich Menschen die Fragen an, die dem Bot gestellt werden und machen ihn schlauer.
Darüber hinaus werden keine Daten gezogen oder weiterverwendet.
Zu den Datenschutzbestimmungen des "Westdeutschen Rundfunks": http://www1.wdr.de/hilfe/datenschutz102.html

## Daten-Quellen / Credits
- Der Informant arbeitet in Kooperation mit Novi, dem Nachrichten-Bot von Funk: https://novi.funk.net/
- Der Informant nutzt Dialogflow (Google Service) um die Absichten der Nutzer (intents) zu klassifizieren. Übergeben wird die PSID (Page Specific ID) und der Nachrichtentext.

## Rechtliches und Lizenzen

#### Lizenz

JavaScript (Source-Code oder aufbereitet) ist bei Beibehaltung des Lizenztextes unter der MIT License frei nutzbar und weiterverbreitbar.

[Lizenztext](LICENSE.md)

Für Grafiken wird kein Nutzungsrecht eingeräumt.

#### Urheberrecht

Copyright Westdeutscher Rundfunk Köln


#### Gewährleistungsausschluss
Es besteht keinerlei Gewährleistung für das Programm, soweit dies gesetzlich zulässig ist. Sofern nicht anderweitig schriftlich bestätigt, stellen die Urheberrechtsinhaber und/oder Dritte das Programm so zur Verfügung, „wie es ist“, ohne irgendeine Gewährleistung. Das volle Risiko bezüglich Qualität und Leistungsfähigkeit des Programms liegt bei Ihnen.