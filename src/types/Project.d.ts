export interface Location {
  ID: string;
  'Program Type': string;
  Address: string;
  'Address 2'?: string;
  City: string;
  State: string;
  Zip: string;
  'Age Range': string;
  'Meeting Day': string;
  'Meeting Time': string;
  Region: string;
  'Registration Status': string;
  'Accepting Volunteers': string;
  lat: number;
  lng: number;
  geocoded: boolean;
}

export interface HeaderProps {
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
}

export interface SearchProps {
  value: string;
  onChange: (value: string) => void;
}

export interface LocationListProps {
  locations: Location[];
  onSelectLocation: (location: Location) => void;
  isSearchResult?: boolean;
  highlightTitle?: boolean;
  selectedLocation?: Location | null;
}

export interface LocationItemProps {
  location: Location;
  highlightTitle?: boolean;
  selected?: boolean;
}