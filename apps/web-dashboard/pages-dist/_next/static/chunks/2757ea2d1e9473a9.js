(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,512572,e=>{"use strict";var t=e.i(843476),r=e.i(271645);function i({clientPosition:i,delivererPosition:n,className:o="h-64 w-full rounded-xl overflow-hidden",showRoute:l=!0}){let a=(0,r.useRef)(null),s=(0,r.useRef)(null),d=(0,r.useRef)(null),c=(0,r.useRef)(null),p=(0,r.useRef)(null),u=(0,r.useRef)(null),[f,h]=(0,r.useState)(!1);return(0,r.useEffect)(()=>{if(!a.current||d.current)return;let t=a.current;return t._leaflet_id&&(delete t._leaflet_id,t.innerHTML=""),async function(){let t=(await e.A(871400)).default;delete t.Icon.Default.prototype._getIconUrl,t.Icon.Default.mergeOptions({iconRetinaUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",iconUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",shadowUrl:"https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"}),s.current=t;let r=i??n??{lat:4.061,lng:9.769},o=t.map(a.current,{center:[r.lat,r.lng],zoom:15,zoomControl:!0,scrollWheelZoom:!0});t.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',maxZoom:19}).addTo(o);let l=new t.Control({position:"bottomleft"});l.onAdd=()=>{let e=t.DomUtil.create("div");return e.innerHTML=`
          <div style="
            background:white;
            border-radius:10px;
            padding:8px 12px;
            font-size:12px;
            font-family:sans-serif;
            box-shadow:0 2px 8px rgba(0,0,0,0.18);
            display:flex;
            flex-direction:column;
            gap:5px;
          ">
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:14px;height:14px;background:#2563eb;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(37,99,235,0.5);flex-shrink:0"></div>
              <span style="font-weight:600;color:#1e293b">Client (destination)</span>
            </div>
            <div style="display:flex;align-items:center;gap:7px">
              <div style="width:14px;height:14px;background:#ea580c;border-radius:50%;border:2px solid white;box-shadow:0 1px 4px rgba(234,88,12,0.5);flex-shrink:0"></div>
              <span style="font-weight:600;color:#1e293b">Livreur (position GPS)</span>
            </div>
          </div>`,e},l.addTo(o),d.current=o,h(!0)}(),()=>{d.current&&(d.current.remove(),d.current=null)}},[]),(0,r.useEffect)(()=>{if(!f||!s.current||!d.current)return;let e=s.current,t=d.current;if(i){let r=[i.lat,i.lng],n=i.label??"Adresse de livraison";if(c.current)c.current.setLatLng(r);else{let o,l=i.name?`<div style="font-weight:700;color:#1e293b;font-size:13px;margin-bottom:2px">👤 ${i.name}</div>`:"",a=i.phone?`<a href="tel:${i.phone}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#2563eb;text-decoration:none;margin-top:3px">📞 ${i.phone}</a>`:"";c.current=e.marker(r,{icon:(o=`
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
        <div style="
          background:#2563eb;
          border:3px solid white;
          width:42px;height:42px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
        ">
          <svg style="transform:rotate(45deg)" width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M10 20v-6h4v6h5v-8h3L12 3 2 12h3v8z"/>
          </svg>
        </div>
        <div style="
          margin-top:2px;
          background:#2563eb;
          color:white;
          font-size:10px;
          font-weight:700;
          padding:2px 8px;
          border-radius:99px;
          white-space:nowrap;
          border:2px solid white;
          letter-spacing:0.3px;
        ">CLIENT</div>
      </div>`,e.divIcon({className:"",html:o,iconSize:[42,62],iconAnchor:[21,62],popupAnchor:[0,-65]})),zIndexOffset:100}).addTo(t).bindPopup(`<div style="font-size:12px;color:#1e293b;min-width:150px;line-height:1.5">
               ${l}
               <div style="color:#64748b;font-size:11px">📍 ${n}</div>
               ${a}
             </div>`,{maxWidth:240})}}else c.current&&(d.current.removeLayer(c.current),c.current=null)},[i,f]),(0,r.useEffect)(()=>{if(!f||!s.current||!d.current)return;let e=s.current,t=d.current;if(n){let r=[n.lat,n.lng],i=n.label??"Livreur en route";if(p.current)p.current.setLatLng(r);else{let o,l=n.phone?`<a href="tel:${n.phone}" style="display:flex;align-items:center;gap:4px;font-size:12px;color:#ea580c;text-decoration:none;margin-top:3px">📞 ${n.phone}</a>`:"";p.current=e.marker(r,{icon:(o=`
      <style>
        @keyframes deliverer-pulse {
          0%,100% { box-shadow: 0 0 0 0 rgba(234,88,12,0.5); }
          50%      { box-shadow: 0 0 0 10px rgba(234,88,12,0); }
        }
      </style>
      <div style="display:flex;flex-direction:column;align-items:center;filter:drop-shadow(0 3px 6px rgba(0,0,0,0.35))">
        <div style="
          background:#ea580c;
          border:3px solid white;
          width:46px;height:46px;
          border-radius:50% 50% 50% 0;
          transform:rotate(-45deg);
          display:flex;align-items:center;justify-content:center;
          animation:deliverer-pulse 1.8s infinite;
        ">
          <svg style="transform:rotate(45deg)" width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M19 7c0-1.1-.9-2-2-2h-3L12 3H7L5 5H3c-1.1 0-2 .9-2 2v1h18V7zM3 10l1.5 9h15L21 10H3z"/>
            <circle cx="6.5" cy="20.5" r="2.5" fill="white"/>
            <circle cx="17.5" cy="20.5" r="2.5" fill="white"/>
          </svg>
        </div>
        <div style="
          margin-top:2px;
          background:#ea580c;
          color:white;
          font-size:10px;
          font-weight:700;
          padding:2px 8px;
          border-radius:99px;
          white-space:nowrap;
          border:2px solid white;
          letter-spacing:0.3px;
        ">LIVREUR</div>
      </div>`,e.divIcon({className:"",html:o,iconSize:[46,68],iconAnchor:[23,68],popupAnchor:[0,-70]})),zIndexOffset:200}).addTo(t).bindPopup(`<div style="font-size:12px;color:#1e293b;min-width:150px;line-height:1.5">
               <div style="font-weight:700;font-size:13px;margin-bottom:2px">🛵 ${i}</div>
               <div style="color:#64748b;font-size:11px">Livreur en route</div>
               ${l}
             </div>`,{maxWidth:240})}}else p.current&&(d.current.removeLayer(p.current),p.current=null)},[n,f]),(0,r.useEffect)(()=>{if(!f||!l||!s.current||!d.current||!i||!n)return;let e=s.current,t=d.current;!async function(){try{let r=`https://router.project-osrm.org/route/v1/driving/${n.lng},${n.lat};${i.lng},${i.lat}?overview=full&geometries=geojson`,o=await fetch(r),l=await o.json();if(d.current!==t)return;if(l.routes?.[0]?.geometry?.coordinates){let r=l.routes[0].geometry.coordinates.map(([e,t])=>[t,e]);u.current&&t.removeLayer(u.current),e.polyline(r,{color:"#ffffff",weight:7,opacity:.7}).addTo(t),u.current=e.polyline(r,{color:"#ea580c",weight:4,opacity:.95,dashArray:"10, 6"}).addTo(t);let o=e.latLngBounds([[i.lat,i.lng],[n.lat,n.lng]]);t.fitBounds(o,{padding:[60,60]})}}catch{if(d.current!==t)return;if(i&&n){let r=e.latLngBounds([[i.lat,i.lng],[n.lat,n.lng]]);t.fitBounds(r,{padding:[60,60]})}}}()},[i,n,f,l]),(0,r.useEffect)(()=>{f&&d.current&&(n&&!i?d.current.setView([n.lat,n.lng],16):i&&!n&&d.current.setView([i.lat,i.lng],16))},[n,i,f]),(0,t.jsx)("div",{className:`relative ${o}`,children:(0,t.jsx)("div",{ref:a,style:{width:"100%",height:"100%"}})})}e.s(["DeliveryMap",()=>i])},223959,e=>{e.n(e.i(512572))},871400,e=>{e.v(t=>Promise.all(["static/chunks/dced6be1dbff4a98.js"].map(t=>e.l(t))).then(()=>t(632322)))}]);