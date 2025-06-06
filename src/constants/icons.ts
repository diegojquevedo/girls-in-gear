import ChevronIcon from "../assets/icons/chevron.svg?react";
import PhoneIcon from "../assets/icons/phone.svg?react";
import WebsiteIcon from "../assets/icons/web.svg?react";
import CircleBicycleIcon from "../assets/icons/circle-bicycle.svg?react";
import ClearIcon from "../assets/icons/clear.svg?react";
import SearchIcon from "../assets/icons/search.svg?react";

export enum IconNames {
  Chevron = "Chevron",
  Phone = "Phone",
  Website = "Website",
  CircleBicycle = "CircleBicycle",
  Clear = "Clear",
  Search = "Search",
}

export const IconComponents = {
  [IconNames.Chevron]: ChevronIcon,
  [IconNames.Phone]: PhoneIcon,
  [IconNames.Website]: WebsiteIcon,
  [IconNames.CircleBicycle]: CircleBicycleIcon,
  [IconNames.Clear]: ClearIcon,
  [IconNames.Search]: SearchIcon,
};