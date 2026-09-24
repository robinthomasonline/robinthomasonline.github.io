(function(){
  "use strict";

  const KEYS = {
    tickets: "helpdesk-tickets",
    categories: "helpdesk-categories",
    team: "helpdesk-team",
    seq: "helpdesk-seq",
    name: "helpdesk-username"
  };

  let tickets = [];
  let categories = [];
  let team = [];
  let seq = 0;
  let currentFilter = "all";
  let activeTicketId = null;

  function load(key, fallback){
    try{
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : JSON.parse(raw);
    } catch(e){
      return fallback;
    }
  }

  function save(key, value){
    try{
      localStorage.setItem(key, JSON.stringify(value));
    } catch(e){
      showToast("Couldn't save — your browser storage may be full or disabled.");
    }
  }

  function loadAll(){
    tickets = load(KEYS.tickets, []);
    categories = load(KEYS.categories, []);
    team = load(KEYS.team, []);
    seq = load(KEYS.seq, 0);
    const name = localStorage.getItem(KEYS.name);
    if(name){
      document.getElementById("whoName").value = name;
      document.getElementById("reporter").value = name;
    }
  }

  function saveTickets(){ save(KEYS.tickets, tickets); }
  function saveCategories(){ save(KEYS.categories, categories); }
  function saveTeam(){ save(KEYS.team, team); }
  function saveSeq(){ save(KEYS.seq, seq); }

  function showToast(msg){
    const t = document.getElementById("toast");
    document.getElementById("toastMsg").textContent = msg;
    t.classList.add("show");
    clearTimeout(showToast._h);
    showToast._h = setTimeout(()=>t.classList.remove("show"), 3000);
  }

  function yw(){
    const d = new Date();
    const yy = String(d.getFullYear()).slice(2);
    const week = String(Math.ceil((((d - new Date(d.getFullYear(),0,1)) / 86400000) + new Date(d.getFullYear(),0,1).getDay()+1)/7)).padStart(2,"0");
    return yy+week;
  }

  function escapeHtml(s){
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  }

  // ---------- Categories & Team ----------

  function renderCategories(){
    const list = document.getElementById("categoryList");
    if(categories.length === 0){
      list.innerHTML = '<span class="empty-hint">No categories yet — add one above to start logging tickets.</span>';
    } else {
      list.innerHTML = categories.map(c => `
        <span class="tag-chip">${escapeHtml(c)}<button type="button" data-remove-category="${escapeHtml(c)}" aria-label="Remove ${escapeHtml(c)}">&times;</button></span>
      `).join("");
    }

    const sel = document.getElementById("category");
    const prev = sel.value;
    sel.innerHTML = '<option value="">Select category…</option>' + categories.map(c => `<option>${escapeHtml(c)}</option>`).join("");
    if(categories.includes(prev)) sel.value = prev;

    const submitBtn = document.getElementById("submitBtn");
    if(categories.length === 0){
      submitBtn.disabled = true;
      submitBtn.textContent = "Add a category first";
    } else {
      submitBtn.disabled = false;
      submitBtn.textContent = "Submit Ticket";
    }

    document.getElementById("categoriesBtnLabel").textContent = categories.length ? `Categories (${categories.length})` : "Categories";
  }

  function renderTeam(){
    const list = document.getElementById("teamList");
    if(team.length === 0){
      list.innerHTML = '<span class="empty-hint">No team members yet — add one above so tickets can be assigned.</span>';
    } else {
      list.innerHTML = team.map(t => `
        <span class="tag-chip">${escapeHtml(t)}<button type="button" data-remove-team="${escapeHtml(t)}" aria-label="Remove ${escapeHtml(t)}">&times;</button></span>
      `).join("");
    }
    document.getElementById("teamBtnLabel").textContent = team.length ? `Team (${team.length})` : "Team";
    render();
  }

  function assignOptions(current){
    const options = ["Unassigned", ...team];
    if(current && !options.includes(current)) options.push(current);
    return options;
  }

  document.getElementById("categoryAddBtn").addEventListener("click", addCategory);
  document.getElementById("categoryInput").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); addCategory(); } });
  function addCategory(){
    const input = document.getElementById("categoryInput");
    const val = input.value.trim();
    if(!val) return;
    if(categories.some(c => c.toLowerCase() === val.toLowerCase())){
      showToast("That category already exists.");
      return;
    }
    categories.push(val);
    saveCategories();
    input.value = "";
    renderCategories();
  }

  document.getElementById("categoryList").addEventListener("click", e => {
    const val = e.target.getAttribute("data-remove-category");
    if(val === null) return;
    categories = categories.filter(c => c !== val);
    saveCategories();
    renderCategories();
  });

  document.getElementById("teamAddBtn").addEventListener("click", addTeamMember);
  document.getElementById("teamInput").addEventListener("keydown", e => { if(e.key === "Enter"){ e.preventDefault(); addTeamMember(); } });
  function addTeamMember(){
    const input = document.getElementById("teamInput");
    const val = input.value.trim();
    if(!val) return;
    if(val.toLowerCase() === "unassigned"){
      showToast('"Unassigned" is reserved.');
      return;
    }
    if(team.some(t => t.toLowerCase() === val.toLowerCase())){
      showToast("That team member already exists.");
      return;
    }
    team.push(val);
    saveTeam();
    input.value = "";
    renderTeam();
  }

  document.getElementById("teamList").addEventListener("click", e => {
    const val = e.target.getAttribute("data-remove-team");
    if(val === null) return;
    team = team.filter(t => t !== val);
    saveTeam();
    renderTeam();
  });

  // ---------- Who am I ----------

  document.getElementById("whoName").addEventListener("change", e => {
    const name = e.target.value.trim();
    if(name){
      document.getElementById("reporter").value = name;
      try{ localStorage.setItem(KEYS.name, name); } catch(e2){}
    }
  });

  // ---------- Rendering the queue ----------

  function statusClass(s){
    return { "Open":"status-open","Assigned":"status-assigned","In Progress":"status-progress","Resolved":"status-resolved" }[s];
  }

  function render(){
    const body = document.getElementById("queueBody");
    const searchTerm = document.getElementById("searchBox").value.toLowerCase();

    let visible = tickets.filter(t=>{
      const matchesFilter = currentFilter === "all" || t.status === currentFilter;
      const hay = (t.location+" "+t.reference+" "+t.reporter+" "+t.category).toLowerCase();
      return matchesFilter && hay.includes(searchTerm);
    });

    document.getElementById("queueCount").textContent = visible.length + " ticket" + (visible.length===1?"":"s");

    if(visible.length === 0){
      body.innerHTML = `<tr class="empty-row"><td colspan="8">${tickets.length===0 ? "No tickets yet." : "No tickets match this view."}</td></tr>`;
    } else {
      body.innerHTML = visible.map(t => {
        const details = [t.location, t.reference].filter(v => v && v !== "—").join(" · ") || "—";
        return `
        <tr class="${t.priority==='Urgent' ? 'urgent' : ''}">
          <td data-label="Ticket" class="id-cell">${escapeHtml(t.id)}${t.priority==="Urgent" ? '<span class="flag">Urgent</span>' : ''}</td>
          <td data-label="Category"><span class="cat-badge">${escapeHtml(t.category)}</span></td>
          <td data-label="Details">${escapeHtml(details)}</td>
          <td data-label="Reported" class="muted">${escapeHtml(t.created)}</td>
          <td data-label="Reporter">${escapeHtml(t.reporter)}</td>
          <td data-label="Assigned to">
            <select class="assign-select" data-id="${t.id}" data-role="assign">
              ${assignOptions(t.assigned).map(a=>`<option ${a===t.assigned?"selected":""}>${escapeHtml(a)}</option>`).join("")}
            </select>
          </td>
          <td data-label="Status">
            <select class="status-pill ${statusClass(t.status)}" data-id="${t.id}" data-role="status">
              ${["Open","Assigned","In Progress","Resolved"].map(s=>`<option ${s===t.status?"selected":""}>${s}</option>`).join("")}
            </select>
          </td>
          <td data-label="" class="details-cell"><button class="view-link" data-id="${t.id}" data-role="view">Details</button></td>
        </tr>
      `;
      }).join("");
    }

    updateStats();
    updateAnalytics();
  }

  function updateStats(){
    document.getElementById("statOpen").textContent = tickets.filter(t=>t.status==="Open").length;
    document.getElementById("statAssigned").textContent = tickets.filter(t=>t.status==="Assigned").length;
    document.getElementById("statProgress").textContent = tickets.filter(t=>t.status==="In Progress").length;
    document.getElementById("statResolved").textContent = tickets.filter(t=>t.status==="Resolved").length;
  }

  function bars(counts, containerId){
    const el = document.getElementById(containerId);
    const entries = Object.entries(counts).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max = entries.length ? entries[0][1] : 1;
    if(entries.length===0){ el.innerHTML = '<div class="muted">No data yet.</div>'; return; }
    el.innerHTML = entries.map(([label,count])=>`
      <div class="bar-row">
        <div class="bar-label"><span>${escapeHtml(label)}</span><span>${count}</span></div>
        <div class="bar-track"><div class="bar-fill" style="width:${(count/max*100).toFixed(0)}%"></div></div>
      </div>
    `).join("");
  }

  function updateAnalytics(){
    const byCat = {}, byLoc = {};
    tickets.forEach(t=>{
      byCat[t.category] = (byCat[t.category]||0)+1;
      if(t.location && t.location !== "—"){
        const locKey = t.location.split(",")[0].trim();
        byLoc[locKey] = (byLoc[locKey]||0)+1;
      }
    });
    bars(byCat, "byCategory");
    bars(byLoc, "byLocation");
  }

  // Row-level actions: assign / status change / view details
  document.getElementById("queueBody").addEventListener("change",(e)=>{
    const id = e.target.getAttribute("data-id");
    const role = e.target.getAttribute("data-role");
    if(!id) return;
    const ticket = tickets.find(t=>t.id===id);
    if(!ticket) return;
    const actor = document.getElementById("whoName").value.trim() || "Someone";
    if(role==="assign"){
      ticket.assigned = e.target.value;
      ticket.log.push({time: new Date().toLocaleString(), text: `${actor} assigned this to ${e.target.value}`});
    }
    if(role==="status"){
      ticket.status = e.target.value;
      ticket.log.push({time: new Date().toLocaleString(), text: `${actor} changed status to ${e.target.value}`});
    }
    render();
    saveTickets();
  });

  document.getElementById("queueBody").addEventListener("click",(e)=>{
    if(e.target.getAttribute("data-role")==="view"){
      openModal(e.target.getAttribute("data-id"));
    }
  });

  // Filters / search
  document.getElementById("tabs").addEventListener("click",(e)=>{
    if(e.target.classList.contains("tab")){
      document.querySelectorAll(".tab").forEach(t=>t.classList.remove("active"));
      e.target.classList.add("active");
      currentFilter = e.target.getAttribute("data-filter");
      render();
    }
  });
  document.getElementById("searchBox").addEventListener("input", render);

  // New ticket submission
  document.getElementById("issueForm").addEventListener("submit",(e)=>{
    e.preventDefault();
    if(categories.length === 0) return;
    const category = document.getElementById("category").value;
    const location = document.getElementById("location").value.trim() || "—";
    const reference = document.getElementById("reference").value.trim() || "—";
    const reporter = document.getElementById("reporter").value.trim();
    const priority = document.getElementById("priority").value;
    const desc = document.getElementById("desc").value.trim();
    if(!category || !reporter || !desc) return;

    seq++;
    const newTicket = {
      id: "TCK-"+yw()+"-"+String(seq).padStart(4,"0"),
      category, location, reference, reporter, priority, desc,
      assigned: "Unassigned", status: "Open",
      created: new Date().toLocaleString(),
      log: [{time: new Date().toLocaleString(), text: `Ticket created by ${reporter}`}]
    };
    tickets.unshift(newTicket);

    document.getElementById("slipId").textContent = newTicket.id;
    document.getElementById("slip").classList.add("show");

    render();
    saveTickets();
    saveSeq();

    const keepReporter = reporter;
    e.target.reset();
    document.getElementById("reporter").value = keepReporter;
    if(document.getElementById("whoName").value.trim()){
      try{ localStorage.setItem(KEYS.name, document.getElementById("whoName").value.trim()); } catch(e2){}
    }
  });

  // Modal
  function openModal(id){
    const ticket = tickets.find(t=>t.id===id);
    if(!ticket) return;
    activeTicketId = id;
    document.getElementById("mId").textContent = ticket.id + (ticket.priority==="Urgent" ? "  ⚠ Urgent" : "");
    const details = [ticket.location, ticket.reference].filter(v => v && v !== "—").join(" · ");
    document.getElementById("mCatLoc").textContent = ticket.category + (details ? " · " + details : "");
    document.getElementById("mDesc").textContent = ticket.desc || "No description provided.";
    document.getElementById("mReporter").textContent = ticket.reporter + " · " + ticket.created;
    document.getElementById("mStatus").value = ticket.status;
    const assignedSel = document.getElementById("mAssigned");
    assignedSel.innerHTML = assignOptions(ticket.assigned).map(a=>`<option ${a===ticket.assigned?"selected":""}>${escapeHtml(a)}</option>`).join("");
    renderLog(ticket);
    document.getElementById("detailsModalBackdrop").classList.add("show");
  }

  function renderLog(ticket){
    const el = document.getElementById("mLog");
    el.innerHTML = ticket.log.slice().reverse().map(l=>`
      <div class="log-entry"><div class="lt">${escapeHtml(l.time)}</div><div class="lx">${escapeHtml(l.text)}</div></div>
    `).join("");
  }

  // ---------- Generic modal wiring (New Ticket / Categories / Team / Details) ----------

  function closeModalEl(backdrop){
    if(!backdrop) return;
    backdrop.classList.remove("show");
    if(backdrop.id === "detailsModalBackdrop") activeTicketId = null;
  }

  document.querySelectorAll("[data-open]").forEach(btn => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-open");
      if(targetId === "ticketModalBackdrop") document.getElementById("slip").classList.remove("show");
      document.getElementById(targetId).classList.add("show");
    });
  });

  document.querySelectorAll(".modal-close").forEach(btn => {
    btn.addEventListener("click", () => closeModalEl(btn.closest(".modal-backdrop")));
  });

  document.querySelectorAll(".modal-backdrop").forEach(backdrop => {
    backdrop.addEventListener("click", (e) => {
      if(e.target === backdrop) closeModalEl(backdrop);
    });
  });

  document.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
      document.querySelectorAll(".modal-backdrop.show").forEach(closeModalEl);
    }
  });

  document.getElementById("mStatus").addEventListener("change",(e)=>{
    const ticket = tickets.find(t=>t.id===activeTicketId);
    if(!ticket) return;
    const actor = document.getElementById("whoName").value.trim() || "Someone";
    ticket.status = e.target.value;
    ticket.log.push({time: new Date().toLocaleString(), text: `${actor} changed status to ${e.target.value}`});
    renderLog(ticket);
    render();
    saveTickets();
  });
  document.getElementById("mAssigned").addEventListener("change",(e)=>{
    const ticket = tickets.find(t=>t.id===activeTicketId);
    if(!ticket) return;
    const actor = document.getElementById("whoName").value.trim() || "Someone";
    ticket.assigned = e.target.value;
    ticket.log.push({time: new Date().toLocaleString(), text: `${actor} assigned this to ${e.target.value}`});
    renderLog(ticket);
    render();
    saveTickets();
  });
  document.getElementById("mNoteBtn").addEventListener("click",()=>{
    const input = document.getElementById("mNoteInput");
    const text = input.value.trim();
    if(!text) return;
    const ticket = tickets.find(t=>t.id===activeTicketId);
    if(!ticket) return;
    const actor = document.getElementById("whoName").value.trim() || "Someone";
    ticket.log.push({time: new Date().toLocaleString(), text: `${actor}: ${text}`});
    input.value = "";
    renderLog(ticket);
    saveTickets();
  });
  document.getElementById("mNoteInput").addEventListener("keydown", e => {
    if(e.key === "Enter"){ e.preventDefault(); document.getElementById("mNoteBtn").click(); }
  });

  // CSV export
  document.getElementById("exportBtn").addEventListener("click",()=>{
    if(tickets.length === 0){ showToast("No tickets to export yet."); return; }
    const headers = ["Ticket","Category","Location","Reference","Reported","Reporter","Assigned To","Status","Priority","Description"];
    const rows = tickets.map(t=>[t.id,t.category,t.location,t.reference,t.created,t.reporter,t.assigned,t.status,t.priority,t.desc]);
    const csv = [headers, ...rows].map(r=>r.map(v=>`"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "helpdesk-export.csv";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Exported " + tickets.length + " tickets to CSV.");
  });

  // Clear all data
  document.getElementById("resetBtn").addEventListener("click", ()=>{
    if(!confirm("Clear all tickets, categories, and team members? This cannot be undone.")) return;
    tickets = [];
    categories = [];
    team = [];
    seq = 0;
    saveTickets();
    saveCategories();
    saveTeam();
    saveSeq();
    renderCategories();
    renderTeam();
    render();
    showToast("All data cleared.");
  });

  loadAll();
  renderCategories();
  renderTeam();
  render();
})();
