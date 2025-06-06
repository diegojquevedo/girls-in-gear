import React, { useEffect, useRef, useState } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import { logger } from "../utils/logger";
import Popup from "./Popup";
import ReactDOMServer from "react-dom/server";
import type { Location } from "../types/Project";

interface MapProps {
  onLocationsLoaded: (locations: Location[]) => void;
  selectedLocation: Location | null;
  resetSignal?: number;
}

const Map: React.FC<MapProps> = ({ onLocationsLoaded, selectedLocation, resetSignal }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const [mapInstance, setMapInstance] = useState<mapboxgl.Map | null>(null);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [geocodingProgress, setGeocodingProgress] = useState({
    current: 0,
    total: 0,
  });
  const markersRef = useRef<Record<string, mapboxgl.Marker>>({});

  const MAPBOX_TOKEN =
    "pk.eyJ1IjoiZ2lybHNpbmdlYXIiLCJhIjoiY2xwcmF1ajNlMDdiOTJpb2xpcjI5dXF3YiJ9.gAAFitjNaaaHyWJ86qdG9A";

  const parseCSV = (csvText: string): Location[] => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length === 0) {
      throw new Error("Empty CSV");
    }
    const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""));
    const data: Location[] = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim().replace(/"/g, ""));
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || "";
      });
      if (row.City && row.State) {
        data.push(row as unknown as Location);
      }
    }
    return data;
  };

  const geocodeAddress = async (
    address: string,
    city: string,
    state: string
  ): Promise<{ lat: number; lng: number; success: boolean }> => {
    try {
      const fullAddress = `${address}, ${city}, ${state}, USA`;
      const encodedAddress = encodeURIComponent(fullAddress);
      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodedAddress}.json?access_token=${MAPBOX_TOKEN}&country=US&limit=1`;

      const response = await fetch(url);

      if (!response.ok) {
        logger.warn(`HTTP Error ${response.status} for ${fullAddress}`);
        return { lat: 0, lng: 0, success: false };
      }

      const data = await response.json();

      if (data.features && data.features.length) {
        const [lng, lat] = data.features[0].center;
        return { lat, lng, success: true };
      }

      logger.warn(`No results for: ${fullAddress}`);
      return { lat: 0, lng: 0, success: false };
    } catch (error) {
      logger.error(`Error geocoding ${address}:`, error);
      return { lat: 0, lng: 0, success: false };
    }
  };

  const getStateFallback = (state: string): { lat: number; lng: number } => {
    const fallbacks: Record<string, { lat: number; lng: number }> = {
      VA: { lat: 37.4316, lng: -78.6569 },
      NJ: { lat: 40.0583, lng: -74.4057 },
      PA: { lat: 40.2732, lng: -76.8867 },
      NC: { lat: 35.7596, lng: -79.0193 },
      NY: { lat: 40.7128, lng: -74.006 },
      DC: { lat: 38.9072, lng: -77.0369 },
      MD: { lat: 39.0458, lng: -76.6413 },
      NV: { lat: 39.1638, lng: -119.7674 },
      CA: { lat: 36.7783, lng: -119.4179 },
      FL: { lat: 27.7663, lng: -82.6404 },
      TX: { lat: 31.9686, lng: -99.9018 },
      IL: { lat: 40.6331, lng: -89.3985 },
      GA: { lat: 32.1656, lng: -82.9001 },
      OH: { lat: 40.4173, lng: -82.9071 },
      MI: { lat: 44.3148, lng: -85.6024 },
      WA: { lat: 47.7511, lng: -120.7401 },
      OR: { lat: 43.8041, lng: -120.5542 },
      CO: { lat: 39.5501, lng: -105.7821 },
    };

    return (
      fallbacks[state.trim().toUpperCase()] || { lat: 39.8283, lng: -98.5795 }
    );
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        logger.info("Starting data load...");
        setError("");

        let csvText: string;
        try {
          const response = await fetch("/data.csv");
          if (!response.ok) {
            throw new Error(`Could not load data.csv: ${response.status}`);
          }
          csvText = await response.text();
          logger.info("CSV loaded, size:", csvText.length, "characters");
        } catch (fetchError) {
          logger.error("Error loading CSV:", fetchError);
          setError(
            "Could not load data.csv file. Please check it exists in the public folder."
          );
          setLoading(false);
          return;
        }

        let rawData: Location[];
        try {
          rawData = parseCSV(csvText);
          if (rawData.length === 0) {
            throw new Error("No valid data found in CSV");
          }
        } catch (parseError) {
          logger.error("Error parsing CSV:", parseError);
          setError("Error processing CSV file. Please check the format.");
          setLoading(false);
          return;
        }

        const uniqueAddresses = new window.Map();
        rawData.forEach((location) => {
          const key = `${location.Address?.trim()}-${location.City?.trim()}-${location.State?.trim()}`;
          if (!uniqueAddresses.has(key) && location.City && location.State) {
            uniqueAddresses.set(key, {
              address: location.Address || "",
              address2: location["Address 2"] || "",
              city: location.City,
              state: location.State,
              region: location.Region || "",
              originalData: [] as Location[],
            });
          }
          if (uniqueAddresses.has(key)) {
            uniqueAddresses.get(key).originalData.push(location);
          }
        });

        const uniqueLocationsArray = Array.from(uniqueAddresses.values());
        logger.info(
          "Unique locations to geocode:",
          uniqueLocationsArray.length
        );

        setGeocodingProgress({
          current: 0,
          total: uniqueLocationsArray.length,
        });

        const geocodedResults: Location[] = [];
        const BATCH_SIZE = 8;
        const BATCH_DELAY = 800;

        for (let i = 0; i < uniqueLocationsArray.length; i += BATCH_SIZE) {
          const batch = uniqueLocationsArray.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (location, batchIndex) => {
            const globalIndex = i + batchIndex;
            let fullAddress = location.address;
            if (location.address2) {
              fullAddress += `, ${location.address2}`;
            }

            const geocodeResult = await geocodeAddress(
              fullAddress,
              location.city,
              location.state
            );

            return {
              location,
              geocodeResult,
              globalIndex,
            };
          });

          const batchResults = await Promise.all(batchPromises);

          batchResults.forEach(({ location, geocodeResult }) => {
            let finalLat, finalLng, isGeocoded;

            if (geocodeResult.success) {
              finalLat = geocodeResult.lat;
              finalLng = geocodeResult.lng;
              isGeocoded = true;
            } else {
              const fallback = getStateFallback(location.state);
              finalLat = fallback.lat + (Math.random() - 0.5) * 0.05;
              finalLng = fallback.lng + (Math.random() - 0.5) * 0.05;
              isGeocoded = false;
              logger.warn(
                `Using fallback for: ${location.address}, ${location.city}, ${location.state}`
              );
            }

            location.originalData.forEach((originalRecord: Location) => {
              geocodedResults.push({
                ...originalRecord,
                lat: finalLat,
                lng: finalLng,
                geocoded: isGeocoded,
              });
            });
          });

          const processedCount = Math.min(
            i + BATCH_SIZE,
            uniqueLocationsArray.length
          );
          setGeocodingProgress({
            current: processedCount,
            total: uniqueLocationsArray.length,
          });

          if (i + BATCH_SIZE < uniqueLocationsArray.length) {
            await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY));
          }
        }

        setLocations(geocodedResults);
        onLocationsLoaded(geocodedResults);
      } catch (error) {
        logger.error("General error:", error);
        setError(
          `Error: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [onLocationsLoaded]);

  useEffect(() => {
    if (locations.length === 0 || !mapContainer.current || mapInstance) return;

    logger.info("Initializing map with", locations.length, "locations");

    import("mapbox-gl")
      .then((mapbox) => {
        const mapboxgl = mapbox.default;
        mapboxgl.accessToken = MAPBOX_TOKEN;

        const map = new mapboxgl.Map({
          container: mapContainer.current!,
          style: "mapbox://styles/mapbox/streets-v12",
          center: [-76, 39],
          zoom: 6,
        });
        map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');

        setMapInstance(map);

        map.on("load", () => {
          logger.info("Map loaded, adding markers...");

          const locationGroups = new window.Map();
          locations.forEach((location) => {
            const key = `${location.lat.toFixed(3)}-${location.lng.toFixed(3)}`;
            if (!locationGroups.has(key)) {
              locationGroups.set(key, []);
            }
            locationGroups.get(key).push(location);
          });

          logger.info("Location groups:", locationGroups.size);

          locationGroups.forEach((groupedLocations) => {
            const primaryLocation = groupedLocations[0];

            const markerElement = document.createElement("div");
            markerElement.style.cssText = `
              width: 35px;
              height: 35px;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
            `;

            markerElement.innerHTML = `
              <svg width="40" height="54" viewBox="0 0 40 54" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M40 20C40 25.9735 33.2291 35 33.2291 35L20.8171 52.5919C20.4187 53.1566 19.5813 53.1566 19.1829 52.5919L6.77088 35C6.77088 35 0 25.9735 0 20C0 8.9543 8.9543 0 20 0C31.0457 0 40 8.9543 40 20Z" fill="#1FC0DD"/>
              <path d="M11.25 28.75C9.47917 28.75 7.99479 28.151 6.79688 26.9531C5.59896 25.7552 5 24.2708 5 22.5C5 20.7292 5.60938 19.2448 6.82812 18.0469C8.04688 16.849 9.52083 16.25 11.25 16.25C12.8542 16.25 14.2031 16.7292 15.2969 17.6875C16.3906 18.6458 17.0833 19.8333 17.375 21.25H18.1875L15.9375 15H13.75V12.5H20V15H18.625L19.0625 16.25H25.0625L23.25 11.25H20V8.75H23.25C23.7917 8.75 24.276 8.89583 24.7031 9.1875C25.1302 9.47917 25.4375 9.875 25.625 10.375L27.75 16.1875H28.75C30.4792 16.1875 31.9531 16.7969 33.1719 18.0156C34.3906 19.2344 35 20.7083 35 22.4375C35 24.1875 34.3958 25.6771 33.1875 26.9062C31.9792 28.1354 30.5 28.75 28.75 28.75C27.25 28.75 25.9323 28.2812 24.7969 27.3438C23.6615 26.4062 22.9375 25.2083 22.625 23.75H17.375C17.0833 25.1875 16.375 26.3802 15.25 27.3281C14.125 28.276 12.7917 28.75 11.25 28.75ZM11.25 26.25C12.1042 26.25 12.8385 26.0156 13.4531 25.5469C14.0677 25.0781 14.5 24.4792 14.75 23.75H11.25V21.25H14.75C14.5 20.5 14.0677 19.8958 13.4531 19.4375C12.8385 18.9792 12.1042 18.75 11.25 18.75C10.1875 18.75 9.29688 19.1094 8.57812 19.8281C7.85938 20.5469 7.5 21.4375 7.5 22.5C7.5 23.5417 7.85938 24.4271 8.57812 25.1562C9.29688 25.8854 10.1875 26.25 11.25 26.25ZM20.875 21.25H22.625C22.7292 20.7708 22.8698 20.3229 23.0469 19.9062C23.224 19.4896 23.4583 19.1042 23.75 18.75H19.9375L20.875 21.25ZM28.75 26.25C29.8125 26.25 30.7031 25.8854 31.4219 25.1562C32.1406 24.4271 32.5 23.5417 32.5 22.5C32.5 21.4375 32.1406 20.5469 31.4219 19.8281C30.7031 19.1094 29.8125 18.75 28.75 18.75H28.625L29.875 22.0625L27.5 22.9375L26.3125 19.625C25.8958 19.9792 25.5729 20.3958 25.3438 20.875C25.1146 21.3542 25 21.8958 25 22.5C25 23.5417 25.3594 24.4271 26.0781 25.1562C26.7969 25.8854 27.6875 26.25 28.75 26.25Z" fill="white"/>
              </svg>
            `;

            const popupContent = `
              <div id="popup-${primaryLocation.ID}" class="popup-container">
                <div class="popup-content">
                  ${ReactDOMServer.renderToString(
                    <Popup
                      locationName={`Girls on the Run ${primaryLocation.Region}`}
                      locationAddress={`${primaryLocation.Address}, ${primaryLocation.City}, ${primaryLocation.State}`}
                      phone="(907) 306-0789"
                      website="www.gotrsouthcentralak.org"
                      onClose={() => {}}
                    />
                  )}
                </div>
              </div>
            `;

            const marker = new mapboxgl.Marker(markerElement)
              .setLngLat([primaryLocation.lng, primaryLocation.lat])
              .setPopup(
                new mapboxgl.Popup({
                  offset: 25,
                  className: "custom-popup",
                }).setHTML(popupContent)
              )
              .addTo(map);

            const popup = marker.getPopup();
            if (popup) {
              popup.on("open", () => {
                setTimeout(() => {
                  const directionsButton = document.querySelector(
                    `#popup-${primaryLocation.ID} button:last-child`
                  );
                  if (directionsButton) {
                    directionsButton.addEventListener("click", () => {
                      window.open(
                        `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
                          primaryLocation.Address +
                            ", " +
                            primaryLocation.City +
                            ", " +
                            primaryLocation.State
                        )}`,
                        "_blank"
                      );
                    });
                  }
                }, 0);
              });
            }

            groupedLocations.forEach((loc: Location) => {
              markersRef.current[loc.ID] = marker;
            });
          });

          logger.info("Markers added to map");

          if (locations.length) {
            const bounds = new mapboxgl.LngLatBounds();
            locations.forEach((location) => {
              bounds.extend([location.lng, location.lat]);
            });
            map.fitBounds(bounds, { padding: 50 });
          }
        });

        map.on("error", (e) => {
          logger.error("Map error:", e);
          setError("Error loading map");
        });
      })
      .catch((error) => {
        logger.error("Error loading Mapbox:", error);
        setError("Error loading map library");
      });
  }, [locations, mapInstance]);

  useEffect(() => {
    if (
      selectedLocation &&
      mapInstance &&
      markersRef.current[selectedLocation.ID]
    ) {
      (Object.values(markersRef.current) as mapboxgl.Marker[]).forEach((marker) => {
        const popup = marker.getPopup();
        if (popup && popup.isOpen()) {
          popup.remove();
        }
      });

      const onMoveEnd = () => {
        if (markersRef.current[selectedLocation.ID]) {
          markersRef.current[selectedLocation.ID].togglePopup();
        }
        mapInstance.off("moveend", onMoveEnd);
      };

      mapInstance.flyTo({
        center: [selectedLocation.lng, selectedLocation.lat],
        zoom: 13,
        essential: true,
        speed: 3,
      });

      mapInstance.on("moveend", onMoveEnd);

      return () => {
        mapInstance.off("moveend", onMoveEnd);
      };
    }
  }, [selectedLocation, mapInstance]);

  useEffect(() => {
    if (resetSignal && mapInstance) {
      mapInstance.flyTo({
        center: [-98.5795, 39.8283],
        zoom: 4,
        essential: true,
        speed: 2
      });
      (Object.values(markersRef.current) as mapboxgl.Marker[]).forEach((marker) => {
        const popup = marker.getPopup();
        if (popup && popup.isOpen()) {
          popup.remove();
        }
      });
    }
  }, [resetSignal, mapInstance]);

  if (error) {
    return (
      <div className="error-container">
        <div className="error-content">
          <div className="error-icon">⚠️</div>
          <h3 className="error-title">Error al cargar el mapa</h3>
          <p className="error-text">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="retry-button"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <div className="loading-spinner"></div>
          <h3 className="loading-title">Loading Girls in Gear Map</h3>
          <p className="loading-text">
            {geocodingProgress.total
              ? `Processing ${geocodingProgress.total} locations`
              : "Loading points..."}
          </p>
          {geocodingProgress.total && (
            <div className="progress-container">
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{
                    width: `${
                      (geocodingProgress.current / geocodingProgress.total) *
                      100
                    }%`,
                  }}
                ></div>
              </div>
              <p className="progress-text">
                {geocodingProgress.current} de {geocodingProgress.total}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="map-container">
      <div ref={mapContainer} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Map;
