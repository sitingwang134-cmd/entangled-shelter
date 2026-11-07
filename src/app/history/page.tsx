import type { Metadata } from "next";
import { DecisionArchive } from "@/components/entangled/DecisionArchive";

export const metadata: Metadata = {
  title: "The Decision Archive — Entangled Shelter",
  description: "Revisit every small certainty accepted within Entangled Shelter.",
};

export default function HistoryPage() {
  return <DecisionArchive />;
}

