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

// ================= ABA =================

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

    lista.innerHTML += `<li>${data.nome}</li>`;
    selectAtend.innerHTML += `<option>${data.nome}</option>`;
    selectOrc.innerHTML += `<option>${data.nome}</option>`;
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

// ================= PDF PROFISSIONAL COM LOGO =================

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
      <title>Orçamento Odontológico</title>

      <style>
        @page {
          size: A4;
          margin: 20mm;
        }

        body {
          font-family: Arial;
          margin: 0;
          padding: 0;
          color: #333;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0b5ed7;
          padding-bottom: 10px;
          margin-bottom: 20px;
        }

        .logo img {
          width: 160px;
        }

        .info {
          text-align: right;
        }

        .info h2 {
          margin: 0;
          color: #0b5ed7;
        }

        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 15px;
        }

        th {
          background: #0b5ed7;
          color: white;
          padding: 10px;
        }

        td {
          padding: 8px;
          border-bottom: 1px solid #ddd;
        }

        .total {
          text-align: right;
          font-size: 18px;
          margin-top: 20px;
          color: #0b5ed7;
          font-weight: bold;
        }

      </style>
    </head>

    <body>

      <div class="header">

        <div class="logo">
          <img src="${LOGO_URL}">
        </div>

        <div class="info">
          <h2>Clínica Odontológica</h2>
          <p>Orçamento Profissional</p>
        </div>

      </div>

      <p><strong>Paciente:</strong> ${data.paciente}</p>
      <p><strong>Data:</strong> ${data.data}</p>

      <table>
        <tr>
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <div class="total">
        Total: R$ ${data.total.toFixed(2)}
      </div>

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

  listarPacientes();
  listarOrcamentos();
};
