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

// ================= PACIENTES =================

async function salvarPaciente() {
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
}

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

    const li = document.createElement("li");
    li.innerHTML = `<strong>${data.nome}</strong>`;
    lista.appendChild(li);

    const opt1 = document.createElement("option");
    opt1.value = data.nome;
    opt1.textContent = data.nome;
    selectAtend.appendChild(opt1);

    const opt2 = document.createElement("option");
    opt2.value = data.nome;
    opt2.textContent = data.nome;
    selectOrc.appendChild(opt2);
  });
}

// ================= ODONTOGRAMA =================

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

function adicionarItemOrcamento() {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = parseFloat(document.getElementById("valorOrcamento").value);

  if (!dente || !proc || !valor) return alert("Preencha tudo");

  itens.push({ dente, proc, valor });
  atualizarOrcamento();
}

function atualizarOrcamento() {
  const lista = document.getElementById("listaItensOrcamento");
  lista.innerHTML = "";

  let total = 0;

  itens.forEach((i, index) => {
    total += i.valor;

    const li = document.createElement("li");
    li.innerHTML = `
      Dente ${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)}
      <button onclick="removerItem(${index})">X</button>
    `;
    lista.appendChild(li);
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

function removerItem(i) {
  itens.splice(i, 1);
  atualizarOrcamento();
}

// ================= SALVAR ORÇAMENTO =================

async function salvarOrcamento() {
  const paciente = document.getElementById("pacienteOrcamento").value;
  const total = itens.reduce((a,b)=>a+b.valor,0);

  if (!paciente) return alert("Selecione paciente");

  const data = {
    paciente,
    data: new Date().toLocaleDateString(),
    itens,
    total
  };

  if (editandoId) {
    await updateDoc(doc(db,"orcamentos",editandoId),data);
    editandoId = null;
  } else {
    await addDoc(collection(db,"orcamentos"),data);
  }

  itens = [];
  atualizarOrcamento();

  listarOrcamentos();
}

// ================= LISTAR ORÇAMENTOS =================

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  if (!lista) return;

  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.paciente}</strong><br>
      ${data.data} - R$ ${data.total.toFixed(2)}<br>

      <button onclick='gerarPDF(${JSON.stringify(data)})'>PDF</button>
      <button onclick="editar('${d.id}')">Editar</button>
      <button onclick="excluirOrcamento('${d.id}')">Excluir</button>
    `;

    lista.appendChild(li);
  });
}

// ================= 🔥 PDF PROFISSIONAL =================

function gerarPDF(data) {
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
        body {
          font-family: Arial;
          margin: 0;
          padding: 30px;
          color: #333;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 2px solid #0b5ed7;
          padding-bottom: 15px;
          margin-bottom: 25px;
        }

        .logo img {
          width: 220px;
          object-fit: contain;
        }

        .clinic-info {
          text-align: right;
        }

        .clinic-info h2 {
          margin: 0;
          color: #0b5ed7;
        }

        .clinic-info p {
          margin: 2px 0;
          font-size: 12px;
        }

        .title {
          text-align: center;
          font-size: 22px;
          margin: 20px 0;
          font-weight: bold;
        }

        .info {
          margin-bottom: 20px;
          font-size: 14px;
        }

        table {
          width: 100%;
          border-collapse: collapse;
        }

        th {
          background: #0b5ed7;
          color: white;
          padding: 10px;
        }

        td {
          padding: 10px;
          border-bottom: 1px solid #ddd;
        }

        .total {
          margin-top: 20px;
          text-align: right;
          font-size: 18px;
          font-weight: bold;
          color: #0b5ed7;
        }

        .footer {
          position: fixed;
          bottom: 20px;
          width: 100%;
          text-align: center;
          font-size: 11px;
          color: #777;
        }
      </style>
    </head>

    <body>

      <div class="header">

        <div class="logo">
          <img src="${LOGO_URL}">
        </div>

        <div class="clinic-info">
          <h2>Clínica Odontológica</h2>
          <p>Atendimento especializado</p>
          <p>Telefone: (XX) XXXX-XXXX</p>
        </div>

      </div>

      <div class="title">ORÇAMENTO ODONTOLÓGICO</div>

      <div class="info">
        <p><strong>Paciente:</strong> ${data.paciente}</p>
        <p><strong>Data:</strong> ${data.data}</p>
      </div>

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

      <div class="footer">
        Sistema odontológico - documento gerado automaticamente
      </div>

    </body>
    </html>
  `);

  janela.document.close();

  setTimeout(() => {
    janela.print();
    janela.close();
  }, 500);
}

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
};
