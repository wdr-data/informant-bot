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

export const byZipCodes = Object.fromEntries(
    zipRaw.map(
        (entry) => [ entry.zipCode, entry ],
    ),
);
