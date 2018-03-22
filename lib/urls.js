module.exports = {
    'push': (id) => `${process.env.CMS_API_URL}pushes/${id}/`,
    'pushes': `${process.env.CMS_API_URL}pushes/`,
    'report': (id) => `${process.env.CMS_API_URL}reports/${id}/`,
    'reportFragment': (id) => `${process.env.CMS_API_URL}reports/fragments/${id}/`,
    'faqBySlug': (slug) => `${process.env.CMS_API_URL}faqs/?slug=${slug}&withFragments=1`,
    'faqFragment': (id) => `${process.env.CMS_API_URL}faqs/fragments/${id}/`,
};
