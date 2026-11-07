"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./StickyNotes.module.css";

const key = "entangled-shelter:stickies:v1";
const motifs = ["✳", "♥", "☾", "✿", "♠", "☀"];
const colours = ["#f2dfa0", "#dbb9ac", "#bdd1b8"];
type Note = { id: string; text: string; motif?: string; image?: string; colour: string; at: string };
const validImage = (image: unknown): image is string => typeof image === "string" && image.length < 900000 && /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(image);
export function parseStickyNotes(raw: string | null): Note[] {
  try {
    const data: unknown = JSON.parse(raw || "[]");
    return Array.isArray(data) ? data.filter((n): n is Note => !!n && typeof n.id === "string" && typeof n.text === "string" && n.text.trim().length > 0 && n.text.length <= 240 && (validImage(n.image) || motifs.includes(n.motif)) && colours.includes(n.colour) && typeof n.at === "string" && Number.isFinite(Date.parse(n.at))).slice(0,100) : [];
  } catch { return []; }
}

export function StickyNotes() {
  const [viewing, setViewing] = useState<Note | null>(null);
  const viewer = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (!viewing) return;
    const dialog = viewer.current;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialog?.showModal();
    return () => { dialog?.close(); document.body.style.overflow = overflow; previous?.focus(); };
  }, [viewing]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [opened, setOpened] = useState(false);
  const [text, setText] = useState("");
  const [image, setImage] = useState("");
  const [loading, setLoading] = useState(false);
  const uploadVersion = useRef(0);
  const [colour, setColour] = useState(colours[0]);
  const [status, setStatus] = useState("");
  useEffect(() => {
    const read = () => { try { setNotes(parseStickyNotes(localStorage.getItem(key))); } catch { setStatus("Browser storage is unavailable."); } };
    read(); window.addEventListener("storage",read);
    return () => window.removeEventListener("storage",read);
  }, []);
  function persist(next: Note[]) {
    try { localStorage.setItem(key,JSON.stringify(next)); setNotes(next); return true; }
    catch { setStatus("Browser storage is full or unavailable. Copy your text, then remove an old note and try again."); return false; }
  }
  async function upload(file?: File) {
    const version = ++uploadVersion.current;
    if (!file) { setLoading(false); return; }
    if (!["image/jpeg","image/png","image/webp"].includes(file.type) || file.size > 20 * 1024 * 1024) {setStatus("Choose a JPG, PNG or WebP image under 20 MB.");setLoading(false);return;}
    setLoading(true);
    const url=URL.createObjectURL(file);
    try {
      const photo=new Image();photo.src=url;await photo.decode();
      const scale=Math.min(1,800/Math.max(photo.naturalWidth,photo.naturalHeight));
      const canvas=document.createElement("canvas");canvas.width=Math.max(1,Math.round(photo.naturalWidth*scale));canvas.height=Math.max(1,Math.round(photo.naturalHeight*scale));
      const ctx=canvas.getContext("2d");if(!ctx)throw new Error("Canvas unavailable");
      ctx.fillStyle="#f4ead0";ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(photo,0,0,canvas.width,canvas.height);
      const data=canvas.toDataURL("image/jpeg",.78);if(!validImage(data))throw new Error("Image too large");
      if(version===uploadVersion.current){setImage(data);setStatus("Your image is ready. Add a few words, then save. Stored only in this browser.");}
    } catch {if(version===uploadVersion.current)setStatus("This image could not be opened. Try another JPG, PNG or WebP image.");}
    finally {URL.revokeObjectURL(url);if(version===uploadVersion.current)setLoading(false);}
  }
  function save() {
    if (loading) return;
    if (!image) {setStatus("Upload an image first.");return;}
    if (!text.trim()) { setStatus("Add a few words before placing your note on the roll."); return; }
    const current = parseStickyNotes(localStorage.getItem(key));
    if (!editing && current.length >= 100) { setStatus("You have saved 100 notes. Remove one to make room for another."); return; }
    const note = {id:editing || crypto.randomUUID(),text:text.trim(),image,colour,at:current.find(n=>n.id===editing)?.at || new Date().toISOString()};
    if (persist([note,...current.filter(n=>n.id!==note.id)])) {
      setOpened(false);setText("");setImage("");setEditing(null);setStatus("Your image and words are on the roll. Saved in this browser for your next visit.");
    }
  }
  return <section className={styles.notes} aria-label="Memory notes">
    <div className={styles.heading}><div><small>A LITTLE NOTE TO KEEP</small><h3>Keep a little of this moment.</h3></div><button onClick={()=>{uploadVersion.current++;setLoading(false);setOpened(!opened);setEditing(null);setText("");setImage("");}}>＋ Add a note</button></div>
    {opened && <form className={styles.editor} onSubmit={e=>{e.preventDefault();try {save();} catch {setStatus("Your note could not be saved. Copy your text and try again.");}}}>
      <div><label htmlFor="sticky-image">Upload an image</label><input id="sticky-image" type="file" accept="image/jpeg,image/png,image/webp" onChange={e=>{void upload(e.target.files?.[0]);e.target.value="";}}/><p>{loading ? "Preparing your image…" : "JPG, PNG or WebP · Up to 20 MB · Automatically compressed and saved in this browser"}</p>
      <fieldset><legend>Paper colour</legend>{colours.map((c,i)=><button type="button" key={c} style={{background:c}} aria-label={["Wheat gold","Rose","Sage green"][i]} aria-pressed={colour===c} onClick={()=>setColour(c)}>●</button>)}</fieldset>
      <label htmlFor="sticky-copy">Words to remember</label><textarea id="sticky-copy" value={text} onChange={e=>setText(e.target.value)} maxLength={240} placeholder="A little discovery, or a few words for your future self…" required/><small>{text.length} / 240</small>
      <div className={styles.actions}><button type="submit" disabled={loading}>Save to the roll ↗</button><button type="button" onClick={()=>{uploadVersion.current++;setLoading(false);setOpened(false);}}>Cancel</button></div></div>
      <div className={styles.paper} style={{background:colour}}>{image ? <img src={image} alt="Uploaded image preview" /> : <div className={styles.placeholder}>Upload a photo of your own</div>}<p>{text || "Your image and words will become a page on the roll."}</p><small>ENTANGLED SHELTER / MEMORY NOTE</small></div>
    </form>}
    <p role="status">{status || "Upload an image and add a few words to create a page on the roll. Saved only in this browser."}</p>
    {!!notes.length && <div className={styles.collection}>{notes.map(note=><article key={note.id} style={{background:note.colour}}><button type="button" className={styles.expandNote} onClick={()=>setViewing(note)} aria-label="Enlarge memory note">{note.image ? <img src={note.image} alt="Memory photo" /> : <b>{note.motif}</b>}<span className={styles.noteText}>{note.text}</span><small>VIEW MEMORY ↗</small></button><div><button onClick={()=>{uploadVersion.current++;setLoading(false);setEditing(note.id);setText(note.text);setImage(note.image || "");setColour(note.colour);setOpened(true);}}>Edit</button><button onClick={()=>{try {if(persist(parseStickyNotes(localStorage.getItem(key)).filter(n=>n.id!==note.id)))setStatus("Note removed.");}catch {setStatus("This note could not be removed. Please try again.");}}}>Delete</button></div></article>)}</div>}
    <dialog ref={viewer} className={styles.viewer} aria-labelledby="note-view-title" onCancel={()=>setViewing(null)} onClose={()=>setViewing(null)} onClick={e=>{if(e.target===e.currentTarget){const r=e.currentTarget.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)setViewing(null);}}}>
      {viewing && <div className={styles.viewerPaper} style={{background:viewing.colour}}><header><h3 id="note-view-title">A little note to keep</h3><button type="button" onClick={()=>setViewing(null)} aria-label="Close enlarged note" autoFocus>×</button></header>{viewing.image ? <img src={viewing.image} alt="Enlarged memory photo"/> : <b>{viewing.motif}</b>}<p>{viewing.text}</p><time dateTime={viewing.at}>{new Date(viewing.at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}</time></div>}
    </dialog>
  </section>;
}
