import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Delete } from "lucide-react";
import { useCallback, useState, type ReactNode } from "react";

type Op = "+" | "-" | "×" | "÷" | null;

export function CalculatorWidget({ className }: { className?: string }) {
  const [display, setDisplay] = useState("0");
  const [stored, setStored] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Op>(null);
  const [fresh, setFresh] = useState(true);

  const applyOp = useCallback((a: number, b: number, op: Op): number => {
    switch (op) {
      case "+":
        return a + b;
      case "-":
        return a - b;
      case "×":
        return a * b;
      case "÷":
        return b === 0 ? NaN : a / b;
      default:
        return b;
    }
  }, []);

  const inputDigit = (d: string) => {
    setDisplay((prev) => {
      if (fresh) {
        setFresh(false);
        return d === "." ? "0." : d;
      }
      if (d === "." && prev.includes(".")) return prev;
      if (prev === "0" && d !== ".") return d;
      return prev + d;
    });
  };

  const clearAll = () => {
    setDisplay("0");
    setStored(null);
    setPendingOp(null);
    setFresh(true);
  };

  const backspace = () => {
    setDisplay((prev) => {
      if (fresh || prev.length <= 1) return "0";
      const next = prev.slice(0, -1);
      return next === "" || next === "-" ? "0" : next;
    });
  };

  const commitOp = (nextOp: Op) => {
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) {
      clearAll();
      return;
    }
    if (stored === null || pendingOp === null) {
      setStored(cur);
    } else {
      const res = applyOp(stored, cur, pendingOp);
      if (Number.isNaN(res)) {
        setDisplay("Error");
        setStored(null);
        setPendingOp(null);
        setFresh(true);
        return;
      }
      const text = String(Math.round(res * 1e12) / 1e12);
      setDisplay(text);
      setStored(res);
    }
    setPendingOp(nextOp);
    setFresh(true);
  };

  const equals = () => {
    if (pendingOp === null || stored === null) return;
    const cur = parseFloat(display);
    if (Number.isNaN(cur)) return;
    const res = applyOp(stored, cur, pendingOp);
    if (Number.isNaN(res)) {
      setDisplay("Error");
    } else {
      setDisplay(String(Math.round(res * 1e12) / 1e12));
    }
    setStored(null);
    setPendingOp(null);
    setFresh(true);
  };

  const B = ({
    children,
    onClick,
    variant = "outline" as const,
    className: c,
  }: {
    children: ReactNode;
    onClick: () => void;
    variant?: "default" | "secondary" | "outline";
    className?: string;
  }) => (
    <Button type="button" variant={variant} size="sm" className={cn("h-9 text-xs font-medium", c)} onClick={onClick}>
      {children}
    </Button>
  );

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <div className="flex min-h-[2.5rem] items-center justify-end rounded-lg border border-border/60 bg-muted/30 px-3 py-2 font-mono text-lg tracking-tight text-foreground tabular-nums">
        {display}
      </div>
      <div className="grid grid-cols-4 gap-1">
        <B onClick={clearAll}>C</B>
        <Button type="button" variant="outline" size="sm" className="h-9 px-0" onClick={backspace} aria-label="Backspace">
          <Delete className="mx-auto h-3.5 w-3.5" />
        </Button>
        <B variant="secondary" onClick={() => commitOp("÷")}>
          ÷
        </B>
        <B variant="secondary" onClick={() => commitOp("×")}>
          ×
        </B>
        <B onClick={() => inputDigit("7")}>7</B>
        <B onClick={() => inputDigit("8")}>8</B>
        <B onClick={() => inputDigit("9")}>9</B>
        <B variant="secondary" onClick={() => commitOp("-")}>
          −
        </B>
        <B onClick={() => inputDigit("4")}>4</B>
        <B onClick={() => inputDigit("5")}>5</B>
        <B onClick={() => inputDigit("6")}>6</B>
        <B variant="secondary" onClick={() => commitOp("+")}>
          +
        </B>
        <B onClick={() => inputDigit("1")}>1</B>
        <B onClick={() => inputDigit("2")}>2</B>
        <B onClick={() => inputDigit("3")}>3</B>
        <B variant="default" className="bg-primary text-primary-foreground hover:bg-primary/90" onClick={equals}>
          =
        </B>
        <B className="col-span-2" onClick={() => inputDigit("0")}>
          0
        </B>
        <B onClick={() => inputDigit(".")}>.</B>
        <B variant="outline" className="text-muted-foreground" onClick={clearAll}>
          AC
        </B>
      </div>
    </div>
  );
}
