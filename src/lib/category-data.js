import { cache } from "react";
import { allPublicItems } from "./public-api";
import { normalizePublicCategories } from "./public-categories";

export const getPublicCategories = cache(async () => {
  const result = await allPublicItems("categories");
  if (!result.error && !Array.isArray(result.data)) {
    return { ...result, data: [], error: "Categories could not be loaded. Please try again later." };
  }
  return { ...result, data: normalizePublicCategories(result.data) };
});
