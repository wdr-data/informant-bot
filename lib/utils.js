export const regexSlug = (str) => {
    const find = /[^a-zA-Z\u00C0-\u017F -]/gm;
    return str.replace(find, '');
};

export const trackLink = (link, params) => {
    const {
        campaignType,
        campaignName,
        campaignId,
    } = params;
    const urlInfo = new URL(link);
    if (urlInfo.host === 'www1.wdr.de') {
        const campaignPlatform = 'facebook_messenger';
        const campaignChannel = 'wdr_aktuell';
        urlInfo.searchParams.append(
            'wt_mc',
            `${
                campaignPlatform
            }.${
                campaignChannel
            }.${
                campaignType
            }.${
                campaignName
            }.nr_${campaignId}`
        );
        return urlInfo.href;
    } else {
        return link;
    }
};

export const sleep = (ms) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
};


export const capitalizeWord = (input) =>
    input.charAt(0).toUpperCase() + input.slice(1);
