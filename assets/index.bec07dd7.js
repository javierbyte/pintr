const ge=function(){const t=document.createElement("link").relList;if(t&&t.supports&&t.supports("modulepreload"))return;for(const o of document.querySelectorAll('link[rel="modulepreload"]'))i(o);new MutationObserver(o=>{for(const n of o)if(n.type==="childList")for(const a of n.addedNodes)a.tagName==="LINK"&&a.rel==="modulepreload"&&i(a)}).observe(document,{childList:!0,subtree:!0});function r(o){const n={};return o.integrity&&(n.integrity=o.integrity),o.referrerpolicy&&(n.referrerPolicy=o.referrerpolicy),o.crossorigin==="use-credentials"?n.credentials="include":o.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function i(o){if(o.ep)return;o.ep=!0;const n=r(o);fetch(o.href,n)}};ge();function Y(e,t=255){const{data:r}=e.getImageData(0,0,e.canvas.width,e.canvas.height),{width:i,height:o}=e.canvas;let n=[];for(let a=0;a<o;a++)for(let s=0;s<i;s++){n[s]||(n[s]=new Uint8Array(o)),n[s][a]=Math.floor((r[a*i*4+s*4]+r[a*i*4+s*4+1]+r[a*i*4+s*4+2])/3);const l=r[a*i*4+s*4+3];l!==255&&(n[s][a]=n[s][a]*(l/255)+t*(1-l/255))}return n}function ue(e,t){const{crop:r=!0,size:i=512}=t;return new Promise(o=>{const n=new window.Image;n.onload=function(){const s=t.canvas||document.createElement("canvas"),l=s.getContext("2d");if(!l)throw new Error("Failed to 'getContext2d'");let c=1;i&&(c=i/Math.max(n.width,n.height)),t.maxSize&&(n.width>t.maxSize||n.height>t.maxSize)&&(c=t.maxSize/Math.max(n.width,n.height));const d=Math.floor(n.width*c),g=Math.floor(n.height*c);if(r){s.width=i,s.height=i;const m=Math.min(n.width,n.height);l.drawImage(n,(n.width-m)/2,(n.height-m)/2,m,m,0,0,i,i)}else s.width=d,s.height=g,l.drawImage(n,0,0,d,g);const h=l.getImageData(0,0,l.canvas.width,l.canvas.height);o(h)},n.src=e})}function K(e){e.beginPath();function t(o,n,a={color:"#000",width:1}){const{color:s="#000",width:l=1}=a;e.beginPath(),e.lineWidth=l,e.moveTo(o[0],o[1]),e.lineTo(n[0],n[1]),e.strokeStyle=s,e.stroke()}function r(o,n){e.moveTo(o[0],o[1]),e.lineTo(n[0],n[1])}function i(o={color:"#000",width:1}){const{color:n="#000",width:a=1}=o;e.lineWidth=a,e.strokeStyle=n,e.stroke(),e.beginPath()}return{line:t,lineBuffer:r,stroke:i}}const U=.1,L={r:.299+U,g:.587+U*-.5,b:.114+U*-.5};function he(e){let t=e.data,r=1/0,i=0,o=0;for(let a=0;a<t.length;a+=4){let s=t[a]*L.r+t[a+1]*L.g+t[a+2]*L.b;t[a+3]<128&&(s=255),r=Math.min(r,s),i=Math.max(i,s),o+=s}o=Math.round(o/(t.length/4)),r+=32,i-=32;const n=255/(i-r);for(let a=0;a<t.length;a+=4){let s=t[a]*L.r+t[a+1]*L.g+t[a+2]*L.b;t[a]=Math.round(s*n)-r,t[a+1]=Math.round(s*n)-r,t[a+2]=Math.round(s*n)-r}return{canvasData:e,averageLightness:o}}function V(e,t,r){let i=0;const o=e[0],n=t[0]-e[0],a=e[1],s=t[1]-e[1],l=Math.max(Math.abs(n),Math.abs(s));for(let c=0;c<l;c++){const d=Math.round(o+n/l*c),g=Math.round(a+s/l*c);i+=r[d][g]}return Math.round(i/l)}function b(e,t){return t===void 0?Math.floor(Math.random()*e):Math.min(e,t)+Math.floor(Math.random()*Math.abs(e-t))}function J(e,t){let r;return function(){clearTimeout(r);let i=arguments;r=setTimeout(function(){e.apply(this,i)},t||1)}}const me=1080,x=1;let E=null,D=[],P=new Date().getTime()-1;const C=document.createElement("canvas");function W(e,t){const r=[...t];if(r.sort((i,o)=>i[0]-o[0]),e<r[0][0]||e>r[r.length-1][0])return e;for(const i in t){const o=t[i];if(o[0]===e)return o[1];if(o[0]>e){const n=t[Number(i)-1],a=o[0]-n[0],s=(e-n[0])/a;return s*o[1]+(1-s)*n[1]}}return e}async function fe(e,{canvasDrawEl:t,onDraw:r,onFinish:i,onLoad:o}){const n=await ue(e,{size:me,canvas:C,crop:!1}),a=n.width,s=n.height;C.width=a,C.height=s;const l=C.getContext("2d");if(!l)throw new Error("Failed to initiate 'CanvasRenderingContext2D'");const c=K(l),d=t||document.createElement("canvas");d.width=a*x,d.height=s*x;const g=document.querySelector("#srcImg"),h=d.getContext("2d");if(!g)throw new Error("Failed to initiate srcImgEl");if(!h)throw new Error("Failed to initiate CanvasRenderingContext2D");g.style.aspectRatio=String(a/s),h.scale(x,x);const m=K(h);console.log("> Starting PINTR"),o({width:a,height:s});const{canvasData:M,averageLightness:p}=he(n);async function R(I){console.log("> Render PINTR",I);const{density:N,singleLine:F,contrast:te,definition:ne,strokeWidth:H}=I;P=new Date().getTime(),D=[];const $=W(ne,[[0,3],[50,15],[100,100]]),oe=W(N,[[0,500],[50,3e3],[100,7e3]]),re="rgba(0, 0, 0, 255)",ie=`rgba(255, 255, 255, ${(100-W(te,[[0,20],[50,75],[100,90]]))/100})`,ae=100-Math.floor($/2);if(!l)throw new Error("Canvas error");l.putImageData(M,0,0),E=Y(l);let se=new Date().getTime(),_=[Math.floor(a/2),Math.floor(s/2)];function ce(){let f=_,k=F?0:$;for(;k--;){let S=[b(a),b(s)];E[f[0]][f[1]]>E[S[0]][S[1]]&&(f=S)}let O=b($,$*2),y,A=255;for(;O--;){let S=[b(a),b(s)];const X=V(f,S,E);X<=A&&(A=X,y=S)}A=V(f,y,E),D.push([f,y]),m.lineBuffer(f,y),c.lineBuffer(f,y),_=y}const j=Math.floor(oe/p*128);let B=j;function le(f){return new Promise(k=>{const O=new Date().getTime();for(;new Date().getTime()<O+15&&B-- >0;){if(f!==P)return;B%ae===0&&(c.stroke({color:ie,width:H*1.5}),E=Y(l)),ce()}m.stroke({color:re,width:H*1}),window.requestAnimationFrame(k)})}async function de(f){for(;B>0&&f===P;)await le(f),r&&r({coords:D});r&&r({coords:D}),i&&i({coords:D});let k=new Date().getTime();console.log("> Lines per second:",j/(k-se)*1e3)}de(P)}return{render:R}}function we(e,{strokeWidth:t,size:r}){return`<svg viewBox="0 0 ${r[0]} ${r[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="${t}">
${e.map(i=>`<line x1="${i[0][0]}" y1="${i[0][1]}" x2="${i[1][0]}" y2="${i[1][1]}"/>`).join(`
`)}
</svg>
  `}function ve(e,{strokeWidth:t,size:r}){return`<svg viewBox="0 0 ${r[0]} ${r[1]}" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${e.map(i=>i[0].join(",")).join(" ")}" fill="none" stroke="black" stroke-width="${t}"/>
</svg>
  `}function pe(e,t){return console.warn(">generateSvg",t),t.singleLine?ve(e,t):we(e,t)}function z(e,{smoothingAmount:t=.15,strokeWidth:r=1,size:i}){const o=e.map(c=>c[0]),n=(c,d)=>{const g=d[0]-c[0],h=d[1]-c[1];return{length:Math.sqrt(Math.pow(g,2)+Math.pow(h,2)),angle:Math.atan2(h,g)}},a=(c,d,g,h)=>{const p=n(d||c,g||c),R=p.angle+(h?Math.PI:0),I=p.length*t,N=c[0]+Math.cos(R)*I,F=c[1]+Math.sin(R)*I;return[N,F]},s=(c,d,g)=>{const h=a(g[d-1],g[d-2],c),m=a(c,g[d-1],g[d+1],!0);return`C ${h[0]},${h[1]} ${m[0]},${m[1]} ${c[0]},${c[1]}`},l=(c,d)=>`<path d="${c.reduce((h,m,M,p)=>M===0?`M ${m[0]},${m[1]}`:`${h} ${d(m,M,p)}`,"")}" fill="none" stroke="black" stroke-width="${r}" />`;return`<svg viewBox="0 0 ${i[0]} ${i[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black">
    ${l(o,s)}
  </svg>
  `}const ye="./test.jpg";let w={contrast:50,definition:50,density:50,makeSmoothSvg:!1,singleLine:!0,strokeWidth:1,smoothingAmount:50},u={currentImgSrc:ye,coords:[],width:512,height:512};async function G(e){const t=await fe(e,{canvasDrawEl:document.querySelector("canvas#draw"),onDraw({coords:o}){u.coords=o},onLoad({width:o,height:n}){document.documentElement.style.setProperty("--sizew",`${o/2}px`),document.documentElement.style.setProperty("--sizeh",`${n/2}px`),u.width=o,u.height=n},onFinish({coords:o}){if(!w.makeSmoothSvg)return;const n=z(o,{...w,size:[u.width,u.height]});document.querySelector(".smooth-svg-container").innerHTML=n}}),r=document.querySelector("#srcImg"),i=document.querySelector(".loading");r.style.backgroundImage=`url("${e}")`,i.style.display="none",t.render(w)}function Se(e){if(e.preventDefault(),e.stopPropagation(),this.files&&this.files[0]){const t=new FileReader;t.addEventListener("load",function(r){u.currentImgSrc=String(r.target.result),G(String(r.target.result))}),t.readAsDataURL(this.files[0])}}function T(e){const t=document.querySelector(e);return Number(t.value)}function Z(e){const t=document.querySelector(e);return Boolean(Number(t.value))}function Q(){const e=T("#density"),t=Z("#singleLine"),r=T("#contrast"),i=T("#definition"),o=T("#strokeWidth"),n=Z("#makeSmoothSvg"),a=T("#smoothingAmount");w={density:e,singleLine:t,contrast:r,definition:i,strokeWidth:o,makeSmoothSvg:n,smoothingAmount:a};const s=document.querySelector(".experimental--smoth-svg--container");s.style.display=n?"block":"none";const l=document.querySelector(".experimental--smoth-svg--container--warning");l.style.display=t?"none":"block",G(u.currentImgSrc)}let v=0;function Le(e){if(console.log("File(s) dropped"),e.preventDefault(),!e.dataTransfer.files||!e.dataTransfer.files[0])return;const t=new FileReader;t.addEventListener("load",function(r){u.currentImgSrc=String(r.target.result),G(String(r.target.result)),document.body.classList.remove("-dragging"),v=0}),t.readAsDataURL(e.dataTransfer.files[0])}function Ee(e){e.preventDefault(),e.stopPropagation()}function Me(e){e.stopPropagation(),v++,console.log(v),v?document.body.classList.add("-dragging"):document.body.classList.remove("-dragging")}function Ie(e){e.stopPropagation(),v--,console.log(v),v?document.body.classList.add("-dragging"):document.body.classList.remove("-dragging")}const q=document.querySelector(".app");q.addEventListener("drop",Le);q.addEventListener("dragover",Ee);q.addEventListener("dragenter",Me);q.addEventListener("dragleave",Ie);const ee=document.querySelector("#inputImageFile");ee.addEventListener("change",Se);document.querySelector("#inputImageButton").addEventListener("click",()=>{ee.click()});document.querySelectorAll("[data-start-drawing]").forEach(e=>{e.addEventListener("change",J(Q,256))});document.querySelector("#smoothingAmount").addEventListener("change",J(()=>{const e=z(u.coords,{...w,size:[u.width,u.height]});document.querySelector(".smooth-svg-container").innerHTML=e},128));document.querySelector("#download").addEventListener("click",()=>{const e=document.createElement("a"),t=document.querySelector("canvas#draw");e.download="PINTR.png",e.href=t.toDataURL(),e.click()});document.querySelector("#downloadSvg").addEventListener("click",()=>{const e=document.createElement("a");e.download="PINTR.svg";const t=pe(u.coords,{...w,size:[u.width,u.height]}),r=new Blob([t],{type:"image/svg+xml;charset=utf-8"}),i=URL.createObjectURL(r);e.href=i,e.click()});document.querySelector("#downloadSmoothSvg").addEventListener("click",()=>{const e=document.createElement("a");e.download="PINTR.svg";const t=z(u.coords,{...w,size:[u.width,u.height]}),r=new Blob([t],{type:"image/svg+xml;charset=utf-8"}),i=URL.createObjectURL(r);e.href=i,e.click()});Q();
