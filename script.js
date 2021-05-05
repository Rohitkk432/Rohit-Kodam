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


//intro_page image
// shutter
const shutter =document.querySelector('.shutter');
const openShutter=function(entries,observer){
    const [entry]=entries;
    if (entry.intersectionRatio ===1 && entry.time>100){
        setTimeout(()=>shutter.src='./img/25.png',100);
        setTimeout(()=>shutter.src='./img/35.png',200);
        setTimeout(()=>shutter.src='./img/60.png',300);
        setTimeout(()=>shutter.src='./img/80.png',400);
        setTimeout(()=>shutter.src='./img/100.png',500);
        console.log("error boomer",entry);
        shutterObserver.unobserve(shutter);
    }
};
const shutterObserver=new IntersectionObserver(openShutter,{
    root:null,
    threshold:1,
});
shutterObserver.observe(shutter);

//init
const init =function(){
    shutter.src="./img/0.png"
};
init();


//Project images 
//Lazy loading images
const imageTargets=document.querySelectorAll('.project_image[data-src]');

const loadImg = function(entries,observer){
    const[entry]=entries;
  
    if(!entry.isIntersecting) return;

    //Replace src with data-src
    entry.target.src=entry.target.dataset.src;

    entry.target.addEventListener('load',function(){
        entry.target.classList.remove('lazy-img');
    });
  
    observer.unobserve(entry.target);
};

const imgObserver = new IntersectionObserver(loadImg,{
    root:null,
    threshold:0,
    rootMargin:'-200px',
});

imageTargets.forEach(img => imgObserver.observe(img));

//reveal sections on scroll

const allSections=document.querySelectorAll('.section');
const revealSection=function(entries,observer){
    const[entry]=entries;
    if(!entry.isIntersecting)return; 
    entry.target.classList.remove('section-hidden');
    observer.unobserve(entry.target);
    console.log(entry.target);
};
const sectionObserver= new IntersectionObserver(revealSection,{
    root:null,
    threshold:0.10,
});
allSections.forEach(function(section){
    sectionObserver.observe(section);
    section.classList.add('section-hidden');
});