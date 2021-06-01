import cityRaw from './cityToStudioRaw';
import linkRaw from './studioLinksRaw';
import zipRaw from './zipRaw';

export const byStudios = Object.fromEntries(
    linkRaw.map(
        (entry) => [ entry.studio, entry ],
    ),
);

export const byCities = Object.fromEntries(
    cityRaw.map(
        (entry) => [ entry.city, entry ],
    ),
);

export const byAGS = Object.fromEntries(
    cityRaw.map(
        (entry) => [ entry.keyCity, entry ],
    ),
);

export const byZipCodes = Object.fromEntries(
    zipRaw.map(
        (entry) => [ entry.zipCode, entry ],
    ),
);

// We want a ZIP code for weather API because it's probably the most reliable
// Note that we only get one ZIP per location
export const zipForCity = Object.fromEntries(
    zipRaw.map(
        (entry) => [ entry.city, entry.zipCode ],
    ),
);
