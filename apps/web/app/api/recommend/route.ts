import { NextResponse } from "next/server";
import { groundPlan, type OpenPlan } from "@/lib/ranking";
import { products } from "@/lib/catalog";
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";

export const runtime = "nodejs";

const schema = {
  type:"object", additionalProperties:false,
  properties:{
    title:{type:"string"},summary:{type:"string"},people:{type:["integer","null"]},budget:{type:["integer","null"]},
    constraints:{type:"array",items:{type:"string"}},exclusions:{type:"array",items:{type:"string"}},steps:{type:"array",items:{type:"string"},maxItems:5},
    requirements:{type:"array",minItems:1,maxItems:10,items:{type:"object",additionalProperties:false,properties:{label:{type:"string"},retrievalQueries:{type:"array",minItems:1,maxItems:4,items:{type:"string"}},priority:{type:"number",minimum:0,maximum:1},confidence:{type:"number",minimum:0,maximum:1},quantity:{type:["number","null"]}},required:["label","retrievalQueries","priority","confidence","quantity"]}}
  },required:["title","summary","people","budget","constraints","exclusions","requirements","steps"]
};

const catalogVocabulary = [...new Set(products.flatMap((product)=>[product.name,product.category,product.subcategory,...(product.dietary??[])]))].join("; ");

function parseOutput(data: any): OpenPlan {
  const text=data.output_text ?? data.output?.flatMap((item:any)=>item.content??[]).find((item:any)=>item.type==="output_text")?.text;
  if(!text) throw new Error("The model returned no structured output");
  return JSON.parse(text);
}

const bedrock = new BedrockRuntimeClient({ region: process.env.AWS_REGION || "us-east-1" });

async function openAIPlan(query:string):Promise<OpenPlan>{
  const response=await fetch(process.env.OPENAI_BASE_URL??"https://api.openai.com/v1/responses",{method:"POST",headers:{"content-type":"application/json","authorization":`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL??"gpt-5-mini",store:false,max_output_tokens:850,prompt_cache_key:"nowly-query-understanding-v2",instructions:`You are the query-understanding layer for an Indian quick-commerce retrieval system. Produce free-form requirements; never classify the request into a predefined intent, mission, occasion, or importance label. Express importance only as a continuous priority from 0 to 1. For every requirement, generate short retrievalQueries using words found in the catalog vocabulary when appropriate. Preserve explicit constraints and infer conservatively. Prices and stock are resolved later; never invent them. For recipes, include short steps. Catalog vocabulary: ${catalogVocabulary}`,input:query,text:{format:{type:"json_schema",name:"shopping_requirements",strict:true,schema}}})});
  const data=await response.json();
  if(!response.ok) throw new Error(data?.error?.message??`Model request failed (${response.status})`);
  return parseOutput(data);
}

async function bedrockPlan(query:string):Promise<OpenPlan>{
  const response=await bedrock.send(new ConverseCommand({
    modelId:process.env.BEDROCK_MODEL_ID??"amazon.nova-micro-v1:0",
    system:[{text:`You are the query-understanding layer for an Indian quick-commerce retrieval system. Return only one JSON object matching this schema: ${JSON.stringify(schema)}. Produce free-form requirements; never classify the request into a predefined intent, mission, occasion, or importance label. Use continuous priority scores and catalog-aligned retrieval queries. Preserve explicit constraints and infer conservatively. Prices and stock are resolved later; never invent them. For recipes, include short steps. Catalog vocabulary: ${catalogVocabulary}`}],
    messages:[{role:"user",content:[{text:query}]}],
    inferenceConfig:{temperature:0,maxTokens:850}
  }));
  const text=response.output?.message?.content?.find((item)=>"text" in item)?.text;
  if(!text) throw new Error("Amazon Bedrock returned no structured output");
  return JSON.parse(text);
}

async function ollamaPlan(query:string):Promise<OpenPlan>{
  const response=await fetch(`${process.env.OLLAMA_URL??"http://127.0.0.1:11434"}/api/generate`,{method:"POST",headers:{"content-type":"application/json"},body:JSON.stringify({model:process.env.OLLAMA_MODEL??"qwen2.5:1.5b",stream:false,format:schema,prompt:`Turn the request into free-form shopping requirements. Do not classify it into a mission, intent type, or importance enum. Use continuous priority scores and catalog-aligned retrieval queries. Catalog vocabulary: ${catalogVocabulary}. Request: ${query}`,options:{temperature:0,num_predict:850}}),signal:AbortSignal.timeout(8000)});
  if(!response.ok) throw new Error("Local model request failed");
  const data=await response.json(); return JSON.parse(data.response);
}

export async function POST(request:Request){
  try{
    const body=await request.json(); const query=String(body.query??"").trim(); const historyIds=Array.isArray(body.historyIds)?body.historyIds.map(String).slice(0,30):[];
    if(!query) return NextResponse.json({error:"Query is required"},{status:400});
    const configuredProvider=process.env.LLM_PROVIDER?.toLowerCase();
    const provider=configuredProvider??(process.env.OPENAI_API_KEY?"openai":"");
    if(!provider) throw new Error("No language model is configured");
    if(provider!=="openai"&&provider!=="bedrock"&&provider!=="ollama") throw new Error(`Unsupported language model provider: ${provider}`);
    const plan=provider==="openai"?await openAIPlan(query):provider==="bedrock"?await bedrockPlan(query):await ollamaPlan(query);
    const suggestion=groundPlan(plan,historyIds);
    if(!suggestion.needs.length) return NextResponse.json({kind:"clarification",title:"We need one more detail",choices:[`A specific product for ${query}`,`Ingredients related to ${query}`,`A complete plan for ${query}`],route:"catalog_gap"});
    return NextResponse.json({kind:"suggestion",suggestion,route:`dynamic_${provider}`});
  }catch(error){
    const message=error instanceof Error?error.message:"Recommendation failed";
    return NextResponse.json({error:message,hint:"Configure an API provider in apps/web/.env.local, or run Ollama locally."},{status:503});
  }
}
