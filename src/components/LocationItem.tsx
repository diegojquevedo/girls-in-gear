import { twMerge } from "tailwind-merge";
import ChevronIcon from "../assets/icons/chevron.svg";
import { IconNames } from "../constants/icons";
import Icon from "./Icon";
import type { LocationItemProps } from "../types/Project.d";

function LocationItem({
  location,
  highlightTitle,
  selected,
}: LocationItemProps) {
  return (
    <button
      className="p-4 flex items-center gap-2 w-full border-b border-quaternary cursor-pointer group hover:bg-senary/5 transition-colors duration-150 ease-in-out"
      aria-label="location item"
    >
      <Icon
        name={IconNames.CircleBicycle}
        className={twMerge(
          "size-10",
          highlightTitle || selected
            ? "text-senary"
            : "text-primary group-hover:text-senary"
        )}
      />
      <div className="flex flex-col gap-2 w-full min-w-0">
        <span
          className={twMerge(
            "font-bold text-lg md:text-xl text-start truncate max-w-[30ch] transition-colors duration-150 ease-in-out",
            highlightTitle || selected
              ? "text-senary"
              : "text-primary group-hover:text-senary"
          )}
          title={location.Region}
        >
          Girls on the Run {location.Region}
        </span>
        <span className="text-xs text-start font-medium text">{`${location.City}, ${location.State}`}</span>
        <div className="flex items-center gap-2">
          <Icon
            name={IconNames.Phone}
            className={twMerge(
              "size-3.5",
              highlightTitle || selected
                ? "text-senary"
                : "text-primary group-hover:text-senary"
            )}
          />
          <span className="text-sm font-medium">(907) 306-0789</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon
            name={IconNames.Website}
            className={twMerge(
              "size-3.5",
              highlightTitle || selected
                ? "text-senary"
                : "text-primary group-hover:text-senary"
            )}
          />
          <span className="text-sm font-medium">
            www.gotrsouthcentralak.org
          </span>
        </div>
      </div>
      <img src={ChevronIcon} alt="arrow" className="size-4" />
    </button>
  );
}

export default LocationItem;
