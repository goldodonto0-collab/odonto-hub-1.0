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

// ================= ORÇAMENTO =================

let itensOrcamento = [];
let editandoOrcamentoId = null;

const dentes = [
  18,17,16,15,14,13,12,11,
  21,22,23,24,25,26,27,28,
  48,47,46,45,44,43,42,41,
  31,32,33,34,35,36,37,38
];

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

function adicionarItemOrcamento() {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = parseFloat(document.getElementById("valorOrcamento").value);

  if (!dente || !proc || !valor) return alert("Preencha tudo");

  itensOrcamento.push({ dente, proc, valor });
  atualizarOrcamento();
}

function atualizarOrcamento() {
  const lista = document.getElementById("listaItensOrcamento");
  lista.innerHTML = "";

  let total = 0;

  itensOrcamento.forEach((i, index) => {
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
  itensOrcamento.splice(i, 1);
  atualizarOrcamento();
}

async function salvarOrcamento() {
  const total = itensOrcamento.reduce((a,b) => a + b.valor, 0);

  const dados = {
    data: new Date().toLocaleDateString(),
    itens: itensOrcamento,
    total
  };

  if (editandoOrcamentoId) {
    await updateDoc(doc(db,"orcamentos",editandoOrcamentoId),dados);
    editandoOrcamentoId = null;
  } else {
    await addDoc(collection(db,"orcamentos"),dados);
  }

  itensOrcamento = [];
  atualizarOrcamento();
  listarOrcamentos();
}

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  if (!lista) return;

  lista.innerHTML = "";

  const snap = await getDocs(collection(db,"orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    const li = document.createElement("li");
    li.innerHTML = `
      ${data.data} - R$ ${data.total.toFixed(2)}
      <button onclick="editarOrcamento('${d.id}')">Editar</button>
      <button onclick="excluirOrcamento('${d.id}')">Excluir</button>
    `;

    lista.appendChild(li);
  });
}

async function editarOrcamento(id) {
  const snap = await getDocs(collection(db,"orcamentos"));

  snap.forEach(d => {
    if (d.id === id) {
      itensOrcamento = d.data().itens;
      editandoOrcamentoId = id;
      atualizarOrcamento();
      mostrarAba("orcamentos");
    }
  });
}

async function excluirOrcamento(id) {
  await deleteDoc(doc(db,"orcamentos",id));
  listarOrcamentos();
}

// ================= ABA =================

function mostrarAba(aba) {
  document.querySelectorAll(".aba").forEach(a => a.style.display="none");
  document.getElementById(aba).style.display="block";

  if (aba === "orcamentos") listarOrcamentos();
}

// ================= INIT =================

window.adicionarItemOrcamento = adicionarItemOrcamento;
window.removerItem = removerItem;
window.salvarOrcamento = salvarOrcamento;
window.editarOrcamento = editarOrcamento;
window.excluirOrcamento = excluirOrcamento;
window.mostrarAba = mostrarAba;

criarOdontograma();
listarOrcamentos();
