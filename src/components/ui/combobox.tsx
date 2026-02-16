"use client"

import * as React from "react"
import { Search, ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface ComboboxProps {
  items: {
    value: string;
    label: string;
    [key: string]: any;
  }[];
  onSelect: (value: string) => void;
  placeholder: string;
  searchMessage: string;
  inputPlaceholder: string;
  className?: string;
}

export function Combobox({ items, onSelect, placeholder, searchMessage, inputPlaceholder, className }: ComboboxProps) {
  const [open, setOpen] = React.useState(false)
  const [value, setValue] = React.useState("")
  const [searchTerm, setSearchTerm] = React.useState("")
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  // Filter items based on search
  const filteredItems = items.filter(item =>
    item.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (selectedValue: string) => {
    setValue(selectedValue);
    onSelect(selectedValue);
    setOpen(false);
    setSearchTerm("");
  }

  // Close dropdown when clicking/touching outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  const selectedItem = items.find(item => item.value === value);

  return (
    <div ref={dropdownRef} className={cn("relative flex-1", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center justify-between w-full min-h-[48px] px-3 py-2 text-sm",
          "bg-background border-2 border-input rounded-r-lg transition-all duration-300",
          "focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/25",
          "hover:border-primary/50",
          open && "border-primary ring-2 ring-primary/25",
          !value ? "text-muted-foreground" : "text-foreground"
        )}
      >
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          {/* Search Icon */}
          <div className="flex items-center justify-center w-7 h-7 rounded-md bg-gradient-to-br from-primary to-primary/80 shrink-0">
            <Search className="w-3.5 h-3.5 text-primary-foreground" />
          </div>
          
          {/* Text */}
          <span className="truncate flex-1 text-left">
            {selectedItem ? selectedItem.label : placeholder}
          </span>
        </div>
        
        {/* Chevron */}
        <ChevronDown 
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform duration-300 ml-2",
            open && "rotate-180"
          )} 
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-[calc(100%+4px)] left-0 right-0 z-50 bg-popover border border-primary/20 rounded-xl shadow-xl max-h-[300px] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-200">
          {/* Search Input */}
          <div className="p-4 border-b border-border bg-muted/5">
            <div className="relative">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded bg-gradient-to-br from-primary to-primary/80">
                <Search className="w-2.5 h-2.5 text-primary-foreground" />
              </div>
              <input
                type="text"
                placeholder={inputPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 text-sm bg-background border border-input rounded-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                autoFocus
              />
            </div>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto p-2 scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
            {filteredItems.length === 0 ? (
              <div className="py-6 px-4 text-center text-muted-foreground text-sm">
                <Search className="w-6 h-6 mx-auto mb-2 opacity-20" />
                {searchMessage}
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.value}
                  onClick={() => handleSelect(item.value)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 my-0.5 rounded-lg cursor-pointer transition-colors text-sm font-medium",
                    value === item.value 
                      ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground" 
                      : "text-foreground hover:bg-primary/10"
                  )}
                >
                  <span className="flex-1 truncate mr-2">
                    {item.label}
                  </span>
                  
                  {value === item.value && (
                    <Check className="w-4 h-4 text-primary-foreground shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}