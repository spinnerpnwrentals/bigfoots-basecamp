const AIRNOW_ZIP_ENDPOINT = "https://www.airnowapi.org/aq/observation/zipCode/current/";
const AIRNOW_COORDINATE_ENDPOINT = "https://www.airnowapi.org/aq/observation/latLong/current/";
const ZIP_CODE = "98068";
const LOCATION = "Snoqualmie Pass, WA";
const ZIP_DISTANCE_MILES = "25";
const LATITUDE = "47.3955";
const LONGITUDE = "-121.4018";
const COORDINATE_DISTANCE_MILES = "50";

const response = (statusCode, body, cacheControl) => ({
  statusCode,
  headers: {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": cacheControl
  },
  body: JSON.stringify(body)
});

const categoryName = (category) => {
  if (typeof category === "string") return category;
  if (category && typeof category.Name === "string") return category.Name;
  return null;
};

const numericAqi = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const observedAt = (observation) => {
  if (typeof observation.DateObserved !== "string") return null;
  if (!Number.isFinite(Number(observation.HourObserved))) return observation.DateObserved;

  const hour = String(Number(observation.HourObserved)).padStart(2, "0");
  const timeZone = typeof observation.LocalTimeZone === "string"
    ? ` ${observation.LocalTimeZone}`
    : "";
  return `${observation.DateObserved} ${hour}:00${timeZone}`;
};

const validObservations = (observations) => (
  Array.isArray(observations)
    ? observations
      .map((item) => ({ item, aqi: item ? numericAqi(item.AQI) : null }))
      .filter((observation) => observation.aqi !== null)
    : []
);

const buildUrl = (endpoint, parameters, apiKey) => {
  const url = new URL(endpoint);
  url.searchParams.set("format", "application/json");
  Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));
  url.searchParams.set("API_KEY", apiKey);
  return url;
};

const requestObservations = async (lookupMethod, url) => {
  try {
    const airNowResponse = await fetch(url, {
      headers: { "Accept": "application/json" }
    });
    console.info(`[AQI] ${lookupMethod} response status: ${airNowResponse.status}`);

    if (!airNowResponse.ok) {
      return { valid: [] };
    }

    const observations = await airNowResponse.json();
    const valid = validObservations(observations);
    const recordCount = Array.isArray(observations) ? observations.length : 0;
    console.info(`[AQI] ${lookupMethod} records: ${recordCount}; valid AQI records: ${valid.length}`);
    return { valid };
  } catch (error) {
    console.warn(`[AQI] ${lookupMethod} request or response parsing failed.`);
    return { valid: [] };
  }
};

const unavailableBody = () => ({
  zipCode: ZIP_CODE,
  location: LOCATION,
  available: false,
  reason: "no-observations",
  message: "Current AQI is temporarily unavailable."
});

exports.handler = async (event = {}) => {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return response(405, { error: "Method not allowed." }, "no-store");
  }

  const apiKey = process.env.AIRNOW_API_KEY;
  console.info(`[AQI] API key configured: ${Boolean(apiKey)}`);
  if (!apiKey) {
    return response(503, { error: "AQI service is not configured." }, "no-store");
  }

  console.info(`[AQI] Starting ZIP lookup for ${ZIP_CODE} within ${ZIP_DISTANCE_MILES} miles.`);
  const zipUrl = buildUrl(AIRNOW_ZIP_ENDPOINT, {
    zipCode: ZIP_CODE,
    distance: ZIP_DISTANCE_MILES
  }, apiKey);
  const zipResult = await requestObservations("ZIP", zipUrl);

  let lookupMethod = "zip";
  let valid = zipResult.valid;

  if (!valid.length) {
    lookupMethod = "coordinates";
    console.info(
      `[AQI] ZIP lookup had no valid AQI; trying coordinates ${LATITUDE}, ${LONGITUDE} `
      + `within ${COORDINATE_DISTANCE_MILES} miles.`
    );
    const coordinateUrl = buildUrl(AIRNOW_COORDINATE_ENDPOINT, {
      latitude: LATITUDE,
      longitude: LONGITUDE,
      distance: COORDINATE_DISTANCE_MILES
    }, apiKey);
    const coordinateResult = await requestObservations("coordinate", coordinateUrl);
    valid = coordinateResult.valid;
  }

  if (!valid.length) {
    console.info("[AQI] No valid observations found after ZIP and coordinate lookups.");
    return response(200, unavailableBody(), "public, s-maxage=300");
  }

  const current = valid.reduce((highest, observation) => (
    observation.aqi > highest.aqi ? observation : highest
  ));
  console.info(`[AQI] Returning AQI ${current.aqi} from ${lookupMethod} lookup.`);

  return response(200, {
    zipCode: ZIP_CODE,
    location: LOCATION,
    available: true,
    aqi: current.aqi,
    category: categoryName(current.item.Category),
    pollutant: typeof current.item.ParameterName === "string" ? current.item.ParameterName : null,
    reportingArea: typeof current.item.ReportingArea === "string" ? current.item.ReportingArea : null,
    observedAt: observedAt(current.item),
    source: "AirNow",
    lookupMethod
  }, "public, s-maxage=3600, stale-while-revalidate=1800");
};
