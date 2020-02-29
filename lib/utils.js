export const trackLink = (report, type) => {
    const urlInfo = new URL(report.link);
    if (urlInfo.host === 'www1.wdr.de') {
        const campaignPlatform = 'facebook_messenger';
        const campaignChannel = 'wdr_aktuell';
        const campaignType = type;
        const campaignName = report.headline.replace('.', '');
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
