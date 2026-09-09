import type { Metadata } from "next";
import { DecisionArchive } from "@/components/entangled/DecisionArchive";

export const metadata: Metadata = {
  title: "选择档案 — Entangled Shelter",
  description: "翻阅你在 Entangled Shelter 接受过的每一次选择。",
};

export default function HistoryPage() {
  return <DecisionArchive />;
}

