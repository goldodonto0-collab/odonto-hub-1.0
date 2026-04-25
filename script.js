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

const dentes = [
  18,17,16,15,14,13,12,11,
  21,22,23,24,25,26,27,28,29,
  19,
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38,39,
  49
];

// ================= ABA =================

window.mostrarAba = (aba) => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// ================= PACIENTES =================

window.salvarPaciente = async () => {
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

// ================= ODONTOGRAMA =================

function criarOdontograma() {
  const el = document.getElementById("odontograma");
  if (!el) return;

  el.innerHTML = "";

  dentes.forEach(d => {
    const div = document.createElement("div");
    div.className = "dente";
    div.innerText = d;

    div.onclick = () => {
      document.getElementById("denteSelecionado").value = d;
    };

    el.appendChild(div);
  });
}

// ================= ORÇAMENTO =================

window.adicionarItemOrcamento = () => {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = Number(document.getElementById("valorOrcamento").value);

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

window.remover = (i) => {
  itens.splice(i, 1);
  atualizar();
};

// ================= SALVAR =================

window.salvarOrcamento = async () => {
  const paciente = document.getElementById("pacienteOrcamento").value;

  if (!paciente) return alert("Selecione paciente");

  const total = itens.reduce((a,b)=>a+b.valor,0);

  await addDoc(collection(db,"orcamentos"), {
    paciente,
    itens,
    total,
    data: new Date().toLocaleDateString()
  });

  itens = [];
  atualizar();
  listarOrcamentos();
};

// ================= HISTÓRICO =================

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db,"orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    lista.innerHTML += `
      <li>
        ${data.paciente} - R$ ${data.total.toFixed(2)}
        <button onclick='gerarPDF(${JSON.stringify(data)})'>PDF</button>
      </li>
    `;
  });
}

// ================= PDF FINAL LIMPO =================

window.gerarPDF = function (data) {

  const wrapper = document.createElement("div");

  let itensHTML = "";

  data.itens.forEach(i => {
    itensHTML += `
      <tr>
        <td>${i.dente}</td>
        <td>${i.proc}</td>
        <td>R$ ${i.valor.toFixed(2)}</td>
      </tr>
    `;
  });

  wrapper.innerHTML = `
    <div id="pdfArea" style="width:800px;padding:30px;font-family:Arial;background:white;">

      <h2>Orçamento Odontológico</h2>

      <p><b>Paciente:</b> ${data.paciente}</p>
      <p><b>Data:</b> ${data.data}</p>

      <table border="1" width="100%" cellspacing="0">
        <tr>
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <h3>Total: R$ ${data.total.toFixed(2)}</h3>

    </div>
  `;

  document.body.appendChild(wrapper);

  const element = document.getElementById("pdfArea");

  html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  }).then(canvas => {

    const img = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p", "mm", "a4");

    const width = 210;
    const height = (canvas.height * width) / canvas.width;

    pdf.addImage(img, "PNG", 0, 0, width, height);
    pdf.save(`orcamento-${data.paciente}.pdf`);

    document.body.removeChild(wrapper);
  });
};

// ================= INIT =================

window.onload = () => {
  criarOdontograma();
  listarPacientes();
  listarOrcamentos();
};
