import type { Metadata } from "next";
import { NutritionTracker } from "../../../components/NutritionTracker";

export const metadata: Metadata = {
  title: "Nutrition — Fitness Huberman",
};

export default function NutritionPage() {
  return <NutritionTracker />;
}
