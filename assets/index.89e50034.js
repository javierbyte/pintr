const gt=function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const a of document.querySelectorAll('link[rel="modulepreload"]'))r(a);new MutationObserver(a=>{for(const n of a)if(n.type==="childList")for(const i of n.addedNodes)i.tagName==="LINK"&&i.rel==="modulepreload"&&r(i)}).observe(document,{childList:!0,subtree:!0});function o(a){const n={};return a.integrity&&(n.integrity=a.integrity),a.referrerpolicy&&(n.referrerPolicy=a.referrerpolicy),a.crossorigin==="use-credentials"?n.credentials="include":a.crossorigin==="anonymous"?n.credentials="omit":n.credentials="same-origin",n}function r(a){if(a.ep)return;a.ep=!0;const n=o(a);fetch(a.href,n)}};gt();function V(t,e=255){const{data:o}=t.getImageData(0,0,t.canvas.width,t.canvas.height),{width:r,height:a}=t.canvas;let n=[];for(let i=0;i<a;i++)for(let s=0;s<r;s++){n[s]||(n[s]=new Uint8Array(a)),n[s][i]=Math.floor((o[i*r*4+s*4]+o[i*r*4+s*4+1]+o[i*r*4+s*4+2])/3);const c=o[i*r*4+s*4+3];c!==255&&(n[s][i]=n[s][i]*(c/255)+e*(1-c/255))}return n}function ut(t,e){const{crop:o=!0,size:r=512}=e;return new Promise(a=>{const n=new window.Image;n.onload=function(){const s=e.canvas||document.createElement("canvas"),c=s.getContext("2d");if(!c)throw new Error("Failed to 'getContext2d'");let m=1;r&&(m=r/Math.max(n.width,n.height)),e.maxSize&&(n.width>e.maxSize||n.height>e.maxSize)&&(m=e.maxSize/Math.max(n.width,n.height));const l=Math.floor(n.width*m),d=Math.floor(n.height*m);if(o){s.width=r,s.height=r;const g=Math.min(n.width,n.height);c.drawImage(n,(n.width-g)/2,(n.height-g)/2,g,g,0,0,r,r)}else s.width=l,s.height=d,c.drawImage(n,0,0,l,d);const h=c.getImageData(0,0,c.canvas.width,c.canvas.height);a(h)},n.src=t})}function K(t){t.beginPath();function e(a,n,i={color:"#000",width:1}){const{color:s="#000",width:c=1}=i;t.beginPath(),t.lineWidth=c,t.moveTo(a[0],a[1]),t.lineTo(n[0],n[1]),t.strokeStyle=s,t.stroke()}function o(a,n){t.moveTo(a[0],a[1]),t.lineTo(n[0],n[1])}function r(a={color:"#000",width:1}){const{color:n="#000",width:i=1}=a;t.lineWidth=i,t.strokeStyle=n,t.stroke(),t.beginPath()}return{line:e,lineBuffer:o,stroke:r}}const z=.1,M={r:.299+z,g:.587+z*-.5,b:.114+z*-.5};function ht(t){let e=t.data,o=1/0,r=0,a=0;for(let i=0;i<e.length;i+=4){let s=e[i]*M.r+e[i+1]*M.g+e[i+2]*M.b;e[i+3]<128&&(s=255),o=Math.min(o,s),r=Math.max(r,s),a+=s}a=Math.round(a/(e.length/4)),o+=32,r-=32;const n=255/(r-o);for(let i=0;i<e.length;i+=4){let s=e[i]*M.r+e[i+1]*M.g+e[i+2]*M.b;e[i]=Math.round(s*n)-o,e[i+1]=Math.round(s*n)-o,e[i+2]=Math.round(s*n)-o}return{canvasData:t,averageLightness:a}}function Z(t,e,o){let r=0;const a=t[0],n=e[0]-t[0],i=t[1],s=e[1]-t[1],c=Math.max(Math.abs(n),Math.abs(s));for(let m=0;m<c;m++){const l=Math.round(a+n/c*m),d=Math.round(i+s/c*m);r+=o[l][d]}return Math.round(r/c)}function p(t,e){return e===void 0?Math.floor(Math.random()*t):Math.min(t,e)+Math.floor(Math.random()*Math.abs(t-e))}function Q(t,e){let o=0;return function(...r){clearTimeout(o),o=window.setTimeout(()=>t.apply(this,r),e)}}function N(t,e){const o=[...e];if(o.sort((r,a)=>r[0]-a[0]),t<o[0][0]||t>o[o.length-1][0])return console.error(`Value "${t}" out of range`,{value:t,tweens:e,sortedTweens:o}),t;for(const r in e){const a=e[r];if(a[0]===t)return a[1];if(a[0]>t){const n=e[Number(r)-1],i=a[0]-n[0],s=(t-n[0])/i;return s*a[1]+(1-s)*n[1]}}return t}const mt=1080,x=1;let I=[],R=[],P=new Date().getTime()-1;const q=document.createElement("canvas");async function ft(t,{canvasDrawEl:e,onDraw:o,onFinish:r,onLoad:a}){const n=await ut(t,{size:mt,canvas:q,crop:!1}),i=n.width,s=n.height;q.width=i,q.height=s;const c=q.getContext("2d");if(!c)throw new Error("Failed to initiate 'CanvasRenderingContext2D'");const m=K(c),l=e||document.createElement("canvas");l.width=i*x,l.height=s*x;const d=document.querySelector("#srcImg"),h=l.getContext("2d");if(!d)throw new Error("Failed to initiate srcImgEl");if(!h)throw new Error("Failed to initiate CanvasRenderingContext2D");d.style.aspectRatio=String(i/s),h.scale(x,x);const g=K(h);console.log("> Starting PINTR"),a({width:i,height:s});const{canvasData:w,averageLightness:D}=ht(n);async function y(b){console.log("> Render PINTR",b);const{density:$,singleLine:B,contrast:O,definition:nt,strokeWidth:_}=b;P=new Date().getTime(),R=[];const C=Math.round(N(nt,[[0,3],[50,15],[100,75]])),ot=Math.round(N($,[[0,500],[50,3e3],[100,7e3]])),rt="rgba(0, 0, 0, 255)",at=`rgba(255, 255, 255, ${(100-Math.round(N(O,[[0,20],[50,67],[100,90]])))/100})`,it=100-Math.floor(C/2);if(!c)throw new Error("Canvas error");c.putImageData(w,0,0),I=V(c);let st=new Date().getTime(),j=[Math.floor(i/2),Math.floor(s/2)];function ct(){let f=j,T=B?0:C;for(;T--;){let L=[p(i),p(s)];I[f[0]][f[1]]>I[L[0]][L[1]]&&(f=L)}let U=p(C,C*2),E=[p(i),p(s)],W=255;for(;U--;){let L=[p(i),p(s)];const Y=Z(f,L,I);Y<=W&&(W=Y,E=L)}W=Z(f,E,I),R.push([f,E]),g.lineBuffer(f,E),m.lineBuffer(f,E),j=E}const X=Math.floor(ot/D*128);let A=X;function lt(f){return new Promise(T=>{const U=new Date().getTime();for(;new Date().getTime()<U+15&&A-- >0;){if(f!==P)return;if(A%it===0){if(m.stroke({color:at,width:_*1.5}),!c)throw new Error("Canvas error");I=V(c)}ct()}g.stroke({color:rt,width:_*1}),window.requestAnimationFrame(T)})}async function dt(f){for(;A>0&&f===P;)await lt(f),o&&o({coords:R});o&&o({coords:R}),r&&r({coords:R});let T=new Date().getTime();console.log("> Lines per second:",X/(T-st)*1e3)}dt(P)}return{render:y}}function wt(t,{strokeWidth:e=1,size:o}){return`<svg viewBox="0 0 ${o[0]} ${o[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black" stroke-width="${e}">
${t.map(r=>`<line x1="${r[0][0]}" y1="${r[0][1]}" x2="${r[1][0]}" y2="${r[1][1]}"/>`).join(`
`)}
</svg>
  `}function vt(t,{strokeWidth:e=1,size:o}){return`<svg viewBox="0 0 ${o[0]} ${o[1]}" xmlns="http://www.w3.org/2000/svg">
  <polyline points="${t.map(r=>r[0].join(",")).join(" ")}" fill="none" stroke="black" stroke-width="${e}"/>
</svg>
  `}function pt(t,e){return console.warn(">generateSvg",e),e.singleLine?vt(t,e):wt(t,e)}function G(t,{smoothingAmount:e=50,strokeWidth:o=1,size:r}){const a=t.map(l=>l[0]),n=N(e,[[0,0],[50,.1],[100,1]]),i=(l,d)=>{const h=d[0]-l[0],g=d[1]-l[1];return{length:Math.sqrt(Math.pow(h,2)+Math.pow(g,2)),angle:Math.atan2(g,h)}},s=(l,d,h,g)=>{const y=i(d||l,h||l);console.log("NEW SMOOTH",e);const b=y.angle+(g?Math.PI:0),$=y.length*n,B=l[0]+Math.cos(b)*$,O=l[1]+Math.sin(b)*$;return[B,O]},c=(l,d,h)=>{const g=s(h[d-1],h[d-2],l),w=s(l,h[d-1],h[d+1],!0);return`C ${g[0]},${g[1]} ${w[0]},${w[1]} ${l[0]},${l[1]}`},m=(l,d)=>`<path d="${l.reduce((g,w,D,y)=>D===0?`M ${w[0]},${w[1]}`:`${g} ${d(w,D,y)}`,"")}" fill="none" stroke="black" stroke-width="${o}" />`;return`<svg viewBox="0 0 ${r[0]} ${r[1]}" xmlns="http://www.w3.org/2000/svg" stroke="black">
    ${m(a,c)}
  </svg>
  `}const St="./test.jpg";let v={contrast:50,definition:50,density:50,makeSmoothSvg:!1,singleLine:!0,strokeWidth:1,smoothingAmount:50},u={currentImgSrc:St,coords:[],width:512,height:512};async function H(t){const e=document.querySelector("canvas#draw");if(!e)throw new Error;const o=await ft(t,{canvasDrawEl:e,onDraw({coords:n}){u.coords=n},onLoad({width:n,height:i}){document.documentElement.style.setProperty("--sizew",`${n/2}px`),document.documentElement.style.setProperty("--sizeh",`${i/2}px`),u.width=n,u.height=i},onFinish({coords:n}){if(!v.makeSmoothSvg)return;const i=G(n,{...v,size:[u.width,u.height]}),s=document.querySelector(".smooth-svg-container");s.innerHTML=i}}),r=document.querySelector("#srcImg"),a=document.querySelector(".loading");r&&a&&(r.style.backgroundImage=`url("${t}")`,a.style.display="none"),o.render(v)}function yt(t){t.preventDefault(),t.stopPropagation();const e=t.target;if(!e||!e.files)return;const o=e.files[0];if(o){const r=new FileReader;r.addEventListener("load",function(a){!a||!a.target||(u.currentImgSrc=String(a.target.result),H(String(a.target.result)))}),r.readAsDataURL(o)}}function k(t){const e=document.querySelector(t);return e?Number(e.value):0}function J(t){const e=document.querySelector(t);return e?Boolean(Number(e.value)):!1}function tt(){const t=k("#density"),e=J("#singleLine"),o=k("#contrast"),r=k("#definition"),a=k("#strokeWidth"),n=J("#makeSmoothSvg"),i=k("#smoothingAmount");v={density:t,singleLine:e,contrast:o,definition:r,strokeWidth:a,makeSmoothSvg:n,smoothingAmount:i};const s=document.querySelector(".experimental--smoth-svg--container");s.style.display=n?"block":"none";const c=document.querySelector(".experimental--smoth-svg--container--warning");c.style.display=e?"none":"block",H(u.currentImgSrc)}let S=0;function Et(t){if(console.log("File(s) dropped"),t.preventDefault(),!t.dataTransfer||!t.dataTransfer.files||!t.dataTransfer.files[0])return;const e=new FileReader;e.addEventListener("load",function(o){!o||!o.target||!o.target.result||(u.currentImgSrc=String(o.target.result),H(String(o.target.result)),document.body.classList.remove("-dragging"),S=0)}),e.readAsDataURL(t.dataTransfer.files[0])}function Lt(t){t.preventDefault(),t.stopPropagation()}function Mt(t){t.stopPropagation(),S++,console.log(S),S?document.body.classList.add("-dragging"):document.body.classList.remove("-dragging")}function It(t){t.stopPropagation(),S--,console.log(S),S?document.body.classList.add("-dragging"):document.body.classList.remove("-dragging")}const F=document.querySelector(".app");F.addEventListener("drop",Et);F.addEventListener("dragover",Lt);F.addEventListener("dragenter",Mt);F.addEventListener("dragleave",It);const et=document.querySelector("#inputImageFile");et.addEventListener("change",yt);const kt=document.querySelector("#inputImageButton");kt.addEventListener("click",()=>{et.click()});document.querySelectorAll("[data-start-drawing]").forEach(t=>{t.addEventListener("change",Q(tt,32))});const Dt=document.querySelector("#smoothingAmount");Dt.addEventListener("change",Q(()=>{v.smoothingAmount=k("#smoothingAmount");const t=G(u.coords,{...v,size:[u.width,u.height]}),e=document.querySelector(".smooth-svg-container");e.innerHTML=t},128));const bt=document.querySelector("#download");bt.addEventListener("click",()=>{const t=document.createElement("a"),e=document.querySelector("canvas#draw");t.download="PINTR.png",t.href=e.toDataURL(),t.click()});const Tt=document.querySelector("#downloadSvg");Tt.addEventListener("click",()=>{const t=document.createElement("a");t.download="PINTR.svg";const e=pt(u.coords,{...v,size:[u.width,u.height]}),o=new Blob([e],{type:"image/svg+xml;charset=utf-8"}),r=URL.createObjectURL(o);t.href=r,t.click()});const Rt=document.querySelector("#downloadSmoothSvg");Rt.addEventListener("click",()=>{const t=document.createElement("a");t.download="PINTR.svg";const e=G(u.coords,{...v,size:[u.width,u.height]}),o=new Blob([e],{type:"image/svg+xml;charset=utf-8"}),r=URL.createObjectURL(o);t.href=r,t.click()});tt();
