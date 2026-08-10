
document.addEventListener("DOMContentLoaded",()=>{
 const t=document.querySelector(".menu-toggle"),n=document.querySelector(".main-nav");
 if(t&&n){t.onclick=()=>{const o=n.classList.toggle("open");t.setAttribute("aria-expanded",String(o))};n.querySelectorAll("a").forEach(a=>a.onclick=()=>n.classList.remove("open"))}
 const items=document.querySelectorAll(".fade-in");
 if("IntersectionObserver" in window){const obs=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");obs.unobserve(e.target)}}),{threshold:.12});items.forEach(i=>obs.observe(i))}else items.forEach(i=>i.classList.add("visible"));
});
