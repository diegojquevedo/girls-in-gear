import { IconNames } from "../constants/icons";
import Icon from "./Icon";

interface PopupProps {
  locationName: string;
  locationAddress: string;
  phone: string;
  website: string;
  onClose: () => void;
}

function Popup({
  locationName,
  locationAddress,
  phone,
  website,
  onClose,
}: PopupProps) {
  return (
    <div className="rounded-2xl bg-white px-4 py-6 shadow-lg flex flex-col w-60 gap-2 relative mobile:py-4">
      <button
        onClick={onClose}
        className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
      ></button>
      <span className="font-bold text-primary">{locationName}</span>
      <span className="text-xs">{locationAddress}</span>
      <div className="flex items-center gap-2">
        <Icon name={IconNames.Phone} className="size-3.5 text-primary" />
        <span className="text-sm">{phone}</span>
      </div>
      <div className="flex items-center gap-2">
        <Icon name={IconNames.Website} className="size-3.5 text-primary" />
        <span className="text-sm">{website}</span>
      </div>
      <button
        onClick={() =>
          window.open(
            `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
              locationAddress
            )}`,
            "_blank"
          )
        }
        style={{ backgroundColor: "#66bbdf" }}
        className="rounded-[3.5rem] text-white text-center py-2 cursor-pointer hover:opacity-80 mt-4 font-bold"
      >
        View Directions
      </button>
    </div>
  );
}

export default Popup;
