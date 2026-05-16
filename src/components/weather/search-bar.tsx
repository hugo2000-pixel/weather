"use client";

import * as React from "react";
import { Search, MapPin } from "lucide-react";
import { useDebounceValue } from "usehooks-ts";
import { useLocationSearch } from "@/lib/hooks/use-weather";
import { GeocodeResult } from "@/lib/schemas/weather";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onLocationSelect: (location: GeocodeResult) => void;
}

export function SearchBar({ onLocationSelect }: SearchBarProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debouncedQuery] = useDebounceValue(query, 300);
  
  const { data, isLoading } = useLocationSearch(debouncedQuery);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className="w-full sm:w-80 justify-start text-muted-foreground"
        onClick={() => setOpen(true)}
      >
        <Search className="mr-2 h-4 w-4" />
        <span>Search city...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search for a city..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && <div className="p-4 text-sm text-center">Searching...</div>}
          {!isLoading && query.length > 0 && <CommandEmpty>No results found.</CommandEmpty>}
          {data?.results && data.results.length > 0 && (
            <CommandGroup heading="Results">
              {data.results.map((result) => (
                <CommandItem
                  key={result.id}
                  onSelect={() => {
                    onLocationSelect(result);
                    setOpen(false);
                    setQuery("");
                  }}
                  className="cursor-pointer"
                >
                  <MapPin className="mr-2 h-4 w-4 text-muted-foreground" />
                  <span>
                    {result.name}
                    {result.admin1 ? `, ${result.admin1}` : ""}
                    {result.country ? ` (${result.country})` : ""}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
