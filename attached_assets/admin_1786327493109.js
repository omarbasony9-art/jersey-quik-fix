let DATA=loadAdmin();

const configs={
 websiteSections:[['page','Page'],['title','Section'],['headline','Headline'],['description','Description'],['published','Published']],
 repairs:[['ticket','Ticket'],['customer','Customer'],['device','Device'],['status','Status'],['technician','Technician'],['amount','Amount']],
 products:[['name','Name'],['category','Category'],['price','Price'],['stock','Stock'],['sku','SKU'],['active','Active']],
 inventory:[['item','Item'],['quantity','Quantity'],['reserved','Reserved'],['threshold','Low Stock'],['reason','Last Reason']],
 orders:[['order','Order #'],['customer','Customer'],['total','Total'],['status','Status']],
 customers:[['name','Name'],['phone','Phone'],['email','Email'],['lifetimeSpend','Lifetime Spend']],
 tradeins:[['customer','Customer'],['device','Device'],['condition','Condition'],['offer','Offer'],['status','Status']],
 events:[['title','Title'],['date','Date'],['time','Time'],['location','Location'],['published','Published']],
 announcements:[['title','Title'],['category','Category'],['priority','Priority'],['status','Status'],['description','Description']],
 actions:[['title','Title'],['status','Status'],['progress','Progress'],['participants','Participants'],['description','Description']],
 members:[['name','Name'],['email','Email'],['role','Role'],['active','Active']],
 photos:[['album','Album'],['featured','Featured Image'],['count','Photo Count']],
 employees:[['name','Name'],['email','Email'],['role','Role'],['status','Status']],
 demo:[['email','Email'],['store','Store'],['status','Status'],['notes','Notes']]
};

function toast(msg){const t=document.getElementById('toast');t.textContent=msg;t.classList.add('show');setTimeout(()=>t.classList.remove('show'),2200)}
function syncRootFields(){document.querySelectorAll('[data-root][data-field]').forEach(el=>{DATA[el.dataset.root][el.dataset.field]=el.type==='number'?Number(el.value):el.value})}
function populateRootFields(){document.querySelectorAll('[data-root][data-field]').forEach(el=>{el.value=DATA[el.dataset.root]?.[el.dataset.field]??''})}
function renderStats(){const s=[['Repairs',DATA.repairs.length],['Products',DATA.products.length],['Customers',DATA.customers.length],['Events',DATA.events.length],['Announcements',DATA.announcements.length],['Orders',DATA.orders.length],['Trade-Ins',DATA.tradeins.length],['Employees',DATA.employees.length]];stats.innerHTML=s.map(x=>`<div class="stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join('')}
function renderCollection(key,target){const wrap=document.getElementById(target);wrap.innerHTML='';DATA[key].forEach(obj=>{const row=document.createElement('div');row.className='row';configs[key].forEach(([field,label])=>{const el=(field==='description'||field==='notes')?document.createElement('textarea'):document.createElement('input');el.value=obj[field]??'';el.placeholder=label;el.dataset.collection=key;el.dataset.id=obj.id;el.dataset.field=field;row.appendChild(el)});const del=document.createElement('button');del.className='danger';del.textContent='Delete';del.onclick=()=>{DATA[key]=DATA[key].filter(x=>x.id!==obj.id);saveAdminData(DATA);renderAll()};row.appendChild(del);wrap.appendChild(row)})}
function syncCollections(){document.querySelectorAll('[data-collection][data-id][data-field]').forEach(el=>{const obj=DATA[el.dataset.collection].find(x=>x.id==el.dataset.id);if(obj)obj[el.dataset.field]=el.value})}
function addGeneric(key,defaults){syncCollections();DATA[key].push({id:Date.now(),...defaults});renderAll()}
function addWebsiteSection(){addGeneric('websiteSections',{page:'Home',title:'New Section',headline:'New headline',description:'Edit this section',published:'Yes'})}
function addRepair(){addGeneric('repairs',{ticket:'JQ-'+Math.floor(Math.random()*999999),customer:'',device:'',status:'Checked In',technician:'',amount:''})}
function addProduct(){addGeneric('products',{name:'New Product',category:'Accessories',price:'0',stock:'0',sku:'',active:'Yes'})}
function addInventory(){addGeneric('inventory',{item:'New Inventory Item',quantity:'0',reserved:'0',threshold:'5',reason:'Manual add'})}
function addOrder(){addGeneric('orders',{order:'ORD-'+Math.floor(Math.random()*99999),customer:'',total:'0',status:'Pending'})}
function addCustomer(){addGeneric('customers',{name:'New Customer',phone:'',email:'',lifetimeSpend:'0'})}
function addTradeIn(){addGeneric('tradeins',{customer:'',device:'',condition:'Good',offer:'0',status:'Submitted'})}
function addEvent(){addGeneric('events',{title:'New Event',date:'',time:'',location:'',published:'Yes'})}
function addAnnouncement(){addGeneric('announcements',{title:'New Announcement',category:'General',priority:'Normal',status:'Published',description:'Edit announcement'})}
function addAction(){addGeneric('actions',{title:'New Action',status:'Planning',progress:'0',participants:'0',description:'Edit action'})}
function addMember(){addGeneric('members',{name:'New Member',email:'',role:'Member',active:'Yes'})}
function addAlbum(){addGeneric('photos',{album:'New Album',featured:'',count:'0'})}
function addEmployee(){addGeneric('employees',{name:'New Employee',email:'',role:'Technician',status:'Active'})}
function addDemo(){addGeneric('demo',{email:'',store:'',status:'New',notes:''})}
function renderAll(){populateRootFields();renderStats();renderCollection('websiteSections','websiteEditor');renderCollection('repairs','repairsList');renderCollection('products','productsList');renderCollection('inventory','inventoryList');renderCollection('orders','ordersList');renderCollection('customers','customersList');renderCollection('tradeins','tradeinsList');renderCollection('events','eventsList');renderCollection('announcements','announcementsList');renderCollection('actions','actionsList');renderCollection('members','membersList');renderCollection('photos','photosList');renderCollection('employees','employeesList');renderCollection('demo','demoList')}
function saveEverything(){syncRootFields();syncCollections();saveAdminData(DATA);toast('All changes saved')}
document.getElementById('saveAll').onclick=saveEverything;
document.querySelectorAll('#adminNav button').forEach(btn=>btn.onclick=()=>{document.querySelectorAll('#adminNav button').forEach(x=>x.classList.remove('active'));document.querySelectorAll('.tab').forEach(x=>x.classList.remove('active'));btn.classList.add('active');document.getElementById(btn.dataset.tab).classList.add('active');pageTitle.textContent=btn.textContent});
globalSearch.oninput=()=>{const q=globalSearch.value.toLowerCase();document.querySelectorAll('.row').forEach(r=>r.style.display=r.textContent.toLowerCase().includes(q)||Array.from(r.querySelectorAll('input,textarea')).some(i=>i.value.toLowerCase().includes(q))?'grid':'none')};
renderAll();
