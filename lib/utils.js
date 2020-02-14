export const trackLink = (report, push = undefined) => {
    const urlInfo = new URL(report.link);
    if (urlInfo.host === 'www1.wdr.de') {
        const campaignPlatform = 'facebook_messenger';
        const campaignChannel = 'wdr_aktuell';
        const campaignType = push ? `${push.timing}-push` : 'breaking-push';
        const campaignName = `${report.headline}-${report.id}`;
        urlInfo.searchParams.append(
            'wt_mc', `${campaignPlatform}.${campaignChannel}.${campaignType}.${campaignName}`
        );
        return urlInfo.href;
    } else {
        return report.link;
    }
};
