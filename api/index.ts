import { Frog, Button, TextInput } from "frog";
import { z } from "zod";

const LuckyState = z.object({
  names: z.array(z.string()).default([]),
  winners: z.array(z.string()).default([]),
  spinning: z.boolean().default(false),
  currentWinner: z.string().optional(),
});

export const app = new Frog<{ State: any }>({
  title: "Lucky Draw",
  initialState: {
    names: [],
    winners: [],
    spinning: false,
  },
});

function normalizeName(raw?: string) {
  if (!raw) return null;
  const s = raw.trim();
  if (!s) return null;
  return s.replace(/\s+/g, " ");
}
function pickRandom(arr: any[]) {
  if (!arr.length) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

app.frame("/", (c) => {
  const { buttonValue, inputText, deriveState } = c;
  deriveState((s: any) => {
    if (buttonValue === "add") {
      const parts = (inputText || "").split(/,|\n/).map(normalizeName).filter(Boolean);
      s.names = Array.from(new Set([...s.names, ...parts]));
    }
    if (buttonValue === "reset") {
      s.names = [];
      s.winners = [];
    }
  });
  const state = c.state;
  return c.res({
    image: (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",width:"100%",height:"100%",background:"#0f172a",color:"#fff",fontSize:40}}>
        <div style={{fontSize:54,fontWeight:800}}>🎡 Lucky Draw</div>
        <div style={{fontSize:24,opacity:0.9}}>Players: {state.names.length}</div>
      </div>
    ),
    intents: [
      <TextInput placeholder="Enter names e.g. Alice, Bob, Charlie" />,
      <Button value="add">➕ Add</Button>,
      <Button action="/spin" value="spin">▶️ GO</Button>,
      <Button value="reset">🔄 Reset</Button>,
    ],
  });
});

app.frame("/spin", (c) => {
  const { deriveState } = c;
  deriveState((s: any) => {
    s.spinning = true;
  });
  const state = c.state;
  return c.res({
    image: (
      <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",background:"#1e293b",color:"#fff",fontSize:48}}>
        Spinning the wheel…
      </div>
    ),
    intents: [
      <Button action="/reveal" value="reveal">🎁 Reveal Winner</Button>,
    ],
  });
});

app.frame("/reveal", (c) => {
  let winner: string | null = null;
  c.deriveState((s: any) => {
    winner = pickRandom(s.names);
    s.currentWinner = winner;
  });
  const state = c.state;
  return c.res({
    image: (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",background:"#052e16",color:"#ecfeff"}}>
        <div style={{fontSize:56,fontWeight:900}}>🎉 Winner!</div>
        <div style={{fontSize:64,fontWeight:800}}>{state.currentWinner || "No one"}</div>
      </div>
    ),
    intents: [
      <Button action="/remove" value="remove">🗑️ Remove</Button>,
      <Button action="/" value="home">🏠 Home</Button>,
    ],
  });
});

app.frame("/remove", (c) => {
  c.deriveState((s: any) => {
    if (s.currentWinner) {
      s.names = s.names.filter((n: string) => n !== s.currentWinner);
      s.winners.push(s.currentWinner);
    }
  });
  const state = c.state;
  return c.res({
    image: (
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",height:"100%",background:"#1e293b",color:"#fff"}}>
        <div style={{fontSize:48,fontWeight:800}}>✅ Removed</div>
        <div style={{fontSize:30}}>Remaining: {state.names.length}</div>
      </div>
    ),
    intents: [
      <Button action="/" value="home">🏠 Back</Button>,
      <Button action="/spin" value="spin">▶️ Draw Again</Button>,
    ],
  });
});

export const GET = app.handle;
export const POST = app.handle;
