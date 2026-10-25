// CV Studio · static GitHub Pages application
'use strict';
const SAMPLE = `## Information
- Name: Alex Morgan
- Email: alex@example.com
- Phone: +966 50 000 0000
- Location: Riyadh, Saudi Arabia
- Username: alexmorgan
- LinkedIn: alex-morgan
- Website: https://example.com

## Education
### BSc in Computer Science
- Organization: Example University
- Dates: 2022–2026
- Location: Riyadh, Saudi Arabia
- GPA: 4.8 / 5.0
- Relevant coursework: Algorithms, Machine Learning, Statistics.

## Objective
Computer science graduate seeking a research role in machine learning, with an interest in useful, reproducible tools.

## Volunteering
### Programming mentor
- Organization: Community Code Club
- Dates: 2024–2026
- Mentored 20 students in Python and problem solving.
- Organized six beginner programming workshops.

## Awards
### University Research Award
- Organization: Example University
- Dates: 2025
- Recognized for an undergraduate project on document classification.

## Publications
### A practical approach to document classification
- Authors: A. Morgan, J. Lee
- Venue: Example Student Research Symposium
- Dates: 2025
- Status: Illustrative sample publication

## Skills
- Python, JavaScript, SQL
- Data analysis: pandas, NumPy, scikit-learn
- Technical writing and reproducible research
- Languages: Arabic, English

## Projects
### Research Paper Explorer
- Dates: 2025–2026
- URL: https://example.com/research
- Built a searchable collection of 1,000 research abstracts.
- Reduced manual review time by 35% in a small user study.

### Personal CV Builder
- Dates: 2026
- Turned structured Markdown into tailored CVs.
`;
const SECTIONS=['Information','Education','Objective','Volunteering','Awards','Publications','Skills','Projects'];
const FIELD_KEYS=new Set(['name','email','phone','location','website','github','gitlab','linkedin','username','orcid','scholar','link','organization','institution','dates','date','url','gpa','degree','role','authors','venue','status']);
const $=id=>document.getElementById(id);
let sections=[],nextId=0,toastTimer,appliedMarkdown='',pdfBusy=false;
const HISTORY_KEY='cv-studio.history.v1';
let cvHistory=[],historyWritable=true,historyError='',autoName=true;
const makeId=()=>String(++nextId);
function parseMarkdown(text){
 nextId=0;const parsed=[],warnings=[];let section=null,entry=null,paragraph=[];
 function addLeaf(kind,text,key=''){if(!entry){entry={id:makeId(),title:'',leaves:[]};section.entries.push(entry)}entry.leaves.push({id:makeId(),kind,text,key,selected:true})}
 function flush(){if(paragraph.length){addLeaf('paragraph',paragraph.join(' '));paragraph=[]}}
 for(const [i,raw] of text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n').split('\n').entries()){
  const line=raw.trim();let m;
  if((m=line.match(/^##\s+(.+?)\s*$/))){if(section)flush();entry=null;const name=m[1].replace(/\s+#+$/,'').trim();if(!SECTIONS.includes(name)){warnings.push('Line '+(i+1)+': unknown section “'+name+'”. Kept as a custom section.')}section={id:makeId(),name,entries:[]};parsed.push(section);continue}
  if(!section){if(line&&!/^#\s/.test(line))warnings.push('Line '+(i+1)+': text before the first ## section was skipped.');continue}
  if(!line){flush();continue}
  if((m=line.match(/^###\s+(.+?)\s*$/))){flush();entry={id:makeId(),title:m[1].replace(/\s+#+$/,'').trim(),leaves:[],selected:true};section.entries.push(entry);continue}
  if((m=line.match(/^[-*]\s+(.+)$/))){flush();const field=m[1].match(/^([^:]+):\s*(.*)$/);if(field&&FIELD_KEYS.has(field[1].trim().toLowerCase()))addLeaf('field',field[2],field[1].trim());else addLeaf('bullet',m[1]);continue}
  if(/^#{1,6}\s/.test(line))warnings.push('Line '+(i+1)+': use ## for sections or ### for entries; kept this line as text.');
  paragraph.push(line);
 }if(section)flush();return {sections:parsed,warnings};
}
function selectedEntry(e){return (e.title&&e.selected)||e.leaves.some(l=>l.selected)}
function selectedSection(s){return s.entries.some(selectedEntry)}
function states(s){return s.entries.flatMap(e=>[...(e.title?[e.selected]:[]),...e.leaves.map(l=>l.selected)])}
function setEntry(e,value){if(e.title)e.selected=value;e.leaves.forEach(l=>l.selected=value)}
function setSection(s,value){s.entries.forEach(e=>setEntry(e,value))}
function el(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n}
function checkbox(value,labelText,fn,mixed=false,token=''){const label=el('label','leaf');const input=document.createElement('input');input.type='checkbox';input.checked=value;input.indeterminate=mixed;if(token)input.id='select-'+token;input.addEventListener('change',()=>{fn(input.checked);render()});label.append(input,el('span','',labelText));return label}
function renderSelection(){
 const focusId=document.activeElement&&document.activeElement.id;const root=$('selection');root.replaceChildren();let picked=0,total=0;
 sections.forEach((s,index)=>{
  const block=el('div','section'),line=el('div','sectionline'),values=states(s);picked+=values.filter(Boolean).length;total+=values.length;
  const label=checkbox(values.length>0&&values.every(Boolean),s.name,v=>setSection(s,v),values.some(Boolean)&&!values.every(Boolean),s.id);label.style.margin='0';line.append(label);
  for(const [text,delta,description] of [['↑',-1,'Move up'],['↓',1,'Move down']]){const b=el('button','move',text);b.type='button';b.setAttribute('aria-label',description+' '+s.name);b.disabled=index+delta<0||index+delta>=sections.length;b.onclick=()=>{[sections[index],sections[index+delta]]=[sections[index+delta],sections[index]];render()};line.append(b)}block.append(line);
  s.entries.forEach(e=>{const entry=el('div','entry');if(e.title){const vals=[e.selected,...e.leaves.map(l=>l.selected)];const title=checkbox(vals.every(Boolean),e.title,v=>setEntry(e,v),vals.some(Boolean)&&!vals.every(Boolean),e.id);title.className='entrytitle';entry.append(title)}e.leaves.forEach(l=>{const label=checkbox(l.selected,(l.key?l.key+': ':'')+l.text,v=>{l.selected=v;if(v&&e.title)e.selected=true},false,l.id);if(!l.selected)label.classList.add('unchecked');entry.append(label)});block.append(entry)});root.append(block);
 });if(!sections.length)root.append(el('p','empty','No sections.'));$('count').textContent=picked+' / '+total;if(focusId&&focusId.startsWith('select-'))document.getElementById(focusId)?.focus({preventScroll:true});
}

const FONTS={roman:{css:'CV Roman',tex:'Latin Modern Roman'},sans:{css:'CV Sans',tex:'Latin Modern Sans'},mono:{css:'CV Mono',tex:'Latin Modern Mono'}};
const STYLES={autocv:{size:11,margin:1.8,space:4,gap:13},classic:{size:11,margin:2,space:5,gap:14},academic:{size:11,margin:2.2,space:6,gap:15},modern:{size:11,margin:1.9,space:4,gap:12},compact:{size:10,margin:1.5,space:2,gap:8},minimal:{size:11,margin:2.4,space:7,gap:19}};
function cvFont(){return FONTS[$('font').value]||FONTS.roman}
function safeHref(value){
 const s=String(value).trim();if(/[\x00-\x20\x7f]/.test(s))return null;
 try{const url=new URL(s);if(['https:','http:'].includes(url.protocol)&&url.hostname&&!url.username&&!url.password)return url.href;if(url.protocol==='mailto:'&&/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.slice(7)))return s;if(url.protocol==='tel:'&&/^\+?[\d().-]+$/.test(s.slice(4)))return s}catch{}
 return null;
}
function linkParts(text,key=''){
 const value=text.trim(),k=key.toLowerCase();const md=value.match(/^\[([^\]]+)\]\(([^\s]+)\)$/);
 if(md){const href=safeHref(md[2]);return {label:md[1],href}}
 let href=safeHref(value);
 if(!href){
  if(k==='email'){href=safeHref('mailto:'+value.replace(/^mailto:/i,''))}
  else if(k==='phone'){href=safeHref('tel:'+value.replace(/^tel:/i,'').replace(/[\s()\-.]/g,''))}
  else if(['github','username','gitlab'].includes(k)&&/^@?[\w.-]+$/.test(value)){href='https://'+(k==='gitlab'?'gitlab.com':'github.com')+'/'+encodeURIComponent(value.replace(/^@/,''))}
  else if(k==='linkedin'&&/^(?:in\/)?[\w.-]+\/?$/.test(value)){href='https://www.linkedin.com/in/'+value.replace(/^in\//,'').replace(/\/$/,'')}
  else if(k==='orcid'&&/^\d{4}-\d{4}-\d{4}-[\dX]{4}$/i.test(value)){href='https://orcid.org/'+value}
  else if(['website','url','link','github','gitlab','linkedin','username','scholar'].includes(k)&&/^(?:[a-z\d-]+\.)+[a-z]{2,}(?:[/?#].*)?$/i.test(value)){href=safeHref('https://'+value)}
 }
 let label=value.replace(/^https?:\/\//,'').replace(/\/$/,'');if(['github','gitlab','username'].includes(k)&&href)label=label.replace(/^(?:www\.)?(?:github|gitlab)\.com\//,'');if(k==='linkedin'&&href)label=label.replace(/^(?:www\.)?linkedin\.com\/in\//,'');
 return {label,href};
}
// Only validated http(s), mailto and tel destinations become links. Text is never HTML.
function linkedNode(text,key=''){
 const part=linkParts(text,key);if(!part.href)return el('span','',part.label);
 const a=el('a','',part.label);a.href=part.href;a.title=part.href;if(/^https?:/.test(part.href)){a.target='_blank';a.rel='noopener noreferrer'}return a;
}
function contentNode(l){const p=el('p',l.kind==='field'?'meta':'');if(l.kind==='field'&&!['url','link','website','email','phone','username','github','gitlab','linkedin','orcid','scholar'].includes(l.key.toLowerCase()))p.append(el('span','',l.key+': '));p.append(linkedNode(l.text,l.key));return p}
function dateLeaves(e){return e.leaves.filter(l=>l.selected&&['date','dates'].includes(l.key.toLowerCase()))}
function renderPreview(){
 const root=$('preview');root.replaceChildren();root.className='paper '+$('template').value;root.style.setProperty('--cvfont',"'"+cvFont().css+"', serif");
 let any=false;const infos=sections.filter(s=>s.name==='Information');const infoLeaves=infos.flatMap(s=>s.entries.flatMap(e=>e.leaves.filter(l=>l.selected)));
 const head=el('div','cv-header'),names=infoLeaves.filter(l=>l.key.toLowerCase()==='name');
 if(names.length){const name=el('h3');names.forEach((l,i)=>{if(i)name.append(el('span','',' / '));name.append(linkedNode(l.text,l.key))});head.append(name);any=true}
 const contacts=infoLeaves.filter(l=>l.key.toLowerCase()!=='name');if(contacts.length){const contact=el('div','contact');for(const l of contacts){const holder=el('span');holder.append(linkedNode(l.text,l.key));contact.append(holder)}head.append(contact);any=true}
 for(const s of infos)for(const e of s.entries)if(e.title&&e.selected){head.append(el('p','',e.title));any=true}
 if(head.children.length)root.append(head);
 for(const s of sections){if(s.name==='Information'||!selectedSection(s))continue;any=true;
  const section=el('section','cv-section');section.append(el('h4','',s.name));const body=el('div','cv-body');section.append(body);
  for(const e of s.entries){if(!selectedEntry(e))continue;const entry=el('div','cv-entry'),dates=dateLeaves(e);const hasTitle=e.title&&e.selected;
   if(hasTitle){const row=el('div','entryhead');row.append(el('h5','',e.title));if(dates.length)row.append(el('span','dates',dates.map(l=>l.text).join(' · ')));entry.append(row)}
   let list=null;for(const l of e.leaves.filter(l=>l.selected)){if(hasTitle&&dates.includes(l))continue;if(l.kind==='bullet'){if(!list){list=el('ul');entry.append(list)}const li=el('li');li.append(linkedNode(l.text));list.append(li)}else{list=null;entry.append(contentNode(l))}}
   body.append(entry);
  }root.append(section);
 }if(!any)root.append(el('p','quiet','No content selected.'));
}
function texEscape(value){const map={'\\':'\\textbackslash{}','{':'\\{','}':'\\}','$':'\\$','&':'\\&','#':'\\#','%':'\\%','_':'\\_','~':'\\textasciitilde{}','^':'\\textasciicircum{}'};return String(value).replace(/[\\{}$&#%_~^]/g,c=>map[c])}

function texLink(text,key=''){
 const part=linkParts(text,key);const target=part.href&&part.href.replace(/[\\{}~^]/g,c=>'%'+c.charCodeAt(0).toString(16).toUpperCase());return target?'\\href{'+texEscape(target)+'}{'+texEscape(part.label)+'}':texEscape(part.label);
}
function texLeaf(l){
 const hide=['url','link','website','email','phone','username','github','gitlab','linkedin','orcid','scholar'].includes(l.key.toLowerCase());
 return (l.key&&!hide?texEscape(l.key)+': ':'')+texLink(l.text,l.key);
}
function generateLatex(){
 const style=$('template').value in STYLES?$('template').value:'autocv',cfg=STYLES[style];
 const lines=[
 '% CV Studio | '+style+' | Compile with XeLaTeX or LuaLaTeX.',
 '\\documentclass['+cfg.size+'pt,a4paper]{article}',
 '\\usepackage[margin='+cfg.margin+'cm]{geometry}',
 '\\usepackage{fontspec}',
 '\\setmainfont{'+cvFont().tex+'}',
 '\\usepackage{enumitem}',
 '\\usepackage{titlesec}',
 '\\usepackage{xcolor}',
 '\\usepackage{tabularx}',
 '\\usepackage{hyperref}',
 '\\definecolor{cvblue}{HTML}{254F73}',
 '\\definecolor{cvpale}{HTML}{EEF2F5}',
 '\\hypersetup{colorlinks=true,urlcolor='+(style==='minimal'?'black':'cvblue')+',linkcolor=cvblue,breaklinks=true}',
 '\\urlstyle{same}',
 '\\pagestyle{empty}',
 '\\setlength{\\parindent}{0pt}',
 '\\setlength{\\parskip}{'+cfg.space+'pt}',
 '\\setlength{\\emergencystretch}{2em}',
 '\\setlist[itemize]{leftmargin=1.3em,topsep=2pt,itemsep='+(style==='compact'?0:2)+'pt,parsep=0pt}',
 ];
 const sectionStyles={
 autocv:'\\titleformat{\\section}{\\Large\\scshape}{}{0pt}{}[\\titlerule]',
 classic:'\\titleformat{\\section}{\\normalsize\\bfseries\\centering}{}{0pt}{\\MakeUppercase}',
 academic:'\\titleformat{\\section}{\\large\\scshape}{}{0pt}{}[\\vspace{1pt}\\titlerule[0.3pt]]',
 modern:'\\newcommand{\\cvbox}[1]{\\colorbox{cvpale}{\\parbox{\\dimexpr\\linewidth-2\\fboxsep\\relax}{#1}}}\n\\titleformat{\\section}{\\normalsize\\bfseries\\color{cvblue}}{}{0pt}{\\cvbox}',
 compact:'\\titleformat{\\section}{\\normalsize\\bfseries}{}{0pt}{\\MakeUppercase}[\\titlerule]',
 minimal:'\\titleformat{\\section}{\\large\\itshape}{}{0pt}{}'
 };
 lines.push(sectionStyles[style],'\\titlespacing*{\\section}{0pt}{'+cfg.gap+'pt}{6pt}','\\begin{document}');
 const infos=sections.filter(s=>s.name==='Information'),leaves=infos.flatMap(s=>s.entries.flatMap(e=>e.leaves.filter(l=>l.selected)));
 const names=leaves.filter(l=>l.key.toLowerCase()==='name'),contacts=leaves.filter(l=>l.key.toLowerCase()!=='name');
 const hasHeader=names.length||contacts.length||infos.some(s=>s.entries.some(e=>e.title&&e.selected));
 if(hasHeader){
  if(['autocv','classic'].includes(style))lines.push('\\begin{center}');
  if(style==='modern')lines.push('{\\color{cvblue}\\hrule height 2pt}\\vspace{8pt}');
  if(names.length)lines.push('{'+(style==='compact'?'\\LARGE':'\\Huge')+(['classic','modern','compact'].includes(style)?'\\bfseries ':' ')+(style==='modern'?'\\color{cvblue} ':'')+names.map(l=>texLink(l.text,l.key)).join(' / ')+'}\\par');
  if(contacts.length)lines.push('{\\small '+contacts.map(l=>texLeaf(l)).join(' \\enspace\\textbar\\enspace ')+'}\\par');
  for(const s of infos)for(const e of s.entries)if(e.title&&e.selected)lines.push(texEscape(e.title)+'\\par');
  if(['autocv','classic'].includes(style))lines.push('\\end{center}');
  if(style==='classic')lines.push('\\vspace{3pt}\\hrule height 0.8pt');
  if(style==='minimal')lines.push('\\vspace{10pt}');
 }
 for(const s of sections){if(s.name==='Information'||!selectedSection(s))continue;
  lines.push('', '\\section*{'+texEscape(s.name)+'}');
  if(style==='academic')lines.push('\\begin{list}{}{\\setlength{\\leftmargin}{0.8em}\\setlength{\\rightmargin}{0pt}}\\item[]');
  for(const e of s.entries){if(!selectedEntry(e))continue;const dates=dateLeaves(e),hasTitle=e.title&&e.selected;
   if(hasTitle){const title=style==='minimal'?texEscape(e.title):'\\textbf{'+texEscape(e.title)+'}';if(dates.length)lines.push('\\begin{tabularx}{\\linewidth}{@{}X r@{}}',title+' & {\\small '+dates.map(l=>texEscape(l.text)).join(' / ')+'} \\\\','\\end{tabularx}');else lines.push(title+'\\par')}
   let inList=false;
   for(const l of e.leaves.filter(l=>l.selected)){
    if(hasTitle&&dates.includes(l))continue;
    if(l.kind==='bullet'){if(!inList){lines.push('\\begin{itemize}');inList=true}lines.push('\\item '+texLink(l.text))}
    else{if(inList){lines.push('\\end{itemize}');inList=false}const txt=texLeaf(l);lines.push((l.kind==='field'?'{\\small\\itshape '+txt+'}':txt)+'\\par')}
   }if(inList)lines.push('\\end{itemize}');
  }if(style==='academic')lines.push('\\end{list}');
 }lines.push('', '\\end{document}');return lines.join('\n');
}
function selectedMarkdown(){let lines=[];for(const s of sections){if(!selectedSection(s))continue;lines.push('## '+s.name,'');for(const e of s.entries){if(!selectedEntry(e))continue;if(e.title&&e.selected)lines.push('### '+e.title);for(const l of e.leaves.filter(l=>l.selected))lines.push(l.kind==='field'?'- '+l.key+': '+l.text:l.kind==='bullet'?'- '+l.text:l.text+'\n');lines.push('')} }return lines.join('\n')}
function updateExportButtons(){const disabled=!sections.some(selectedSection)||$('source').value!==appliedMarkdown||pdfBusy;['download','pdfdownload','savecv','copy','selectedmd'].forEach(id=>$(id).disabled=disabled)}
function render(){renderSelection();renderPreview();$('latex').value=generateLatex();updateExportButtons()}
function notify(msg){clearTimeout(toastTimer);$('toast').textContent=msg;$('toast').hidden=false;toastTimer=setTimeout(()=>$('toast').hidden=true,3000)}
function apply(){const result=parseMarkdown($('source').value);sections=result.sections;appliedMarkdown=$('source').value;$('warnings').textContent=result.warnings.join('\n');$('warnings').hidden=!result.warnings.length;$('sourcehint').textContent='Applied';render()}
function download(name,text,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function validSnapshot(s){return s&&s.schema===1&&typeof s.id==='string'&&typeof s.name==='string'&&typeof s.markdown==='string'&&s.markdown.length<=2*1024*1024&&Object.hasOwn(STYLES,s.style)&&Object.hasOwn(FONTS,s.font)&&['tex','pdf','md','cv'].includes(s.format)&&Number.isFinite(Date.parse(s.exportedAt))&&Array.isArray(s.selectedIds)&&s.selectedIds.every(x=>typeof x==='string')&&Array.isArray(s.sectionOrder)&&s.sectionOrder.every(x=>typeof x==='string')}
function readHistory(){
 try{const raw=localStorage.getItem(HISTORY_KEY);if(raw===null){historyWritable=true;historyError='';return []}const value=JSON.parse(raw);if(!Array.isArray(value)||!value.every(validSnapshot))throw new Error('invalid');historyWritable=true;historyError='';return value}
 catch{historyWritable=false;historyError='History is unavailable. Exports still work.';return []}
}
function writeHistory(next){
 if(!historyWritable){notify('History is unavailable in this browser. Downloads still work.');return false}
 try{localStorage.setItem(HISTORY_KEY,JSON.stringify(next));cvHistory=next;renderHistory();return true}
 catch{notify('History could not be saved; browser storage may be full.');return false}
}
function localDateName(now=new Date()){
 return now.getFullYear()+'-'+String(now.getMonth()+1).padStart(2,'0')+'-'+String(now.getDate()).padStart(2,'0');
}
function nextDefaultName(now=new Date()){
 const base=localDateName(now),names=new Set(cvHistory.map(s=>s.name));let candidate=base,n=0;
 while(names.has(candidate))candidate=base+' ('+(++n)+')';return candidate;
}
function refreshDefaultName(){if(autoName)$('cvname').value=nextDefaultName()}
function captureSnapshot(format){
 if(autoName||!$('cvname').value.trim()){autoName=true;refreshDefaultName()}
 const selectedIds=[];for(const s of sections)for(const e of s.entries){if(e.title&&e.selected)selectedIds.push(e.id);for(const l of e.leaves)if(l.selected)selectedIds.push(l.id)}
 return {schema:1,id:typeof crypto!=='undefined'&&crypto.randomUUID?crypto.randomUUID():Date.now().toString(36)+'-'+Math.random().toString(36).slice(2),name:$('cvname').value.trim().slice(0,100)||nextDefaultName(),autoName,exportedAt:new Date().toISOString(),format,markdown:appliedMarkdown,selectedIds,sectionOrder:sections.map(s=>s.id),style:$('template').value,font:$('font').value};
}
function saveSnapshot(snapshot){const saved=writeHistory([snapshot,...cvHistory]);if(saved)refreshDefaultName();return saved}
function snapshotSections(snapshot){
 const parsed=parseMarkdown(snapshot.markdown).sections,selected=new Set(snapshot.selectedIds),positions=new Map(snapshot.sectionOrder.map((id,i)=>[id,i]));
 for(const s of parsed)for(const e of s.entries){if(e.title)e.selected=selected.has(e.id);for(const l of e.leaves)l.selected=selected.has(l.id)}
 return parsed.sort((a,b)=>(positions.get(a.id)??9999)-(positions.get(b.id)??9999));
}
function loadSnapshot(snapshot,announce=true){
 if($('source').value!==appliedMarkdown&&!confirm('Discard unapplied Markdown changes?'))return;
 $('source').value=snapshot.markdown;appliedMarkdown=snapshot.markdown;sections=snapshotSections(snapshot);$('template').value=snapshot.style;$('font').value=snapshot.font;$('cvname').value=snapshot.name;autoName=typeof snapshot.autoName==='boolean'?snapshot.autoName:/^\d{4}-\d{2}-\d{2}(?: \(\d+\))?$/.test(snapshot.name);
 const warnings=parseMarkdown(snapshot.markdown).warnings;$('warnings').textContent=warnings.join('\n');$('warnings').hidden=!warnings.length;$('sourcehint').textContent='Loaded';render();if(announce)notify('Loaded '+snapshot.name);
}
function renameSnapshot(id){
 const old=cvHistory.find(s=>s.id===id);if(!old)return;const name=prompt('Rename CV',old.name);if(name===null||!name.trim())return;
 writeHistory(cvHistory.map(s=>s.id===id?{...s,name:name.trim().slice(0,100),autoName:false}:s));
}
function renderHistory(){
 $('historycount').textContent=String(cvHistory.length);const list=$('historylist');list.replaceChildren();
 if(!cvHistory.length){list.append(el('p','history-note',historyError||'No saved CVs.'));return}
 for(const snapshot of cvHistory){
  const row=el('div','history-row'),load=el('button','history-load');load.type='button';load.append(el('span','history-title',snapshot.name),el('span','history-date',new Intl.DateTimeFormat(undefined,{dateStyle:'medium',timeStyle:'short'}).format(new Date(snapshot.exportedAt))));load.title='Load '+snapshot.name+' · '+snapshot.style+' · '+snapshot.font;load.onclick=()=>loadSnapshot(snapshot);
  const rename=el('button','history-rename','Rename');rename.type='button';rename.setAttribute('aria-label','Rename '+snapshot.name);rename.onclick=()=>renameSnapshot(snapshot.id);
  row.append(load,el('span','history-format',snapshot.format.toUpperCase()),rename);list.append(row);
 }list.append(el('p','history-note','Saved in this browser.'));
}
function exportFilename(snapshot,extension){const title=snapshot.name.normalize('NFKC').replace(/[^\p{L}\p{N}]+/gu,'-').replace(/^-|-$/g,'').slice(0,70)||'cv';return title+'-'+snapshot.style+'-'+snapshot.exportedAt.slice(0,19).replace(/[T:]/g,'-')+'.'+extension}
function canExport(){return sections.some(selectedSection)&&$('source').value===appliedMarkdown&&!pdfBusy}
function exportText(format){
 if(!canExport())return;const snapshot=captureSnapshot(format),text=format==='tex'?generateLatex():selectedMarkdown();
 download(exportFilename(snapshot,format),text,format==='tex'?'application/x-tex;charset=utf-8':'text/markdown;charset=utf-8');if(saveSnapshot(snapshot))notify('Downloaded · saved to My CVs');
}
// Local, vector PDF export. Fonts and their glyph metrics are bundled offline.
async function generatePDF(snapshot){
 const {PDFDocument,PDFName,PDFString,rgb}=PDFLib;
 const model=snapshotSections(snapshot),cfg=STYLES[snapshot.style],assets=CV_PDF_ASSETS[snapshot.font];
 const document=await PDFDocument.create();
 document.setTitle(snapshot.name);document.setCreator('CV Studio');document.setCreationDate(new Date(snapshot.exportedAt));
 const fontMetadata=new WeakMap();
 document.registerFontkit({create:bytes=>{
  const meta=fontMetadata.get(bytes);if(!meta)throw new Error('Font data is unavailable.');
  const glyphForCodePoint=cp=>{const value=meta.cmap[cp];if(!value)throw new Error('Font does not support U+'+cp.toString(16).toUpperCase()+'. Export TeX for custom font support.');return {id:value[0],advanceWidth:value[1],codePoints:[cp]}};
  return {...meta,cff:false,post:{isFixedPitch:meta.fixedPitch},head:{macStyle:{italic:meta.italic}},'OS/2':{sFamilyClass:meta.serif?1:0},characterSet:Object.keys(meta.cmap).map(Number),glyphForCodePoint,layout:text=>({glyphs:Array.from(text,c=>glyphForCodePoint(c.codePointAt(0)))})};
 }});
 const fonts={};
 for(const kind of ['regular','bold','italic']){
  if(!assets[kind]){fonts[kind]=fonts.regular;continue}
  const bytes=Uint8Array.from(atob(assets[kind].data),c=>c.charCodeAt(0));fontMetadata.set(bytes,assets[kind].meta);
  fonts[kind]=await document.embedFont(bytes,{subset:false});
 }
 const W=595.28,H=841.89,margin=cfg.margin*28.3464567,width=W-2*margin;
 const ink=rgb(.13,.14,.14),blue=rgb(.145,.31,.45),muted=rgb(.33,.35,.36),pale=rgb(.933,.949,.961),linkColor=snapshot.style==='minimal'?ink:blue;
 let page,y;
 function newPage(){page=document.addPage([W,H]);y=H-margin-12}
 function ensure(height){if(y-height<margin)newPage()}
 function annotate(href,x,baseline,w,size){
  if(!href||w<=0)return;
  const annotation=document.context.obj({Type:'Annot',Subtype:'Link',Rect:[x,baseline-2,x+w,baseline+size],Border:[0,0,0],A:{Type:'Action',S:'URI',URI:PDFString.of(href)}});
  page.node.addAnnot(document.context.register(annotation));
 }
 function linesFor(runs,font,size,maxWidth){
  const result=[];let parts=[],used=0;
  const measure=t=>font.widthOfTextAtSize(t,size);
  function flush(){while(parts.length){parts[parts.length-1].text=parts[parts.length-1].text.trimEnd();if(parts[parts.length-1].text)break;parts.pop()}if(parts.length)result.push({parts,width:parts.reduce((sum,p)=>sum+measure(p.text),0)});parts=[];used=0}
  function add(text,href){if(!parts.length)text=text.trimStart();if(!text)return;const last=parts[parts.length-1];if(last&&last.href===href)last.text+=text;else parts.push({text,href});used+=measure(text)}
  for(const run of runs)for(const token of run.text.match(/\S+\s*|\s+/g)||[]){
   const tokenWidth=measure(token);if(used&&used+tokenWidth>maxWidth)flush();
   if(tokenWidth<=maxWidth){add(token,run.href);continue}
   for(const c of Array.from(token)){if(used&&used+measure(c)>maxWidth)flush();add(c,run.href)}
  }flush();return result;
 }
 function flow(runs,options={}){
  const font=options.font||fonts.regular,size=options.size||cfg.size,indent=options.indent||0,maxWidth=options.width||width-indent,leading=options.leading||1.25;
  for(const line of linesFor(runs,font,size,maxWidth)){
   ensure(size*leading+2);let x=margin+indent+(options.align==='center'?(maxWidth-line.width)/2:0);
   for(const part of line.parts){const w=font.widthOfTextAtSize(part.text,size);page.drawText(part.text,{x,y,size,font,color:part.href?linkColor:options.color||ink});annotate(part.href,x,y,w,size);x+=w}
   y-=size*leading;
  }
 }
 const plain=text=>[{text}];
 function linked(text,key=''){const value=linkParts(text,key);return [{text:value.label,href:value.href}]}
 newPage();
 const infos=model.filter(s=>s.name==='Information'),leaves=infos.flatMap(s=>s.entries.flatMap(e=>e.leaves.filter(l=>l.selected))),names=leaves.filter(l=>l.key.toLowerCase()==='name'),contacts=leaves.filter(l=>l.key.toLowerCase()!=='name');
 const centered=['autocv','classic'].includes(snapshot.style);
 if(snapshot.style==='modern'){page.drawRectangle({x:margin,y:y+5,width,height:2,color:blue});y-=30}
 if(names.length){const runs=[];names.forEach((l,i)=>{if(i)runs.push({text:' / '});runs.push(...linked(l.text,l.key))});flow(runs,{size:snapshot.style==='compact'?24:30,font:['classic','modern','compact'].includes(snapshot.style)?fonts.bold:fonts.regular,align:centered?'center':'left',color:snapshot.style==='modern'?blue:ink,leading:1.22});y-=5}
 if(contacts.length){const runs=[];contacts.forEach((l,i)=>{if(i)runs.push({text:'  |  '});runs.push(...linked(l.text,l.key))});flow(runs,{size:9.5,align:centered?'center':'left',leading:1.45});y-=4}
 for(const s of infos)for(const e of s.entries)if(e.title&&e.selected)flow(plain(e.title),{size:cfg.size,align:centered?'center':'left'});
 if(snapshot.style==='classic'){y-=4;page.drawLine({start:{x:margin,y},end:{x:W-margin,y},thickness:.9,color:ink});y-=6}
 if(snapshot.style==='minimal')y-=10;
 for(const section of model){
  if(section.name==='Information'||!selectedSection(section))continue;
  ensure(80);y-=cfg.gap*.7;const headingBaseline=y;
  const name=['autocv','classic','academic','compact'].includes(snapshot.style)?section.name.toUpperCase():section.name;
  const headingSize=snapshot.style==='autocv'?14:snapshot.style==='minimal'?15:12;
  if(snapshot.style==='modern'){const height=linesFor(plain(name),fonts.bold,headingSize,width-16).length*headingSize*1.25+4;page.drawRectangle({x:margin,y:y-height+headingSize,width,height,color:pale})}
  flow(plain(name),{size:headingSize,font:snapshot.style==='minimal'?fonts.italic:['classic','modern','compact'].includes(snapshot.style)?fonts.bold:fonts.regular,align:snapshot.style==='classic'?'center':'left',color:snapshot.style==='modern'?blue:ink,indent:snapshot.style==='modern'?8:0,width:snapshot.style==='modern'?width-16:width});
  if(['autocv','academic','compact'].includes(snapshot.style))page.drawLine({start:{x:margin,y:headingBaseline-4},end:{x:W-margin,y:headingBaseline-4},thickness:snapshot.style==='academic'?.3:.6,color:ink});
  y-=5;const indent=snapshot.style==='academic'?10:0;
  for(const entry of section.entries){
   if(!selectedEntry(entry))continue;ensure(34);const dates=dateLeaves(entry),hasTitle=entry.title&&entry.selected;
   if(hasTitle){
    const font=snapshot.style==='minimal'?fonts.regular:fonts.bold,dateText=dates.map(l=>l.text).join(' / '),dateWidth=fonts.regular.widthOfTextAtSize(dateText,cfg.size-1);
    if(dateText&&dateWidth<width*.45){page.drawText(dateText,{x:W-margin-dateWidth,y,size:cfg.size-1,font:fonts.regular,color:muted});flow(plain(entry.title),{font,indent,width:width-indent-dateWidth-14})}
    else{flow(plain(entry.title),{font,indent});if(dateText)flow(plain(dateText),{indent,size:cfg.size-1,color:muted})}
    y-=1;
   }
   for(const leaf of entry.leaves.filter(l=>l.selected)){
    if(hasTitle&&dates.includes(leaf))continue;
    if(leaf.kind==='bullet'){
     ensure(cfg.size*1.35+2);page.drawText('•',{x:margin+indent+2,y,size:cfg.size,font:fonts.regular,color:ink});flow(linked(leaf.text),{indent:indent+13});
    }else if(leaf.kind==='field'){
     const hide=['url','link','website','email','phone','username','github','gitlab','linkedin','orcid','scholar'].includes(leaf.key.toLowerCase());
     const runs=[...(hide?[]:[{text:leaf.key+': '}]),...linked(leaf.text,leaf.key)];flow(runs,{indent,font:fonts.italic,size:cfg.size-1,color:muted});
    }else{flow(linked(leaf.text),{indent});y+=cfg.space>5?-3:0}
   }y+=snapshot.style==='compact'?-1:-2;
  }
 }
 return document.save();
}

$('parse').onclick=()=>{apply();notify('Applied')};
$('source').oninput=()=>{$('sourcehint').textContent=$('source').value===appliedMarkdown?'Applied':'Apply to export';updateExportButtons()};
$('sample').onclick=()=>{if($('source').value!==SAMPLE&&!confirm('Replace your current Markdown with the sample?'))return;$('source').value=SAMPLE;autoName=true;refreshDefaultName();apply()};
$('file').onchange=async event=>{const f=event.target.files[0];if(!f)return;if(f.size>2*1024*1024){notify('Please use a Markdown file smaller than 2 MB.');event.target.value='';return}try{$('source').value=await f.text();apply();notify('Opened '+f.name)}catch{notify('Could not read this file. Try pasting its text.')}event.target.value=''};
$('all').onclick=()=>{sections.forEach(s=>setSection(s,true));render()};$('none').onclick=()=>{sections.forEach(s=>setSection(s,false));render()};$('template').onchange=render;$('font').onchange=render;
function tab(tex){$('preview').hidden=tex;$('latex').hidden=!tex;$('previewtab').setAttribute('aria-selected',String(!tex));$('textab').setAttribute('aria-selected',String(tex))}
$('previewtab').onclick=()=>tab(false);$('textab').onclick=()=>tab(true);
for(const id of ['previewtab','textab'])$(id).onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();const tex=e.key==='End'||(e.key!=='Home'&&id==='previewtab');tab(tex);$(tex?'textab':'previewtab').focus()}};
$('copy').onclick=async()=>{try{await navigator.clipboard.writeText(generateLatex());notify('LaTeX copied.')}catch{tab(true);$('latex').focus();$('latex').select();notify('Press Ctrl+C or ⌘C to copy the selected LaTeX.')}};
$('download').onclick=()=>exportText('tex');$('sampledownload').onclick=()=>download('cv-sample.md',SAMPLE,'text/markdown;charset=utf-8');$('selectedmd').onclick=()=>exportText('md');
$('savecv').onclick=()=>{if(canExport()&&saveSnapshot(captureSnapshot('cv')))notify('Saved a new CV')};
$('pdfdownload').onclick=async()=>{
 if(!canExport())return;const snapshot=captureSnapshot('pdf');pdfBusy=true;updateExportButtons();$('pdfdownload').textContent='Creating PDF…';
 try{const bytes=await generatePDF(snapshot);download(exportFilename(snapshot,'pdf'),bytes,'application/pdf');if(saveSnapshot(snapshot))notify('PDF downloaded · saved to My CVs')}
 catch(error){notify('PDF export failed: '+(error.message||'Please try again.'))}
 finally{pdfBusy=false;$('pdfdownload').textContent='Download .pdf ↓';updateExportButtons()}
};
if(typeof window!=='undefined')window.addEventListener('storage',event=>{if(event.key===HISTORY_KEY||event.key===null){cvHistory=readHistory();renderHistory();refreshDefaultName()}});
$('cvname').oninput=()=>{autoName=!$('cvname').value.trim()};
$('source').value=SAMPLE;apply();cvHistory=readHistory();renderHistory();refreshDefaultName();
