var ee=Object.defineProperty,te=Object.defineProperties;var ne=Object.getOwnPropertyDescriptors;var A=Object.getOwnPropertySymbols;var oe=Object.prototype.hasOwnProperty,re=Object.prototype.propertyIsEnumerable;var H=(e,t,o)=>t in e?ee(e,t,{enumerable:!0,configurable:!0,writable:!0,value:o}):e[t]=o,$=(e,t)=>{for(var o in t||(t={}))oe.call(t,o)&&H(e,o,t[o]);if(A)for(var o of A(t))re.call(t,o)&&H(e,o,t[o]);return e},q=(e,t)=>te(e,ne(t));const ae=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const s of n.addedNodes)s.tagName==="LINK"&&s.rel==="modulepreload"&&r(s)}).observe(document,{childList:!0,subtree:!0});function o(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerpolicy&&(n.referrerPolicy=a.referrerpolicy),a.crossorigin==="use-credentials"?n.credentials="include":a.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(a){if(a.ep)return;a.ep=!0;const n=o(a);fetch(a.href,n)}};ae();function j(e){const{data:t}=e.getImageData(0,0,e.canvas.width,e.canvas.height),{width:o,height:r}=e.canvas;let a=[];for(let n=0;n<r;n++)for(let s=0;s<o;s++)a[s]||(a[s]=[]),a[s][n]=Math.floor((t[n*o*4+s*4]+t[n*o*4+s*4+1]+t[n*o*4+s*4+2])/3);return a}function se(e,t={}){const{crop:o=!0,size:r}=t;return new Promise(a=>{const n=new window.Image;n.onload=function(){const c=t.canvas||document.createElement("canvas"),l=c.getContext("2d");let i=1;r&&(i=r/Math.max(n.width,n.height)),t.maxSize&&(n.width>t.maxSize||n.height>t.maxSize)&&(i=t.maxSize/Math.max(n.width,n.height));const u=Math.floor(n.width*i),h=Math.floor(n.height*i);if(o){c.width=r,c.height=r;const g=Math.min(n.width,n.height);l.drawImage(n,(n.width-g)/2,(n.height-g)/2,g,g,0,0,r,r)}else c.width=u,c.height=h,l.drawImage(n,0,0,u,h);const m=l.getImageData(0,0,l.canvas.width,l.canvas.height);m.ctx=l,a(m)},n.src=e})}function _(e){e.beginPath();function t(a,n,s={}){const{color:c="#000",width:l=1}=s;e.beginPath(),e.lineWidth=l,e.moveTo(a[0],a[1]),e.lineTo(n[0],n[1]),e.strokeStyle=c,e.stroke()}function o(a,n){e.moveTo(a[0],a[1]),e.lineTo(n[0],n[1])}function r(a={}){const{color:n="#000",width:s=1}=a;e.lineWidth=s,e.strokeStyle=n,e.stroke(),e.beginPath()}return{line:t,lineBuffer:o,stroke:r}}const W=.1,b={r:.299+W,g:.587+W*-.5,b:.114+W*-.5};function ie(e){let t=e.data,o=1/0,r=0,a=0;for(let s=0;s<t.length;s+=4){let c=t[s]*b.r+t[s+1]*b.g+t[s+2]*b.b;o=Math.min(o,c),r=Math.max(r,c),a+=c}a=Math.round(a/(t.length/4)),o+=32,r-=32;const n=255/(r-o);for(let s=0;s<t.length;s+=4){let c=t[s]*b.r+t[s+1]*b.g+t[s+2]*b.b;t[s]=Math.round(c*n)-o,t[s+1]=Math.round(c*n)-o,t[s+2]=Math.round(c*n)-o}return{canvasData:e,averageLightness:a}}function X(e,t,o){let r=0;const a=e[0],n=t[0]-e[0],s=e[1],c=t[1]-e[1],l=Math.max(Math.abs(n),Math.abs(c));for(let i=0;i<l;i++){const u=Math.round(a+n/l*i),h=Math.round(s+c/l*i);r+=o[u][h]}return Math.round(r/l)}function R(e,t){return t===void 0?Math.floor(Math.random()*e):Math.min(e,t)+Math.floor(Math.random()*Math.abs(e-t))}function Y(e,t){let o;return function(){clearTimeout(o);let r=arguments;o=setTimeout(function(){e.apply(this,r)},t||1)}}const ce=1080,x=1;let L=null,D=null,P=null;const C=document.createElement("canvas");async function le(e,t={}){const{canvasDrawEl:o,onDraw:r,onFinish:a,onLoad:n}=t,s=await se(e,{size:ce,canvas:C,crop:!1}),c=s.width,l=s.height;C.width=c,C.height=l;const i=C.getContext("2d"),u=_(i),h=o||document.createElement("canvas");h.width=c*x,h.height=l*x;const m=h.getContext("2d");m.scale(x,x);const g=_(m);console.log("> Starting PINTR"),n&&n({width:c,height:l});const{canvasData:M,averageLightness:S}=ie(s);async function E({config:w}){console.log("> Render PINTR",w),P=new Date().getTime(),D=[],i.putImageData(M,0,0),L=j(i);let N=new Date().getTime(),T=[Math.floor(c/2),Math.floor(l/2)];function J(){let f=T,I=w.singleLine?0:w.precisionRange;for(;I--;){let p=[R(c),R(l)];L[f[0]][f[1]]>L[p[0]][p[1]]&&(f=p)}let F=R(w.precisionRange,w.precisionRange*2),y,z=255;for(;F--;){let p=[R(c),R(l)];const G=X(f,p,L);G<=z&&(z=G,y=p)}z=X(f,y,L),D.push([f,y]),g.lineBuffer(f,y,{color:"#000"}),u.lineBuffer(f,y,{color:w.substractionColor}),T=y}const U=Math.floor(w.baseLineNumber/S*128);let B=U;function Q(f){return new Promise(I=>{const F=new Date().getTime();for(;new Date().getTime()<F+15&&B-- >0;){if(f!==P)return;B%w.updateSampleRate===0&&(u.stroke({color:w.substractionColor,width:w.strokeWidth*1.5}),L=j(i)),J()}g.stroke({color:w.addColor,width:w.strokeWidth*1}),window.requestAnimationFrame(I)})}async function V(f){for(;B>0&&f===P;)await Q(f),r&&r({coords:D});r&&r({coords:D}),a&&a({coords:D});let I=new Date().getTime();console.log("> Lines per second:",U/(I-N)*1e3)}V(P)}return{render:E}}function ue(e,{strokeWidth:t,size:o}){return`<svg viewBox="0 0 ${o[0]} ${o[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="${t}">
${e.map(r=>`<line x1="${r[0][0]}" y1="${r[0][1]}" x2="${r[1][0]}" y2="${r[1][1]}"/>`).join(`
`)}
</svg>
  `}function he(e,{strokeWidth:t,size:o}){return`<svg viewBox="0 0 ${o[0]} ${o[1]}" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${e.map(r=>r[0].join(",")).join(" ")}" fill="none" stroke="black" stroke-width="${t}"/>
</svg>
  `}function de(e,t){return console.warn(">generateSvg",t),t.singleLine?he(e,t):ue(e,t)}function O(e,{smoothing:t=.15,strokeWidth:o,size:r}){const a=e.map(i=>i[0]),n=(i,u)=>{const h=u[0]-i[0],m=u[1]-i[1];return{length:Math.sqrt(Math.pow(h,2)+Math.pow(m,2)),angle:Math.atan2(m,h)}},s=(i,u,h,m)=>{const S=n(u||i,h||i),E=S.angle+(m?Math.PI:0),w=S.length*t,N=i[0]+Math.cos(E)*w,T=i[1]+Math.sin(E)*w;return[N,T]},c=(i,u,h)=>{const m=s(h[u-1],h[u-2],i),g=s(i,h[u-1],h[u+1],!0);return`C ${m[0]},${m[1]} ${g[0]},${g[1]} ${i[0]},${i[1]}`},l=(i,u)=>`<path d="${i.reduce((m,g,M,S)=>M===0?`M ${g[0]},${g[1]}`:`${m} ${u(g,M,S)}`,"")}" fill="none" stroke="black" stroke-width="${o}" />`;return`<svg viewBox="0 0 ${r[0]} ${r[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black">
    ${l(a,c)}
  </svg>
  `}const me="./test.jpg";let v={},d={currentImgSrc:me,coords:null,width:null,height:null};async function K(e){const t=await le(e,{canvasDrawEl:document.querySelector("canvas#draw"),onDraw({coords:o}){d.coords=o},onLoad({width:o,height:r}){document.documentElement.style.setProperty("--sizew",`${o/2}px`),document.documentElement.style.setProperty("--sizeh",`${r/2}px`),d.width=o,d.height=r},onFinish({coords:o}){if(!v.makeSmoothSvg)return;const r=O(o,q($({},v),{size:[d.width,d.height],smoothing:Number(document.querySelector("#inputSmoothness").value)/100}));document.querySelector(".smooth-svg-container").innerHTML=r}});document.querySelector("#srcImg").style.backgroundImage=`url("${e}")`,document.querySelector(".loading").style.display="none",t.render({config:v})}function ge(){if(this.files&&this.files[0]){const e=new FileReader;e.addEventListener("load",function(t){d.currentImgSrc=t.target.result,K(t.target.result)}),e.readAsDataURL(this.files[0])}}function k(e,t){return t==="number"?Number(document.querySelector(e).value):t==="bool"?Boolean(Number(document.querySelector(e).value)):document.querySelector(e).value}function Z(){const e=k("#lines","number"),t=k("#singleLine","bool"),o=k("#contrast","number"),r=k("#definition","number"),a=k("#strokeWidth","number"),n=k("#makeSmoothSvg","bool");v={addColor:"#000",updateSampleRate:90,baseLineNumber:72*e,substractionColor:`rgba(255, 255, 255, ${100-o}%)`,precisionRange:r,singleLine:t,strokeWidth:a,makeSmoothSvg:t&&n},document.querySelector(".experimental--smoth-svg--container").style.display=n?"block":"none",document.querySelector(".experimental--smoth-svg--container--warning").style.display=t?"none":"block",K(d.currentImgSrc)}Z();document.querySelector("#inputImageFile").addEventListener("change",ge);document.querySelector("#inputImageButton").addEventListener("click",()=>{document.querySelector("#inputImageFile").click()});document.querySelectorAll("[data-start-drawing]").forEach(e=>{e.addEventListener("change",Y(Z,256))});document.querySelector("#inputSmoothness").addEventListener("change",Y(()=>{const e=O(d.coords,q($({},v),{size:[d.width,d.height],smoothing:document.querySelector("#inputSmoothness").value/100}));document.querySelector(".smooth-svg-container").innerHTML=e},128));document.querySelector("#download").addEventListener("click",()=>{const e=document.createElement("a");e.download="PINTR.png",e.href=document.querySelector("canvas#draw").toDataURL(),e.click()});document.querySelector("#downloadSvg").addEventListener("click",()=>{const e=document.createElement("a");e.download="PINTR.svg";const t=de(d.coords,q($({},v),{size:[d.width,d.height]})),o=new Blob([t],{type:"image/svg+xml;charset=utf-8"}),r=URL.createObjectURL(o);e.href=r,e.click()});document.querySelector("#downloadSmoothSvg").addEventListener("click",()=>{const e=document.createElement("a");e.download="PINTR.svg";const t=O(d.coords,{CONFIG:v,size:[d.width,d.height],smoothing:document.querySelector("#inputSmoothness").value/100}),o=new Blob([t],{type:"image/svg+xml;charset=utf-8"}),r=URL.createObjectURL(o);e.href=r,e.click()});
