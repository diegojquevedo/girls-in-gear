import { useState } from "react";
import { IconNames } from "../constants/icons";
import Icon from "./Icon";
import { SearchProps } from "../types/Project.d";

function Search({ value, onChange }: SearchProps) {
  const [input, setInput] = useState(value);

  const handleSearch = () => {
    onChange(input);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      onChange(input);
    }
  };

  return (
    <div className="flex items-center px-6 py-4 gap-2 bg-white rounded-[3.5rem] w-60 mobile:px-5 mobile:py-3 mobile:w-full">
      <input
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Search for a location"
        className="outline-none w-full mobile:text-sm"
      />
      {input && (
        <button
          className="cursor-pointer shrink-0"
          aria-label="clear"
          onClick={() => {
            setInput("");
            onChange("");
          }}
        >
          <Icon
            name={IconNames.Clear}
            className="size-4 text-secondary hover:text-primary"
          />
        </button>
      )}
      <button
        className="cursor-pointer shrink-0"
        aria-label="search"
        onClick={handleSearch}
      >
        <Icon
          name={IconNames.Search}
          className="size-4 text-secondary hover:text-primary"
        />
      </button>
    </div>
  );
}

export default Search;
