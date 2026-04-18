import { type DetectedObject, type Inspiration, type SearchPlan } from "@/lib/types";
import { buildLocalSearchPlan } from "@/lib/shopping-taxonomy";

const supportedRetailers = ["ikea", "bonami", "beliani", "xxxlutz", "momax", "mobelix", "jysk"];

export async function planRetailSearch(
  selectedObject: DetectedObject,
  inspiration: Inspiration
): Promise<SearchPlan> {
  return buildLocalSearchPlan(selectedObject, inspiration, supportedRetailers);
}
