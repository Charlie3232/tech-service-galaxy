const SCRIPT_URL = '您的GAS部署網址'; 
let allIssues = [];
let allEvents = [];
let dataConfig = {};
let isMutating = false; 

// ✨ 記錄當前彈出視窗是普通任務('TS')還是主管事務('MGR')
let currentModalType = 'TS';

let calBaseDate = new Date();
calBaseDate.setDate(calBaseDate.getDate() - calBaseDate.getDay() - 7);

function handleLogin() {
  const pwd = document.getElementById('login-pwd').value;
  if(pwd === "13091309") {
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';
    init();
  } else if (pwd === "13321332") {
    // ✨ 專屬主管密碼
    document.getElementById('login-overlay').style.display = 'none';
    document.getElementById('main-ui').style.display = 'block';
    document.getElementById('btn-tab-manager').style.display = 'block';
    init();
  } else { 
    alert("歐嚕嚕咒語無效，存取拒絕"); 
  }
}

async function init() {
  await fetchData();
  renderIssues();
  renderManagerIssues();
  renderCalendar();
  renderStats();
  setInterval(silentSync, 10000);
}

async function silentSync() {
  if (isMutating) return; 
  try {
    const resp = await fetch(SCRIPT_URL + '?action=getData');
    const data = await resp.json();
    if (isMutating) return; 
    allIssues = data.issues || [];
    allEvents = data.events || [];
    renderIssues();
    renderManagerIssues();
    renderCalendar();
    renderStats();
  } catch (e) { }
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(el => el.style.display = 'none');
  document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
  document.getElementById(tabId).style.display = 'block';
  document.getElementById('btn-' + tabId).classList.add('active');
  if(tabId === 'tab-main') { renderCalendar(); renderStats(); }
}

document.addEventListener('click', function(e) {
  if (!e.target.matches('.select-selected')) {
    document.querySelectorAll('.select-items').forEach(el => el.style.display = 'none');
  }
});

function toggleDropdown(id, event) {
  event.stopPropagation();
  document.querySelectorAll('.select-items').forEach(el => { if(el.id !== id) el.style.display = 'none'; });
  const el = document.getElementById(id);
  el.style.display = el.style.display === 'block' ? 'none' : 'block';
}

const fillCheckboxes = (id, list, data, onChangeCode) => {
  const el = document.getElementById(id);
  if(el && data.config[list]) {
    let html = data.config[list].map(t => `<label class="checkbox-label" onclick="event.stopPropagation()"><input type="checkbox" value="${t}" onchange="${onChangeCode}"> ${t}</label>`).join('');
    if(el.innerHTML.trim() === '') el.innerHTML = html;
  }
};

function updateStatsStatusText() {
  const vals = getCheckedValues('stats-status');
  const txt = document.getElementById('stats-status-text');
  if (vals.length === 0) txt.innerText = "狀態: 全狀態 ▾";
  else txt.innerText = vals.length > 1 ? `狀態: 已選(${vals.length}) ▾` : `狀態: ${vals[0]} ▾`;
  renderStats();
}

async function fetchData() {
  const resp = await fetch(SCRIPT_URL + '?action=getData');
  const data = await resp.json();
  allIssues = data.issues || [];
  allEvents = data.events || [];
  dataConfig = data.config || {};
  
  const fillFormSelect = (id, list) => {
    const el = document.getElementById(id);
    if(el && dataConfig[list] && el.options.length <= 1) {
      let options = dataConfig[list].map(t => `<option value="${t}">${t}</option>`);
      options.unshift('<option value="" disabled selected>請選擇...</option>');
      el.innerHTML = options.join('');
    }
  };

  const fillCategory = () => {
    const el = document.getElementById('ev-category');
    if(el && dataConfig.eventCategories && el.options.length <= 1) {
      let options = dataConfig.eventCategories.map(c => `<option value="${c.name}">${c.name}</option>`);
      options.unshift('<option value="" disabled selected>請選擇類別...</option>');
      el.innerHTML = options.join('');
    }
  };

  fillCheckboxes('items-owner', 'owners', data, 'renderIssues()');
  fillCheckboxes('items-status', 'statusList', data, 'renderIssues()');
  fillCheckboxes('items-customer', 'customers', data, 'renderIssues()');
  fillCheckboxes('ev-participants', 'owners', data, 'updateParticipantsText()');
  
  // 主管專屬篩選器
  fillCheckboxes('items-status-mgr', 'statusList', data, 'renderManagerIssues()');
  fillCheckboxes('items-customer-mgr', 'customers', data, 'renderManagerIssues()');

  fillCheckboxes('stats-status', 'statusList', data, 'updateStatsStatusText()');
  
  fillFormSelect('input-owner', 'owners');
  fillFormSelect('input-status', 'statusList');
  fillFormSelect('input-customer', 'customers');
  fillFormSelect('input-project', 'projects');
  fillCategory();
}

const getCheckedValues = (id) => {
  return Array.from(document.querySelectorAll(`#${id} input[type="checkbox"]:checked`)).map(cb => cb.value);
};

function updateParticipantsText() {
  const vals = getCheckedValues('ev-participants');
  const txt = document.getElementById('ev-participants-text');
  if(vals.length === 0) txt.innerText = "點擊選擇人員 ▾";
  else txt.innerText = vals.join(', ') + " ▾";
}

function toggleEndDate() {
  const isChecked = document.getElementById('ev-has-end').checked;
  document.getElementById('end-date-group').style.display = isChecked ? 'grid' : 'none';
  document.getElementById('ev-end-date').required = isChecked;
  document.getElementById('ev-end-time-h').required = isChecked;
  document.getElementById('ev-end-time-m').required = isChecked;
}

const getCategoryColor = (catName) => {
  if(!dataConfig.eventCategories) return '#555555';
  const cat = dataConfig.eventCategories.find(c => c.name === catName);
  const colorStr = cat ? cat.color : '';
  if(colorStr.includes('綠')) return '#4caf50';
  if(colorStr.includes('藍')) return '#2196f3';
  if(colorStr.includes('粉')) return '#e91e63';
  if(colorStr.includes('咖啡')) return '#795548';
  if(colorStr.includes('紅')) return '#f44336';
  if(colorStr.includes('橘') || colorStr.includes('橙')) return '#ff9800';
  if(colorStr.includes('黃')) return '#fbc02d';
  if(colorStr.includes('紫')) return '#9c27b0';
  return '#555555'; 
};

// ================= 行事曆功能 =================
function changeCalendarWeek(offsetWeeks) {
  calBaseDate.setDate(calBaseDate.getDate() + (offsetWeeks * 7));
  renderCalendar();
}

function parseDateSafe(dStr) {
  if (!dStr) return 0;
  let parts = String(dStr).split(/[-/T ]/);
  if (parts.length < 3) return 0;
  return new Date(parts[0], parts[1] - 1, parts[2]).getTime();
}

function renderCalendar() {
  const grid = document.getElementById('cal-grid');
  grid.innerHTML = "";
  
  let endDate = new Date(calBaseDate);
  endDate.setDate(endDate.getDate() + 27);
  document.getElementById('cal-month-year').innerText = `${calBaseDate.getFullYear()}/${calBaseDate.getMonth()+1}/${calBaseDate.getDate()} - ${endDate.getFullYear()}/${endDate.getMonth()+1}/${endDate.getDate()}`;

  const today = new Date();
  const todaySafe = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;

  let calDays = [];
  for(let i=0; i<28; i++) {
    let d = new Date(calBaseDate);
    d.setDate(d.getDate() + i);
    calDays.push({
      dateObj: d,
      dateStr: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
      time: new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    });
  }

  let cellSlots = Array.from({length: 28}, () => []);

  let viewEvents = allEvents.filter(ev => {
    let evStart = parseDateSafe(ev.date);
    let evEnd = ev.endDate ? parseDateSafe(ev.endDate) : evStart;
    return evEnd >= calDays[0].time && evStart <= calDays[27].time;
  }).sort((a, b) => {
    let aStart = parseDateSafe(a.date), bStart = parseDateSafe(b.date);
    if(aStart !== bStart) return aStart - bStart;
    let aTime = String(a.time || "00:00");
    let bTime = String(b.time || "00:00");
    if (aTime !== bTime) return aTime.localeCompare(bTime); 
    let aLen = (parseDateSafe(a.endDate || a.date) - aStart);
    let bLen = (parseDateSafe(b.endDate || b.date) - bStart);
    return bLen - aLen; 
  });

  viewEvents.forEach(ev => {
    let evStart = parseDateSafe(ev.date);
    let evEnd = ev.endDate ? parseDateSafe(ev.endDate) : evStart;

    let actualStartIndex = calDays.findIndex(d => d.time === evStart);
    let actualEndIndex = calDays.findIndex(d => d.time === evEnd);

    if(actualStartIndex === -1) actualStartIndex = (evStart < calDays[0].time) ? -1 : 999;
    if(actualEndIndex === -1) actualEndIndex = (evEnd > calDays[27].time) ? 999 : -1;

    let vStart = Math.max(0, actualStartIndex);
    let vEnd = Math.min(27, actualEndIndex);

    if (vStart <= vEnd) {
      let slotIdx = 0;
      while(true) {
        let isFree = true;
        for(let i = vStart; i <= vEnd; i++) {
          if(cellSlots[i][slotIdx]) { isFree = false; break; }
        }
        if(isFree) break;
        slotIdx++;
      }
      
      for(let i = vStart; i <= vEnd; i++) {
        let currentDayOfWeek = calDays[i].dateObj.getDay();
        let isSegmentStart = (i === vStart) || (currentDayOfWeek === 0);
        
        let segmentSpan = 1;
        if (isSegmentStart) {
          let endOfThisWeek = i + (6 - currentDayOfWeek);
          let segmentEnd = Math.min(vEnd, endOfThisWeek);
          segmentSpan = segmentEnd - i + 1;
        }

        cellSlots[i][slotIdx] = {
          ev: ev,
          isStart: (i === actualStartIndex),
          isEnd: (i === actualEndIndex),
          isMulti: (actualStartIndex !== actualEndIndex),
          isSegmentStart: isSegmentStart,
          segmentSpan: segmentSpan 
        };
      }
    }
  });

  for(let i=0; i<28; i++) {
    let cd = calDays[i];
    let isToday = (cd.dateStr === todaySafe) ? 'today' : '';
    let dateDisplay = (i === 0 || cd.dateObj.getDate() === 1) ? `${cd.dateObj.getMonth()+1}/${cd.dateObj.getDate()}` : cd.dateObj.getDate();

    let dayEventsHTML = '';
    let slots = cellSlots[i];
    
    for(let s = 0; s < slots.length; s++) {
      let slotData = slots[s];
      if(!slotData) {
        dayEventsHTML += `<div class="cal-event-spacer"></div>`;
      } else {
        let ev = slotData.ev;
        let classes = "cal-event";
        if (slotData.isMulti) {
          if (slotData.isStart) classes += " multi-start";
          else if (slotData.isEnd) classes += " multi-end";
          else classes += " multi-middle";
        }
        
        let bgColor = getCategoryColor(ev.category);

        if (slotData.isSegmentStart) {
          let fullText = ev.name;
          if (ev.time && slotData.isStart) fullText = ev.time + ' ' + fullText;
          
          let spanLen = slotData.segmentSpan || 1;
          let textWidth = `calc(${spanLen * 100}% + ${(spanLen - 1) * 19}px)`;
          
          let innerSpan = `<span style="position: absolute; top: 0; left: 0; width: ${textWidth}; text-align: center; color: #fff; pointer-events: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; display: block; z-index: 60;">${fullText}</span>`;
          
          dayEventsHTML += `<div class="${classes}" style="background-color: ${bgColor}; position: relative; z-index: 50; overflow: visible;" onclick="openEditEvent('${ev.id}', event)">${innerSpan}</div>`;
        } else {
          dayEventsHTML += `<div class="${classes}" style="background-color: ${bgColor}; color: transparent; position: relative; z-index: 5;" onclick="openEditEvent('${ev.id}', event)">&nbsp;</div>`;
        }
      }
    }

    grid.innerHTML += `<div class="cal-cell ${isToday}" onclick="openEventModal('${cd.dateStr}')"><div class="cal-date-num">${dateDisplay}</div>${dayEventsHTML}</div>`;
  }
}

function openEventModal(prefillDate = "") {
  document.getElementById('eventForm').reset();
  document.getElementById('edit-ev-id').value = "";
  document.getElementById('ev-has-end').checked = false;
  toggleEndDate();
  
  document.querySelectorAll('#ev-participants input[type="checkbox"]').forEach(cb => cb.checked = false);
  updateParticipantsText();
  
  if (prefillDate) {
    document.getElementById('ev-date').value = prefillDate;
  } else {
    let d = new Date();
    let dStr = d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
    document.getElementById('ev-date').value = dStr;
  }
  
  const btn = document.getElementById('ev-submit-btn');
  btn.innerText = "[ 建立活動 ]";
  btn.disabled = false;
  document.getElementById('btn-ev-delete').style.display = 'none';
  document.getElementById('event-modal-overlay').style.display = 'flex';
}

function openEditEvent(id, event) {
  event.stopPropagation();
  const ev = allEvents.find(x => x.id === id);
  if(!ev) return;

  document.getElementById('edit-ev-id').value = ev.id;
  document.getElementById('ev-name').value = ev.name;
  document.getElementById('ev-category').value = ev.category || "";
  document.getElementById('ev-date').value = ev.date;
  
  let timeParts = (ev.time || "").split(':');
  document.getElementById('ev-time-h').value = timeParts[0] || "";
  document.getElementById('ev-time-m').value = timeParts[1] || "";
  
  document.getElementById('ev-location').value = ev.location;

  if(ev.endDate) {
    document.getElementById('ev-has-end').checked = true;
    toggleEndDate();
    document.getElementById('ev-end-date').value = ev.endDate;
    let endTimeParts = (ev.endTime || "").split(':');
    document.getElementById('ev-end-time-h').value = endTimeParts[0] || "";
    document.getElementById('ev-end-time-m').value = endTimeParts[1] || "";
  } else {
    document.getElementById('ev-has-end').checked = false;
    toggleEndDate();
  }

  const parts = String(ev.participants || "").split(', ');
  document.querySelectorAll('#ev-participants input[type="checkbox"]').forEach(cb => {
    cb.checked = parts.includes(cb.value);
  });
  updateParticipantsText();

  const btn = document.getElementById('ev-submit-btn');
  btn.innerText = "[ 編輯完成 ]";
  btn.disabled = false;
  document.getElementById('btn-ev-delete').style.display = 'inline-block';
  document.getElementById('event-modal-overlay').style.display = 'flex';
}

function closeEventModal() { document.getElementById('event-modal-overlay').style.display = 'none'; }

async function submitEvent() {
  const form = document.getElementById('eventForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  
  const participants = getCheckedValues('ev-participants').join(', ');
  if(!participants) { alert("請至少選擇一位參與人員"); return; }

  const hh = document.getElementById('ev-time-h').value.padStart(2, '0');
  const mm = document.getElementById('ev-time-m').value.padStart(2, '0');
  
  let endD = "", endT = "";
  if(document.getElementById('ev-has-end').checked) {
    endD = document.getElementById('ev-end-date').value;
    let eh = document.getElementById('ev-end-time-h').value.padStart(2, '0');
    let em = document.getElementById('ev-end-time-m').value.padStart(2, '0');
    endT = `${eh}:${em}`;
    if(new Date(endD) < new Date(document.getElementById('ev-date').value)) {
      alert("結束日期不能早於開始日期！"); return;
    }
  }

  const isEdit = document.getElementById('edit-ev-id').value !== "";
  const evId = document.getElementById('edit-ev-id').value || "EV-" + Date.now();
  
  const btn = document.getElementById('ev-submit-btn');
  btn.innerText = "[ 同步中... ]"; 
  btn.disabled = true;

  const payload = {
    action: isEdit ? "editEvent" : "addEvent",
    id: evId,
    name: document.getElementById('ev-name').value,
    category: document.getElementById('ev-category').value,
    date: document.getElementById('ev-date').value,
    time: `${hh}:${mm}`,
    endDate: endD,
    endTime: endT,
    participants: participants,
    location: document.getElementById('ev-location').value
  };

  if(isEdit) {
    const idx = allEvents.findIndex(x => x.id === evId);
    if(idx > -1) allEvents[idx] = payload;
  } else { allEvents.push(payload); }

  renderCalendar();
  closeEventModal();
  
  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }); } catch(e) {}
  isMutating = false;
  
  btn.innerText = isEdit ? "[ 編輯完成 ]" : "[ 建立活動 ]";
  btn.disabled = false;
}

async function deleteEvent() {
  const pwd = prompt("請輸入歐嚕嚕咒語以確認刪除活動:");
  if (pwd !== "13091309" && pwd !== "13321332") { alert("咒語錯誤，取消刪除"); return; }
  
  const id = document.getElementById('edit-ev-id').value;
  allEvents = allEvents.filter(ev => ev.id !== id);
  renderCalendar();
  closeEventModal();

  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({action: "deleteEvent", id: id}) }); } catch(e) {}
  isMutating = false;
}

// ================= 負責人統計 (✨ 隱藏主管專案) =================
function renderStats() {
  const container = document.getElementById('stats-bars');
  const ownerCounts = {};
  let totalIssues = 0;

  const fStats = getCheckedValues('stats-status'); 
  const startMonth = document.getElementById('stats-month-start').value; 
  const endMonth = document.getElementById('stats-month-end').value;     

  allIssues.forEach(i => {
    // ✨ 防護：只要是主管的秘密任務(ID開頭MGR)，絕對不統計！
    if (i.id && String(i.id).startsWith('MGR-')) return;

    const stat = String(i.status);
    if(fStats.length > 0 && !fStats.includes(stat)) return; 
    
    let issueMonth = "";
    if (i.date) {
      let dParts = String(i.date).split(/[-/T ]/); 
      if (dParts.length >= 2) {
        issueMonth = `${dParts[0]}-${dParts[1].padStart(2, '0')}`;
      }
    }
    if (startMonth || endMonth) {
      if (!issueMonth) return; 
      if (startMonth && issueMonth < startMonth) return;
      if (endMonth && issueMonth > endMonth) return;
    }
    
    const owner = String(i.owner);
    if(!owner) return;
    ownerCounts[owner] = (ownerCounts[owner] || 0) + 1;
    totalIssues++;
  });

  if(totalIssues === 0) { container.innerHTML = "<p style='color:#888;'>此區間/狀態內沒有任務記錄。</p>"; return; }

  const colors = ['#00d2ff', '#0f0', '#ffeb3b', '#ff0055', '#a020f0', '#ff9800', '#00bcd4'];

  container.innerHTML = Object.keys(ownerCounts).sort((a,b) => ownerCounts[b] - ownerCounts[a]).map((owner, idx) => {
    const count = ownerCounts[owner];
    const pct = Math.round((count / totalIssues) * 100);
    const color = colors[idx % colors.length];
    return `
      <div class="stat-row">
        <div class="stat-label" title="${owner}">${owner}</div>
        <div class="stat-bar-bg">
          <div class="stat-bar-fill" style="width: ${pct}%; background: ${color};"></div>
          <div class="stat-value">${count} 件 (${pct}%)</div>
        </div>
      </div>
    `;
  }).join('');
}

// ================= 任務清單功能 (✨ 分離主管與一般任務) =================

const isTaskUrgent = (deadlineStr, status) => {
  if (!deadlineStr || status === "已解決" || status === "Done") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let dParts = String(deadlineStr).split(/[-/T ]/);
  if(dParts.length < 3) return false;
  const deadline = new Date(dParts[0], dParts[1] - 1, dParts[2]);
  deadline.setHours(0, 0, 0, 0);
  
  const diffDays = Math.ceil((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diffDays <= 2; 
};

// 渲染一般任務 (排除主管事務)
function renderIssues() {
  const container = document.getElementById('issue-display');
  const search = document.getElementById('search-input').value.toLowerCase();
  const fOwners = getCheckedValues('items-owner');
  const fStats = getCheckedValues('items-status');
  const fCusts = getCheckedValues('items-customer');

  let filtered = allIssues.filter(i => 
    (!i.id || !String(i.id).startsWith('MGR-')) && // ✨ 隱藏主管專案
    String(i.issue).toLowerCase().includes(search) &&
    (fOwners.length === 0 || fOwners.includes(String(i.owner))) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status))) &&
    (fCusts.length === 0 || fCusts.includes(String(i.customer)))
  ).sort((a, b) => {
    const statA = String(a.status);
    const statB = String(b.status);
    const isDoneA = (statA === "已解決" || statA === "Done");
    const isDoneB = (statB === "已解決" || statB === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    
    const urgentA = isTaskUrgent(a.deadline, statA);
    const urgentB = isTaskUrgent(b.deadline, statB);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;

    const priA = String(a.priority);
    const priB = String(b.priority);
    const isHighA = priA.includes('高') || priA.includes('Critical');
    const isHighB = priB.includes('高') || priB.includes('Critical');
    if (isHighA !== isHighB) return isHighA ? -1 : 1;
    
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, stat)) ? 'urgent-card' : '';
    
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:${(String(i.priority).includes('高') || String(i.priority).includes('Critical')) ? '#ff0055' : 'var(--pixel-blue)'}">[ ${stat} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.customer} | ${i.project}<br><small>建立: ${i.date} | 預計: ${i.deadline || '未定'}</small></div>
    </div>`;
  }).join('');
}

// ✨ 渲染主管專屬任務 (只顯示 MGR 開頭的)
function renderManagerIssues() {
  const container = document.getElementById('manager-issue-display');
  const search = document.getElementById('search-input-mgr').value.toLowerCase();
  const fStats = getCheckedValues('items-status-mgr');
  const fCusts = getCheckedValues('items-customer-mgr');

  let filtered = allIssues.filter(i => 
    i.id && String(i.id).startsWith('MGR-') && // ✨ 只抓取主管專案
    String(i.issue).toLowerCase().includes(search) &&
    (fStats.length === 0 ? (String(i.status) !== "已解決" && String(i.status) !== "Done") : fStats.includes(String(i.status))) &&
    (fCusts.length === 0 || fCusts.includes(String(i.customer)))
  ).sort((a, b) => {
    const statA = String(a.status);
    const statB = String(b.status);
    const isDoneA = (statA === "已解決" || statA === "Done");
    const isDoneB = (statB === "已解決" || statB === "Done");
    if (isDoneA !== isDoneB) return isDoneA ? 1 : -1;
    
    const urgentA = isTaskUrgent(a.deadline, statA);
    const urgentB = isTaskUrgent(b.deadline, statB);
    if (urgentA !== urgentB) return urgentA ? -1 : 1;

    const priA = String(a.priority);
    const priB = String(b.priority);
    const isHighA = priA.includes('高') || priA.includes('Critical');
    const isHighB = priB.includes('高') || priB.includes('Critical');
    if (isHighA !== isHighB) return isHighA ? -1 : 1;
    
    return new Date(b.date) - new Date(a.date);
  });

  container.innerHTML = filtered.map(i => {
    const stat = String(i.status);
    const isDone = (stat === "已解決" || stat === "Done");
    const urgentClass = (!isDone && isTaskUrgent(i.deadline, stat)) ? 'urgent-card' : '';
    
    return `<div class="pebble ${isDone ? 'resolved-card' : ''} ${urgentClass}" onclick="openEdit('${i.id}')">
      <div style="font-size:12px; margin-bottom:8px; color:${(String(i.priority).includes('高') || String(i.priority).includes('Critical')) ? '#ff0055' : 'var(--pixel-blue)'}">[ ${stat} ]</div>
      <div style="font-size:22px; margin-bottom:12px; line-height:1.3;">${i.issue}</div>
      <div style="font-size:14px; color:#888;">${i.owner} | ${i.customer} | ${i.project}<br><small>建立: ${i.date} | 預計: ${i.deadline || '未定'}</small></div>
    </div>`;
  }).join('');
}

// 共用任務視窗邏輯
function openModal(type = 'TS') {
  currentModalType = type; // ✨ 記錄目前是開一般還是主管任務
  
  document.getElementById('edit-id').value = "";
  document.getElementById('issueForm').reset();
  document.getElementById('link-group').innerHTML = '<input type="text" class="pixel-input wide link-entry" placeholder="https://...">';
  document.getElementById('input-created-date').value = new Date().toLocaleDateString('zh-TW');
  
  document.getElementById('modal-title').innerText = type === 'MGR' ? 'MANAGER_AFFAIRS_V7.0' : 'TASK_CONFIGURATION_V7.0';
  
  const ownerSelect = document.getElementById('input-owner');
  if (type === 'MGR') {
      // ✨ 主管模式防呆：自動填寫並鎖定 Owner
      ownerSelect.innerHTML = '<option value="Charlie (主管)" selected>Charlie (主管)</option>';
      ownerSelect.disabled = true;
  } else {
      fillFormSelect('input-owner', 'owners');
      ownerSelect.disabled = false;
  }

  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 建立完成 ]";
  btn.disabled = false;
  
  document.getElementById('btn-delete').style.display = 'none'; 
  document.getElementById('modal-overlay').style.display = 'flex';
}

function openEdit(id) {
  const i = allIssues.find(x => x.id === id);
  if(!i) return;
  
  // ✨ 判斷舊資料是主管任務還是普通任務
  currentModalType = String(id).startsWith('MGR-') ? 'MGR' : 'TS';
  document.getElementById('modal-title').innerText = currentModalType === 'MGR' ? 'MANAGER_AFFAIRS_V7.0' : 'TASK_CONFIGURATION_V7.0';

  document.getElementById('edit-id').value = i.id;
  document.getElementById('input-issue').value = i.issue;
  
  const setSelectSafe = (id, val) => {
    const el = document.getElementById(id);
    el.value = val;
    if(!el.value) {
      if(id === 'input-priority' && val) {
        if(val.includes('高') || val.includes('Critical')) el.value = "1_高";
        else if(val.includes('低') || val.includes('Low')) el.value = "3_低";
        else el.value = "2_一般";
      } else el.value = "";
    }
  };

  const ownerSelect = document.getElementById('input-owner');
  if (currentModalType === 'MGR') {
      // ✨ 主管模式防呆
      ownerSelect.innerHTML = `<option value="${i.owner}" selected>${i.owner}</option>`;
      ownerSelect.disabled = true;
  } else {
      fillFormSelect('input-owner', 'owners');
      ownerSelect.disabled = false;
      setSelectSafe('input-owner', i.owner);
  }

  setSelectSafe('input-status', i.status);
  setSelectSafe('input-customer', i.customer);
  setSelectSafe('input-project', i.project);
  setSelectSafe('input-priority', i.priority);
  
  let safeDeadline = i.deadline || "";
  if(safeDeadline.includes('/')) safeDeadline = safeDeadline.replace(/\//g, '-');
  document.getElementById('input-deadline').value = safeDeadline;
  
  document.getElementById('input-description').value = i.description || "";
  document.getElementById('input-records').value = i.records || "";
  document.getElementById('input-created-date').value = i.date;
  
  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 編輯完成 ]";
  btn.disabled = false;
  
  document.getElementById('btn-delete').style.display = 'inline-block'; 

  const linkGroup = document.getElementById('link-group');
  linkGroup.innerHTML = "";
  (i.link || "").split(' | ').forEach(url => {
    if(!url) return;
    const input = document.createElement('input');
    input.className = "pixel-input wide link-entry"; input.value = url; input.style.marginTop = "10px";
    linkGroup.appendChild(input);
  });
  if(!linkGroup.innerHTML) addLinkField();
  document.getElementById('modal-overlay').style.display = 'flex';
}

function addLinkField() {
  const input = document.createElement('input');
  input.className = "pixel-input wide link-entry"; input.style.marginTop = "10px";
  document.getElementById('link-group').appendChild(input);
}
function closeModal() { 
  document.getElementById('modal-overlay').style.display = 'none'; 
  document.getElementById('submit-btn').disabled = false;
}

async function deleteIssue() {
  const pwd = prompt("請輸入歐嚕嚕咒語以確認刪除:");
  if (pwd !== "13091309" && pwd !== "13321332") { alert("咒語錯誤，取消刪除"); return; }
  const issueId = document.getElementById('edit-id').value;
  if (!issueId) return;
  allIssues = allIssues.filter(issue => issue.id !== issueId);
  renderIssues(); renderManagerIssues(); renderStats(); closeModal();
  
  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify({ action: "delete", id: issueId }) }); } catch(err) {}
  isMutating = false;
}

async function submitIssue() {
  const form = document.getElementById('issueForm');
  if (!form.checkValidity()) { form.reportValidity(); return; }
  
  const btn = document.getElementById('submit-btn');
  btn.innerText = "[ 同步中... ]"; 
  btn.disabled = true;
  
  const linkVal = Array.from(document.querySelectorAll('.link-entry')).map(el => el.value).filter(v => v).join(' | ');
  const isEdit = document.getElementById('edit-id').value !== "";
  
  // ✨ 主管任務強制加上 MGR- 標籤，一般任務使用 TS- 標籤
  const prefix = currentModalType === 'MGR' ? 'MGR-' : 'TS-';
  const issueId = document.getElementById('edit-id').value || prefix + Date.now();

  // ✨ 極致防呆：無論如何，只要是主管模式，強制寫入 Charlie (主管)
  let finalOwner = document.getElementById('input-owner').value;
  if (currentModalType === 'MGR') finalOwner = 'Charlie (主管)';

  const payload = {
    action: isEdit ? "edit" : "add", id: issueId, issue: document.getElementById('input-issue').value,
    owner: finalOwner, status: document.getElementById('input-status').value,
    customer: document.getElementById('input-customer').value, project: document.getElementById('input-project').value,
    date: document.getElementById('input-created-date').value, deadline: document.getElementById('input-deadline').value,
    priority: document.getElementById('input-priority').value, description: document.getElementById('input-description').value,
    records: document.getElementById('input-records').value, link: linkVal
  };

  if (isEdit) {
    const idx = allIssues.findIndex(x => x.id === issueId);
    if (idx > -1) allIssues[idx] = payload;
  } else { allIssues.push(payload); }
  
  renderIssues(); renderManagerIssues(); renderStats(); closeModal();

  isMutating = true;
  try { await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', body: JSON.stringify(payload) }); } catch (e) { console.error(e); }
  isMutating = false;
  
  btn.innerText = isEdit ? "[ 編輯完成 ]" : "[ 建立完成 ]";
  btn.disabled = false;
}
