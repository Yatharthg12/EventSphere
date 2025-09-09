//Main JavaScript file for Event Management System
// Handles login, event creation, registration, filtering, and rendering
// Uses localStorage for data persistence


// Storage helpers
function initStore() {
  if (!localStorage.getItem("events")) {
    const seed = [
      { id: Date.now(), title: "Tech Talk: AI Future", description: "Discussion on AI trends", date: "2025-09-15", category: "tech", createdBy: "system" },
      { id: Date.now() + 101, title: "Cultural Night", description: "Dance and Music Fest", date: "2025-09-20", category: "cultural", createdBy: "system" },
      { id: Date.now() + 202, title: "Sports Meet", description: "Track and field events", date: "2025-09-25", category: "sports", createdBy: "system" }
    ];
    localStorage.setItem("events", JSON.stringify(seed));
  }
  if (!localStorage.getItem("registrations")) {
    localStorage.setItem("registrations", JSON.stringify([]));
  }
}
initStore();

function getEvents() { return JSON.parse(localStorage.getItem("events") || "[]"); }
function setEvents(list) { localStorage.setItem("events", JSON.stringify(list)); }
function getRegistrations(){ return JSON.parse(localStorage.getItem("registrations") || "[]"); }
function setRegistrations(list){ localStorage.setItem("registrations", JSON.stringify(list)); }
function getCurrentUser(){ try { return JSON.parse(localStorage.getItem("currentUser") || "null"); } catch { return null; } }



// Authentication (mock example, can be updated once fully connected to a database system with continuous updation)
const USERS = {
  students: [ { username: "student1", password: "pass123" }, { username: "student2", password: "1234" } ],
  organizers: [ { username: "organizer1", password: "admin123" }, { username: "organizer2", password: "4567" } ]
};



// Login Function
function studentLogin(){
  const username = document.getElementById("studentUsername")?.value?.trim();
  const password = document.getElementById("studentPassword")?.value?.trim();
  const match = USERS.students.find(u=>u.username===username && u.password===password);
  if(!match){ alert("❌ Invalid Student credentials!"); return; }
  localStorage.setItem("currentUser", JSON.stringify({ role:"student", username }));
  window.location.href = "student-dashboard.html";
}
function organizerLogin(){
  const username = document.getElementById("organizerUsername")?.value?.trim();
  const password = document.getElementById("organizerPassword")?.value?.trim();
  const match = USERS.organizers.find(u=>u.username===username && u.password===password);
  if(!match){ alert("❌ Invalid Organizer credentials!"); return; }
  localStorage.setItem("currentUser", JSON.stringify({ role:"organizer", username }));
  window.location.href = "organizer-dashboard.html";
}
function logout(){
  localStorage.removeItem("currentUser");
  window.location.href = "index.html";
}



// STUDENT: Displaying & registering for events
function renderEventsForStudents(list = null){
  const container = document.getElementById("studentEvents"); if(!container) return;
  const user = getCurrentUser();
  const events = (list || getEvents()).slice().sort((a,b)=>a.date.localeCompare(b.date));
  const regs = getRegistrations();

  container.innerHTML = "";
  const today = new Date().toISOString().split("T")[0];

  events.filter(e => e.date >= today).forEach(ev => {
    const isRegistered = user ? regs.some(r => r.eventId === ev.id && r.username === user.username) : false;
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <h4>${ev.title}</h4>
      <p>${ev.description}</p>
      <small>${ev.date} | ${ev.category}</small><br>
      ${ user?.role === "student" ? (isRegistered
         ? `<button class="btn logout" data-eid="${ev.id}" data-action="unregister">Unregister</button>`
         : `<button class="btn" data-eid="${ev.id}" data-action="register">Register</button>`
       ) : "" }
    `;
    container.appendChild(card);
  });

  //Delegation for register/unregister
  container.onclick = (e) => {
    const btn = e.target.closest("button[data-eid]");
    if(!btn) return;
    const eid = Number(btn.getAttribute("data-eid"));
    const action = btn.getAttribute("data-action");
    if(action === "register") registerEvent(eid);
    if(action === "unregister") unregisterEvent(eid);
  };
}

function registerEvent(eventId){
  const user = getCurrentUser();
  if(!user || user.role !== "student"){ alert("Please login as student"); return; }
  const regs = getRegistrations();
  if(regs.some(r => r.eventId === eventId && r.username === user.username)){
    alert("Already registered.");
    return;
  }
  regs.push({ eventId, username: user.username });
  setRegistrations(regs);
  alert("✅ Registered successfully! (Email confirmation simulated)");
  applyStudentFilters();
  renderRegisteredEvents();
}

function unregisterEvent(eventId){
  const user = getCurrentUser();
  if(!user) return;
  const regs = getRegistrations().filter(r => !(r.eventId === eventId && r.username === user.username));
  setRegistrations(regs);
  alert("❎ Unregistered.");
  applyStudentFilters();
  renderRegisteredEvents();
}

function renderRegisteredEvents(){
  const container = document.getElementById("registeredEvents"); if(!container) return;
  const regs = getRegistrations(); const user = getCurrentUser(); const events = getEvents();
  container.innerHTML = "";
  if(!user) return;
  regs.filter(r => r.username === user.username).forEach(r => {
    const ev = events.find(e=>e.id===r.eventId);
    if(!ev) return;
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <h4>${ev.title}</h4>
      <small>${ev.date} | ${ev.category}</small><br>
      <button class="btn logout" data-eid="${ev.id}" data-action="unregister">Unregister</button>
    `;
    container.appendChild(card);
  });
  container.onclick = (e) => {
    const btn = e.target.closest("button[data-eid][data-action='unregister']");
    if(!btn) return;
    unregisterEvent(Number(btn.getAttribute("data-eid")));
  };
}



// ORGANIZER: Creating & managing events
function renderEventsForOrganizer(){
  const container = document.getElementById("organizerEvents"); if(!container) return;
  const user = getCurrentUser();
  if(!user || user.role !== "organizer"){ container.innerHTML = "<p>Please login as organizer.</p>"; return; }
  const all = getEvents().slice().sort((a,b)=>a.date.localeCompare(b.date));
  const mine = all.filter(e => e.createdBy === user.username || e.createdBy === "system");
  container.innerHTML = "";
  mine.forEach(ev => {
    const card = document.createElement("div");
    card.className = "event-card";
    card.innerHTML = `
      <h4>${ev.title}</h4>
      <p>${ev.description}</p>
      <small>${ev.date} | ${ev.category}</small>
    `;
    container.appendChild(card);
  });
}

function createEvent(){
  const title = document.getElementById("eventTitle")?.value?.trim();
  const desc  = document.getElementById("eventDesc")?.value?.trim();
  const date  = document.getElementById("eventDate")?.value;
  const cat   = document.getElementById("eventCategory")?.value;
  const user  = getCurrentUser();

  if(!user || user.role !== "organizer"){ alert("Please login as organizer."); return; }
  if(!title || !desc || !date || !cat){ alert("❌ Please fill all fields."); return; }

  const list = getEvents();
  const newEvent = { id: Date.now(), title, description: desc, date, category: cat, createdBy: user.username };
  list.push(newEvent);
  setEvents(list);

  if(document.getElementById("eventTitle")) document.getElementById("eventTitle").value = "";
  if(document.getElementById("eventDesc")) document.getElementById("eventDesc").value = "";
  if(document.getElementById("eventDate")) document.getElementById("eventDate").value = "";
  if(document.getElementById("eventCategory")) document.getElementById("eventCategory").value = "tech";

  alert(`✅ Event "${newEvent.title}" created! Students can now see & register.`);

  renderEventsForOrganizer();
  applyStudentFilters();
  renderRegisteredEvents();
}

// Student: Filtering Search & Category
function applyStudentFilters(){
  const query = (document.getElementById("searchStudent")?.value || "").toLowerCase();
  const cat = (document.getElementById("categoryFilterStudent")?.value || "all");
  const events = getEvents();
  const today = new Date().toISOString().split("T")[0];
  const filtered = events.filter(e => {
    const qMatch = e.title.toLowerCase().includes(query) || e.description.toLowerCase().includes(query);
    const cMatch = (cat === "all") || (e.category === cat);
    return qMatch && cMatch && e.date >= today;
  });
  renderEventsForStudents(filtered);
}



// Bootstrapping (section is run after the HTML file is fully loaded)
document.addEventListener("DOMContentLoaded", () => {
  const createBtn = document.getElementById("createEventBtn");
  if (createBtn && !createBtn._attached) {
    createBtn.addEventListener("click", (e) => {
      e.preventDefault();
      try { createEvent(); } catch(err){ console.error("createEvent error:", err); alert("Error creating event"); }
    });
    createBtn._attached = true;
  }

  if (document.getElementById("studentEvents")) {
    const user = getCurrentUser();
    if (!user || user.role !== "student") { window.location.href = "student-login.html"; return; }
    applyStudentFilters();
    renderRegisteredEvents();

    const search = document.getElementById("searchStudent");
    if (search) search.addEventListener("input", applyStudentFilters);
    const cat = document.getElementById("categoryFilterStudent");
    if (cat) cat.addEventListener("change", applyStudentFilters);
  }

  if (document.getElementById("organizerEvents")) {
    const user = getCurrentUser();
    if (!user || user.role !== "organizer") { window.location.href = "organizer-login.html"; return; }
    renderEventsForOrganizer();
  }
});
//EOF