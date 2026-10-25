const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'test-output');fs.mkdirSync(out,{recursive:true});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const script=fs.readFileSync(path.join(root,'assets/app.js'),'utf8');
new vm.Script(script);
// Both a user domain and a repository subpath must resolve every bundled asset.
const refs=Array.from(html.matchAll(/(?:href|src)="([^"]+)"/g),m=>m[1]);
const css=fs.readFileSync(path.join(root,'assets/styles.css'),'utf8');
const fontRefs=Array.from(css.matchAll(/url\(['"]?([^'")]+)['"]?\)/g),m=>m[1]);
assert.equal(fontRefs.length,10);
for(const base of ['https://example.github.io/','https://example.github.io/cv-studio/']){
 const baseURL=new URL(base);
 for(const [ref,from] of [...refs.map(ref=>[ref,base]),...fontRefs.map(ref=>[ref,new URL('./assets/styles.css',base).href])]){
  assert.ok(!/^(?:[a-z]+:|\/)/i.test(ref),'Asset must be relative: '+ref);
  const resolved=new URL(ref,from);assert.equal(resolved.origin,baseURL.origin);
  assert.ok(resolved.pathname.startsWith(baseURL.pathname));
  const local=path.join(root,decodeURIComponent(resolved.pathname.slice(baseURL.pathname.length)));
  assert.ok(fs.existsSync(local),'Missing asset: '+local);
 }
}
for(const ref of fontRefs){const font=fs.readFileSync(path.resolve(root,'assets',ref));assert.equal(font.subarray(0,4).toString(),'wOFF')}
const ids=new Set(Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]));
for(const match of script.matchAll(/\$\('([^']+)'\)/g))assert.ok(ids.has(match[1]),'Missing interface element: '+match[1]);
assert.ok(fs.existsSync(path.join(root,'.nojekyll')));
console.log('PASS: all static assets, fonts, interface IDs, and GitHub Pages root/repository paths.');
const controls={template:{value:'classic'},font:{value:'roman'}};
const context=vm.createContext({document:{getElementById:id=>controls[id]},setTimeout,clearTimeout,URL});
vm.runInContext(script.slice(0,script.indexOf("$('parse').onclick=")),context);
const run=code=>vm.runInContext(code,context);
run('sections=parseMarkdown(SAMPLE).sections');
assert.equal(run('sections.length'),8);
assert.equal(run('parseMarkdown(SAMPLE).warnings.length'),0);
assert.equal(run('sections[1].entries[0].title'),'BSc in Computer Science');
assert.match(run('generateLatex()'),/35\\%/);
assert.match(run('selectedMarkdown()'),/## Publications/);
run("setSection(sections.find(s=>s.name==='Publications'),false)");
assert.doesNotMatch(run('generateLatex()'),/Student Research Symposium/);
assert.doesNotMatch(run('selectedMarkdown()'),/## Publications/);
run("sections.find(s=>s.name==='Projects').entries[0].leaves.find(l=>l.text.includes('35%')).selected=false");
assert.doesNotMatch(run('generateLatex()'),/35\\%/);
assert.match(run('generateLatex()'),/1,000 research abstracts/);
run('sections.forEach(s=>setSection(s,false))');
assert.doesNotMatch(run('generateLatex()'),/\\section\*/);
assert.equal(run('selectedMarkdown()'),'');
const tricky='## Information\r\n- Name: Ada & Co_{x} 100% $5 #1 ~ ^ \\input{evil}\r\n\r\n## Skills\r\n- C++ & Python\r\n\r\n## Custom\r\nA paragraph\r\ncontinued.\r\n\r\nAnother paragraph.\r\n\r\n### Title only';
context.fixture=tricky;
assert.equal(run('parseMarkdown(fixture).warnings.length'),1);
run('sections=parseMarkdown(fixture).sections');
assert.equal(run('sections[2].entries[0].leaves[0].text'),'A paragraph continued.');
assert.match(run('generateLatex()'),/\\textbackslash\{\}input\\\{evil\\\}/);
assert.match(run('generateLatex()'),/\\textbf\{Title only\}/);
context.duplicate='## Skills\n- One\n## Skills\n- Two';
context.bom='\uFEFF## Skills\r\n- One';
context.preface='before section\n## Skills\n- One';
assert.equal(run('parseMarkdown(duplicate).sections.length'),2);
assert.equal(run('parseMarkdown(bom).sections.length'),1);
assert.equal(run('parseMarkdown(preface).warnings.length'),1);
context.hashTitle='## Projects\n### C#\n- A compiler project';
assert.equal(run('parseMarkdown(hashTitle).sections[0].entries[0].title'),'C#');
assert.equal(run("parseMarkdown('   ').sections.length"),0);
run('sections=parseMarkdown(SAMPLE).sections');
const selection=run('selectedMarkdown()');
context.roundtrip=selection;
assert.equal(run('parseMarkdown(roundtrip).sections.length'),8);
for(const layout of ['autocv','classic','academic','modern','compact','minimal']){
 controls.template.value=layout;
 fs.writeFileSync(out+'/cv-'+layout+'.tex',run('generateLatex()'));
}
fs.writeFileSync(out+'/escape.tex',run('sections=parseMarkdown(fixture).sections;generateLatex()'));
fs.writeFileSync(out+'/sample.md',run('SAMPLE'));
console.log('PASS: parser, selection, escaping, empty states, Markdown round trip; generated six LaTeX layouts.');

// Exercise the complete startup and user flows with a minimal DOM, without a browser.
class Element{
 constructor(tag='div'){this.tagName=tag;this.children=[];this.attrs={};this.hidden=false;this.value='';this.checked=false;this.indeterminate=false;this.style={setProperty:(key,value)=>this.style[key]=value};this.className='';this.classList={add:name=>{this.className+=' '+name}};this.events={};this._text='';}
 get textContent(){return this._text+this.children.map(c=>c.textContent||'').join('')}
 set textContent(value){this._text=value;this.children=[]}
 append(...nodes){this.children.push(...nodes)}
 replaceChildren(...nodes){this.children=[...nodes]}
 setAttribute(key,value){this.attrs[key]=value}
 addEventListener(event,callback){this.events[event]=callback}
 focus(){}
 select(){}
 remove(){}
 click(){if(this.onclick)this.onclick()}
}
const domIds={};
const doc={getElementById:id=>domIds[id]||(domIds[id]=new Element()),createElement:tag=>new Element(tag),body:new Element()};
doc.getElementById('template').value='classic';
doc.getElementById('font').value='roman';
doc.getElementById('cvname').value='Untitled CV';
const localData=new Map();let storageFails=false,promptReply='Renamed CV';
const localStore={getItem:key=>localData.has(key)?localData.get(key):null,setItem:(key,value)=>{if(storageFails)throw new Error('QuotaExceededError');localData.set(key,value)}};
const full=vm.createContext({document:doc,setTimeout:()=>0,clearTimeout,confirm:()=>true,prompt:()=>promptReply,URL,localStorage:localStore,atob});
vm.runInContext(script,full);
assert.match(domIds.count.textContent,/\d+ \/ \d+/);
assert.equal(domIds.selection.children.length,8);
assert.match(domIds.latex.value,/Alex Morgan/);
domIds.none.click();
assert.equal(domIds.download.disabled,true);
assert.equal(domIds.preview.children[0].textContent,'No content selected.');
domIds.all.click();
assert.equal(domIds.download.disabled,false);
domIds.textab.click();
assert.equal(domIds.latex.hidden,false);
assert.equal(domIds.preview.hidden,true);
domIds.previewtab.click();
assert.equal(domIds.preview.hidden,false);
domIds.template.value='compact';domIds.template.onchange();
assert.match(domIds.latex.value,/Latin Modern Roman/);
domIds.font.value='sans';domIds.font.onchange();
assert.match(domIds.latex.value,/Latin Modern Sans/);
// A real checkbox listener must affect the generated output.
const projectSection=domIds.selection.children[7];
const entry=projectSection.children[1];
const bullet=entry.children.at(-1).children[0];
bullet.checked=false;bullet.events.change();
assert.doesNotMatch(domIds.latex.value,/35\\%/);
// Imported script-like text stays literal text in the preview and is escaped for TeX.
domIds.source.value='## Objective\n<script>alert(1)</'+'script> & 50%';
domIds.parse.click();
assert.match(domIds.preview.textContent,/<script>/);
assert.match(domIds.latex.value,/\\& 50\\%/);
domIds.source.value='';domIds.parse.click();
assert.equal(domIds.download.disabled,true);
console.log('PASS: complete startup, checkbox interaction, tabs, layout switch, empty state, and literal HTML handling.');

// The selected typeface must remain independent of all six style choices.
run('sections=parseMarkdown(SAMPLE).sections');
const outputs=new Set();
for(const layout of ['autocv','classic','academic','modern','compact','minimal']){
 for(const [key,font] of [['roman','Latin Modern Roman'],['sans','Latin Modern Sans'],['mono','Latin Modern Mono']]){
  controls.template.value=layout;controls.font.value=key;
  const tex=run('generateLatex()');
  assert.ok(tex.includes('\\setmainfont{'+font+'}'));
  assert.ok(tex.includes('\\href{mailto:alex@example.com}{alex@example.com}'));
  assert.ok(tex.includes('\\href{https://github.com/alexmorgan}{alexmorgan}'));
  assert.ok(tex.includes('\\href{https://www.linkedin.com/in/alex-morgan}{alex-morgan}'));
  assert.ok(tex.includes('\\href{tel:+966500000000}{+966 50 000 0000}'));
  assert.ok(tex.includes('\\href{https://example.com/}{example.com}'));
  assert.ok(tex.includes('BSc in Computer Science'));
  assert.ok(tex.includes('2022–2026'));
  assert.equal(tex.split('2022–2026').length-1,1);
  assert.equal(tex.split('\\begin{document}').length-1,1);
  assert.equal(tex.split('\\end{document}').length-1,1);
  outputs.add(tex);
 }
}
assert.equal(outputs.size,18);
const links=[
 ['alex@example.com','Email','mailto:alex@example.com'],
 ['@alex-morgan','GitHub','https://github.com/alex-morgan'],
 ['alex_morgan','Username','https://github.com/alex_morgan'],
 ['alex-morgan','LinkedIn','https://www.linkedin.com/in/alex-morgan'],
 ['linkedin.com/in/alex-morgan','LinkedIn','https://linkedin.com/in/alex-morgan'],
 ['[Portfolio](https://example.com/work?x=1&y=2#demo)','Website','https://example.com/work?x=1&y=2#demo'],
 ['+966 (50) 000-0000','Phone','tel:+966500000000'],
 ['0000-0002-1825-0097','ORCID','https://orcid.org/0000-0002-1825-0097']
];
for(const [text,key,href] of links){context.linkText=text;context.linkKey=key;assert.equal(run('linkParts(linkText,linkKey).href'),href)}
for(const target of ['javascript:alert(1)','data:text/html,<script>','file:///etc/passwd','https://user:secret@example.com','https://example.com/\nnext']){
 context.linkText='[Click]('+target+')';
 assert.equal(run('linkParts(linkText).href'),null);
}
context.linkText='[A&B_#](https://example.com/a_b?x=1&y=50%25#top)';
assert.equal(run('texLink(linkText)'),String.raw`\href{https://example.com/a\_b?x=1\&y=50\%25\#top}{A\&B\_\#}`);
domIds.source.value=run('SAMPLE');domIds.parse.click();
const walk=n=>[n,...n.children.flatMap(walk)];
const anchors=walk(domIds.preview).filter(n=>n.tagName==='a');
assert.ok(anchors.some(n=>n.href==='mailto:alex@example.com'));
assert.ok(anchors.some(n=>n.href==='https://github.com/alexmorgan'));
assert.ok(anchors.some(n=>n.href==='https://www.linkedin.com/in/alex-morgan'));
assert.ok(anchors.some(n=>n.href==='tel:+966500000000'));
assert.ok(anchors.filter(n=>/^https?:/.test(n.href)).every(n=>n.rel==='noopener noreferrer'));
console.log('PASS: 18 layout/font combinations, contact anchors in preview and TeX, URL escaping and unsafe-link rejection.');

const inApp=code=>vm.runInContext(code,full);
full.downloads=[];
inApp('download=(name,data,type)=>downloads.push({name,data,type})');
assert.match(domIds.cvname.value,/^\d{4}-\d{2}-\d{2}$/);
assert.equal(run('localDateName(new Date(2026,0,2,23,59))'),'2026-01-02');
run("cvHistory=[{name:'2026-10-26'},{name:'2026-10-26 (1)'},{name:'2026-10-25 (9)'}]");
assert.equal(run('nextDefaultName(new Date(2026,9,26))'),'2026-10-26 (2)');
assert.equal(run('nextDefaultName(new Date(2026,9,27))'),'2026-10-27');
run('cvHistory=[]');
const dateName=domIds.cvname.value;
domIds.savecv.click();assert.equal(inApp('cvHistory[0].name'),dateName);
const dateFirstId=inApp('cvHistory[0].id');
assert.equal(domIds.cvname.value,dateName+' (1)');
domIds.savecv.click();assert.equal(inApp('cvHistory[0].name'),dateName+' (1)');
domIds.download.click();assert.equal(inApp('cvHistory[0].name'),dateName+' (2)');
full.dateFirstId=dateFirstId;
inApp('loadSnapshot(cvHistory.find(s=>s.id===dateFirstId))');
assert.equal(domIds.cvname.value,dateName);
domIds.savecv.click();assert.equal(inApp('cvHistory[0].name'),dateName+' (3)');
assert.notEqual(inApp('cvHistory[0].id'),dateFirstId);
assert.equal(inApp('cvHistory.find(s=>s.id===dateFirstId).name'),dateName);
localData.clear();inApp('cvHistory=[];autoName=true;refreshDefaultName();renderHistory()');
console.log('PASS: local YYYY-MM-DD defaults, zero padding, daily rollover, unique counters, and new names after restoring old automatic names.');
domIds.cvname.value='Research CV';domIds.cvname.oninput();domIds.template.value='academic';domIds.font.value='mono';
inApp("setSection(sections.find(s=>s.name==='Publications'),false);[sections[1],sections[7]]=[sections[7],sections[1]];render()");
const expectedTex=inApp('generateLatex()'),expectedMarkdown=domIds.source.value;
domIds.savecv.click();
assert.equal(inApp('cvHistory.length'),1);
const first=JSON.parse(inApp('JSON.stringify(cvHistory[0])'));
assert.equal(first.name,'Research CV');
assert.equal(first.style,'academic');assert.equal(first.font,'mono');
assert.equal(first.markdown,expectedMarkdown);assert.ok(Date.parse(first.exportedAt));
domIds.savecv.click();assert.equal(inApp('cvHistory.length'),2);
assert.notEqual(inApp('cvHistory[0].id'),first.id);
domIds.download.click();assert.equal(inApp('cvHistory.length'),3);
assert.equal(inApp('cvHistory[0].format'),'tex');
assert.equal(full.downloads.at(-1).data,expectedTex);
assert.match(full.downloads.at(-1).name,/^Research-CV-academic-.*\.tex$/);
domIds.selectedmd.click();assert.equal(inApp('cvHistory.length'),4);
assert.equal(inApp('cvHistory[0].format'),'md');
inApp('sections.forEach(s=>setSection(s,false));render()');
full.firstId=first.id;
inApp('loadSnapshot(cvHistory.find(s=>s.id===firstId))');
assert.equal(inApp('generateLatex()'),expectedTex);
assert.equal(domIds.source.value,expectedMarkdown);
assert.equal(domIds.template.value,'academic');assert.equal(domIds.font.value,'mono');
inApp('renameSnapshot(firstId)');
assert.equal(inApp('cvHistory.length'),4);
assert.equal(inApp('cvHistory.find(s=>s.id===firstId).name'),'Renamed CV');
assert.equal(inApp('cvHistory.find(s=>s.id===firstId).exportedAt'),first.exportedAt);
const storedBefore=localData.get('cv-studio.history.v1');
inApp('cvHistory=[];cvHistory=readHistory();loadSnapshot(cvHistory.find(s=>s.id===firstId))');
assert.equal(inApp('generateLatex()'),expectedTex);
assert.equal(domIds.cvname.value,'Renamed CV');
domIds.source.value+='\nUnapplied changes';domIds.source.oninput();
assert.equal(domIds.download.disabled,true);assert.equal(domIds.pdfdownload.disabled,true);assert.equal(domIds.savecv.disabled,true);
domIds.download.click();assert.equal(inApp('cvHistory.length'),4);
domIds.source.value=inApp('appliedMarkdown');domIds.source.oninput();
assert.equal(domIds.download.disabled,false);
storageFails=true;const nDownloads=full.downloads.length;domIds.download.click();
assert.equal(full.downloads.length,nDownloads+1);assert.equal(inApp('cvHistory.length'),4);
storageFails=false;localData.set('cv-studio.history.v1','broken JSON');
assert.equal(inApp('readHistory().length'),0);assert.equal(inApp('historyWritable'),false);
assert.equal(inApp('saveSnapshot(captureSnapshot("cv"))'),false);
assert.equal(localData.get('cv-studio.history.v1'),'broken JSON');
localData.set('cv-studio.history.v1',storedBefore);inApp('cvHistory=readHistory();renderHistory()');
assert.equal(inApp('historyWritable'),true);
console.log('PASS: append-only snapshots, export history, renaming, restored Markdown/checks/order/style/font, reload, dirty-source guard, quota and corrupted-storage handling.');

async function verifyPDFs(){
 const historyBeforeImport=inApp('cvHistory.length');
 const imported='## Information\n- Name: Imported CV\n\n## Skills\n- Python\n';
 await domIds.file.onchange({target:{files:[{name:'import.md',size:imported.length,text:async()=>imported}],value:'import.md'}});
 assert.equal(domIds.source.value,imported);assert.match(domIds.latex.value,/Imported CV/);
 assert.equal(inApp('cvHistory.length'),historyBeforeImport);
 let readOversized=false;
 await domIds.file.onchange({target:{files:[{name:'too-big.md',size:3*1024*1024,text:async()=>{readOversized=true;return ''}}],value:'too-big.md'}});
 assert.equal(readOversized,false);assert.equal(domIds.source.value,imported);
 await domIds.file.onchange({target:{files:[{name:'unreadable.md',size:1,text:async()=>{throw new Error('read failed')}}],value:'unreadable.md'}});
 assert.equal(domIds.source.value,imported);
 console.log('PASS: Markdown file import, unreadable file recovery, and oversized file rejection.');
 vm.runInContext(fs.readFileSync(path.join(root,'assets/pdf-fonts.js'),'utf8'),full);
 vm.runInContext(fs.readFileSync(path.join(root,'assets/vendor/pdf-lib.min.js'),'utf8'),full);
 domIds.source.value=inApp('SAMPLE');domIds.parse.click();domIds.cvname.value='PDF QA';domIds.cvname.oninput();
 for(const layout of ['autocv','classic','academic','modern','compact','minimal'])for(const font of ['roman','sans','mono']){
  domIds.template.value=layout;domIds.font.value=font;
  const bytes=await inApp('generatePDF(captureSnapshot("pdf"))');
  assert.equal(Buffer.from(bytes).subarray(0,4).toString(),'%PDF');
  fs.writeFileSync(out+'/pdf-'+layout+'-'+font+'.pdf',bytes);
  full.cachedPDF=bytes;
 }
 const previousCount=inApp('cvHistory.length');
 inApp('const originalPDF=generatePDF;generatePDF=async()=>cachedPDF');
 await domIds.pdfdownload.onclick();
 assert.equal(inApp('cvHistory.length'),previousCount+1);
 assert.equal(inApp('cvHistory[0].format'),'pdf');
 assert.equal(full.downloads.at(-1).type,'application/pdf');
 inApp('generatePDF=async()=>{throw new Error("Test failure")}');
 await domIds.pdfdownload.onclick();
 assert.equal(inApp('cvHistory.length'),previousCount+1);
 assert.equal(inApp('pdfBusy'),false);
 inApp('generatePDF=originalPDF');
 console.log('PASS: actual offline PDF generation for all 18 style/font combinations; PDF export saves a new snapshot only on success.');
}
verifyPDFs().catch(error=>{console.error(error);process.exitCode=1});
