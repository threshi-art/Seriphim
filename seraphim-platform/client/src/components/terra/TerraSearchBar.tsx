import { Input } from "@/components/ui/input";

type TerraSearchBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
};

export default function TerraSearchBar({ value, onChange, onSubmit }: TerraSearchBarProps) {
  return (
    <div className="space-y-2 rounded-xl border border-border/50 bg-muted/10 p-3">
      <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground/70">Search Location</p>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={event => onChange(event.target.value)}
          placeholder="City or region"
          className="h-8 text-xs"
          onKeyDown={event => {
            if (event.key === "Enter") {
              onSubmit();
            }
          }}
        />
        <button
          type="button"
          onClick={onSubmit}
          className="rounded-md border border-primary/40 bg-primary/10 px-3 text-xs font-semibold text-primary"
        >
          Find
        </button>
      </div>
    </div>
  );
}
