// Magnetic declination from the World Magnetic Model (WMM2025, NOAA/BGS, public domain).
// The iPhone compass reports magnetic north; the sky must be aligned to true north.
// Coefficients via the geomagnetism npm package (Apache-2.0). Index: n(n+1)/2 + m, n = 1..12.
window.LS = window.LS || {};

LS.Magnetic = (function () {
  const WMM2025 = {
    epoch: 2025, g: [0,-29351.8,-1410.8,-2556.6,2951.1,1649.3,1361,-2404.1,1243.8,453.6,895,799.5,55.7,-281.1,12.1,-233.2,368.9,187.2,-138.7,-142,20.9,64.4,63.8,76.9,-115.7,-40.9,14.9,-60.7,79.5,-77,-8.8,59.3,15.8,2.5,-11.1,14.2,23.2,10.8,-17.5,2,-21.7,16.9,15,-16.8,0.9,4.6,7.8,3,-0.2,-2.5,-13.1,2.4,8.6,-8.7,-12.9,-1.3,-6.4,0.2,2,-1,-0.6,-0.9,1.5,0.9,-2.7,-3.9,2.9,-1.5,-2.5,2.4,-0.6,-0.1,-0.6,-0.1,1.1,-1,-0.2,2.6,-2,-0.2,0.3,1.2,-1.3,0.6,0.6,0.5,-0.1,-0.4,-0.2,-1.3,-0.7],
    h: [0,0,4545.4,0,-3133.6,-815.1,0,-56.6,237.5,-549.5,0,278.6,-133.9,212,-375.6,0,45.4,220.2,-122.9,43,106.1,0,-18.4,16.8,48.8,-59.8,10.9,72.7,0,-48.9,-14.4,-1,23.4,-7.4,-25.1,-2.3,0,7.1,-12.6,11.4,-9.7,12.7,0.7,-5.2,3.9,0,-24.8,12.2,8.3,-3.3,-5.2,7.2,-0.6,0.8,10,0,3.3,0,2.4,5.3,-9.1,0.4,-4.2,-3.8,0.9,-9.1,0,0,2.9,-0.6,0.2,0.5,-0.3,-1.2,-1.7,-2.9,-1.8,-2.3,0,-1.3,0.7,1,-1.4,0,0.6,-0.1,0.8,0.1,-1,0.1,0.2],
    gd: [0,12,9.7,-11.6,-5.2,-8,-1.3,-4.2,0.4,-15.6,-1.6,-2.4,-6,5.6,-7,0.6,1.4,0,0.6,2.2,0.9,-0.2,-0.4,0.9,1.2,-0.9,0.3,0.9,0,-0.1,-0.1,0.5,-0.1,-0.8,-0.8,0.8,-0.1,0.2,0,0.5,-0.1,0.3,0.2,0,0.2,0,-0.1,0.1,0.3,-0.3,0,0.3,-0.1,0.1,-0.1,0.1,0,0.1,0.1,0,-0.3,0,-0.1,-0.1,0,0,0,0,0,0,0,-0.1,0,0,-0.1,-0.1,-0.1,-0.1,0,0,0,0,0,0,0.1,0,0,0,-0.1,0,-0.1],
    hd: [0,0,-21.5,0,-27.7,-12.1,0,4,-0.3,-4.1,0,-1.1,4.1,1.6,-4.4,0,-0.5,2.2,0.4,1.7,1.9,0,0.3,-1.6,-0.4,0.9,0.7,0.9,0,0.6,0.5,-0.8,0,-1,0.6,-0.2,0,-0.2,0.5,-0.4,0.4,-0.5,-0.6,0.3,0.2,0,-0.3,0.3,-0.3,0.3,0.2,-0.1,-0.2,0.4,0.1,0,0,0,-0.2,0.1,-0.1,0.1,0,-0.1,0.2,0,0,0,0.1,0,0.1,0,0,0.1,0,0,0,0,0,0,0,-0.1,0.1,0,0,0,0,0,0,0,-0.1],
  };
  const N = 12, D2R = Math.PI / 180;

  // Declination (degrees, east positive) at geodetic lat/lon (degrees), height (km), decimal year.
  function declination(lat, lon, year, heightKm = 0, model = WMM2025) {
    const dt = year - model.epoch;
    // Geodetic -> geocentric spherical (WGS84).
    const A = 6378.137, F = 1 / 298.257223563, E2 = F * (2 - F), REF = 6371.2;
    const phi = lat * D2R, sp = Math.sin(phi), cp = Math.cos(phi);
    const rc = A / Math.sqrt(1 - E2 * sp * sp);
    const px = (rc + heightKm) * cp, pz = (rc * (1 - E2) + heightKm) * sp;
    const r = Math.hypot(px, pz), phig = Math.asin(pz / r);
    const x = Math.sin(phig), z = Math.cos(phig);
    // Schmidt semi-normalised associated Legendre functions and their derivatives.
    const NT = (N + 1) * (N + 2) / 2;
    const P = new Float64Array(NT), dP = new Float64Array(NT), S = new Float64Array(NT);
    P[0] = 1;
    for (let n = 1; n <= N; n++) {
      for (let m = 0; m <= n; m++) {
        const i = n * (n + 1) / 2 + m;
        if (n === m) {
          const i0 = (n - 1) * n / 2 + m - 1;
          P[i] = z * P[i0]; dP[i] = z * dP[i0] + x * P[i0];
        } else if (n === 1 && m === 0) {
          P[i] = x * P[0]; dP[i] = x * dP[0] - z * P[0];
        } else {
          const i1 = (n - 1) * n / 2 + m;
          if (m > n - 2) { P[i] = x * P[i1]; dP[i] = x * dP[i1] - z * P[i1]; }
          else {
            const i0 = (n - 2) * (n - 1) / 2 + m, k = ((n - 1) * (n - 1) - m * m) / ((2 * n - 1) * (2 * n - 3));
            P[i] = x * P[i1] - k * P[i0]; dP[i] = x * dP[i1] - z * P[i1] - k * dP[i0];
          }
        }
      }
    }
    S[0] = 1;
    for (let n = 1; n <= N; n++) {
      const i = n * (n + 1) / 2;
      S[i] = S[(n - 1) * n / 2] * (2 * n - 1) / n;
      for (let m = 1; m <= n; m++) S[i + m] = S[i + m - 1] * Math.sqrt((n - m + 1) * (m === 1 ? 2 : 1) / (n + m));
    }
    // Field summation in geocentric coordinates.
    let bx = 0, by = 0, bz = 0;
    const lam = lon * D2R;
    for (let n = 1; n <= N; n++) {
      const rr = Math.pow(REF / r, n + 2);
      for (let m = 0; m <= n; m++) {
        const i = n * (n + 1) / 2 + m;
        const g = model.g[i] + dt * model.gd[i], h = model.h[i] + dt * model.hd[i];
        const cm = Math.cos(m * lam), sm = Math.sin(m * lam), p = P[i] * S[i], dp = -dP[i] * S[i];
        bz -= rr * (g * cm + h * sm) * (n + 1) * p;
        by += rr * (g * sm - h * cm) * m * p;
        bx -= rr * (g * cm + h * sm) * dp;
      }
    }
    by = Math.abs(z) > 1e-10 ? by / z : by;
    // Rotate from geocentric to geodetic north.
    const psi = phig - phi;
    const bxg = bx * Math.cos(psi) - bz * Math.sin(psi);
    return Math.atan2(by, bxg) / D2R;
  }

  function decimalYear(date) {
    const y = date.getUTCFullYear();
    return y + (date - Date.UTC(y, 0, 1)) / (Date.UTC(y + 1, 0, 1) - Date.UTC(y, 0, 1));
  }

  return { declination, decimalYear, WMM2025 };
})();
