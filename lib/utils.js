export const regexSlug = (str) => {
    const find = /[^a-zA-Z\u00C0-\u017F -]/gm;
    return str.replace(find, '');
};

export const trackLink = (report, type) => {
    const urlInfo = new URL(report.link);
    if (urlInfo.host === 'www1.wdr.de') {
        const campaignPlatform = 'facebook_messenger';
        const campaignChannel = 'wdr_aktuell';
        const campaignType = type;
        const campaignName = regexSlug(report.headline);
        const campaignId = report.id;
        urlInfo.searchParams.append(
            'wt_mc',
            `${campaignPlatform}.${campaignChannel}.${campaignType}.${campaignName}.${campaignId}`
        );
        return urlInfo.href;
    } else {
        return report.link;
    }
};
