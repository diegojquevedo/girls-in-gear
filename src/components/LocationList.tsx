import LocationItem from "./LocationItem";
import { useEffect, useRef, useState } from "react";
import { twMerge } from "tailwind-merge";
import { useIsMobile } from "../hooks/useMobile";
import type { LocationListProps } from "../types/Project.d";

function LocationList({
  locations,
  onSelectLocation,
  isSearchResult,
  highlightTitle,
  selectedLocation,
}: LocationListProps) {
  const headerRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const [maxHeight, setMaxHeight] = useState<string>("auto");

  useEffect(() => {
    if (!isMobile) {
      console.log("not mobile");
      setMaxHeight("max-content");
      return;
    }

    if (isOpen) {
      setMaxHeight(
        `calc(100dvh - 70px - ${headerRef.current?.clientHeight ?? 0}px)`
      );
    } else {
      setMaxHeight("0px");
    }
  }, [isMobile, isOpen]);

  return (
    <aside
      role="button"
      tabIndex={0}
      onClick={() => {
        if (isMobile) {
          setIsOpen(!isOpen);
        }
      }}
      className={twMerge(
        "bg-white w-[37.5%] flex flex-col h-full z-10",
        "mobile:absolute mobile:w-full mobile:rounded-t-2xl mobile:bottom-0 mobile:h-fit"
      )}
    >
      <header
        className="flex flex-col gap-2 py-6 px-5 border-b border-quaternary"
        ref={headerRef}
      >
        <div className="bg-[#C4C4C4] gap-2 hidden mobile:flex w-8 h-[0.188rem] mx-auto" />
        <div className="flex justify-between items-center font-bold">
          <span>{locations.length} Local Chapters Found</span>
        </div>
        <span className="text-sm font-medium">
          Girls in your area need your support!
        </span>
      </header>
      <div
        className="flex flex-col overflow-y-auto transition-all duration-300"
        style={{
          maxHeight: maxHeight,
        }}
      >
        {locations.map((loc, idx) => (
          <div
            key={idx}
            onClick={() => onSelectLocation(loc)}
            style={{ cursor: "pointer" }}
          >
            <LocationItem
              location={loc}
              highlightTitle={highlightTitle}
              selected={!!selectedLocation && selectedLocation.ID === loc.ID}
            />
          </div>
        ))}
        {!isSearchResult && (
          <div className="text-center text-sm text-senary font-bold p-4">
            {"Still no results"}
          </div>
        )}
      </div>
    </aside>
  );
}

export default LocationList;
