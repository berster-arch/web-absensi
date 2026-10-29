(() => {
  const STORAGE_KEY = "ruanghadir-v1";
  const seedStudents = [
    { nis: "2025001", name: "Alya Putri Ramadhani", className: "1A" },
    { nis: "2025002", name: "Bima Aditya Pratama", className: "1A" },
    { nis: "2025003", name: "Citra Maharani", className: "2A" },
    { nis: "2025004", name: "Daffa Rizky Saputra", className: "2B" },
    { nis: "2025005", name: "Nadia Zahra Azzahra", className: "3A" },
    { nis: "2025006", name: "Rafi Ahmad Maulana", className: "3B" },
    { nis: "2025007", name: "Salsabila Nirmala", className: "4A" },
    { nis: "2025008", name: "Fajar Ramadhan", className: "5A" }
  ];
  const $ = (selector) => document.querySelector(selector);
  const today = () => new Date().toLocaleDateString("en-CA");
  const timeNow = (date = new Date()) => date.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: false });
  let state;
  let scanner;
  let scannerRunning = false;
  let lastScanText = "";
  let lastScanAt = 0;
  let selectedQrStudent = null;

  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    state = saved && Array.isArray(saved.students) && Array.isArray(saved.attendance)
      ? saved
      : { students: seedStudents, attendance: [] };
  } catch (error) {
    console.error("Gagal membaca data RuangHadir dari penyimpanan browser.", error);
    state = { students: seedStudents, attendance: [] };
    toast("Data tersimpan tidak dapat dibaca. Data contoh ditampilkan.", "error");
  }

  function persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      return true;
    } catch (error) {
      console.error("Gagal menyimpan data RuangHadir.", error);
      toast("Data gagal disimpan. Periksa ruang penyimpanan browser.", "error");
      return false;
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
    })[char]);
  }

  function toast(message, type = "") {
    const item = document.createElement("div");
    item.className = `toast ${type}`;
    item.textContent = message;
    $("#toast-region").append(item);
    window.setTimeout(() => item.remove(), 3500);
  }

  function initials(name) {
    return name.split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
  }

  function setPage(name) {
    document.querySelectorAll(".page").forEach((page) => page.classList.toggle("active", page.id === `page-${name}`));
    document.querySelectorAll(".nav-link").forEach((link) => link.classList.toggle("active", link.dataset.page === name));
    const titles = { dashboard: "Dashboard", attendance: "Absensi", students: "Data Siswa" };
    $("#breadcrumb-current").textContent = titles[name] || titles.dashboard;
    $("#sidebar").classList.remove("open");
    if (name === "attendance") renderAttendance();
    if (name === "students") renderStudents();
  }

  function recordForToday(student) {
    return state.attendance.find((item) => item.nis === student.nis && item.date === today());
  }

  function renderDashboard() {
    const present = state.attendance.filter((item) => item.date === today());
    const late = present.filter((item) => item.status === "Terlambat").length;
    $("#stat-total").textContent = state.students.length;
    $("#stat-present").textContent = present.length;
    $("#stat-late").textContent = late;
    $("#stat-absent").textContent = Math.max(0, state.students.length - present.length);
    $("#present-percent").textContent = state.students.length ? `${Math.round(present.length / state.students.length * 100)}%` : "0%";
    $("#nav-count").textContent = present.length;
    const rows = present.slice().sort((a, b) => b.time.localeCompare(a.time)).slice(0, 6);
    $("#dashboard-attendance").innerHTML = rows.map((item, index) => {
      const student = state.students.find((entry) => entry.nis === item.nis);
      if (!student) return "";
      return `<tr><td><div class="student-cell"><span class="student-avatar tone-${index % 4}">${escapeHtml(initials(student.name))}</span><span>${escapeHtml(student.name)}</span></div></td><td>${escapeHtml(student.className)}</td><td>${escapeHtml(item.time)}</td><td><span class="status-badge ${item.status === "Terlambat" ? "status-late" : "status-present"}">${escapeHtml(item.status)}</span></td></tr>`;
    }).join("");
    $("#dashboard-empty").classList.toggle("hidden", rows.length > 0);
    $("#welcome-date").textContent = new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).toUpperCase();
    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 4 ? "Selamat malam" : hour < 11 ? "Selamat pagi" : hour < 15 ? "Selamat siang" : hour < 18 ? "Selamat sore" : "Selamat malam";
    $("#welcome-title").innerHTML = `${greeting}, Admin <span class="wave">✦</span>`;
    const academicStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    $("#academic-year").textContent = `${academicStart}/${academicStart + 1}`;
    document.querySelectorAll(".copyright-year").forEach((year) => { year.textContent = now.getFullYear(); });
  }

  function renderAttendance() {
    const date = $("#attendance-date").value || today();
    const query = $("#attendance-search").value.trim().toLocaleLowerCase("id");
    $("#attendance-date-label").textContent = date === today() ? "Catatan kehadiran hari ini" : `Catatan kehadiran ${new Date(`${date}T12:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}`;
    const rows = state.attendance.filter((item) => {
      const student = state.students.find((entry) => entry.nis === item.nis);
      return student && item.date === date && `${student.name} ${student.nis} ${student.className}`.toLocaleLowerCase("id").includes(query);
    }).sort((a, b) => b.time.localeCompare(a.time));
    $("#attendance-body").innerHTML = rows.map((item, index) => {
      const student = state.students.find((entry) => entry.nis === item.nis);
      return `<tr><td><div class="student-cell"><span class="student-avatar tone-${index % 4}">${escapeHtml(initials(student.name))}</span><span>${escapeHtml(student.name)}</span></div></td><td>${escapeHtml(student.nis)}</td><td>${escapeHtml(student.className)}</td><td>${escapeHtml(new Date(`${item.date}T12:00:00`).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }))}</td><td>${escapeHtml(item.time)}</td><td><span class="status-badge ${item.status === "Terlambat" ? "status-late" : "status-present"}">${escapeHtml(item.status)}</span></td></tr>`;
    }).join("");
    $("#attendance-empty").classList.toggle("hidden", rows.length > 0);
  }

  function renderStudents() {
    const query = $("#student-search").value.trim().toLocaleLowerCase("id");
    const className = $("#class-filter").value;
    const classes = [...new Set(state.students.map((student) => student.className))].sort((a, b) => a.localeCompare(b, "id", { numeric: true }));
    const classFilter = $("#class-filter");
    const previousClass = classFilter.value;
    classFilter.innerHTML = '<option value="">Semua Kelas</option>' + classes.map((name) => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join("");
    classFilter.value = classes.includes(className || previousClass) ? (className || previousClass) : "";
    $("#student-count").textContent = `${state.students.length} siswa`;
    const rows = state.students.filter((student) => `${student.name} ${student.nis}`.toLocaleLowerCase("id").includes(query) && (!classFilter.value || student.className === classFilter.value));
    $("#students-body").innerHTML = rows.map((student, index) => `<tr><td><div class="student-cell"><span class="student-avatar tone-${index % 4}">${escapeHtml(initials(student.name))}</span><span>${escapeHtml(student.name)}<small>${recordForToday(student) ? "Sudah melakukan absensi hari ini" : "Belum melakukan absensi hari ini"}</small></span></div></td><td>${escapeHtml(student.nis)}</td><td>${escapeHtml(student.className)}</td><td><button class="qr-button" data-qr="${escapeHtml(student.nis)}">▦ Lihat QR</button></td><td><button class="row-menu" data-delete="${escapeHtml(student.nis)}" aria-label="Hapus ${escapeHtml(student.name)}">···</button></td></tr>`).join("");
    $("#students-empty").classList.toggle("hidden", rows.length > 0);
  }

  function markAttendance(nis) {
    const student = state.students.find((item) => item.nis === nis.trim());
    if (!student) {
      $("#scanner-feedback").textContent = "Siswa dengan NIS tersebut tidak ditemukan.";
      $("#scanner-feedback").className = "scanner-feedback error";
      toast("NIS tidak ditemukan. Periksa kembali nomor induk siswa.", "error");
      return false;
    }
    if (recordForToday(student)) {
      $("#scanner-feedback").textContent = `${student.name} sudah tercatat hadir hari ini.`;
      $("#scanner-feedback").className = "scanner-feedback error";
      toast(`${student.name} sudah melakukan absensi hari ini.`, "error");
      return false;
    }
    const recordedAt = new Date();
    const minutesAfterMidnight = recordedAt.getHours() * 60 + recordedAt.getMinutes();
    const status = minutesAfterMidnight > 7 * 60 + 15 ? "Terlambat" : "Hadir";
    state.attendance.push({ nis: student.nis, date: today(), time: timeNow(recordedAt), status });
    if (!persist()) {
      state.attendance.pop();
      return false;
    }
    $("#scanner-feedback").textContent = `Berhasil! ${student.name} tercatat ${status.toLocaleLowerCase("id")} pukul ${timeNow(recordedAt)}.`;
    $("#scanner-feedback").className = "scanner-feedback success";
    $("#manual-nis").value = "";
    renderDashboard();
    renderStudents();
    if ($("#page-attendance").classList.contains("active")) renderAttendance();
    toast(`Absensi ${student.name} berhasil dicatat.`, "success");
    return true;
  }

  function showModal(id) {
    $(`#${id}`).classList.remove("hidden");
  }

  async function stopScanner() {
    if (!scanner || !scannerRunning) return;
    try {
      await scanner.stop();
    } catch (error) {
      console.error("Kamera pemindai gagal dihentikan.", error);
    }
    scannerRunning = false;
  }

  async function openScanner() {
    showModal("scanner-modal");
    $("#scanner-feedback").textContent = "Kamera siap dipindai. Izinkan akses kamera jika diminta.";
    $("#scanner-feedback").className = "scanner-feedback";
    if (typeof Html5Qrcode === "undefined") {
      $("#scanner-feedback").textContent = "Library pemindai tidak tersedia. Periksa koneksi internet atau masukkan NIS secara manual.";
      $("#scanner-feedback").className = "scanner-feedback error";
      return;
    }
    if (!scanner) scanner = new Html5Qrcode("qr-reader");
    try {
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 220, height: 220 } },
        (decodedText) => {
          const scanTime = Date.now();
          if (decodedText === lastScanText && scanTime - lastScanAt < 2000) return;
          lastScanText = decodedText;
          lastScanAt = scanTime;
          let nis = decodedText.trim();
          try {
            const payload = JSON.parse(decodedText);
            if (payload && payload.type === "ruanghadir" && typeof payload.nis === "string") nis = payload.nis;
          } catch { /* Plain NIS QR codes are accepted for convenience. */ }
          markAttendance(nis);
        },
        () => {}
      );
      scannerRunning = true;
    } catch (error) {
      console.error("Kamera tidak dapat dimulai.", error);
      $("#scanner-feedback").textContent = "Kamera tidak dapat diakses. Izinkan akses kamera atau masukkan NIS secara manual.";
      $("#scanner-feedback").className = "scanner-feedback error";
    }
  }

  function openQr(student) {
    selectedQrStudent = student;
    $("#qr-title").textContent = student.name;
    $("#qr-student-info").textContent = `NIS ${student.nis} · Kelas ${student.className}`;
    $("#qr-display").innerHTML = "";
    showModal("qr-modal");
    if (typeof QRCode === "undefined") {
      $("#qr-display").textContent = "QR code tidak dapat dimuat. Periksa koneksi internet.";
      toast("Library QR code tidak tersedia.", "error");
      return;
    }
    new QRCode($("#qr-display"), {
      text: JSON.stringify({ type: "ruanghadir", nis: student.nis }),
      width: 190, height: 190, colorDark: "#24283a", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.M
    });
  }

  function exportCsv() {
    const date = $("#attendance-date").value || today();
    const rows = state.attendance.filter((item) => item.date === date).map((item) => {
      const student = state.students.find((entry) => entry.nis === item.nis);
      return student ? [student.nis, student.name, student.className, item.date, item.time, item.status] : null;
    }).filter(Boolean);
    const quote = (value) => `"${String(value).replace(/"/g, '""')}"`;
    const csv = ["NIS,Nama,Kelas,Tanggal,Waktu,Status", ...rows.map((row) => row.map(quote).join(","))].join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `absensi-${date}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast(`${rows.length} catatan absensi diekspor.`, "success");
  }

  document.querySelectorAll(".nav-link").forEach((link) => link.addEventListener("click", () => setPage(link.dataset.page)));
  document.querySelectorAll("[data-go]").forEach((button) => button.addEventListener("click", () => setPage(button.dataset.go)));
  $("#open-scanner").addEventListener("click", openScanner);
  $("#quick-scan").addEventListener("click", openScanner);
  $("#attendance-scan").addEventListener("click", openScanner);
  $("#quick-students").addEventListener("click", () => setPage("students"));
  $("#add-student").addEventListener("click", () => {
    $("#student-form").reset();
    showModal("student-modal");
    $("#student-name").focus();
  });
  $("#mobile-menu").addEventListener("click", () => $("#sidebar").classList.toggle("open"));
  $("#attendance-search").addEventListener("input", renderAttendance);
  $("#attendance-date").value = today();
  $("#attendance-date").addEventListener("change", renderAttendance);
  $("#export-csv").addEventListener("click", exportCsv);
  $("#student-search").addEventListener("input", renderStudents);
  $("#class-filter").addEventListener("change", renderStudents);
  $("#manual-attendance").addEventListener("submit", (event) => {
    event.preventDefault();
    markAttendance($("#manual-nis").value.trim());
  });

  $("#student-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const student = {
      name: $("#student-name").value.trim(),
      nis: $("#student-nis").value.trim(),
      className: $("#student-class").value
    };
    if (!student.name || !student.nis || !student.className) return;
    if (state.students.some((entry) => entry.nis === student.nis)) {
      toast("NIS sudah terdaftar. Gunakan nomor induk yang berbeda.", "error");
      $("#student-nis").focus();
      return;
    }
    state.students.push(student);
    if (!persist()) {
      state.students.pop();
      return;
    }
    $("#student-modal").classList.add("hidden");
    renderDashboard();
    renderStudents();
    toast(`${student.name} berhasil ditambahkan.`, "success");
  });

  $("#students-body").addEventListener("click", (event) => {
    const qrButton = event.target.closest("[data-qr]");
    if (qrButton) {
      const student = state.students.find((entry) => entry.nis === qrButton.dataset.qr);
      if (student) openQr(student);
      return;
    }
    const deleteButton = event.target.closest("[data-delete]");
    if (deleteButton) {
      const student = state.students.find((entry) => entry.nis === deleteButton.dataset.delete);
      if (!student || !window.confirm(`Hapus data ${student.name}? Riwayat absensinya juga akan dihapus.`)) return;
      const oldStudents = state.students;
      const oldAttendance = state.attendance;
      state.students = oldStudents.filter((entry) => entry.nis !== student.nis);
      state.attendance = oldAttendance.filter((entry) => entry.nis !== student.nis);
      if (!persist()) {
        state.students = oldStudents;
        state.attendance = oldAttendance;
        return;
      }
      renderDashboard();
      renderStudents();
      toast(`${student.name} berhasil dihapus.`, "success");
    }
  });

  $("#print-qr").addEventListener("click", () => window.print());
  $("#help-button").addEventListener("click", () => toast("Buka Data Siswa untuk menampilkan QR, lalu pindai melalui menu Scan QR Siswa."));
  document.querySelectorAll("[data-close]").forEach((button) => button.addEventListener("click", async () => {
    const modal = button.dataset.close;
    $(`#${modal}`).classList.add("hidden");
    if (modal === "scanner-modal") await stopScanner();
  }));
  document.querySelectorAll(".modal-backdrop").forEach((backdrop) => backdrop.addEventListener("click", async (event) => {
    if (event.target !== backdrop) return;
    backdrop.classList.add("hidden");
    if (backdrop.id === "scanner-modal") await stopScanner();
  }));
  document.addEventListener("keydown", async (event) => {
    if (event.key !== "Escape") return;
    const open = document.querySelector(".modal-backdrop:not(.hidden)");
    if (open) {
      open.classList.add("hidden");
      if (open.id === "scanner-modal") await stopScanner();
    }
  });

  renderDashboard();
  renderStudents();
})();
