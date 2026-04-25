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

// ================= VARIÁVEIS =================

let editandoAtendimentoId = null;
let editandoPacienteId = null;

// ================= DENTES =================

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

  const data = {
    nome: document.getElementById("nomePaciente").value,
    telefone: document.getElementById("telefonePaciente").value,
    cpf: document.getElementById("cpfPaciente").value,
    rg: document.getElementById("rgPaciente").value,
    nascimento: document.getElementById("nascimentoPaciente").value,
    endereco: document.getElementById("enderecoPaciente").value,
    observacoes: document.getElementById("observacoesPaciente").value
  };

  if (!data.nome) return alert("Nome obrigatório");

  if (editandoPacienteId) {
    await updateDoc(doc(db, "pacientes", editandoPacienteId), data);
    editandoPacienteId = null;
  } else {
    await addDoc(collection(db, "pacientes"), data);
  }

  limparPaciente();
  listarPacientes();
};

function limparPaciente() {
  document.querySelectorAll("#pacientes input, #pacientes textarea").forEach(e => e.value = "");
}

// ================= LISTAR PACIENTES =================

async function listarPacientes() {

  const lista = document.getElementById("listaPacientes");
  const selectAtend = document.getElementById("nome");
  const selectOrc = document.getElementById("pacienteOrcamento");

  lista.innerHTML = "";
  selectAtend.innerHTML = `<option value="">Selecione</option>`;
  selectOrc.innerHTML = `<option value="">Selecione</option>`;

  const snap = await getDocs(collection(db, "pacientes"));

  snap.forEach(d => {
    const p = d.data();

    lista.innerHTML += `
      <li>
        <strong>${p.nome}</strong><br>

        <button onclick="editarPaciente('${d.id}', '${p.nome}', '${p.telefone || ''}', '${p.cpf || ''}', '${p.rg || ''}', '${p.nascimento || ''}', '${p.endereco || ''}', '${p.observacoes || ''}')">Editar</button>

        <button onclick="excluirPaciente('${d.id}')">Excluir</button>
      </li>
    `;

    selectAtend.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
    selectOrc.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
  });
}

// ================= EDITAR PACIENTE =================

window.editarPaciente = (id, nome, tel, cpf, rg, nasc, end, obs) => {

  document.getElementById("nomePaciente").value = nome;
  document.getElementById("telefonePaciente").value = tel;
  document.getElementById("cpfPaciente").value = cpf;
  document.getElementById("rgPaciente").value = rg;
  document.getElementById("nascimentoPaciente").value = nasc;
  document.getElementById("enderecoPaciente").value = end;
  document.getElementById("observacoesPaciente").value = obs;

  editandoPacienteId = id;
};

// ================= EXCLUIR PACIENTE =================

window.excluirPaciente = async (id) => {
  if (!confirm("Deseja excluir este paciente?")) return;

  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
};

// ================= ATENDIMENTOS =================

window.salvar = async () => {

  const paciente = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  if (!paciente || !feito) return alert("Preencha os campos");

  const data = {
    paciente,
    feito,
    proximo,
    data: new Date().toLocaleDateString()
  };

  if (editandoAtendimentoId) {
    await updateDoc(doc(db, "atendimentos", editandoAtendimentoId), data);
    editandoAtendimentoId = null;
  } else {
    await addDoc(collection(db, "atendimentos"), data);
  }

  document.getElementById("feito").value = "";
  document.getElementById("proximo").value = "";

  listarAtendimentos();
};

// ================= LISTAR ATENDIMENTOS =================

async function listarAtendimentos() {

  const lista = document.getElementById("lista");
  if (!lista) return;

  lista.innerHTML = "";

  const snap = await getDocs(collection(db, "atendimentos"));

  snap.forEach(d => {
    const a = d.data();

    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${a.paciente}</strong><br>
      ${a.feito}<br>
      Retorno: ${a.proximo || "-"}<br>
      ${a.data}<br>

      <button class="edit">Editar</button>
      <button class="del">Excluir</button>
    `;

    li.querySelector(".edit").onclick = () => {
      document.getElementById("nome").value = a.paciente;
      document.getElementById("feito").value = a.feito;
      document.getElementById("proximo").value = a.proximo || "";
      editandoAtendimentoId = d.id;
    };

    li.querySelector(".del").onclick = async () => {
      if (!confirm("Excluir atendimento?")) return;
      await deleteDoc(doc(db, "atendimentos", d.id));
      listarAtendimentos();
    };

    lista.appendChild(li);
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

// ================= INIT =================

window.onload = () => {
  criarOdontograma();
  listarPacientes();
  listarAtendimentos();
};
