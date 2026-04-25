import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// ================= FIREBASE =================

const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "agenda-paciente.firebaseapp.com",
  projectId: "agenda-paciente",
  storageBucket: "agenda-paciente.appspot.com",
  messagingSenderId: "159249022645",
  appId: "1:159249022645:web:08b5fe64f2f0db4c9708fc"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ================= LOGO =================

const LOGO_URL = "https://i.imgur.com/2Bvio9f.jpeg";

// ================= VARIÁVEIS =================

let itens = [];

// ================= ABA =================

window.mostrarAba = function (aba) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// ================= PACIENTES =================

window.salvarPaciente = async function () {
  const paciente = {
    nome: document.getElementById("nomePaciente").value
  };

  if (!paciente.nome) return alert("Digite o nome");

  await addDoc(collection(db, "pacientes"), paciente);

  listarPacientes();
};

// ================= LISTAR PACIENTES =================

async function listarPacientes() {
  const lista = document.getElementById("listaPacientes");
  const select = document.getElementById("pacienteOrcamento");

  lista.innerHTML = "";
  select.innerHTML = "";

  const snap = await getDocs(collection(db, "pacientes"));

  snap.forEach(d => {
    const data = d.data();

    lista.innerHTML += `<li>${data.nome}</li>`;
    select.innerHTML += `<option>${data.nome}</option>`;
  });
}

// ================= ORÇAMENTO =================

window.adicionarItemOrcamento = function () {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = parseFloat(document.getElementById("valorOrcamento").value);

  if (!dente || !proc || !valor) return alert("Preencha tudo");

  itens.push({ dente, proc, valor });
  atualizarOrcamento();
};

function atualizarOrcamento() {
  const lista = document.getElementById("listaItensOrcamento");
  lista.innerHTML = "";

  let total = 0;

  itens.forEach((i, index) => {
    total += i.valor;

    lista.innerHTML += `
      <li>
        Dente ${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)}
        <button onclick="removerItem(${index})">X</button>
      </li>
    `;
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

window.removerItem = function (i) {
  itens.splice(i, 1);
  atualizarOrcamento();
};

// ================= SALVAR =================

window.salvarOrcamento = async function () {
  const paciente = document.getElementById("pacienteOrcamento").value;
  const total = itens.reduce((a,b)=>a+b.valor,0);

  await addDoc(collection(db,"orcamentos"),{
    paciente,
    data: new Date().toLocaleDateString(),
    itens,
    total
  });

  itens = [];
  atualizarOrcamento();
  listarOrcamentos();
};

// ================= HISTÓRICO =================

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    lista.innerHTML += `
      <li>
        <strong>${data.paciente}</strong><br>
        ${data.data} - R$ ${data.total.toFixed(2)}<br>
        <button onclick='gerarPDF(${JSON.stringify(data)})'>PDF</button>
      </li>
    `;
  });
}

// ================= PDF PROFISSIONAL (SEM BRANCO) =================

window.gerarPDF = function (data) {

  let itensHTML = "";

  data.itens.forEach(i => {
    itensHTML += `
      <tr>
        <td>${i.dente}</td>
        <td>${i.proc}</td>
        <td style="text-align:right;">R$ ${i.valor.toFixed(2)}</td>
      </tr>
    `;
  });

  const el = document.createElement("div");

  el.innerHTML = `
    <div style="font-family:Arial; width:210mm; padding:20px;">

      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #0b5ed7; padding-bottom:10px;">
        <img src="${LOGO_URL}" style="width:140px;">
        <div style="text-align:right;">
          <h2 style="margin:0; color:#0b5ed7;">Clínica Odontológica</h2>
        </div>
      </div>

      <p><b>Paciente:</b> ${data.paciente}</p>
      <p><b>Data:</b> ${data.data}</p>

      <table style="width:100%; border-collapse:collapse;">
        <tr style="background:#0b5ed7; color:white;">
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <h3 style="text-align:right; color:#0b5ed7;">
        Total: R$ ${data.total.toFixed(2)}
      </h3>

    </div>
  `;

  document.body.appendChild(el);

  html2pdf().set({
    margin: 0,
    filename: `orcamento-${data.paciente}.pdf`,
    image: { type: 'jpeg', quality: 1 },
    html2canvas: { scale: 3, useCORS: true },
    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
  }).from(el).save().then(() => {
    document.body.removeChild(el);
  });
};

// ================= INIT =================

window.onload = () => {
  listarPacientes();
  listarOrcamentos();
};
