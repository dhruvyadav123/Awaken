"use client";
import { useEffect, useState } from "react";
export default function BreathingPractice() {
 const [running,setRunning]=useState(false);
 const [seconds,setSeconds]=useState(0);
 useEffect(()=>{if(!running)return;const timer=setInterval(()=>setSeconds(value=>value+1),1000);return ()=>clearInterval(timer);},[running]);
 const active=running && seconds<24;
 useEffect(()=>{if(seconds>=24 && running){const timeout=setTimeout(()=>setRunning(false),0);return ()=>clearTimeout(timeout);}},[seconds,running]);
 return <div className="renew-breathing"><div className={`renew-breath-circle ${active?"is-breathing":""}`}><span aria-hidden="true">✧</span><p aria-live="polite">{active?(seconds%8<4?"Breathe in":"Breathe out"):seconds>=24?"A little more present.":"Be here, now."}</p><small>{active?`${24-seconds}s remaining`:"A 24-second pause"}</small></div><button type="button" onClick={()=>{setSeconds(0);setRunning(!active);}}>{active?"End practice":seconds>=24?"Breathe again":"Begin a mindful moment"} <span aria-hidden="true">→</span></button><small>Breathe gently, at a pace that feels comfortable.</small></div>;
}
