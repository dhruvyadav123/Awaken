"use client";

import { useId, useRef, useState } from "react";
import { publicMediaUrl } from "@/lib/dashboard/media";
import { MediaBrowser, PermanentImagePreview } from "./MediaControls";
import { idOf } from "./data";

// Controlled value follows the form contract (one permanent URL or an array).
// Temporary private grants belong to previews, never to this value.
export default function MediaPicker({ title = "Image", value, multiple = false, valueType = "url", mediaKind = "IMAGE", allowNonPublic = false, previewValue = "", onChange, onSelectRecord, onBusyChange, disabled = false, compact = true }) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [selectedPreviews, setSelectedPreviews] = useState({});
  const toggle = useRef(null);
  const panelId = useId();
  const values = multiple ? Array.isArray(value) ? value : [] : value ? [value] : [];
  const idMode = valueType === "id";
  const blocked = disabled || working;

  function select(record) {
    const href = publicMediaUrl(record);
    const mediaId = idOf(record);
    if ((!href && !idMode) || (idMode && !mediaId)) return;
    if (idMode) {
      setSelectedPreviews(current => ({ ...current, [mediaId]: href }));
      onChange(multiple ? [...new Set([...values, mediaId])] : mediaId);
    } else onChange(multiple ? [...new Set([...values, href])] : href);
    onSelectRecord?.({ id: mediaId, href, record });
    setOpen(false);
    toggle.current?.focus();
  }

  function busyChanged(next) {
    setWorking(next);
    onBusyChange?.(next);
  }

  return <fieldset className="ws-field-full ws-media-field" disabled={disabled}>
    <legend>{title}</legend>
    <div className="ws-media-field-intro"><span>{multiple ? `Choose ${mediaKind.toLowerCase()} files from your media library.` : `Choose a ${mediaKind.toLowerCase()} file from your media library.`}</span><small>{idMode ? "The selected media ID will be sent to the lesson API." : "Only permanent public media can be saved as a URL."}</small></div>
    <div className="ws-media-selections" aria-live="polite">
      {values.map((selectedValue, index) => <div key={`${selectedValue}:${index}`}>
        {(idMode ? selectedPreviews[selectedValue] || (!multiple ? previewValue : "") : selectedValue) ? <PermanentImagePreview key={selectedValue} value={idMode ? selectedPreviews[selectedValue] || (!multiple ? previewValue : "") : selectedValue} /> : idMode ? <div className="ws-media-selection-id"><strong>{mediaKind} selected</strong><code>{selectedValue}</code></div> : null}
        <button type="button" disabled={blocked} className="ws-text-link" onClick={() => onChange(multiple ? values.filter((_, i) => i !== index) : "")}>Remove selection</button>
      </div>)}
    </div>
    {!idMode && <label className="ws-field ws-media-url-fallback">{multiple ? "Image URLs (optional fallback)" : "Image URL (optional fallback)"}
      {multiple ? <textarea className="ws-input" disabled={blocked} value={values.join("\n")} onChange={event => onChange(event.target.value.split("\n").filter(Boolean))} /> : <input className="ws-input" type="text" inputMode="url" disabled={blocked} value={value || ""} onChange={event => onChange(event.target.value)} />}
    </label>}
    <button ref={toggle} type="button" className="ws-button ws-media-library-toggle" disabled={blocked} aria-expanded={open} aria-controls={panelId} onClick={() => setOpen(current => !current)}>{open ? "Close media library" : values.length && !multiple ? "Change media" : "Open media library"}</button>
    {open && <div id={panelId}><MediaBrowser compact={compact} kinds={[mediaKind]} allowNonPublic={allowNonPublic} onSelect={select} onBusyChange={busyChanged} /></div>}
    <p className="ws-muted">Save the form to apply your selection. Removing a selection keeps the original file in your library.</p>
  </fieldset>;
}
