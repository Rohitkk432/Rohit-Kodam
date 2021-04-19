'use strict';
//nav buttons

//smooth scrolling
document.querySelector('.nav_links').addEventListener('click',function(e){
    e.preventDefault();
    
    if(e.target.classList.contains('nav_link')){
        const id = e.target.getAttribute('href');
        document.querySelector(id).scrollIntoView({behavior:"smooth"});
    }
});

//hover effect
const nav=document.querySelector(".nav");
const handleHover =function(e){
    if(e.target.classList.contains('nav_link')){
        const link=e.target;
        const siblings=link.closest('.nav').querySelectorAll('.nav_link');
        const logo=link.closest('.nav').querySelector('img');
        siblings.forEach(el=>{
            if(el!==link){
                el.style.opacity=this;
            } 
        });
        logo.style.opacity=this;
    };
}
nav.addEventListener('mouseover',handleHover.bind(0.6));
nav.addEventListener('mouseout',handleHover.bind(1));

// shutter
const shutter =document.querySelector('.shutter');
const openShutter=function(entries,observer){
    const [entry]=entries
    if (entry.intersectionRatio ===1){
        setTimeout(()=>shutter.src='./img/25.png',100);
        setTimeout(()=>shutter.src='./img/35.png',200);
        setTimeout(()=>shutter.src='./img/60.png',300);
        setTimeout(()=>shutter.src='./img/80.png',400);
        setTimeout(()=>shutter.src='./img/100.png',500);
        imgObserver.unobserve(shutter);
    }
};
const imgObserver=new IntersectionObserver(openShutter,{
    root:null,
    threshold:1,
});
imgObserver.observe(shutter);