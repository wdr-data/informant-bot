#!/bin/bash

if [ ! $FB_PAGETOKEN ]
then
    echo "Please set 'FB_PAGETOKEN' environment variable"
    exit 1
fi

echo "Setting 'Get Sarted' button..."
curl -X POST -H "Content-Type: application/json" -d '{ "get_started":{"payload":"{\"action\":\"faq\", \"slug\":\"onboarding\"}"}}' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=$FB_PAGETOKEN"
echo ""
echo ""
echo "Setting menu..."
curl -X POST -H "Content-Type: application/json" -d '{"persistent_menu":[{"locale":"default","call_to_actions":[{"title":"An-/Abmelden","type":"postback","payload":"{\"action\":\"subscriptions\"}"}, {"title":"Über den Informanten","type":"nested","call_to_actions":[{"title":"Informant?","type":"postback","payload":"{\"action\": \"faq\", \"slug\": \"about\"}"}, {"title":"Wie funktioniert das hier?","type":"postback","payload":"{\"action\":\"faq\", \"slug\": \"how_to\"}"}, {"title":"Datenschutz","type":"postback","payload":"{\"action\":\"faq\", \"slug\": \"datenschutz\"}"}, {"title":"Impressum","type":"postback","payload":"{\"action\":\"faq\", \"slug\": \"impressum\"}"},]}, {"title":"Teilen","type":"postback","payload":"{\"action\":\"share\"}"}]}]}' "https://graph.facebook.com/v2.6/me/messenger_profile?access_token=$FB_PAGETOKEN"
