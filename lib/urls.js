module.exports = {
    'push': id => `${process.env.CMS_API_URL}pushes/${id}/`,
    'report': id => `${process.env.CMS_API_URL}reports/${id}/`,
    'reportFragment': id => `${process.env.CMS_API_URL}reports/fragments/${id}/`,
};
