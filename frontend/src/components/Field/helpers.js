export const getLayerMinMax = (layerName, dataObj) => {
  if (!layerName || !dataObj) return null;

  const day0 =
    Array.isArray(dataObj)         
      ? dataObj[1]
      : dataObj[1] ?? dataObj['1'];  

  if (!day0 || !day0[layerName]) return null;

  const entry = day0[layerName];

  if (entry && typeof entry === 'object' && 'min' in entry && 'max' in entry) {
    return [Number(entry.min), Number(entry.max)];
  }

  const flat = (Array.isArray(entry) ? entry : Object.values(entry))
                .map(Number)
                .filter(v => !Number.isNaN(v));

  return flat.length ? [Math.min(...flat), Math.max(...flat)] : null;
};
