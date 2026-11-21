import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const out = dirname(fileURLToPath(import.meta.url));
const W = 390;
const H = 844;
const paper = '#FBFBF8';
const white = '#FFFFFF';
const ink = '#16161A';
const muted = '#5D5D63';
const seam = '#E9E6DC';
const green = '#0F7B4A';
const red = '#D1263B';
const blue = '#2F3CCF';

const esc = (s) => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const rect = (x,y,w,h,fill=white,stroke=seam,r=4,extra='') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" ${extra}/>`;
const line = (x1,y1,x2,y2,stroke=seam,width=1,dash='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${stroke}" stroke-width="${width}" ${dash ? `stroke-dasharray="${dash}"` : ''}/>`;
const txt = (x,y,s,size=14,weight=400,color=ink,anchor='start',family='IBM Plex Sans Thai,Arial,sans-serif',extra='') => `<text x="${x}" y="${y}" font-family="${family}" font-size="${size}" font-weight="${weight}" fill="${color}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const label = (x,y,s,color=muted) => txt(x,y,s.toUpperCase(),10,600,color,'start','IBM Plex Sans Thai,Arial,sans-serif','letter-spacing="1"');
const chip = (x,y,s,active=false,w=0) => { const ww=w||Math.max(72,s.length*7+28); return rect(x,y,ww,34,active?ink:white,active?ink:seam,17)+txt(x+ww/2,y+22,s,12,500,active?white:ink,'middle'); };
const button = (x,y,w,s,primary=false,disabled=false) => rect(x,y,w,44,primary?ink:white,primary?ink:seam,4,disabled?'opacity=".42"':'')+txt(x+w/2,y+28,s,14,600,primary?white:ink,'middle','IBM Plex Sans Thai,Arial,sans-serif',disabled?'opacity=".55"':'');
const dividerTitle = (y,s) => txt(16,y,s,18,600)+line(16,y+10,374,y+10,ink,2);
const search = (y=62,placeholder='ค้นหาสินค้าและร้านค้า') => rect(16,y,358,44,white,ink,4)+`<circle cx="34" cy="${y+22}" r="7" fill="none" stroke="${muted}" stroke-width="1.5"/><line x1="39" y1="${y+27}" x2="44" y2="${y+32}" stroke="${muted}" stroke-width="1.5"/>`+txt(54,y+27,placeholder,13,400,muted);
const header = (title='DynamicShopper',subtitle='มาตรฐาน') => rect(0,0,W,52,paper,seam,0)+txt(16,31,title,20,700)+label(218,29,subtitle)+txt(346,31,'TH',12,600)+`<path d="M372 18h-13l-3 16h18l3-11h-18" fill="none" stroke="${ink}" stroke-width="1.5"/>`;
const nav = (active='ร้าน') => {
  const items=[['ร้าน',28],['ค้นหา',104],['เทียบ',180],['ตะกร้า',256],['ฉัน',332]];
  return rect(0,782,W,62,white,seam,0)+items.map(([s,x])=>`<circle cx="${x}" cy="801" r="8" fill="none" stroke="${s===active?ink:muted}" stroke-width="1.6"/>`+txt(x,829,s,11,s===active?600:400,s===active?ink:muted,'middle')).join('');
};
const art = (x,y,w,h,type='mouse') => {
  let icon='';
  if(type==='mouse') icon=`<path d="M${x+w*.5} ${y+h*.2}c-${w*.16} 0-${w*.26} ${h*.16}-${w*.26} ${h*.34}v${h*.1}c0 ${h*.18} ${w*.11} ${h*.28} ${w*.26} ${h*.28}s${w*.26}-${h*.1} ${w*.26}-${h*.28}v-${h*.1}c0-${h*.18}-${w*.1}-${h*.34}-${w*.26}-${h*.34}z" fill="none" stroke="${ink}" stroke-width="2"/><line x1="${x+w*.5}" y1="${y+h*.2}" x2="${x+w*.5}" y2="${y+h*.46}" stroke="${ink}" stroke-width="2"/>`;
  if(type==='buds') icon=`<path d="M${x+w*.35} ${y+h*.28}c-${w*.12} 0-${w*.16} ${h*.1}-${w*.16} ${h*.2}s${w*.06} ${h*.18} ${w*.17} ${h*.18}h${w*.07}v-${h*.18}c0-${h*.11}-${w*.02}-${h*.2}-${w*.08}-${h*.2}zm${w*.3} 0c${w*.12} 0 ${w*.16} ${h*.1} ${w*.16} ${h*.2}s-${w*.06} ${h*.18}-${w*.17} ${h*.18}h-${w*.07}v-${h*.18}c0-${h*.11} ${w*.02}-${h*.2} ${w*.08}-${h*.2}z" fill="none" stroke="${ink}" stroke-width="2"/><line x1="${x+w*.35}" y1="${y+h*.45}" x2="${x+w*.35}" y2="${y+h*.7}" stroke="${ink}" stroke-width="5"/><line x1="${x+w*.65}" y1="${y+h*.45}" x2="${x+w*.65}" y2="${y+h*.7}" stroke="${ink}" stroke-width="5"/>`;
  if(type==='rice') icon=`<path d="M${x+w*.25} ${y+h*.35}h${w*.5}v${h*.36}q0 ${h*.1}-${w*.08} ${h*.1}h-${w*.34}q-${w*.08} 0-${w*.08}-${h*.1}zM${x+w*.32} ${y+h*.35}q${w*.18}-${h*.18} ${w*.36} 0" fill="none" stroke="${ink}" stroke-width="2"/><circle cx="${x+w*.5}" cy="${y+h*.55}" r="4" fill="${ink}"/>`;
  return rect(x,y,w,h,'#F2F0E9',seam,4)+icon;
};
const priceKey = (x,y,key='catalog.price') => txt(x,y,key,18,700,ink,'start','IBM Plex Mono,monospace');
const productCard = (x,y,w=171,name='Catalog item',type='mouse',layout='grid') => {
  if(layout==='row') return rect(x,y,w,112,white,seam,4)+art(x,y,104,112,type)+txt(x+118,y+27,name,15,600)+priceKey(x+118,y+52)+txt(x+118,y+76,'ข้อมูลจากรายการสินค้า',12,400,muted)+button(x+118,y+82,112,'ดูสินค้า',false);
  return rect(x,y,w,236,white,seam,4)+art(x,y,w,112,type)+txt(x+12,y+138,name,14,600)+priceKey(x+12,y+163)+line(x+12,y+176,x+w-12,y+176,muted,1,'4 4')+txt(x+12,y+195,'ส่ง • catalog.shipping',11,400,muted)+txt(x+12,y+216,'★ catalog.rating',11,400,muted);
};
const stamp = (x,y,s='ตรวจจากแคตตาล็อก') => rect(x,y,Math.max(128,s.length*7+24),28,'none',green,3,'stroke-width="1.5"')+txt(x+10,y+19,'✓ '+s,11,600,green);
const receipt = (x,y,w,title,rows=[],verified=false) => {
  const h=50+rows.length*28+(verified?38:0);
  let g=rect(x,y,w,h,white,seam,4)+label(x+14,y+22,title);
  rows.forEach((r,i)=>{ const yy=y+48+i*28; g+=txt(x+14,yy,r[0],12,400,r[2]||ink)+line(x+110,yy-4,x+w-92,yy-4,muted,1,'2 4')+txt(x+w-14,yy,r[1],12,500,r[2]||ink,'end','IBM Plex Mono,monospace'); });
  if(verified) g+=stamp(x+14,y+h-33,'ตรวจแล้ว');
  return g;
};
const phone = (title,section,body,active='ร้าน',mode='standard') => `<g>${txt(0,-18,title,15,600,ink)}${rect(0,0,W,H,mode==='minimal'?white:paper,ink,24,'stroke-width="2"')}${body}${nav(active)}</g>`;
const board = (title,subtitle,screens,filename,notes=[]) => {
  const gap=54, left=62, top=128;
  const width=left*2+screens.length*W+(screens.length-1)*gap;
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="1120" viewBox="0 0 ${width} 1120"><rect width="100%" height="100%" fill="#F1F0EB"/>${txt(left,54,title,30,700)}${txt(left,82,subtitle,14,400,muted)}${label(width-300,54,'DYNAMICSHOPPER • DRAFT V2')}`;
  screens.forEach((s,i)=>{svg+=`<g transform="translate(${left+i*(W+gap)} ${top})">${s}</g>`;});
  notes.forEach((n,i)=>{const x=left+i*((width-left*2)/notes.length);svg+=rect(x,1012,(width-left*2)/notes.length-16,72,white,seam,4)+label(x+14,1034,n[0])+txt(x+14,1060,n[1],12,400,muted);});
  svg+='</svg>';
  writeFileSync(join(out,filename),svg);
};

const baseline = phone('01 · ร้านมาตรฐาน','baseline',
  header('DynamicShopper','มาตรฐาน')+search()+dividerTitle(137,'สินค้าทั้งหมด')+
  chip(16,160,'ทั้งหมด',true)+chip(100,160,'เมาส์')+chip(181,160,'หูฟัง')+chip(266,160,'ครัว')+
  productCard(16,212,171,'Aero Mouse','mouse')+productCard(203,212,171,'Everyday Buds','buds')+
  productCard(16,462,358,'Simple Cooker','rice','row')+
  receipt(16,590,358,'แหล่งข้อมูล',[['ราคา','แคตตาล็อก'],['การจัดลำดับ','ตรรกะร้าน']],false)
);
const invite = phone('02 · คำเชิญแบบไม่บังคับ','baseline invite',
  header()+search()+dividerTitle(137,'สินค้าทั้งหมด')+productCard(16,160,171,'Aero Mouse','mouse')+productCard(203,160,171,'Everyday Buds','buds')+
  rect(16,420,358,210,white,ink,4,'stroke-width="1.5"')+label(32,450,'ปรับร้านให้เหมาะกับคุณ')+txt(32,487,'อยากให้ร้านช่วยคุณแบบไหน?',21,600)+txt(32,516,'ตอบสั้น ๆ หรือข้ามได้ ร้านยังใช้งานได้เหมือนเดิม',13,400,muted)+button(32,548,150,'เริ่มตั้งค่า',true)+button(194,548,150,'ไว้ทีหลัง')+txt(32,616,'ไม่เปลี่ยนราคา • ย้อนกลับได้',12,400,muted)
);
const interview1 = phone('03 · สัมภาษณ์: เป้าหมาย','interview',
  header('ตั้งค่าร้านของฉัน','ยกเลิก')+label(16,88,'คำถามแรก')+txt(16,122,'วันนี้คุณอยากช้อปแบบไหน?',22,600)+txt(16,150,'เลือกได้มากกว่าหนึ่งแบบ',13,400,muted)+
  rect(16,180,358,74,white,ink,4,'stroke-width="2"')+txt(34,210,'เปรียบเทียบก่อนเลือก',17,600)+txt(34,235,'ให้สเปกและความต่างมาก่อน',12,400,muted)+
  rect(16,266,358,74,white,seam,4)+txt(34,296,'ค้นพบของใหม่',17,600)+txt(34,321,'ใช้ภาพและรีวิวช่วยตัดสินใจ',12,400,muted)+
  rect(16,352,358,74,white,seam,4)+txt(34,382,'ซื้อให้เสร็จเร็ว',17,600)+txt(34,407,'ลดขั้นตอนและจำของที่ซื้อซ้ำ',12,400,muted)+
  rect(16,438,358,74,white,seam,4)+txt(34,468,'ซื้อให้คนอื่น',17,600)+txt(34,493,'ตัวเลือกน้อยลง แชร์ง่ายขึ้น',12,400,muted)+
  button(16,704,358,'ถัดไป',true)
);
const interview2 = phone('04 · สัมภาษณ์: วิธีรับข้อมูล','interview',
  header('ตั้งค่าร้านของฉัน','ยกเลิก')+label(16,88,'รูปแบบข้อมูล')+txt(16,122,'คุณอยากเห็นรายละเอียดแค่ไหน?',22,600)+
  rect(16,168,358,96,white,seam,4)+txt(34,200,'เรียบง่าย',17,600)+txt(34,226,'สรุปสั้น ตัวเลือกชัด',13,400,muted)+
  rect(16,278,358,96,white,ink,4,'stroke-width="2"')+txt(34,310,'สมดุล',17,600)+txt(34,336,'ภาพ ราคา สเปกหลัก และรีวิว',13,400,muted)+
  rect(16,388,358,96,white,seam,4)+txt(34,420,'ละเอียด',17,600)+txt(34,446,'ตารางเทียบและข้อมูลเชิงลึก',13,400,muted)+
  label(16,546,'การเข้าถึง')+chip(16,566,'ตัวอักษรใหญ่')+chip(148,566,'ลดการเคลื่อนไหว')+
  button(16,704,110,'ย้อนกลับ')+button(138,704,236,'ดูตัวอย่าง',true)
);
const preview = phone('05 · ตัวอย่างก่อนใช้','preview',
  header('ตัวอย่างร้าน','ยังไม่ใช้')+receipt(16,74,358,'สิ่งที่จะเปลี่ยน',[['หน้าแรก','เทียบก่อน'],['การ์ดสินค้า','สเปกก่อน'],['ความหนาแน่น','สมดุล']],false)+
  dividerTitle(240,'ตัวอย่างผลลัพธ์')+chip(16,264,'เปรียบเทียบ',true)+chip(130,264,'สเปกก่อน',true)+chip(232,264,'Undo')+
  rect(16,316,358,222,white,seam,4)+label(30,344,'เปรียบเทียบก่อน')+txt(30,376,'รายการสินค้าเดียวกัน',18,600)+line(30,394,360,394,ink,2)+txt(30,422,'ชื่อสินค้า',12,600)+txt(350,422,'ราคา',12,600,ink,'end')+line(30,438,360,438)+txt(30,466,'Aero Mouse',13,500)+txt(350,466,'catalog.price',12,500,ink,'end','IBM Plex Mono,monospace')+line(30,482,360,482)+txt(30,510,'Everyday Buds',13,500)+txt(350,510,'catalog.price',12,500,ink,'end','IBM Plex Mono,monospace')+
  button(16,672,110,'แก้ไข')+button(138,672,236,'ใช้กับร้านของฉัน',true)
);

board('A · First-run adaptation','เริ่มจากร้านมาตรฐาน → ขออนุญาต → สัมภาษณ์สั้น → แสดงตัวอย่างก่อนเปลี่ยน',[baseline,invite,interview1,interview2,preview],'adaptive-v2-01-onboarding.svg',[
  ['FAMILIAR FIRST','ไม่มีการเปลี่ยนร้านก่อนผู้ใช้เลือก'],['OPTIONAL','ข้ามได้และกลับมาทำทีหลังได้'],['EXPLICIT','คำตอบมีน้ำหนักเหนือการคาดเดา'],['ACCESSIBLE','ตัวอักษรใหญ่และลด motion เป็นตัวเลือก'],['REVERSIBLE','Preview • Undo • Reset']
]);

const adapted = phone('06 · ร้านหลังปรับครั้งแรก','seeded',
  header('DynamicShopper','ปรับแล้ว')+search(62,'gaming mouse')+chip(16,118,'สเปกก่อน',true)+chip(118,118,'เทียบง่าย',true)+chip(222,118,'Undo')+chip(300,118,'Reset')+
  receipt(16,166,358,'สิ่งที่เปลี่ยน',[['ส่วนแรก','เปรียบเทียบ'],['การ์ด','สเปกก่อน']],false)+
  dividerTitle(290,'เลือกจากความต่าง')+productCard(16,316,358,'Aero Mouse','mouse','row')+productCard(16,440,358,'Core Mouse','mouse','row')+
  stamp(16,584,'ตรวจข้อเท็จจริงแล้ว')+txt(16,636,'ผลิตภัณฑ์ยังอยู่บนหน้าเสมอ',13,400,muted)
);
const searchSpec = phone('07 · ผลค้นหาแบบสเปกก่อน','search results',
  header('ผลการค้นหา','สเปกก่อน')+search(62,'gaming mouse')+label(16,132,'เรียงด้วยตรรกะที่ตรวจสอบได้')+chip(16,150,'เบาก่อน',true)+chip(107,150,'แบตก่อน')+chip(202,150,'ทนทาน')+
  dividerTitle(226,'ผลลัพธ์')+productCard(16,250,358,'Aero Mouse','mouse','row')+productCard(16,374,358,'Core Mouse','mouse','row')+productCard(16,498,358,'Work Mouse','mouse','row')+
  rect(16,636,358,82,white,ink,4,'stroke-dasharray="6 4"')+label(30,660,'เหตุผลที่เรียงแบบนี้')+txt(30,690,'ความสำคัญ: น้ำหนัก → แบตเตอรี่ → ความทนทาน',13,500)
,'ค้นหา');
const compare = phone('08 · ตารางเปรียบเทียบ','compare',
  header('เปรียบเทียบ','สินค้าชุดเดิม')+label(16,82,'เหตุผลสำคัญก่อน')+rect(16,102,358,84,white,ink,4,'stroke-dasharray="6 4"')+txt(30,130,'น้ำหนัก',12,500)+rect(118,120,228,10,ink,ink,5)+txt(30,158,'แบตเตอรี่',12,500)+rect(118,148,170,10,ink,ink,5)+
  rect(16,204,358,424,white,seam,4)+label(28,232,'สินค้า')+txt(170,232,'Aero',12,600,ink,'middle')+txt(270,232,'Core',12,600,ink,'middle')+txt(352,232,'Work',12,600,ink,'end')+line(28,246,362,246,ink,2)+
  ['ราคา','น้ำหนัก','แบตเตอรี่','ประกัน','การจัดส่ง','ร้านค้า'].map((s,i)=>txt(28,280+i*54,s,12,500)+txt(170,280+i*54,'catalog',11,500,ink,'middle','IBM Plex Mono,monospace')+txt(270,280+i*54,'catalog',11,500,ink,'middle','IBM Plex Mono,monospace')+txt(352,280+i*54,'catalog',11,500,ink,'end','IBM Plex Mono,monospace')+line(28,292+i*54,362,292+i*54)).join('')+
  stamp(16,650,'ข้อเท็จจริงตรงกัน')
,'เทียบ','minimal');
const detail = phone('09 · หน้าสินค้าที่จัดข้อมูลใหม่','product detail',
  header('รายละเอียดสินค้า','สเปกก่อน')+art(16,64,358,206,'mouse')+txt(16,300,'Aero Mouse',22,600)+priceKey(16,332)+line(16,350,374,350,ink,1,'5 4')+
  label(16,378,'ข้อมูลที่คุณสนใจ')+receipt(16,394,358,'ข้อมูลสินค้า',[['น้ำหนัก','catalog.spec'],['แบตเตอรี่','catalog.spec'],['ประกัน','catalog.spec']],true)+
  label(16,590,'คำถามเกี่ยวกับสินค้า')+button(16,608,358,'ถามจากรายการสินค้า')+button(16,664,171,'ราคาดีที่สุด')+button(203,664,171,'เพิ่มตะกร้า',true)
,'ค้นหา');
const qa = phone('10 · ถามตอบพร้อมอ้างอิง','cited answer',
  header('ถามจากรายการสินค้า','ไม่เปลี่ยนร้าน')+rect(70,78,304,64,ink,ink,4)+txt(352,106,'ใช้ได้นานไหม?',14,500,white,'end')+txt(352,128,'คำถามของฉัน',11,400,'#C9C9CD','end')+
  txt(16,182,'ฉันยืนยันได้เฉพาะสิ่งที่อยู่ในรายการสินค้า',16,500)+receipt(16,208,358,'อ้างอิงจากรายการสินค้า',[['หัวข้อ','แบตเตอรี่'],['แหล่ง','สเปกสินค้า']],true)+
  rect(16,352,358,110,white,seam,4)+label(30,378,'ถ้าไม่มีข้อมูล')+txt(30,408,'ยืนยันเรื่องนี้จากรายการสินค้าไม่ได้',15,600)+txt(30,437,'คำตอบไม่เปลี่ยนหน้าและไม่จัดอันดับใหม่',12,400,muted)+
  label(16,522,'คำถามแนะนำ')+chip(16,542,'ประกันอย่างไร')+chip(142,542,'เหมาะกับงานไหม')+button(16,692,358,'กลับไปที่สินค้า',true)
,'ค้นหา');

board('B · Adaptive shopping','การเปลี่ยนแปลงที่มองเห็นได้ • ผลค้นหาแบบสเปก • เปรียบเทียบ • สินค้า • คำตอบมีแหล่งอ้างอิง',[adapted,searchSpec,compare,detail,qa],'adaptive-v2-02-shopping.svg',[
  ['EXPLAIN','ทุก adaptation มี What changed'],['DETERMINISTIC','การเรียงอ่านจาก priority เดียวกัน'],['SAME FACTS','สองมุมมองใช้ข้อมูลชุดเดียว'],['CATALOG-BOUND','ราคาและสเปกไม่ผ่าน AI'],['QUESTIONS DECLINE','ไม่มีอ้างอิงก็ไม่ยืนยัน']
]);

const basket = phone('11 · ตะกร้า','basket',
  header('ตะกร้า','มาตรฐาน')+productCard(16,72,358,'Aero Mouse','mouse','row')+productCard(16,196,358,'Everyday Buds','buds','row')+
  receipt(16,336,358,'สรุปตะกร้า',[['สินค้า','catalog.items'],['จัดส่ง','catalog.shipping']],false)+
  rect(16,458,358,104,white,seam,4)+label(30,484,'ของที่ใช้ร่วมกัน')+txt(30,516,'แสดงเมื่อเข้ากันได้และเพิ่มเองเท่านั้น',14,500)+button(30,530,140,'ดูตัวเลือก')+txt(330,556,'ซ่อน',12,500,muted,'end')+
  button(16,690,358,'หาราคาดีที่สุด',true)
,'ตะกร้า');
const deal = phone('12 · ใบเสร็จดีล','optimizer receipt',
  header('ราคาดีที่สุด','ตรรกะราคา')+receipt(16,74,358,'คำนวณจากแคตตาล็อก',[['ราคาสินค้า','optimizer.item'],['คูปองร้าน','optimizer.shop'],['คูปองส่ง','optimizer.shipping'],['เหรียญ','optimizer.coins'],['ยอดรวม','optimizer.total']],true)+
  rect(16,302,358,136,white,seam,4)+label(30,330,'คูปองที่ไม่ได้ใช้')+txt(30,360,'○ ไม่ถึงเงื่อนไขจากแคตตาล็อก',13,500)+txt(30,390,'○ ใช้ร่วมกับคูปองที่เลือกไม่ได้',13,500)+txt(30,420,'เหตุผลมาจาก optimizer เดียวกัน',11,400,muted)+
  rect(16,458,358,144,white,ink,4,'stroke-dasharray="6 4"')+label(30,486,'เฉพาะถ้าอยากได้เพิ่ม')+txt(30,518,'ของเสริมที่ปลดเงื่อนไขได้จริง',15,600)+txt(30,546,'ไม่เลือกไว้ก่อน • แสดงต้นทุนเพิ่มจริง',12,400,muted)+button(30,560,142,'ดูของเสริม')+
  button(16,684,358,'กลับไปตะกร้า',true)
,'ตะกร้า');
const complete = phone('13 · ครบชุดอย่างซื่อสัตย์','complete the set',
  header('ใช้ร่วมกันได้','เพิ่มเองเท่านั้น')+art(16,72,358,178,'mouse')+txt(16,278,'ชุดทำงานที่เข้ากันได้',20,600)+txt(16,304,'ตรวจจากประเภทสินค้าและข้อมูลรายการ',13,400,muted)+
  rect(16,330,358,90,white,seam,4)+txt(30,360,'แผ่นรองเมาส์',15,600)+txt(30,388,'เหตุผล: ใช้ร่วมกับสินค้าหลัก',12,400,muted)+button(254,350,104,'เพิ่มเอง')+
  rect(16,432,358,90,white,seam,4)+txt(30,462,'กระเป๋าจัดเก็บ',15,600)+txt(30,490,'เหตุผล: ปกป้องระหว่างเดินทาง',12,400,muted)+button(254,452,104,'เพิ่มเอง')+
  rect(16,544,358,72,white,ink,4,'stroke-dasharray="6 4"')+txt(30,574,'ไม่มีรายการใดถูกเลือกไว้ล่วงหน้า',13,600)+txt(30,598,'ซ่อนทั้งส่วนได้ทันที',12,400,muted)+button(16,682,358,'เสร็จแล้ว',true)
,'ตะกร้า');
const mom = phone('14 · ซื้อให้แม่','large print',
  header('ซื้อให้คนในครอบครัว','ตัวใหญ่')+label(16,84,'โหมดอ่านง่าย')+txt(16,118,'เลือกง่าย แชร์ง่าย',24,600)+txt(16,148,'ตัวเลือกน้อยลง แต่ข้อเท็จจริงเท่าเดิม',16,400,muted)+
  rect(16,178,358,142,white,seam,6)+art(16,178,120,142,'rice')+txt(154,214,'Simple Cooker',20,600)+priceKey(154,248)+txt(154,278,'ใช้งานง่าย',18,500)+
  rect(16,334,358,142,white,seam,6)+art(16,334,120,142,'rice')+txt(154,370,'Easy Cooker',20,600)+priceKey(154,404)+txt(154,434,'ข้อมูลชัดเจน',18,500)+
  button(16,510,358,'แชร์ให้ครอบครัว',true)+button(16,568,358,'ดูใบเสร็จราคา')+txt(16,650,'ภาษาไทย • เป้าหมายสัมผัสใหญ่ • ไม่มี motion',16,500)
,'ร้าน');
const share = phone('15 · ลิงก์แชร์ที่ไม่เปิดเผยข้อมูล','share',
  header('แชร์มุมมองร้าน','ข้อมูลส่วนตัวไม่ติดไป')+receipt(16,78,358,'สิ่งที่จะแชร์',[['รูปแบบ','ตัวอักษรใหญ่'],['ภาษา','ไทย'],['สินค้า','catalog ids']],false)+
  rect(16,236,358,126,white,seam,4)+label(30,264,'ไม่แชร์')+txt(30,296,'ประวัติสนทนา',14,500)+txt(30,324,'ตะกร้า • ที่อยู่ • พฤติกรรมส่วนตัว',14,500)+txt(30,348,'แชร์เฉพาะหน้าร้านที่จัดไว้',11,400,muted)+
  button(16,390,358,'คัดลอกลิงก์',true)+button(16,446,358,'แชร์ผ่าน LINE')+
  stamp(16,534,'ตรวจ facts ก่อนแชร์')+txt(16,590,'ผู้รับเห็นข้อมูลสินค้าจากแคตตาล็อกชุดเดียวกัน',13,400,muted)+button(16,682,358,'กลับ',false)
,'ร้าน');

board('C · Basket, deal & family','ตะกร้าที่ไม่บังคับซื้อเพิ่ม • ใบเสร็จ optimizer • ชุดที่เข้ากันได้ • โหมดครอบครัว • แชร์เฉพาะมุมมอง',[basket,deal,complete,mom,share],'adaptive-v2-03-basket-family.svg',[
  ['NO PRESELECT','ของเสริมต้องกดเพิ่มเอง'],['ONE PRICING PATH','ดีลทุกแห่งใช้ optimizer เดียว'],['COMPATIBLE','Complete-the-set ต้องมีเหตุผล'],['LARGE PRINT','ข้อความและเป้าสัมผัสใหญ่จริง'],['PRIVATE SHARE','ไม่ส่ง chat, cart หรือ address']
]);

const suggest = phone('16 · เรียนรู้แบบขออนุญาต','learning',
  header('DynamicShopper','กำลังเรียนรู้')+search()+dividerTitle(137,'สินค้าทั้งหมด')+productCard(16,160,171,'Aero Mouse','mouse')+productCard(203,160,171,'Everyday Buds','buds')+
  rect(16,420,358,198,white,ink,4,'stroke-width="1.5"')+label(32,448,'ข้อเสนอ ไม่ใช่คำสั่ง')+txt(32,482,'คุณเปิดตารางเทียบบ่อย',19,600)+txt(32,512,'ให้วางการเปรียบเทียบไว้ก่อนหรือไม่?',14,400,muted)+button(32,546,146,'ใช้ครั้งนี้',true)+button(190,546,154,'ไม่เปลี่ยน')+txt(32,604,'ยังไม่บันทึกเป็นค่าถาวร',11,400,muted)
);
const prefs = phone('17 · ศูนย์ควบคุมการปรับร้าน','preferences',
  header('การปรับร้าน','ควบคุมได้')+label(16,84,'ยืนยันแล้ว')+
  rect(16,102,358,94,white,seam,4)+txt(30,132,'สเปกก่อน',16,600)+txt(30,158,'มาจาก: คำตอบของคุณ',12,400,muted)+txt(344,148,'ลบ',12,600,ink,'end')+
  rect(16,208,358,94,white,seam,4)+txt(30,238,'ภาษาไทย',16,600)+txt(30,264,'มาจาก: ตัวควบคุมโดยตรง',12,400,muted)+txt(344,254,'ลบ',12,600,ink,'end')+
  label(16,342,'กำลังทดลอง')+rect(16,360,358,112,white,ink,4,'stroke-dasharray="6 4"')+txt(30,390,'วางของซื้อซ้ำก่อน',16,600)+txt(30,416,'มาจาก: พฤติกรรมซ้ำ',12,400,muted)+button(30,428,110,'ยืนยัน')+button(152,428,92,'หยุด')+
  label(16,526,'การควบคุม')+button(16,546,171,'Undo')+button(203,546,171,'Reset')+button(16,604,358,'พักการเรียนรู้')
,'ฉัน');
const offline = phone('18 · Offline ยังใช้งานได้','offline',
  header('DynamicShopper','OFFLINE')+rect(16,66,358,58,white,ink,4)+label(30,90,'offline mode')+txt(350,92,'เครือข่ายไม่พร้อม',12,500,muted,'end')+search(140,'ขอแบบเรียบ ๆ ดูสเปกก่อน')+
  receipt(16,204,358,'สิ่งที่เปลี่ยน',[['ธีม','เรียบ'],['ข้อมูล','สเปกก่อน']],false)+
  dividerTitle(334,'ผลลัพธ์จากกฎสำรอง')+productCard(16,360,358,'Aero Mouse','mouse','row')+productCard(16,484,358,'Core Mouse','mouse','row')+
  txt(16,634,'ค้นหา • จัดหน้า • Undo • Reset ยังทำงาน',13,500)+button(16,682,358,'ดูรายละเอียด Offline')
);
const poison = phone('19 · โมเดลไม่ปลอดภัยถูกกันออก','red team',
  header('X-ray','โหมดพัฒนา')+rect(16,70,358,54,white,red,4,'stroke-width="1.5"')+label(30,92,'poisoned model',red)+txt(348,94,'ถูกปฏิเสธ',12,600,red,'end')+
  receipt(16,146,358,'ผลการตรวจ',[['ธีมปลอม','DROP',red],['สินค้าปลอม','DROP',red],['ประโยคมีตัวเลข','REPLACE',red],['แผนที่ถูกต้อง','KEEP',green]],true)+
  rect(16,360,358,128,white,seam,4)+label(30,386,'ร้านยังปลอดภัย')+txt(30,418,'รายการสินค้าไม่หาย',15,600)+txt(30,446,'ราคาและสเปกไม่เคลื่อน',15,600)+txt(30,474,'ส่วนที่ดีของข้อเสนออยู่ต่อ',12,400,muted)+
  button(16,520,171,'Force offline')+button(203,520,171,'ปิด X-ray')+txt(16,604,'ทุกขั้นตอนมองเห็นได้ • เครื่องมืออ่านอย่างเดียว',13,500)
,'ฉัน');
const reset = phone('20 · Undo และ Reset','recovery',
  header('ร้านของฉัน','ย้อนกลับได้')+receipt(16,76,358,'ประวัติการเปลี่ยน',[['ล่าสุด','สเปกก่อน'],['ก่อนหน้า','ความหนาแน่น'],['เริ่มต้น','ร้านมาตรฐาน']],false)+
  rect(16,246,358,118,white,seam,4)+label(30,274,'undo')+txt(30,306,'ย้อนเฉพาะการเปลี่ยนล่าสุด',16,600)+txt(30,334,'ตะกร้าและประวัติคำสั่งไม่หาย',12,400,muted)+button(252,288,106,'Undo')+
  rect(16,378,358,144,white,ink,4,'stroke-width="1.5"')+label(30,406,'reset')+txt(30,438,'กลับสู่ร้านมาตรฐาน',16,600)+txt(30,466,'ล้างเฉพาะแผนการนำเสนอ',12,400,muted)+button(252,420,106,'Reset',true)+
  stamp(16,558,' facts ยังเหมือนเดิม')+button(16,682,358,'กลับไปช้อป',true)
,'ฉัน');

board('D · Learning, safety & recovery','ระบบเรียนรู้โดยขออนุญาต • preferences ที่ลบได้ • offline parity • red-team proof • undo/reset',[suggest,prefs,offline,poison,reset],'adaptive-v2-04-trust-learning.svg',[
  ['ASK FIRST','พฤติกรรมเสนอได้แต่ใช้แทนไม่ได้'],['SOURCE VISIBLE','ทุก preference บอกที่มา'],['OFFLINE PARITY','ร้านไม่พึ่ง network หรือ key'],['FAIL CLOSED','AI ผิดแล้วร้านยังใช้งานได้'],['UNDOABLE','การปรับร้านย้อนกลับได้เสมอ']
]);

const components = () => {
  const width=2420,height=1700;
  let s=`<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#F1F0EB"/>${txt(64,62,'E · Component system',32,700)}${txt(64,92,'Fixed library • fact-locked surfaces • mobile and desktop states',14,400,muted)}${label(2050,62,'DYNAMICSHOPPER • DRAFT V2')}`;
  const section=(x,y,w,h,t,n)=>rect(x,y,w,h,white,seam,4)+label(x+20,y+30,`${n} · ${t}`)+line(x+20,y+44,x+w-20,y+44,ink,2);
  s+=section(64,130,720,300,'Controls','01')+search(186,'Search default')+chip(84,252,'Default')+chip(174,252,'Selected',true)+chip(274,252,'Removable ×')+button(84,312,150,'Primary',true)+button(246,312,150,'Secondary')+button(408,312,150,'Disabled',false,true)+stamp(84,374,'ตรวจแล้ว');
  s+=section(814,130,720,300,'Navigation','02')+
    `<g transform="translate(834 174)">${header('DynamicShopper','มาตรฐาน')}</g>`+
    txt(1244,194,'Fixed shell on every layout',12,500,muted)+
    txt(840,250,'Underline tabs',13,500)+line(840,270,1488,270)+txt(852,304,'ทั้งหมด',14,600)+line(840,320,920,320,ink,3)+txt(956,304,'เมาส์',14,400,muted)+txt(1046,304,'หูฟัง',14,400,muted)+txt(1148,304,'ครัว',14,400,muted)+
    `<g transform="translate(834 344) scale(1.65 .7)">${nav()}</g>`;
  s+=section(1564,130,792,300,'Theme tokens','03');
  const themes=[['Standard',paper,ink,seam],['Minimal',white,ink,'#ECEBE6'],['Vibrant',paper,blue,'#E3E3EF'],['Large print',paper,'#0D0D10','#858172']];
  themes.forEach((t,i)=>{const x=1584+i*186;s+=rect(x,190,166,176,t[1],t[3],t[0]==='Minimal'?0:6)+rect(x+16,210,134,38,t[2],t[2],4)+txt(x+83,235,t[0],13,600,white,'middle')+txt(x+16,278,'Surface',12,500,t[2])+line(x+16,292,x+150,292,t[3])+txt(x+16,320,'Seam / Ink',12,400,t[2])+txt(x+16,350,t[0]==='Large print'?'20px floor':'16px base',12,500,t[2]);});
  s+=section(64,462,720,492,'Product cards','04')+productCard(84,526,180,'Grid card','mouse')+productCard(282,526,180,'Visual card','buds')+productCard(480,526,284,'Row card','rice','row')+rect(480,660,284,238,white,seam,4)+label(496,688,'comparison cell')+txt(496,722,'Aero Mouse',15,600)+priceKey(496,750)+line(496,768,744,768,ink,1,'4 4')+txt(496,796,'spec.weight',12,500)+txt(744,796,'catalog',12,500,ink,'end','IBM Plex Mono,monospace')+txt(496,832,'spec.battery',12,500)+txt(744,832,'catalog',12,500,ink,'end','IBM Plex Mono,monospace')+button(496,846,248,'ดูสินค้า');
  s+=section(814,462,720,492,'Proof surfaces','05')+receipt(834,526,330,'what changed',[['Layout','Compare'],['Cards','Specs first']],false)+receipt(1184,526,330,'best deal',[['Item','optimizer'],['Voucher','applied'],['TOTAL','optimizer']],true)+receipt(834,722,330,'citation',[['Source','listing'],['Field','battery']],true)+rect(1184,722,330,166,white,ink,4,'stroke-dasharray="6 4"')+label(1200,748,'why this order')+txt(1200,780,'Performance',12,500)+rect(1300,770,194,10,ink,ink,5)+txt(1200,816,'Value',12,500)+rect(1300,806,146,10,ink,ink,5)+txt(1200,852,'Durability',12,500)+rect(1300,842,98,10,ink,ink,5);
  s+=section(1564,462,792,492,'State matrix','06');
  const states=[['Default',seam,ink],['Hover',ink,ink],['Focus',blue,ink],['Disabled',seam,muted],['Loading',seam,muted],['Error',red,red],['Verified',green,green],['Empty',ink,muted]];
  states.forEach((st,i)=>{const x=1584+(i%2)*370,y=526+Math.floor(i/2)*96;s+=rect(x,y,350,76,white,st[1],4,st[0]==='Disabled'?'opacity=".45"':'')+txt(x+16,y+28,st[0],14,600,st[2])+txt(x+16,y+54,st[0]==='Loading'?'Preserve layout':'State copy stays readable',12,400,muted);});
  s+=section(64,986,720,620,'Responsive patterns','07')+rect(84,1052,450,490,paper,ink,4,'stroke-width="2"')+txt(104,1084,'Desktop shell',15,600)+line(104,1100,514,1100)+rect(104,1120,250,250,white,seam,4)+rect(370,1120,144,400,white,seam,4)+label(386,1148,'chat dock')+receipt(120,1140,218,'facts',[['Price','catalog'],['Spec','catalog']],true)+rect(558,1052,206,446,paper,ink,22,'stroke-width="2"')+txt(578,1084,'Phone',15,600)+rect(574,1110,174,260,white,seam,4)+rect(574,1384,174,96,white,ink,4)+label(590,1412,'bottom sheet')+txt(590,1440,'Chat on mobile',12,500)+txt(84,1574,'No horizontal page scroll • chat becomes a sheet • proof stays readable',12,500,muted);
  s+=section(814,986,720,620,'Empty, loading & error','08')+rect(834,1052,330,150,white,ink,4,'stroke-dasharray="6 4"')+label(852,1080,'empty')+txt(852,1114,'ไม่พบสินค้าที่ตรงกัน',17,600)+txt(852,1144,'บอก filter ที่ใช้อยู่',12,400,muted)+button(852,1154,142,'ล้างตัวกรอง',true)+rect(1184,1052,330,150,white,seam,4)+label(1202,1080,'loading')+rect(1202,1102,242,16,'#F0EFEA','#F0EFEA',3)+rect(1202,1130,284,12,'#F0EFEA','#F0EFEA',3)+rect(1202,1156,198,12,'#F0EFEA','#F0EFEA',3)+rect(834,1222,330,164,white,red,4)+label(852,1250,'error',red)+txt(852,1284,'การเชื่อมต่อขัดข้อง',17,600)+txt(852,1314,'ร้านเดิมยังใช้งานได้',12,400,muted)+button(852,1330,142,'ลองอีกครั้ง')+rect(1184,1222,330,164,white,seam,4)+label(1202,1250,'offline')+txt(1202,1284,'ใช้กฎสำรองแล้ว',17,600)+txt(1202,1314,'ผลลัพธ์ชนิดเดียวกับ AI',12,400,muted)+stamp(1202,1338,'offline')+rect(834,1406,680,138,white,seam,4)+label(852,1434,'reduced motion')+txt(852,1468,'Receipt appears instantly • no pulse • no transitions',14,600)+txt(852,1500,'Focus and state changes remain visible without motion',12,400,muted);
  s+=section(1564,986,792,620,'Content contracts','09')+label(1584,1050,'fixed layer')+txt(1584,1080,'Search • categories • cart • account • product list',14,500)+line(1584,1100,2328,1100)+label(1584,1132,'adaptive layer')+txt(1584,1162,'Section order • density • fields • layout • approved theme',14,500)+line(1584,1182,2328,1182)+label(1584,1214,'fact layer')+txt(1584,1244,'Price • rating • reviews • shipping • specs • vouchers',14,500)+line(1584,1264,2328,1264)+receipt(1584,1300,360,'AI may propose',[['Theme','allowlist'],['Layout','allowlist'],['Sections','fixed library']],false)+receipt(1968,1300,360,'AI cannot receive',[['Price','never'],['Order','never'],['Markup','never']],false)+txt(1584,1516,'Thai and English strings are authored separately. Every adaptation is visible and reversible.',13,500,muted);
  s+='</svg>'; writeFileSync(join(out,'adaptive-v2-05-components.svg'),s);
};
components();
console.log('Generated five DynamicShopper Figma SVG boards.');
