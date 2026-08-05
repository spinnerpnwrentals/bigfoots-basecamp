const AIRNOW_ENDPOINT = "https://www.airnowapi.org/aq/observation/zipCode/current/";
const ZIP_CODE = "98068";
const LOCATION = "Snoqualmie Pass, WA";
const DISTANCE_MILES = "25";

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

exports.handler = async (event = {}) => {
  if (event.httpMethod && event.httpMethod !== "GET") {
    return response(405, { error: "Method not allowed." }, "no-store");
  }

  const apiKey = process.env.AIRNOW_API_KEY;
  if (!apiKey) {
    return response(503, { error: "AQI service is not configured." }, "no-store");
  }

  const url = new URL(AIRNOW_ENDPOINT);
  url.searchParams.set("format", "application/json");
  url.searchParams.set("zipCode", ZIP_CODE);
  url.searchParams.set("distance", DISTANCE_MILES);
  url.searchParams.set("API_KEY", apiKey);

  try {
    const airNowResponse = await fetch(url, {
      headers: { "Accept": "application/json" }
    });

    if (!airNowResponse.ok) {
      console.warn(`AirNow request returned status ${airNowResponse.status}.`);
      return response(502, {
        zipCode: ZIP_CODE,
        location: LOCATION,
        available: false,
        message: "Current AQI is temporarily unavailable."
      }, "public, s-maxage=300");
    }

    const observations = await airNowResponse.json();
    const validObservations = Array.isArray(observations)
      ? observations
        .map((item) => ({ item, aqi: item ? numericAqi(item.AQI) : null }))
        .filter((observation) => observation.aqi !== null)
      : [];

    if (!validObservations.length) {
      return response(200, {
        zipCode: ZIP_CODE,
        location: LOCATION,
        available: false,
        message: "Current AQI is temporarily unavailable."
      }, "public, s-maxage=300");
    }

    const current = validObservations.reduce((highest, observation) => (
      observation.aqi > highest.aqi ? observation : highest
    ));

    return response(200, {
      zipCode: ZIP_CODE,
      location: LOCATION,
      available: true,
      aqi: current.aqi,
      category: categoryName(current.item.Category),
      pollutant: typeof current.item.ParameterName === "string" ? current.item.ParameterName : null,
      reportingArea: typeof current.item.ReportingArea === "string" ? current.item.ReportingArea : null,
      observedAt: observedAt(current.item),
      source: "AirNow"
    }, "public, s-maxage=3600, stale-while-revalidate=1800");
  } catch (error) {
    console.warn("AirNow request failed without returning data.");
    return response(502, {
      zipCode: ZIP_CODE,
      location: LOCATION,
      available: false,
      message: "Current AQI is temporarily unavailable."
    }, "public, s-maxage=300");
  }
};
