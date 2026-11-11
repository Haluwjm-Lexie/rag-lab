import {normalizeConfig} from './core.mjs';
export const BASELINE={method:'keyword',candidateK:12,topK:4,rewrite:false,rerank:false,budget:6000};
export function baselineConfig(input={}){const c=normalizeConfig({...BASELINE,...input});return Object.fromEntries(Object.keys(BASELINE).map(k=>[k,c[k]]));}
export function validateTestCase(input,docs,{allowMissing=false}={}){
 if(!input||typeof input.question!=='string'||!input.question.trim()||input.question.length>4000)throw Error('测试问题必填，最多4000字符');
 if(input.expected!=null&&(typeof input.expected!=='string'||input.expected.length>4000))throw Error('参考答案最多4000字符');
 if(!Array.isArray(input.gold)||input.gold.length>12)throw Error('每道题最多12条标准证据');
 const gold=input.gold.map(e=>{if(!e||typeof e.docId!=='string'||typeof e.quote!=='string'||!e.quote.trim()||e.quote.length>10000)throw Error('请选择资料并填写原文中的标准证据');const d=docs.find(d=>d.id===e.docId);if(!allowMissing&&(!d||!d.text.includes(e.quote)))throw Error('标准证据必须是所选资料中的原文，请不要改写或添加省略号');return {docId:e.docId,quote:e.quote};});
 const unanswerable=input.unanswerable===true;if(!gold.length&&!unanswerable)throw Error('请至少标注一条原文证据，或选择“资料不足，应当拒答”');
 if(unanswerable&&gold.length)throw Error('拒答题请清空标准证据，改用参考答案说明预期边界');
 return {id:typeof input.id==='string'?input.id:crypto.randomUUID(),question:input.question.trim(),expected:input.expected||'',unanswerable,gold,product:typeof input.product==='string'?input.product:'',year:typeof input.year==='string'?input.year:'',docId:typeof input.docId==='string'?input.docId:'',created:input.created||new Date().toISOString()};
}
export function usableTestCase(q,docs){return q.unanswerable||q.gold.every(e=>docs.some(d=>d.id===e.docId&&d.text.includes(e.quote)));}
