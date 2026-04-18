import { belianiAdapter } from "./beliani";
import { bonamiAdapter } from "./bonami";
import { ikeaAdapter } from "./ikea";
import { jyskAdapter } from "./jysk";
import { mobelixAdapter } from "./mobelix";
import { momaxAdapter } from "./momax";
import type { RetailerAdapter } from "./types";
import { xxxlutzAdapter } from "./xxxlutz";

export const retailerAdapters: Record<string, RetailerAdapter> = {
  ikea: ikeaAdapter,
  bonami: bonamiAdapter,
  beliani: belianiAdapter,
  xxxlutz: xxxlutzAdapter,
  momax: momaxAdapter,
  mobelix: mobelixAdapter,
  jysk: jyskAdapter
};
