import React, { useEffect, useRef } from 'react';

export default function CambodiaMap({ suppliers, darkMode }) {
  const mapRef = useRef(null);
  const mapObj = useRef(null);
  const markersRef = useRef([]);
  const tileRef = useRef(null);

  useEffect(() => {
    const L = window.L;
    if (!L || mapObj.current) return;

    const map = L.map(mapRef.current, {
      center: [12.5657, 104.9910],
      zoom: 7,
      zoomControl: false,
      attributionControl: false,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);

    const tile = L.tileLayer(
      darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 18, attribution: '© OpenStreetMap © CARTO' }
    ).addTo(map);

    tileRef.current = tile;
    mapObj.current  = map;

    // Click to add pin
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      const L2 = window.L;
      const icon = L2.divIcon({
        className: '',
        html: `<div style="width:12px;height:12px;background:#00c9a7;border:2px solid #fff;border-radius:50%;box-shadow:0 2px 8px rgba(0,201,167,0.6)"></div>`,
        iconSize: [12, 12], iconAnchor: [6, 6],
      });
      L2.marker([lat, lng], { icon })
        .addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;font-size:12px"><b>📍 Custom Pin</b><br><span style="color:#6b7280">Lat: ${lat.toFixed(5)}</span><br><span style="color:#6b7280">Lng: ${lng.toFixed(5)}</span></div>`)
        .openPopup();
    });

  }, []);

  // Update tile on dark mode change
  useEffect(() => {
    const L = window.L;
    if (!L || !mapObj.current || !tileRef.current) return;
    tileRef.current.remove();
    tileRef.current = L.tileLayer(
      darkMode
        ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
      { maxZoom: 18, attribution: '© OpenStreetMap © CARTO' }
    ).addTo(mapObj.current);
  }, [darkMode]);

  // Update supplier markers
  useEffect(() => {
    const L = window.L;
    if (!L || !mapObj.current) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    const colors = ['#1e6bde','#12b886','#7c3aed','#f59f00','#e24b4a','#06b6d4','#ec4899','#f97316'];

    suppliers.forEach((s, i) => {
      const coords = getCambodiaCoords(s.address);
      if (!coords) return;

      const color = colors[i % colors.length];
      const initials = s.name?.slice(0, 2).toUpperCase() || '??';
      const status = s.status || 'active';
      const statusColor = status === 'active' ? '#12b886' : status === 'pending' ? '#f59f00' : '#6b7280';

      const icon = L.divIcon({
        className: '',
        html: `
          <div style="position:relative;width:40px;height:46px">
            <div style="
              width:40px;height:40px;border-radius:50% 50% 50% 0;
              background:${color};border:3px solid #fff;
              transform:rotate(-45deg);
              box-shadow:0 4px 15px rgba(0,0,0,0.3);
              display:flex;align-items:center;justify-content:center;
            ">
              <span style="transform:rotate(45deg);color:#fff;font-size:12px;font-weight:700;font-family:sans-serif">${initials}</span>
            </div>
            <div style="
              position:absolute;bottom:0;left:50%;transform:translateX(-50%);
              width:8px;height:8px;border-radius:50%;
              background:${statusColor};border:2px solid #fff;
            "></div>
          </div>
        `,
        iconSize: [40, 46],
        iconAnchor: [20, 46],
        popupAnchor: [0, -48],
      });

      const popup = `
        <div style="font-family:'DM Sans',sans-serif;min-width:200px;padding:4px">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px">
            <div style="width:36px;height:36px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:12px;flex-shrink:0">${initials}</div>
            <div>
              <div style="font-weight:700;font-size:13px;color:#0f1f3d">${s.name}</div>
              <div style="font-size:10px;color:#6b7fa8">SUP-${String(s.id).padStart(3,'0')}</div>
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:5px">
            ${s.contact_name ? `<div style="font-size:11px;color:#374151;display:flex;gap:6px"><span>👤</span><span>${s.contact_name}</span></div>` : ''}
            ${s.phone        ? `<div style="font-size:11px;color:#374151;display:flex;gap:6px"><span>📞</span><span>${s.phone}</span></div>` : ''}
            ${s.email        ? `<div style="font-size:11px;color:#374151;display:flex;gap:6px"><span>✉️</span><span>${s.email}</span></div>` : ''}
            ${s.delivery_company ? `<div style="font-size:11px;color:#374151;display:flex;gap:6px"><span>🚚</span><span>${s.delivery_company}</span></div>` : ''}
            ${s.address      ? `<div style="font-size:11px;color:#374151;display:flex;gap:6px"><span>📍</span><span>${s.address}</span></div>` : ''}
          </div>
          <div style="margin-top:8px;padding-top:8px;border-top:1px solid #e5e7eb;display:flex;align-items:center;justify-content:space-between">
            <span style="font-size:10px;padding:2px 8px;border-radius:20px;font-weight:600;background:${status==='active'?'#e6fcf5':status==='pending'?'#fff3cd':'#f3f4f6'};color:${status==='active'?'#0d7a5f':status==='pending'?'#92400e':'#6b7280'}">
              ● ${status.toUpperCase()}
            </span>
            <span style="font-size:10px;color:#6b7fa8">${s.category||'General'}</span>
          </div>
        </div>
      `;

      const marker = L.marker(coords, { icon })
        .addTo(mapObj.current)
        .bindPopup(popup, { maxWidth: 240, className: 'custom-popup' });

      markersRef.current.push(marker);
    });
  }, [suppliers]);

  return <div ref={mapRef} style={{ width:'100%', height:'100%' }} />;
}

function getCambodiaCoords(address) {
  if (!address) return null;
  const addr = address.toLowerCase();

  // Check if it's a custom lat/lng format
  const latLngMatch = addr.match(/lat:([\d.-]+),\s*lng:([\d.-]+)/);
  if (latLngMatch) return [parseFloat(latLngMatch[1]), parseFloat(latLngMatch[2])];

  const cities = [
    { keys: ['phnom penh','phnompenh'],          lat: 11.5564, lng: 104.9282 },
    { keys: ['siem reap','siemreap'],             lat: 13.3671, lng: 103.8448 },
    { keys: ['battambang'],                        lat: 13.0957, lng: 103.2022 },
    { keys: ['sihanoukville','preah sihanouk'],   lat: 10.6090, lng: 103.5297 },
    { keys: ['kampot'],                            lat: 10.6167, lng: 104.1800 },
    { keys: ['kampong cham','kompong cham'],       lat: 11.9932, lng: 105.4635 },
    { keys: ['kampong chhnang'],                   lat: 12.2500, lng: 104.6667 },
    { keys: ['kampong speu'],                      lat: 11.4500, lng: 104.5167 },
    { keys: ['kampong thom'],                      lat: 12.7111, lng: 104.8897 },
    { keys: ['koh kong'],                          lat: 11.6150, lng: 103.0000 },
    { keys: ['kratie','kratié'],                   lat: 12.4881, lng: 106.0188 },
    { keys: ['mondulkiri'],                        lat: 12.4574, lng: 107.1884 },
    { keys: ['preah vihear'],                      lat: 13.7861, lng: 104.9783 },
    { keys: ['prey veng'],                         lat: 11.4847, lng: 105.3249 },
    { keys: ['pursat'],                            lat: 12.5388, lng: 103.9193 },
    { keys: ['ratanakiri'],                        lat: 13.7394, lng: 106.9872 },
    { keys: ['svay rieng'],                        lat: 11.0878, lng: 105.7997 },
    { keys: ['takeo'],                             lat: 10.9908, lng: 104.7850 },
    { keys: ['kep'],                               lat: 10.4833, lng: 104.3167 },
    { keys: ['pailin'],                            lat: 12.8490, lng: 102.6091 },
    { keys: ['stung treng'],                       lat: 13.5238, lng: 105.9698 },
    { keys: ['tbong khmum'],                       lat: 11.9889, lng: 105.6667 },
    { keys: ['oddar meanchey'],                    lat: 14.1803, lng: 103.5167 },
    { keys: ['banteay meanchey'],                  lat: 13.5617, lng: 102.9892 },
  ];

  for (const city of cities) {
    if (city.keys.some(k => addr.includes(k))) {
      return [
        city.lat + (Math.random()-0.5)*0.04,
        city.lng + (Math.random()-0.5)*0.04,
      ];
    }
  }
  return [11.5564+(Math.random()-0.5)*0.05, 104.9282+(Math.random()-0.5)*0.05];
}