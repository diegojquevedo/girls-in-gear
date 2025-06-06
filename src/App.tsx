import "./App.css";
import LocationList from "./components/LocationList";
import Header from "./components/Header";
import Map from "./components/Map";
import { useState } from "react";
import type { Location } from "./types/Project";

function App() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [search, setSearch] = useState("");
  const [resetSignal, setResetSignal] = useState(0);

  const filteredLocations = locations.filter((loc) =>
    Object.values(loc).join(" ").toLowerCase().includes(search.toLowerCase())
  );

  const isSearchResult = search.trim() !== "" && filteredLocations.length > 0;

  const handleReset = () => {
    setSearch("");
    setSelectedLocation(null);
    setResetSignal((s) => s + 1);
  };

  return (
    <div className="flex flex-col bg-tertiary size-full gap-8 overflow-hidden p-28 relative mobile:p-0">
      <Header value={search} onChange={setSearch} onReset={handleReset} />
      <div className="flex items-center w-full rounded-t-2xl overflow-hidden h-full min-h-0 mobile:rounded-none ">
        <LocationList
          locations={filteredLocations}
          onSelectLocation={setSelectedLocation}
          isSearchResult={isSearchResult}
          highlightTitle={isSearchResult}
          selectedLocation={selectedLocation}
        />
        <div className="bg-amber-100  h-full w-[62.5%] mobile:w-full">
          <Map
            onLocationsLoaded={setLocations}
            selectedLocation={selectedLocation}
            resetSignal={resetSignal}
          />
          map
        </div>
      </div>
    </div>
  );
}

export default App;
