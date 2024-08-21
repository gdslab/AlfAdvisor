import { LatLon } from 'geodesy/mgrs';

export default function getMgrsTiles(latitude, longitude) {
    const latLongP = new LatLon(latitude, longitude);
    const utmCoord = latLongP.toUtm();
    const mgrsGRef = utmCoord.toMgrs();
    const mgrsStr = mgrsGRef.toString();
    console.log("tileID are:", mgrsGRef);
    const baseTileID = mgrsStr.replace(" ", "").substring(0, 5);
    const tileIDs = [baseTileID]; // Start with the base tile

    // Define offsets to get adjacent tiles
    const offsets = [
        { latOffset: 1, lonOffset: 0 },
        { latOffset: -1, lonOffset: 0 },
        { latOffset: 0, lonOffset: 1 },
        { latOffset: 0, lonOffset: -1 },
        { latOffset: 1, lonOffset: 1 },
        { latOffset: 1, lonOffset: -1 },
        { latOffset: -1, lonOffset: 1 },
        { latOffset: -1, lonOffset: -1 }
    ];

    for (const offset of offsets) {
        const lat = latLongP.destinationPoint(offset.latOffset * 1000, 0).lat; // 1000 meters offset
        const lon = latLongP.destinationPoint(offset.lonOffset * 1000, 90).lon; // 1000 meters offset
        const utmCoord = new LatLon(lat, lon).toUtm();
        const mgrs = utmCoord.toMgrs();
        const mgrsStr = mgrs.toString();
        const tileID = mgrsStr.replace(" ", "").substring(0, 5);
        if (!tileIDs.includes(tileID)) {
            tileIDs.push(tileID);
        }
    }

    return tileIDs;
}

