export default {
    'push': (id) => `${process.env.CMS_API_URL}pushes/${id}/`,
    'pushes': `${process.env.CMS_API_URL}pushes/`,
    'report': (id) => `${process.env.CMS_API_URL}reports/${id}/`,
    'reportFragment': (id) => `${process.env.CMS_API_URL}reports/fragments/${id}/`,
    'reports': `${process.env.CMS_API_URL}reports/`,
    'quizByReport': (id) => `${process.env.CMS_API_URL}quiz/?report=${id}`,
    'faqBySlug': (slug) => `${process.env.CMS_API_URL}faqs/?slug=${slug}&withFragments=1`,
    'fullFaqBySlug': (slug) => `${process.env.CMS_API_URL}faqs/?slug=${slug}&allFragments=1`,
    'faqFragment': (id) => `${process.env.CMS_API_URL}faqs/fragments/${id}/`,
    'tags': (tag) => `${process.env.CMS_API_URL}tags/?name=${tag}`,
    'genres': (genre) => `${process.env.CMS_API_URL}genres/?name=${genre}`,
};
