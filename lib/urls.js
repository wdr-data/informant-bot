export default {
    'push': (id) => `${process.env.CMS_API_URL}pushes/${id}/`,
    'pushes': `${process.env.CMS_API_URL}pushes/`,
    'report': (id) => `${process.env.CMS_API_URL}reports/${id}/`,
    'reportFragment': (id) => `${process.env.CMS_API_URL}reports/fragments/${id}/`,
    'reports': `${process.env.CMS_API_URL}reports/?withFragments=1`,
    'faqBySlug': (slug) => `${process.env.CMS_API_URL}faqs/?slug=${slug}&withFragments=1`,
    'faqFragment': (id) => `${process.env.CMS_API_URL}faqs/fragments/${id}/`,
    'tags': (tag) => `${process.env.CMS_API_URL}tags/?name=${tag}`,
    'topics': (topic) => `${process.env.CMS_API_URL}topics/?name=${topic}`,
    'genres': (genre) => `${process.env.CMS_API_URL}genres/?name=${genre}`,
};
