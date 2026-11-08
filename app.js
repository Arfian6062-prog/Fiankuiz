// QUIZVERSE front-end. Ganti API_URL setelah deploy Google Apps Script.
const API_URL = "PASTE_GOOGLE_APPS_SCRIPT_WEB_APP_URL_HERE";
const QUESTIONS = [
  {q:"Di sebuah kelas terdapat siswa dengan agama yang berbeda-beda. Mereka memiliki cara beribadah yang berbeda, tetapi tetap bisa belajar dan bekerja sama. Sikap tersebut menunjukkan bahwa moderasi beragama adalah ....",a:["Menganggap semua agama memiliki aturan yang sama.","Menghargai perbedaan tanpa harus meninggalkan keyakinan sendiri.","Mengikuti cara beribadah teman agar tidak terjadi konflik.","Menghindari pertemanan dengan orang yang berbeda agama."],correct:1},
  {q:"Seorang teman mengajakmu mengikuti kegiatan keagamaan yang sesuai dengan keyakinannya. Kamu menolak dengan sopan karena memiliki keyakinan berbeda. Bagaimana sikap yang paling tepat?",a:["Memarahinya karena telah mengajak.","Mengikutinya meskipun bertentangan dengan keyakinanmu.","Menolak dengan sopan dan tetap menghargai dirinya.","Memutuskan pertemanan dengannya."],correct:2},
  {q:"Dalam pemilihan ketua kelompok, terdapat dua calon dengan kemampuan yang sama. Salah satu calon berbeda agama dengan mayoritas anggota kelompok. Keputusan paling adil adalah ....",a:["Memilih calon yang agamanya sama dengan mayoritas.","Memilih calon yang paling dekat dengan ketua kelas.","Tidak memilih calon yang berbeda agama agar tidak menimbulkan masalah.","Menentukan pilihan berdasarkan kemampuan dan tanggung jawab."],correct:3},
  {q:"Ketika terjadi bencana, warga dari berbagai agama mengumpulkan bantuan. Namun, ada seseorang yang menolak membantu korban karena berbeda agama. Jika kamu berada di sana, tindakan paling tepat adalah ....",a:["Membiarkannya karena setiap orang bebas berpendapat.","Mengingatkan bahwa membantu sesama manusia tidak harus melihat agamanya.","Hanya membantu korban yang agamanya sama.","Membalas penolakannya dengan tidak membantu kelompoknya."],correct:1},
  {q:"Dua mahasiswa berbeda pendapat mengenai suatu persoalan agama. Perdebatan mulai memanas dan keduanya saling menyalahkan. Apa langkah paling bijak?",a:["Menghentikan diskusi dan saling mendengarkan pendapat.","Memaksakan pendapat yang dianggap paling benar.","Mengajak teman lain untuk menyerang pendapat lawan.","Menyebarkan perdebatan tersebut agar salah satu pihak dipermalukan."],correct:0},
  {q:"Kamu sedang mengerjakan tugas kelompok. Salah satu anggota meminta izin untuk menjalankan ibadah ketika kelompok sedang berdiskusi. Apa keputusan terbaik?",a:["Memintanya menyelesaikan tugas terlebih dahulu.","Mengeluarkannya dari kelompok karena menghambat pekerjaan.","Memberikan kesempatan beribadah dan mengatur ulang pembagian tugas.","Membiarkan seluruh pekerjaan menjadi tanggung jawab anggota lainnya."],correct:2},
  {q:"Dua orang memiliki keyakinan yang berbeda dan sama-sama yakin dengan ajaran agamanya. Mereka tetap berteman, saling membantu, dan tidak mengganggu ibadah masing-masing. Kesimpulan yang paling tepat adalah ....",a:["Persahabatan hanya bisa terjadi jika memiliki agama yang sama.","Perbedaan keyakinan harus dihilangkan agar tercipta kedamaian.","Salah satu pihak harus mengikuti keyakinan pihak lainnya.","Perbedaan keyakinan tidak menghalangi manusia untuk hidup rukun."],correct:3}
];
const CHAOS = [
  "🚨 SENSOR LOGIKA MENDETEKSI KEGUGUPAN. TARIK NAPAS.",
  "🛸 Alien pengawas berkata: 'hmm... menarik sekali pilihanmu.'",
  "⚠️ RAM OTAK PENUH. Tutup 37 tab pikiran yang tidak perlu.",
  "🎺 Musik kemenangan tertunda. Sistem masih menilai.",
  "🧠 Otak sedang buffering... mohon jangan diguncang."
];
const $ = id => document.getElementById(id);
let player = null, index = 0, answers = [], score = 0, timeLeft = 20, timerId = null, locked = false, startAt = 0, chaosTimer = null;
const screens = ["home","register","quiz","result","leaderboard"];
function showScreen(name){screens.forEach(s=>$(`screen-${s}`).classList.toggle("active",s===name));window.scrollTo({top:0,behavior:"smooth"});}
function toast(msg){const el=$("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2500);}
function apiReady(){return API_URL.startsWith("https://script.google.com/");}
$("start-btn").onclick=()=>showScreen("register");
$("back-home").onclick=()=>showScreen("home");
$("register-form").addEventListener("submit",e=>{
  e.preventDefault();
  const name=$("player-name").value.trim(), cls=$("player-class").value.trim(), npm=$("player-npm").value.trim();
  if(!name||!cls||!npm){toast("Data pemain belum lengkap.");return;}
  if(npm.length<5){toast("Periksa kembali NPM kamu.");return;}
  player={name,kelas:cls,npm};
  beginGame();
});
$("retry-btn").onclick=()=>showScreen("home");
$("leaderboard-btn").onclick=loadLeaderboard;
$("leader-home").onclick=()=>showScreen("home");
$("leader-play").onclick=()=>showScreen("register");

function beginGame(){
  index=0;answers=[];score=0;startAt=Date.now();
  $("player-chip").textContent=player.name.toUpperCase().slice(0,18);
  showScreen("quiz");renderQuestion();
}
function renderQuestion(){
  clearInterval(timerId);locked=false;timeLeft=20;
  const q=QUESTIONS[index];
  $("question-count").textContent=`QUESTION ${String(index+1).padStart(2,"0")} / 07`;
  $("progress-fill").style.width=`${(index/7)*100}%`;
  $("question-text").textContent=q.q;
  $("timer").textContent="20.0s";$("timer").classList.remove("danger");
  $("question-hint").textContent="PILIH JAWABAN TERBAIK";
  $("chaos-banner").textContent="";
  $("answers").innerHTML="";
  q.a.forEach((answer,i)=>{
    const b=document.createElement("button");b.className="answer";
    const letter=document.createElement("span");letter.className="letter";letter.textContent="ABCD"[i];
    const label=document.createElement("span");label.textContent=answer;
    b.append(letter,label);b.onclick=()=>chooseAnswer(i,false);$("answers").appendChild(b);
  });
  timerId=setInterval(()=>{
    timeLeft=Math.max(0,timeLeft-.1);
    $("timer").textContent=`${timeLeft.toFixed(1)}s`;
    if(timeLeft<=5)$("timer").classList.add("danger");
    if(timeLeft<=0){clearInterval(timerId);chooseAnswer(-1,true);}
  },100);
  if(Math.random()<.42) setTimeout(()=>{if(!locked)$("chaos-banner").textContent=CHAOS[Math.floor(Math.random()*CHAOS.length)];},1800);
}
function chooseAnswer(choice,timedOut){
  if(locked)return;locked=true;clearInterval(timerId);
  const q=QUESTIONS[index],correct=choice===q.correct;
  answers.push(choice);
  const buttons=[...$("answers").querySelectorAll("button")];
  buttons.forEach((b,i)=>{b.disabled=true;if(i===q.correct)b.classList.add("correct");if(i===choice&&!correct)b.classList.add("wrong");});
  if(correct){
    const speedBonus=Math.max(0,Math.floor(timeLeft*2));
    const bonus=Math.random()<.12?25:0;
    score+=100+speedBonus+bonus;
    $("question-hint").textContent=bonus?`CRITICAL HIT! BONUS CHAOS +${bonus}`:`BENAR! +${100+speedBonus} POIN`;
    $("chaos-banner").textContent=bonus?"🎁 LOOT DROP! Kamu menemukan 25 poin bonus.": "✨ Sistem mengakui kecerdasanmu. Jangan sombong.";
  }else{
    $("question-hint").textContent=timedOut?"WAKTU HABIS!":"BELUM TEPAT.";
    $("chaos-banner").textContent=timedOut?"⏰ Bahkan jam dinding ikut kecewa.":CHAOS[Math.floor(Math.random()*CHAOS.length)];
    document.body.classList.add("chaos-flash");setTimeout(()=>document.body.classList.remove("chaos-flash"),400);
  }
  $("score-live").textContent=`SCORE: ${String(score).padStart(3,"0")}`;
  setTimeout(()=>{index++;if(index<QUESTIONS.length)renderQuestion();else finishGame();},1450);
}
function getVerdict(correct){
  if(correct===7)return ["Professor of Chaos","🏆","Sempurna. Bahkan kalkulator meminta tanda tanganmu."];
  if(correct>=6)return ["Otak Berjalan","🧠","Logikamu stabil. Tolong jangan gunakan kekuatan ini untuk debat grup keluarga."];
  if(correct>=4)return ["Lumayan Waras","😎","Ada cahaya pengetahuan di sana. Terus pertahankan."];
  if(correct>=2)return ["Korban Keadaan","🫠","Perjalanan masih panjang. Setidaknya kamu tidak menyerah."];
  return ["NPC Kehidupan","💀","Plot twist: kamu baru saja membuka tutorial kehidupan."];
}
async function finishGame(){
  showScreen("result");
  const correct=answers.filter((a,i)=>a===QUESTIONS[i].correct).length;
  const wrong=7-correct,accuracy=Math.round(correct/7*100),duration=Math.round((Date.now()-startAt)/1000);
  const finalScore=score;
  const verdict=getVerdict(correct);
  $("result-title").textContent=verdict[0];$("result-emoji").textContent=verdict[1];$("result-message").textContent=verdict[2];
  $("final-score").textContent=String(finalScore).padStart(3,"0");
  $("correct-count").textContent=correct;$("wrong-count").textContent=wrong;$("accuracy").textContent=`${accuracy}%`;
  $("save-status").textContent="Mengirim hasil ke database...";
  if(!apiReady()){$("save-status").textContent="Mode demo: hubungkan URL Apps Script untuk menyimpan hasil.";return;}
  try{
    const response=await fetch(API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"submit",player,answers,score:finalScore,correct,wrong,accuracy,duration})});
    const data=await response.json();
    if(data.ok){$("final-score").textContent=String(data.score).padStart(3,"0");$("save-status").textContent="✓ Hasil berhasil disimpan ke database. Skor resmi: "+data.score;}else{$("save-status").textContent=`Gagal menyimpan: ${data.error||"coba lagi"}`;}
  }catch(err){$("save-status").textContent="Koneksi database gagal. Periksa URL atau deploy Apps Script.";}
}
async function loadLeaderboard(){
  showScreen("leaderboard");$("leaderboard-content").innerHTML='<p class="muted">Menghubungi server...</p>';
  if(!apiReady()){$("leaderboard-content").innerHTML='<div class="empty-state">Leaderboard akan aktif setelah Google Apps Script dikonfigurasi.</div>';return;}
  try{
    const r=await fetch(`${API_URL}?action=leaderboard`);const data=await r.json();
    if(!data.ok||!data.rows?.length){$("leaderboard-content").innerHTML='<div class="empty-state">Belum ada legenda di arena ini. Jadilah yang pertama!</div>';return;}
    const table=document.createElement("table");table.className="leader-table";
    table.innerHTML="<thead><tr><th>RANK</th><th>PEMAIN</th><th>KELAS</th><th>SKOR</th></tr></thead>";
    const tbody=document.createElement("tbody");
    data.rows.forEach((r,i)=>{const tr=document.createElement("tr");[String(i+1).padStart(2,"0"),r.name,r.kelas,String(r.score)].forEach(v=>{const td=document.createElement("td");td.textContent=v;tr.appendChild(td);});tr.children[0].className="rank";tbody.appendChild(tr);});
    table.appendChild(tbody);$("leaderboard-content").replaceChildren(table);
  }catch(e){$("leaderboard-content").innerHTML='<div class="empty-state">Server belum bisa dihubungi. Coba beberapa saat lagi.</div>';}
}
