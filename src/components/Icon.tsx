import { twMerge } from "tailwind-merge";
import { IconNames, IconComponents } from "../constants/icons";

export interface IconProps {
  name: IconNames;
  className?: string;
}

function Icon(props: IconProps) {
  const { name, className } = props;
  const IconComponent = IconComponents[name as IconNames];

  if (!IconComponent) {
    console.warn(`Icon "${String(name)}" does not exist.`);
    return null;
  }

  return (
    <IconComponent
      className={twMerge("transition-all duration-150 ease-in-out", className)}
    />
  );
}

export default Icon;
