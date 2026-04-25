import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs
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

const LOGO_URL = "https://i.imgur.com/2Bvio9f.jpeg";

let itens = [];

const dentes = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,29,19,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38,39,49];

// ABA
window.mostrarAba = (aba) => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// PACIENTE
window.salvarPaciente = async () => {
  const nome = document.getElementById("nomePaciente").value;
  if (!nome) return alert("Nome obrigatório");

  await addDoc(collection(db, "pacientes"), { nome });
  listarPacientes();
};

// LISTAR PACIENTES
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

// ODONTOGRAMA
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

// ORÇAMENTO
window.adicionarItemOrcamento = () => {
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
    lista.innerHTML += `<li>${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)} <button onclick="remover(${index})">X</button></li>`;
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

window.remover = (i) => {
  itens.splice(i, 1);
  atualizar();
};

// SALVAR
window.salvarOrcamento = async () => {
  const paciente = document.getElementById("pacienteOrcamento").value;
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

// HISTÓRICO
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

// PDF (MANTIDO SIMPLES E FUNCIONAL)
window.gerarPDF = function (data) {

  let itensHTML = "";

  data.itens.forEach(i => {
    itensHTML += `<tr><td>${i.dente}</td><td>${i.proc}</td><td>R$ ${i.valor}</td></tr>`;
  });

  const el = document.createElement("div");

  el.innerHTML = `
    <div style="font-family:Arial; width:210mm; padding:20px;">
      <img src="${LOGO_URL}" style="width:140px;">
      <h2>${data.paciente}</h2>
      <table>
        ${itensHTML}
      </table>
      <h3>Total: R$ ${data.total}</h3>
    </div>
  `;

  document.body.appendChild(el);

  html2pdf().from(el).save().then(() => {
    document.body.removeChild(el);
  });
};

// INIT
window.onload = () => {
  criarOdontograma();
  listarPacientes();
  listarOrcamentos();
};
