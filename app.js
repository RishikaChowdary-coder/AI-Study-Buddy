// ============ Helpers ============
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
const storage = {
  get: (k, d) => JSON.parse(localStorage.getItem(k) || JSON.stringify(d)),
  set: (k, v) => localStorage.setItem(k, JSON.stringify(v))
};
const debounce = (fn, wait=300) => {
  let t; return (...args)=>{ clearTimeout(t); t=setTimeout(()=>fn(...args), wait); };
};

// ============ Theme ============
const themeToggle = $("#themeToggle");
themeToggle.addEventListener("click", ()=>{
  document.body.classList.toggle("theme-dark");
  document.body.classList.toggle("theme-light");
  localStorage.setItem("theme", document.body.classList.contains("theme-dark") ? "dark" : "light");
});
(function initTheme(){
  const t = localStorage.getItem("theme") || "light";
  document.body.classList.toggle("theme-dark", t==="dark");
  document.body.classList.toggle("theme-light", t!=="dark");
})();

// ============ Sidebar (mobile) ============
const sidebar = $("#sidebar");
$("#sidebarToggle").addEventListener("click", ()=>{
  sidebar.classList.toggle("open");
});

// Close sidebar on main click (mobile)
$(".content").addEventListener("click", ()=> sidebar.classList.remove("open"));

// ============ Navigation ============
$$(".nav-btn").forEach(btn=>{
  btn.addEventListener("click", ()=>{
    const target = btn.dataset.target;
    $$(".nav-btn").forEach(b=>b.classList.remove("active"));
    btn.classList.add("active");
    $$(".panel").forEach(p=>p.classList.remove("active"));
    $("#"+target).classList.add("active");
    localStorage.setItem("activePanel", target);
    updateStats();
  });
});
window.addEventListener("DOMContentLoaded", ()=>{
  const last = localStorage.getItem("activePanel") || "flashcards";
  document.querySelector(`.nav-btn[data-target="${last}"]`)?.click();
  loadAll();
});

// ============ Flashcards ============
const FC_KEY = "flashcards";
const fcContainer = $("#flashcard-container");
$("#addFlashBtn").addEventListener("click", addFlashcard);

function addFlashcard(){
  const q = $("#flash-question").value.trim();
  const a = $("#flash-answer").value.trim();
  if(!q || !a) return;
  const list = storage.get(FC_KEY, []);
  list.push({q,a});
  storage.set(FC_KEY, list);
  $("#flash-question").value = "";
  $("#flash-answer").value = "";
  renderFlashcards();
  updateStats();
}
function renderFlashcards(){
  const list = storage.get(FC_KEY, []);
  fcContainer.innerHTML = "";
  list.forEach((item,idx)=>{
    const div = document.createElement("div");
    div.className = "glass-2";
    div.style.padding = "12px";
    div.style.borderRadius = "12px";
    div.title = "Click to delete";
    div.innerHTML = `<strong>${item.q}</strong><br><span class="muted">${item.a}</span>`;
    div.addEventListener("click", ()=>{
      list.splice(idx,1);
      storage.set(FC_KEY, list);
      renderFlashcards();
      updateStats();
    });
    fcContainer.appendChild(div);
  });
}

// ============ Quiz ============
const QZ_KEY = "quiz";
$("#addQuizBtn").addEventListener("click", addQuizQuestion);

function addQuizQuestion(){
  const q = $("#quiz-question").value.trim();
  const a = $("#quiz-answer").value.trim();
  if(!q || !a) return;
  const quiz = storage.get(QZ_KEY, []);
  quiz.push({q,a});
  storage.set(QZ_KEY, quiz);
  $("#quiz-question").value = "";
  $("#quiz-answer").value = "";
  renderQuiz();
  updateStats();
}
function renderQuiz(){
  const quiz = storage.get(QZ_KEY, []);
  const container = $("#quiz-container");
  container.innerHTML = "";
  quiz.forEach((qa,idx)=>{
    const item = document.createElement("div");
    item.className = "glass-2";
    item.style.padding = "12px";
    item.style.borderRadius = "12px";
    item.title = "Click to delete";
    item.innerHTML = `<strong>Q:</strong> ${qa.q}<br><strong>A:</strong> <span class="muted">${qa.a}</span>`;
    item.addEventListener("click", ()=>{
      quiz.splice(idx,1);
      storage.set(QZ_KEY, quiz);
      renderQuiz();
      updateStats();
    });
    container.appendChild(item);
  });
}

// ============ Notes (debounced autosave) ============
const notesArea = $("#notes-text");
notesArea.addEventListener("input", debounce(()=>{
  localStorage.setItem("notes", notesArea.value);
  updateStats();
}, 200));

// ============ Planner ============
const TK_KEY = "tasks";
$("#addTaskBtn").addEventListener("click", addTask);
function addTask(){
  const input = $("#task-input");
  const text = input.value.trim();
  if(!text) return;
  const list = storage.get(TK_KEY, []);
  list.push({text, done:false});
  storage.set(TK_KEY, list);
  input.value = "";
  renderTasks();
  updateStats();
}
function renderTasks(){
  const list = storage.get(TK_KEY, []);
  const ul = $("#task-list");
  ul.innerHTML = "";
  list.forEach((t,idx)=>{
    const li = document.createElement("li");
    li.innerHTML = `
      <span${t.done?' style="text-decoration:line-through; opacity:.7"':''}>${t.text}</span>
      <span class="actions">
        <span class="chip ${t.done?'done':''} toggle">✔</span>
        <span class="chip delete">🗑️</span>
      </span>`;
    li.querySelector(".toggle").addEventListener("click", ()=>{
      t.done = !t.done; storage.set(TK_KEY, list); renderTasks(); updateStats();
    });
    li.querySelector(".delete").addEventListener("click", ()=>{
      list.splice(idx,1); storage.set(TK_KEY, list); renderTasks(); updateStats();
    });
    ul.appendChild(li);
  });
}

// ============ Code Lab ============
$("#runBtn").addEventListener("click", ()=>{
  const code = $("#code-editor").value;
  $("#output-frame").srcdoc = code;
});

// ============ Stats Modal ============
const statsBtn = $("#openStats");
const statsModal = $("#statsModal");
const closeStats = $("#closeStats");
statsBtn.addEventListener("click", ()=>{ updateStats(); statsModal.classList.remove("hidden"); });
closeStats.addEventListener("click", ()=> statsModal.classList.add("hidden"));
statsModal.addEventListener("click", (e)=>{ if(e.target===statsModal) statsModal.classList.add("hidden"); });

function updateStats(){
  const cards = storage.get(FC_KEY, []).length;
  const quiz = storage.get(QZ_KEY, []).length;
  const tasks = storage.get(TK_KEY, []).length;
  const notesCount = (localStorage.getItem("notes")||"").length;
  $("#stat-cards").textContent = cards;
  $("#stat-quiz").textContent = quiz;
  $("#stat-tasks").textContent = tasks;
  $("#stat-notes").textContent = notesCount;
}

// ============ Chat (Gemini backend) ============
const chatFab = $("#chat-toggle");
const chatBox = $("#chat-widget");
const closeChatBtn = $("#closeChat");
const chatBody = $("#chat-body");
const typingEl = $("#typing");
const chatInput = $("#chat-msg");
const sendBtn = $("#sendBtn");

chatFab.addEventListener("click", ()=> { chatBox.style.display = "flex"; chatInput.focus(); });
closeChatBtn.addEventListener("click", ()=> chatBox.style.display = "none");
sendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e)=>{
  if(e.key==="Enter" && !e.shiftKey){ e.preventDefault(); sendChatMessage(); }
});

function addBubble(text, who="bot"){
  const b = document.createElement("div");
  b.className = `bubble ${who}`;
  b.textContent = text;
  chatBody.appendChild(b);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function saveChatHistory(){ localStorage.setItem("chatHTML", chatBody.innerHTML); }

async function sendChatMessage(){
  const text = chatInput.value.trim();
  if(!text) return;
  addBubble(text, "user");
  chatInput.value = "";
  saveChatHistory();

  typingEl.classList.remove("hidden");
  try{
    const r = await fetch("/api/chat",{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({ message: text })
    });
    const data = await r.json();
    typingEl.classList.add("hidden");
    addBubble(data.reply || "AI could not generate a reply.", "bot");
    saveChatHistory();
  }catch(err){
    typingEl.classList.add("hidden");
    addBubble("⚠️ Network error. Is the server running?", "bot");
  }
}

// ============ Voice Input (Web Speech API) ============
const voiceBtn = $("#voiceBtn");
let recognizing = false, rec;
if("webkitSpeechRecognition" in window){
  rec = new webkitSpeechRecognition();
  rec.lang = "en-US"; rec.interimResults = false; rec.continuous = false;
  rec.onresult = (e)=>{ chatInput.value = e.results[0][0].transcript; };
  rec.onend = ()=> { recognizing=false; voiceBtn.classList.remove("active"); voiceBtn.title="Voice input"; };
  voiceBtn.addEventListener("click", ()=>{
    if(recognizing){ rec.stop(); return; }
    recognizing = true; voiceBtn.classList.add("active"); voiceBtn.title="Listening… click to stop"; rec.start();
  });
}else{
  voiceBtn.title = "Voice not supported in this browser";
  voiceBtn.disabled = true;
}

// ============ Load All ============
function loadAll(){
  renderFlashcards();
  renderQuiz();
  renderTasks();
  notesArea.value = localStorage.getItem("notes") || "";
  chatBody.innerHTML = localStorage.getItem("chatHTML") || "";
  updateStats();
}
