import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = "openai/gpt-5.4-mini";
const cors = {"Access-Control-Allow-Origin":"*","Access-Control-Allow-Headers":"authorization, x-client-info, apikey, content-type","Access-Control-Allow-Methods":"POST, OPTIONS"};

function response(body, status=200) {
  return new Response(JSON.stringify(body), {status, headers:{...cors,"Content-Type":"application/json"}});
}
function parseJson(text) {
  try { return JSON.parse(text); } catch {}
  const m=text.match(/\{[\s\S]*\}/);
  if(m){ try{return JSON.parse(m[0]);}catch{} }
  throw new Error("AI returned invalid JSON");
}
function buildPrompt(mode, task) {
  if(mode==="email") return [
    "You are the Monshaat Action Tracker intake analyst. The source email may be Arabic. Convert only explicit or strongly implied consultant recommendations into structured execution items.",
    "Preserve source meaning. Do not invent deadlines, legal facts, requirements, costs, or commitments.",
    "Translate Arabic into concise English action wording while preserving important names and terms.",
    "Extract consultant name and received date only when supported. If no deadline is stated, due_date must be null.",
    "Return JSON only with this shape: {consultant_name:string|null,received_date:YYYY-MM-DD|null,summary:string,recommendations:[{title,description,priority, due_date, source_excerpt, tasks:[{title,description,priority,due_date}]}]}",
    "priority must be low, medium, high, or critical."
  ].join("\n");
  return [
    "You are the Monshaat evidence-review analyst. Determine whether uploaded evidence appears to satisfy the specific action.",
    "Assess only what the evidence shows. Do not claim legal or regulatory compliance as fact.",
    "Use result completed, justified, or not_sufficient. completed means direct proof of the requested action; justified means credible support but not proof of completion; not_sufficient means material proof is missing, contradictory, unreadable, or unrelated.",
    "Never change task status automatically. Return JSON only with {result,confidence,rationale,missing_items,evidence_summary}.",
    "Task title: "+(task?.title||""),
    "Task description: "+(task?.description||""),
    "Task priority: "+(task?.priority||""),
    "Task due date: "+(task?.due_date||"none")
  ].join("\n");
}

Deno.serve(async (req) => {
  if(req.method==="OPTIONS") return new Response("ok",{headers:cors});
  try {
    const apiKey=Deno.env.get("OPENROUTER_API_KEY");
    if(!apiKey) return response({error:"OPENROUTER_API_KEY is not configured in Supabase Edge Function secrets."},500);
    const body=await req.json();
    const mode=body.mode==="evidence"?"evidence":"email";
    const prompt=buildPrompt(mode,body.task);
    const filename=body.filename||"document.txt";
    const mimeType=body.mime_type||"text/plain";
    let userContent;
    if(body.file_base64){
      const dataUrl="data:"+mimeType+";base64,"+body.file_base64;
      if(mimeType==="application/pdf"){
        userContent=[{type:"file",file:{filename,file_data:dataUrl}},{type:"text",text:prompt}];
      } else if(mimeType.startsWith("image/")){
        userContent=[{type:"image_url",image_url:{url:dataUrl}},{type:"text",text:prompt}];
      } else {
        const binary=atob(body.file_base64);
        const bytes=new Uint8Array(binary.length);
        for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
        userContent=prompt+"\n\nDocument content:\n"+new TextDecoder().decode(bytes);
      }
    } else {
      userContent=prompt+"\n\nSource content:\n"+String(body.content||"");
    }
    const ai=await fetch(OPENROUTER_URL,{
      method:"POST",
      headers:{"Authorization":"Bearer "+apiKey,"Content-Type":"application/json","HTTP-Referer":"https://munshaat.vercel.app","X-OpenRouter-Title":"Munshaat Action Tracker"},
      body:JSON.stringify({model:MODEL,temperature:0.1,max_tokens:4000,response_format:{type:"json_object"},messages:[{role:"system",content:prompt},{role:"user",content:userContent}]})
    });
    const payload=await ai.json();
    if(!ai.ok) return response({error:payload?.error?.message||"OpenRouter request failed"},ai.status);
    const text=payload?.choices?.[0]?.message?.content;
    if(!text) return response({error:"AI returned no content."},502);
    return response({result:parseJson(text),model:payload.model||MODEL});
  } catch(error) {
    return response({error:error instanceof Error?error.message:"Unexpected analysis error"},500);
  }
});
