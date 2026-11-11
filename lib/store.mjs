import {mkdirSync,existsSync,readFileSync,writeFileSync,renameSync,copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {normalizeConfig} from './core.mjs';
import {validateTestCase,baselineConfig,BASELINE} from './evaluation.mjs';
const empty=()=>({version:1,documents:[],index:null,runs:[],evaluations:[],config:{},testCases:[],baselineConfig:{...BASELINE}});
const object=x=>x&&typeof x==='object'&&!Array.isArray(x);
const text=x=>typeof x==='string';
export function validateDocuments(docs){
  if(!Array.isArray(docs)||docs.length>100)throw Error('资料必须为数组，最多100份');
  const ids=new Set();
  for(const d of docs){
    if(!object(d)||!text(d.id)||!d.id||ids.has(d.id)||!text(d.title)||!d.title.trim()||!text(d.text)||!d.text.trim()||d.text.length>500000||['product','year','kind'].some(k=>d[k]!=null&&!text(d[k])))throw Error('资料字段无效、重复或正文过长');
    ids.add(d.id);
  }
  if(docs.reduce((n,d)=>n+d.text.length,0)>2000000)throw Error('资料总长度不能超过200万字符');
  return docs.map(d=>({id:d.id,title:d.title,text:d.text,product:d.product||'',year:d.year||'',kind:d.kind||'文本',created:typeof d.created==='string'?d.created:null}));
}
function validateChunk(c){
  if(!object(c)||['id','docId','title','text','section'].some(k=>!text(c[k]))||!Number.isInteger(c.start)||!Number.isInteger(c.end)||c.start<0||c.end<c.start||!Number.isInteger(c.page))throw Error('备份证据片段格式无效');
}
function validateRun(r){
  if(!object(r)||['id','created','question','answer','rewritten','indexId'].some(k=>!text(r[k]))||!['teaching','real'].includes(r.mode)||!object(r.config)||!object(r.metrics)||!object(r.context)||!text(r.context.text)||!Array.isArray(r.selected)||!Array.isArray(r.candidates)||!Array.isArray(r.trace))throw Error('历史记录格式无效');
  for(const c of [...r.selected,...r.candidates])validateChunk(c);
  if(r.selected.some(c=>!Number.isInteger(c.citation)||c.citation<1))throw Error('引用编号格式无效');
  for(const t of r.trace)if(!object(t)||!text(t.name)||!object(t.input)||!object(t.output)||!Number.isFinite(t.ms))throw Error('链路格式无效');
  if(r.trace.length!==6)throw Error('链路步骤数量无效');
  const retrieval=r.trace[2].output;
  if(!Number.isInteger(retrieval.filtered)||!Number.isInteger(retrieval.eligible)||!Array.isArray(retrieval.candidates))throw Error('检索链路格式无效');
  for(const c of retrieval.candidates){validateChunk(c);if(['bm25','similarity','score'].some(k=>!Number.isFinite(c[k])))throw Error('检索分数格式无效');}
  if(!Number.isFinite(Date.parse(r.created)))throw Error('历史日期无效');
  for(const key of ['recall','precision','candidateRecall','answerAccuracy','citationSupport'])if(r.metrics[key]!==null&&(!Number.isFinite(r.metrics[key])||r.metrics[key]<0||r.metrics[key]>1))throw Error('评估指标格式无效');
  for(const key of ['elapsed','contextCharacters','hits','total'])if(!Number.isFinite(r.metrics[key])||r.metrics[key]<0)throw Error('评估指标格式无效');
  if(r.review!=null&&(!object(r.review)||!['correct','partial','wrong'].includes(r.review.rating)))throw Error('人工评价格式无效');
  normalizeConfig(r.config);
}
export class Store{
  constructor(dir){mkdirSync(dir,{recursive:true});this.file=join(dir,'state.json');if(!existsSync(this.file))this.write(empty());this.read();}
  read(){let s;try{s=JSON.parse(readFileSync(this.file,'utf8'));}catch{throw Error('data/state.json 无法读取，请从备份恢复。原文件未覆盖。');}if(s.version!==1)throw Error('不支持的数据版本');return {...s,testCases:s.testCases||[],baselineConfig:s.baselineConfig||{...BASELINE}};}
  write(s){const temp=this.file+'.tmp';writeFileSync(temp,JSON.stringify(s,null,2));renameSync(temp,this.file);}
  update(fn){const next=fn(this.read());this.write(next);return next;}
  restore(data){
    if(!object(data)||data.version!==1||!Array.isArray(data.runs)||!Array.isArray(data.evaluations))throw Error('备份格式无效');
    const documents=validateDocuments(data.documents);
    if(data.runs.length>200||data.evaluations.length>30)throw Error('历史数量超过上限');
    data.runs.forEach(validateRun);
    for(const e of data.evaluations){if(!object(e)||!text(e.id)||!text(e.created)||!['teaching','real'].includes(e.mode)||!text(e.note)||!Array.isArray(e.rows)||e.rows.length>100)throw Error('评估记录格式无效');for(const row of e.rows){if(!object(row)||!text(row.question)||!text(row.expected))throw Error('评估题目格式无效');validateRun(row.a);validateRun(row.b);}}
    const config=normalizeConfig(data.config||{});
    if(data.testCases!=null&&(!Array.isArray(data.testCases)||data.testCases.length>100))throw Error('最多100道自定义测试题');
    const testCases=(data.testCases||[]).map(q=>validateTestCase(q,documents,{allowMissing:true}));
    const baseline=baselineConfig(data.baselineConfig||{});
    copyFileSync(this.file,this.file+'.before-restore.bak');
    const next={...empty(),documents,runs:data.runs,evaluations:data.evaluations,config,testCases,baselineConfig:baseline};this.write(next);return next;
  }
}
