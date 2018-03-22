module.exports = {
    'push': (id) => `pushes/${id}/`,
    'pushes': `pushes/`,
    'report': (id) => `reports/${id}/`,
    'reportFragment': (id) => `reports/fragments/${id}/`,
    'faqBySlug': (slug) => `faqs/?slug=${slug}&withFragments=1`,
    'faqFragment': (id) => `faqs/fragments/${id}/`,
};
