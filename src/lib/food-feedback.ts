import { ThumbsDown, Ban, PackageX } from "lucide-react";

export const FOOD_FEEDBACK = [
  { id: "nao-gosto", label: "Não gosto", Icon: ThumbsDown },
  { id: "nao-quero", label: "Não quero", Icon: Ban },
  { id: "nao-tenho", label: "Não tenho", Icon: PackageX },
] as const;

export type FoodFeedback = (typeof FOOD_FEEDBACK)[number]["id"];
