const ADMIN_KEY='jqf_admin_master_v1';
const DEFAULT_DATA={
  homepage:{eyebrow:'BUILT FOR MODERN DEVICE RETAIL & REPAIR',headline:'Everything your store needs to move faster.',description:'Jersey Quik Fix unifies sales, repairs, inventory, customers, appointments, and administration.',primaryButton:'See the system',secondaryButton:'Explore the platform',openRepairs:24,todaySales:'$2,840',lowStock:4,weeklyRevenue:'$14,582'},
  websiteSections:[{id:1,page:'Home',title:'Hero',headline:'Everything your store needs to move faster.',description:'Connected retail and repair management.',published:'Yes'}],
  repairs:[],
  products:[],
  inventory:[],
  orders:[],
  customers:[],
  tradeins:[],
  events:[],
  announcements:[],
  actions:[],
  members:[],
  photos:[],
  employees:[],
  demo:[],
  settings:{storeName:'Jersey Quik Fix',contactEmail:'',phone:'',visibility:'Private',footer:'© 2026 Jersey Quik Fix Management System.'}
};
function loadAdmin(){try{return JSON.parse(localStorage.getItem(ADMIN_KEY))||structuredClone(DEFAULT_DATA)}catch(e){return structuredClone(DEFAULT_DATA)}}
function saveAdminData(data){localStorage.setItem(ADMIN_KEY,JSON.stringify(data))}
