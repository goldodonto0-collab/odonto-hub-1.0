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

// ================= ATENDIMENTOS =================

async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  const pacienteId = pacientesMap[nome];
  if (!pacienteId) return alert("Selecione paciente");

  await addDoc(collection(db, "atendimentos"), {
    nome,
    feito,
    proximo,
    pacienteId,
    data: new Date().toLocaleDateString()
  });

  listar();
}

// ================= LISTA ATENDIMENTOS =================

async function listar() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "atendimentos"));

  snap.forEach(d => {
    const data = d.data();

    const li = document.createElement("li");
    li.innerHTML = `${data.nome} - ${data.feito} - ${data.proximo}`;
    lista.appendChild(li);
  });
}

// ================= CALENDÁRIO =================

async function carregarCalendario() {
  const lista = document.getElementById("listaCalendario");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "atendimentos"));

  snap.forEach(d => {
    const data = d.data();

    if (data.proximo) {
      const li = document.createElement("li");
      li.innerHTML = `${data.nome} - Retorno: ${data.proximo}`;
      lista.appendChild(li);
    }
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

async function listarOrcamentos() {
  const lista = document.getElementById("historicoOrcamentos");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db,"orcamentos"));

  snap.forEach(d => {
    const data = d.data();

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.paciente}</strong><br>
      ${data.data} - R$ ${data.total.toFixed(2)}
      <button onclick="editar('${d.id}')">Editar</button>
      <button onclick="excluirOrcamento('${d.id}')">Excluir</button>
    `;
    lista.appendChild(li);
  });
}

async function editar(id) {
  const snap = await getDocs(collection(db,"orcamentos"));

  snap.forEach(d => {
    if (d.id === id) {
      itens = d.data().itens;
      editandoId = id;
      atualizarOrcamento();
      mostrarAba("orcamentos");
    }
  });
}

async function excluirOrcamento(id) {
  await deleteDoc(doc(db,"orcamentos",id));
  listarOrcamentos();
}

// ================= ABAS =================

function mostrarAba(aba) {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";

  if (aba === "calendario") carregarCalendario();
  if (aba === "orcamentos") listarOrcamentos();
}

// ================= INIT (CORRIGIDO) =================

window.onload = async () => {
  window.salvarPaciente = salvarPaciente;
  window.salvar = salvar;
  window.mostrarAba = mostrarAba;
  window.adicionarItemOrcamento = adicionarItemOrcamento;
  window.removerItem = removerItem;
  window.salvarOrcamento = salvarOrcamento;
  window.editar = editar;
  window.excluirOrcamento = excluirOrcamento;

  criarOdontograma();
  await listarPacientes();
  await listar();
};
