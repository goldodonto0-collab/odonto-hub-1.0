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

// ================= VARIÁVEIS =================

let itens = [];

// ================= ABA =================

window.mostrarAba = function (aba) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// ================= PACIENTES =================

window.salvarPaciente = async function () {
  const nome = document.getElementById("nomePaciente").value;

  if (!nome) return alert("Nome obrigatório");

  await addDoc(collection(db, "pacientes"), { nome });

  listarPacientes();
};

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

  atualizar();
};

function atualizar() {
  const lista = document.getElementById("listaItensOrcamento");
  lista.innerHTML = "";

  let total = 0;

  itens.forEach((i, index) => {
    total += i.valor;

    lista.innerHTML += `
      <li>
        ${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)}
        <button onclick="remover(${index})">X</button>
      </li>
    `;
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

window.remover = function (i) {
  itens.splice(i, 1);
  atualizar();
};

window.salvarOrcamento = async function () {
  const paciente = document.getElementById("pacienteOrcamento").value;

  const total = itens.reduce((a, b) => a + b.valor, 0);

  if (!paciente) return alert("Selecione paciente");

  await addDoc(collection(db, "orcamentos"), {
    paciente,
    data: new Date().toLocaleDateString(),
    itens,
    total
  });

  itens = [];
  atualizar();

  listarOrcamentos();
};

// ================= LISTAR =================

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");

  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    lista.innerHTML += `
      <li>
        <b>${data.paciente}</b><br>
        ${data.data} - R$ ${data.total.toFixed(2)}<br>
        <button onclick='gerarPDF(${JSON.stringify(data)})'>PDF</button>
      </li>
    `;
  });
}

// ================= PDF 100% ESTÁVEL =================

window.gerarPDF = function (data) {

  const el = document.createElement("div");

  let html = "";

  data.itens.forEach(i => {
    html += `
      <tr>
        <td>${i.dente}</td>
        <td>${i.proc}</td>
        <td style="text-align:right;">R$ ${i.valor.toFixed(2)}</td>
      </tr>
    `;
  });

  el.innerHTML = `
    <div style="width:210mm;padding:15mm;font-family:Arial;background:white;">

      <h2 style="text-align:center;">ORÇAMENTO ODONTOLÓGICO</h2>

      <p><b>Paciente:</b> ${data.paciente}</p>
      <p><b>Data:</b> ${data.data}</p>

      <table style="width:100%;border-collapse:collapse;">
        <tr style="background:#0b5ed7;color:white;">
          <th>Dente</th><th>Procedimento</th><th>Valor</th>
        </tr>
        ${html}
      </table>

      <h3 style="text-align:right;color:#0b5ed7;">
        Total: R$ ${data.total.toFixed(2)}
      </h3>

    </div>
  `;

  html2pdf()
    .set({
      margin: 0,
      filename: "orcamento.pdf",
      html2canvas: { scale: 2 },
      jsPDF: { format: "a4", unit: "mm" }
    })
    .from(el)
    .save();
};

// ================= INIT =================

window.onload = () => {
  listarPacientes();
  listarOrcamentos();
};
