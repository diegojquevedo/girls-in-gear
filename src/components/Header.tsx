import { HeaderProps } from "../types/Project.d";
import Search from "./Search";

function Header({ value, onChange, onReset }: HeaderProps) {
  return (
    <div className="flex flex-col gap-10 mobile:absolute mobile:top-0 mobile:left-0 z-10">
      <h1 className="text-primary text-center text-[4rem] font-bold leading-[normal] mobile:hidden">
        Where are we located?
      </h1>
      <section className="flex items-center gap-6 justify-center mobile:gap-1 mobile:pt-4 mobile:pl-2">
        <Search value={value} onChange={onChange} />
        <div className="w-[0.0625rem] h-[2.5rem] bg-secondary/30 mobile:hidden" />
        <button onClick={onReset} className="whitespace-nowrap bg-quinary rounded-[3.5rem] text-primary text-center px-6 py-4 cursor-pointer hover:opacity-80 font-medium mobile:text-sm mobile:px-4 mobile:py-3">
          Reset Map
        </button>
      </section>
    </div>
  );
}

export default Header;
