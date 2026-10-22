import type { MacroId } from "@/lib/api/types";

/** Cor de cada macro no card "Meta diária". */
export const MACRO_COLORS: Record<MacroId, string> = {
  proteinas: "#f4623a",
  gorduras: "#f9c9b8",
  carboidratos: "#7fc1e8",
};

/** Ordem dos macros no card "Meta diária". */
export const MACRO_ORDER: MacroId[] = ["proteinas", "carboidratos", "gorduras"];

/** Cor das fibras no card "Meta diária". */
export const FIBER_COLOR = "#8cc084";

/** Cor da água no card "Meta diária". */
export const WATER_COLOR = "#3b82c4";
