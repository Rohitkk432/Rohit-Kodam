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