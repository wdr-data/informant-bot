# Der 1LIVE Informant - Infos, über die der Sektor spricht

## Über den 1LIVE Informanten 🕶️ 

Hallo, 
hier bei 1LIVE nennen mich alle nur "Der Informant". 

Ich habe die Infos, über die der Sektor spricht: Das, was du von der Welt wissen musst, um mitzureden – und nicht nur das Schlechte. Du ahnst nicht, was jeden Tag so passiert... Wir können auch ein bisschen quatschen. 

Meine Nachrichten kannst du ein oder zweimal am Tag haben: Morgens, abends oder beides. Und ich melde mich, wenn etwas wirklich Wichtiges passiert.

Du kannst mich im Facebook-Messenger nutzen.
[m.me/1LIVE.Informant]

## Impressum / Team 🕵️

Redaktion: 1LIVE Infos, Jessica Häusler, Susanne Schwarzbach, Jens Becker
Grafik: Mirko Schweikert
Umsetzung: Lisa Achenbach, Patricia Ennenbach, Jannes Höke, Christian Jörres, Marcus Weiner

[**Ipressum**](https://www1.wdr.de/radio/1live/einslive-impressum-100.html)


## Nutzung

### Vorraussetzungen

- [Facebook Developer](https://developer.facebook.com/) App mit Messenger Integration: [Anleitung](https://developers.facebook.com/docs/messenger-platform/getting-started/app-setup)
- [Dialogflow](https://dialogflow.com/) App (früher api.ai)

Zunächst sollte der Source-Code lokal vorhanden sein. Dieses Git Kommando legt einen neuen Ordner mit dem Source an.

```
git clone https://github.com/wdr-data/informant-bot.git
git clone https://github.com/wdr-data/informant-cms.git
```

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

## Datenschutz
Es gelten die Facebook-Datenschutz-Regeln. Falls Nutzer sich für Push-Nachrichten anmelden, speichert der Bot eine PSID (page specific id). Diese ID identifiziert den User nur im Chat und hat sonst keine Bedeutung für Facebook.
Um entscheiden zu können, welche Antwort dem Nutzer gesendet werden, schickt der Bot den Text der Nachricht und die psid zu api.ai (Google Assistant).
Alleine kann der Bot nichts lernen. Deshalb schauen sich Menschen die Fragen an, die dem Bot gestellt werden und machen ihn schlauer.
Darüber hinaus werden keine Daten gezogen oder weiterverwendet.
Zu den Datenschutzbestimmungen des "Westdeutschen Rundfunks": http://www1.wdr.de/hilfe/datenschutz102.html

## Daten-Quellen / Credits
- Der Informant arbeitet in Kooperation mit Novi, dem Nachrichten-Bot von Funk: https://www.funk.net/
- Der Informant nutzt api.ai (Google Assistant) um die Absichten der Nutzer (intents) zu klassifizieren. Übergeben wird die PSID (Page Specific ID) und der Nachrichtentext.

## Rechtliches und Lizenzen

#### Lizenz

JavaScript (Source-Code oder aufbereitet) ist bei Beibehaltung des Lizenztextes unter der MIT License frei nutzbar und weiterverbreitbar.

[Lizenztext](LICENSE)

Für Grafiken wird kein Nutzungsrecht eingeräumt.

#### Urheberrecht

Copyright Westdeutscher Rundfunk Köln


#### Gewähleistungsausschluss
Es besteht keinerlei Gewährleistung für das Programm, soweit dies gesetzlich zulässig ist. Sofern nicht anderweitig schriftlich bestätigt, stellen die Urheberrechtsinhaber und/oder Dritte das Programm so zur Verfügung, „wie es ist“, ohne irgendeine Gewährleistung. Das volle Risiko bezüglich Qualität und Leistungsfähigkeit des Programms liegt bei Ihnen.
