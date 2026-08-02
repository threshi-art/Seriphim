import { useState, useMemo, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import {
  Cloud, Thermometer, Wind, Droplets, Eye, Sun, CloudRain, CloudSnow,
  CloudLightning, CloudFog, Loader2, MapPin, Search, Compass,
} from "lucide-react";

function wmoToCondition(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly Cloudy";
  if (code <= 48) return "Fog";
  if (code <= 57) return "Drizzle";
  if (code <= 65) return "Rain";
  if (code <= 67) return "Heavy Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Rain";
  if (code <= 86) return "Snow";
  if (code <= 99) return "Thunderstorm";
  return "Cloudy";
}

const WEATHER_ICONS: Record<string, any> = {
  "Clear": Sun, "Partly Cloudy": Cloud, "Cloudy": Cloud, "Overcast": CloudFog,
  "Rain": CloudRain, "Heavy Rain": CloudRain, "Snow": CloudSnow,
  "Thunderstorm": CloudLightning, "Fog": CloudFog, "Drizzle": CloudRain,
};

function getWeatherIcon(condition: string) {
  return WEATHER_ICONS[condition] || Cloud;
}

function windDirection(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export default function WeatherPage() {
  const [cityName, setCityName] = useState("Seattle");
  const [searchInput, setSearchInput] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null);

  const geocode = trpc.weather.geocode.useMutation({
    onSuccess: (results: any[]) => {
      if (results.length > 0) {
        setCoords({ lat: results[0].latitude, lon: results[0].longitude });
      }
    },
  });

  // Geocode on initial load and city change
  useEffect(() => {
    geocode.mutate({ city: cityName });
  }, [cityName]);

  const queryInput = useMemo(
    () => coords ? { lat: coords.lat, lon: coords.lon, city: cityName } : null,
    [coords, cityName]
  );

  const { data: rawWeather, isLoading, error } = trpc.weather.current.useQuery(
    queryInput!,
    { enabled: !!coords, staleTime: 10 * 60 * 1000 }
  );

  const handleSearch = () => {
    const trimmed = searchInput.trim();
    if (trimmed) {
      setCityName(trimmed);
      setSearchInput("");
    }
  };

  // Parse the Open-Meteo response
  const weather = useMemo(() => {
    if (!rawWeather?.current) return null;
    const c = rawWeather.current;
    const condition = wmoToCondition(c.weather_code);
    const hourly = rawWeather.hourly ? rawWeather.hourly.time.slice(0, 24).map((t: string, i: number) => ({
      time: new Date(t).toLocaleTimeString("en-US", { hour: "numeric", hour12: true }),
      temp: Math.round(rawWeather.hourly.temperature_2m[i]),
      condition: wmoToCondition(rawWeather.hourly.weather_code[i]),
    })) : [];
    return {
      city: rawWeather.city,
      temperature: Math.round(c.temperature_2m),
      feelsLike: Math.round(c.apparent_temperature),
      condition,
      windSpeed: Math.round(c.wind_speed_10m),
      windDirection: c.wind_direction_10m,
      humidity: c.relative_humidity_2m,
      visibility: 10000,
      pressure: Math.round(c.surface_pressure),
      hourly,
    };
  }, [rawWeather]);

  const Icon = weather ? getWeatherIcon(weather.condition) : Cloud;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <Cloud className="h-5 w-5 text-[oklch(0.70_0.14_175)]" />
            Weather Radar
          </h1>
          <p className="text-xs text-[oklch(0.45_0.02_230)] mt-1">Real-time weather intelligence</p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[oklch(0.35_0.02_230)]" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            placeholder="Enter city name..."
            className="w-full pl-10 pr-4 py-2.5 rounded-lg text-sm bg-[oklch(0.08_0.02_230)] border border-[oklch(0.15_0.02_230)] text-white placeholder:text-[oklch(0.35_0.02_230)] focus:outline-none focus:border-[oklch(0.70_0.14_175_/_0.5)]"
          />
        </div>
        <button
          onClick={handleSearch}
          className="px-4 py-2.5 rounded-lg text-sm font-medium bg-[oklch(0.70_0.14_175_/_0.15)] border border-[oklch(0.70_0.14_175_/_0.3)] text-[oklch(0.70_0.14_175)] hover:bg-[oklch(0.70_0.14_175_/_0.25)] transition-colors"
        >
          <Search className="h-4 w-4" />
        </button>
      </div>

      {/* Quick Cities */}
      <div className="flex flex-wrap gap-1.5">
        {["Seattle", "New York", "London", "Tokyo", "Dubai", "Sydney", "Paris", "Singapore"].map((c) => (
          <button
            key={c}
            onClick={() => { setCityName(c); setSearchInput(""); }}
            className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
              cityName === c
                ? "bg-[oklch(0.70_0.14_175_/_0.2)] text-[oklch(0.70_0.14_175)] border border-[oklch(0.70_0.14_175_/_0.3)]"
                : "bg-[oklch(0.10_0.02_230)] border border-[oklch(0.15_0.02_230)] text-[oklch(0.45_0.02_230)] hover:text-[oklch(0.60_0.02_230)]"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {/* Loading */}
      {(isLoading || geocode.isPending) && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 text-[oklch(0.70_0.14_175)] animate-spin" />
          <span className="ml-3 text-sm text-[oklch(0.45_0.02_230)]">Fetching weather data...</span>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-400">
          {error.message}
        </div>
      )}

      {/* Weather Data */}
      {!isLoading && weather && (
        <>
          {/* Main Weather Card */}
          <div className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-6">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
              <span className="text-sm font-semibold text-white">{weather.city}</span>
            </div>
            <div className="flex items-center gap-8">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-xl bg-[oklch(0.70_0.14_175_/_0.1)] border border-[oklch(0.70_0.14_175_/_0.2)] flex items-center justify-center">
                  <Icon className="h-8 w-8 text-[oklch(0.70_0.14_175)]" />
                </div>
                <div>
                  <div className="text-4xl font-black text-white">{weather.temperature}°F</div>
                  <div className="text-xs text-[oklch(0.50_0.02_230)]">{weather.condition}</div>
                </div>
              </div>
              <div className="text-xs text-[oklch(0.40_0.02_230)]">
                Feels like <span className="text-white font-semibold">{weather.feelsLike}°F</span>
              </div>
            </div>
          </div>

          {/* Metrics Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { icon: Wind, label: "Wind", value: `${weather.windSpeed} mph`, sub: windDirection(weather.windDirection) },
              { icon: Droplets, label: "Humidity", value: `${weather.humidity}%`, sub: weather.humidity > 70 ? "High" : weather.humidity > 40 ? "Moderate" : "Low" },
              { icon: Thermometer, label: "Pressure", value: `${weather.pressure} hPa`, sub: weather.pressure > 1013 ? "High" : "Low" },
              { icon: Compass, label: "Wind Dir", value: `${weather.windDirection}°`, sub: windDirection(weather.windDirection) },
            ].map((m) => (
              <div key={m.label} className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-4">
                <div className="flex items-center gap-2 mb-2">
                  <m.icon className="h-3.5 w-3.5 text-[oklch(0.70_0.14_175)]" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[oklch(0.45_0.02_230)]">{m.label}</span>
                </div>
                <div className="text-lg font-bold text-white">{m.value}</div>
                <div className="text-[10px] text-[oklch(0.35_0.02_230)]">{m.sub}</div>
              </div>
            ))}
          </div>

          {/* Hourly Forecast */}
          {weather.hourly.length > 0 && (
            <div className="rounded-xl border border-[oklch(0.15_0.02_230)] bg-[oklch(0.10_0.02_230_/_0.5)] p-5">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[oklch(0.45_0.02_230)] mb-4">
                24-Hour Forecast
              </p>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {weather.hourly.map((h: any, i: number) => {
                  const HIcon = getWeatherIcon(h.condition);
                  return (
                    <div key={i} className="flex flex-col items-center gap-1.5 min-w-[56px] px-2 py-2 rounded-lg bg-[oklch(0.08_0.02_230)] border border-[oklch(0.12_0.02_230)]">
                      <span className="text-[10px] text-[oklch(0.40_0.02_230)]">{h.time}</span>
                      <HIcon className="h-4 w-4 text-[oklch(0.70_0.14_175)]" />
                      <span className="text-xs font-bold text-white">{h.temp}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
