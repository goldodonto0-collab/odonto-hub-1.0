import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
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

let pacientesMap = {};
let itens = [];
let editandoId = null;

// ================= DENTES =================

const dentes = [
  18,17,16,15,14,13,12,11,
  21,22,23,24,25,26,27,28,29,
  19,
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38,39,
  49
];

// ================= ABA (NÃO MEXIDA) =================

window.mostrarAba = function (aba) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// ================= PACIENTES =================

window.salvarPaciente = async function () {
  const paciente = {
    nome: document.getElementById("nomePaciente").value,
    telefone: document.getElementById("telefonePaciente").value,
    cpf: document.getElementById("cpfPaciente").value,
    rg: document.getElementById("rgPaciente").value,
    nascimento: document.getElementById("nascimentoPaciente").value,
    endereco: document.getElementById("enderecoPaciente").value,
    saude: document.getElementById("saudePaciente").value,
    observacoes: document.getElementById("observacoesPaciente").value
  };

  if (!paciente.nome) return alert("Digite o nome");

  await addDoc(collection(db, "pacientes"), paciente);

  listarPacientes();
};

// ================= LISTAR PACIENTES =================

async function listarPacientes() {
  const lista = document.getElementById("listaPacientes");
  const selectAtend = document.getElementById("nome");
  const selectOrc = document.getElementById("pacienteOrcamento");

  lista.innerHTML = "";
  selectAtend.innerHTML = `<option value="">Selecione o paciente</option>`;
  selectOrc.innerHTML = `<option value="">Selecione o paciente</option>`;

  const snap = await getDocs(collection(db, "pacientes"));

  snap.forEach(d => {
    const data = d.data();

    pacientesMap[data.nome] = d.id;

    lista.innerHTML += `<li>${data.nome}</li>`;
    selectAtend.innerHTML += `<option>${data.nome}</option>`;
    selectOrc.innerHTML += `<option>${data.nome}</option>`;
  });
}

// ================= ODONTOGRAMA (ORIGINAL) =================

function criarOdontograma() {
  const el = document.getElementById("odontograma");
  if (!el) return;

  el.innerHTML = "";

  dentes.forEach(d => {
    const div = document.createElement("div");
    div.className = "dente";

    if ([19,29,39,49].includes(d)) {
      div.classList.add("extra");
    }

    div.innerText = d;

    div.onclick = () => {
      document.getElementById("denteSelecionado").value = d;
    };

    el.appendChild(div);
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

  if (!paciente) return alert("Selecione paciente");

  const data = {
    paciente,
    data: new Date().toLocaleDateString(),
    itens,
    total
  };

  await addDoc(collection(db,"orcamentos"),data);

  itens = [];
  atualizarOrcamento();
  listarOrcamentos();
};

// ================= HISTÓRICO =================

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  if (!lista) return;

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

// ================= PDF COM LOGO (SÓ ISSO FOI MELHORADO) =================

window.gerarPDF = function (data) {

  const janela = window.open("", "_blank");

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

  janela.document.write(`
    <html>
    <head>
      <title>Orçamento</title>
      <style>
        body { font-family: Arial; padding: 20px; }
        table { width:100%; border-collapse: collapse; }
        th { background:#0b5ed7; color:white; padding:8px; }
        td { padding:8px; border-bottom:1px solid #ddd; }

        .header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          border-bottom:2px solid #0b5ed7;
          margin-bottom:15px;
          padding-bottom:10px;
        }

        .logo img { width:140px; }

        .info { text-align:right; }
      </style>
    </head>

    <body>

      <div class="header">
        <div class="logo">
          <img src="${LOGO_URL}">
        </div>

        <div class="info">
          <h3>Clínica Odontológica</h3>
        </div>
      </div>

      <p><b>Paciente:</b> ${data.paciente}</p>
      <p><b>Data:</b> ${data.data}</p>

      <table>
        <tr>
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <h3>Total: R$ ${data.total.toFixed(2)}</h3>

      <script>
        window.onload = () => window.print();
      </script>

    </body>
    </html>
  `);

  janela.document.close();
};

// ================= INIT =================

window.onload = () => {
  window.salvarPaciente = salvarPaciente;
  window.adicionarItemOrcamento = adicionarItemOrcamento;
  window.removerItem = removerItem;
  window.salvarOrcamento = salvarOrcamento;
  window.gerarPDF = gerarPDF;
  window.mostrarAba = mostrarAba;

  criarOdontograma();
  listarPacientes();
  listarOrcamentos();
};
