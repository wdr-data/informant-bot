import { quickReply } from '../lib/facebook';
import { getFaq } from './payloadFaq';


export const handleMenu = async (chat) => {
    // Get FAQ menu
    const menuText = await getFaq(`new_menu`);

    // Add Quickreplybuttons
    const quickReplies = [
        quickReply('📰 Schlagzeilen',
            {
                action: 'newsfeed_curated',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Schlagzeilen',
                },
            }),
        quickReply('✨ Messenger-Funktionen',
            {
                action: 'faq',
                slug: 'list_of_features',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Weitere Funktionen',
                },
            }),
        quickReply('💌 Teilen', {
            action: 'share',
            track: {
                category: 'Menüpunkt',
                event: 'Messenger-Menü',
                label: 'Teilen',
            },
        }),
        quickReply('☕ Morgen-Update',
            {
                action: 'current_news',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Letzter Push',
                },
            }),
        quickReply('💬 Kontakt/Feedback', {
            action: 'contact',
            track: {
                category: 'Menüpunkt',
                event: 'Messenger-Menü',
                label: 'Kontakt/Feedback',
            },
        }),
        quickReply('🔧 An-/Abmelden', {
            action: 'subscriptions',
            track: {
                category: 'Menüpunkt',
                event: 'Messenger-Menü',
                label: 'An-/Abmelden',
            },
        }),
        quickReply('#️⃣ WDR aktuell',
            {
                action: 'faq',
                slug: 'about',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'WDR aktuell im Messenger',
                },
            }),
        quickReply('🛡 Datenschutz (1/2)',
            {
                action: 'faq',
                slug: 'datenschutz',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Datenschutz (Teil 1)',
                },
            }
        ),
        quickReply(
            '📊 Datenschutz (2/2)',
            {
                action: 'analyticsPolicy',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Datenschutz (Teil 2)',
                },
            }
        ),
        quickReply(
            '📇 Impressum',
            {
                action: 'faq',
                slug: 'impressum',
                track: {
                    category: 'Menüpunkt',
                    event: 'Messenger-Menü',
                    label: 'Impressum',
                },
            }
        ),
    ];

    return chat.sendText(menuText.text, quickReplies);
};
