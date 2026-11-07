import { choiceCategories, createChoiceId, type CategoryId, type ChoiceOption, type Decision, type GameMode } from "./choice-data";

export const traceKey = "entangled-shelter:traces:v1";
export const draftKey = "entangled-shelter:drafts:v1";
export const notesKey = "entangled-shelter:notes:v1";
export const memoryEvent = "entangled:memory";
export type TraceAction = "opened" | "closed" | "selected" | "removed" | "cleared" | "custom" | "filter" | "batch" | "mode" | "wager" | "call" | "round" | "retry" | "accepted" | "stage";
export type Trace = { id: string; at: string; categoryId: CategoryId; action: TraceAction; label: string; optionId?: string };
const actions: TraceAction[] = ["opened","closed","selected","removed","cleared","custom","filter","batch","mode","wager","call","round","retry","accepted","stage"];
const categoryValid = (value: unknown): value is CategoryId => typeof value === "string" && Object.hasOwn(choiceCategories, value);
export function parseTraces(raw: string | null): Trace[] {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    if (!Array.isArray(data)) return [];
    return data.filter((value): value is Trace => !!value && typeof value === "object" && typeof value.id === "string" && typeof value.at === "string" && Number.isFinite(Date.parse(value.at)) && categoryValid(value.categoryId) && actions.includes(value.action) && typeof value.label === "string" && value.label.length <= 240 && (value.optionId === undefined || typeof value.optionId === "string")).slice(0, 2000);
  } catch { return []; }
}
export function rememberTrace(categoryId: CategoryId, action: TraceAction, label: string, optionId?: string): boolean {
  try {
    const entry: Trace = { id:createChoiceId(), at:new Date().toISOString(), categoryId, action, label:label.slice(0,240), ...(optionId ? {optionId} : {}) };
    localStorage.setItem(traceKey, JSON.stringify([entry,...parseTraces(localStorage.getItem(traceKey))].slice(0,2000)));
    window.dispatchEvent(new Event(memoryEvent));
    return true;
  } catch { return false; }
}
export type ChoiceDraft = { selectedIds: string[]; custom: ChoiceOption[]; mode: GameMode };
export function parseDraft(raw: string | null, categoryId: CategoryId): ChoiceDraft | null {
  try {
    const value = JSON.parse(raw || "{}")[categoryId];
    if (!value || !Array.isArray(value.selectedIds) || !Array.isArray(value.custom)) return null;
    const custom: ChoiceOption[] = value.custom.filter((o: ChoiceOption) => o && typeof o.id === "string" && o.id.startsWith("custom-") && typeof o.name === "string" && o.name.length <= 36 && typeof o.detail === "string" && typeof o.group === "string").slice(0,8).map((o: ChoiceOption) => ({id:o.id,name:o.name,detail:o.detail,group:"My Possibilities",custom:true}));
    const valid = new Set([...choiceCategories[categoryId].options,...custom].map(o=>o.id));
    return { custom, selectedIds:[...new Set<string>(value.selectedIds.filter((id: unknown) => typeof id === "string" && valid.has(id)))], mode:["poker","rps","guess"].includes(value.mode) ? value.mode : "poker" };
  } catch { return null; }
}
export function saveDraft(categoryId: CategoryId, draft: ChoiceDraft): boolean {
  try {
    const raw=localStorage.getItem(draftKey);
    const all: Partial<Record<CategoryId,ChoiceDraft>> = {};
    for(const id of ["food","style","travel"] as const) { const stored=parseDraft(raw,id); if(stored) all[id]=stored; }
    all[categoryId]=draft; localStorage.setItem(draftKey,JSON.stringify(all)); return true;
  } catch { return false; }
}
export function parseNotes(raw: string | null): Record<string,string> {
  try {
    const data: unknown=JSON.parse(raw || "{}");
    if(!data || typeof data!=="object" || Array.isArray(data)) return {};
    return Object.fromEntries(Object.entries(data).filter(([id,value])=>id.length<100 && typeof value==="string").slice(0,501).map(([id,value])=>[id,(value as string).slice(0,600)]));
  } catch {return {};}
}
export function saveNote(id: string, note: string): boolean {
  try {const notes=parseNotes(localStorage.getItem(notesKey)); notes[id]=note.slice(0,600);localStorage.setItem(notesKey,JSON.stringify(notes));window.dispatchEvent(new Event(memoryEvent));return true;} catch {return false;}
}
export function favouriteChoices(records: Decision[]) {
  const totals=new Map<string,{name:string;count:number;categoryId:CategoryId}>();
  for(const r of records) {const key=r.categoryId+":"+r.option.id;const entry=totals.get(key);if(entry) entry.count++;else totals.set(key,{name:r.option.name,count:1,categoryId:r.categoryId});}
  return [...totals.values()].sort((a,b)=>b.count-a.count);
}
