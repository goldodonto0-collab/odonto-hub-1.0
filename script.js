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

// ================= ESTADO =================

let editPaciente = null;
let editAtendimento = null;

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

  if (editPaciente) {
    await updateDoc(doc(db,"pacientes",editPaciente),data);
    editPaciente = null;
  } else {
    await addDoc(collection(db,"pacientes"),data);
  }

  listarPacientes();
};

// ================= LISTAR PACIENTES =================

async function listarPacientes() {

  const lista = document.getElementById("listaPacientes");
  const sel = document.getElementById("nome");
  const sel2 = document.getElementById("nomeAgenda");

  lista.innerHTML = "";
  sel.innerHTML = `<option value="">Selecione</option>`;
  sel2.innerHTML = `<option value="">Selecione</option>`;

  const snap = await getDocs(collection(db,"pacientes"));

  snap.forEach(d => {
    const p = d.data();

    lista.innerHTML += `
      <li>
        <strong>${p.nome}</strong><br>

        <button onclick="editarPaciente('${d.id}','${p.nome}')">Editar</button>
        <button onclick="excluirPaciente('${d.id}')">Excluir</button>
      </li>
    `;

    sel.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
    sel2.innerHTML += `<option value="${p.nome}">${p.nome}</option>`;
  });
}

// ================= EDITAR / EXCLUIR PACIENTE =================

window.editarPaciente = (id,nome) => {
  document.getElementById("nomePaciente").value = nome;
  editPaciente = id;
};

window.excluirPaciente = async (id) => {
  await deleteDoc(doc(db,"pacientes",id));
  listarPacientes();
};

// ================= ATENDIMENTOS =================

window.salvarAtendimento = async () => {

  const data = {
    paciente: document.getElementById("nome").value,
    feito: document.getElementById("feito").value,
    proximo: document.getElementById("proximo").value,
    data: new Date().toLocaleDateString()
  };

  if (editAtendimento) {
    await updateDoc(doc(db,"atendimentos",editAtendimento),data);
    editAtendimento = null;
  } else {
    await addDoc(collection(db,"atendimentos"),data);
  }

  listarAtendimentos();
};

// ================= LISTAR ATENDIMENTOS =================

async function listarAtendimentos() {

  const lista = document.getElementById("listaAtendimentos");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db,"atendimentos"));

  snap.forEach(d => {
    const a = d.data();

    const li = document.createElement("li");

    li.innerHTML = `
      <strong>${a.paciente}</strong><br>
      ${a.feito}<br>
      ${a.data}<br>

      <button class="edit">Editar</button>
      <button class="del">Excluir</button>
    `;

    li.querySelector(".edit").onclick = () => {
      document.getElementById("nome").value = a.paciente;
      document.getElementById("feito").value = a.feito;
      document.getElementById("proximo").value = a.proximo;
      editAtendimento = d.id;
    };

    li.querySelector(".del").onclick = async () => {
      await deleteDoc(doc(db,"atendimentos",d.id));
      listarAtendimentos();
    };

    lista.appendChild(li);
  });
}

// ================= CALENDÁRIO =================

window.salvarAgendamento = async () => {

  const data = {
    paciente: document.getElementById("nomeAgenda").value,
    data: document.getElementById("dataAgendamento").value,
    descricao: document.getElementById("descricaoAgendamento").value
  };

  await addDoc(collection(db,"agendamentos"),data);

  listarAgendamentos();
};

// ================= LISTAR CALENDÁRIO =================

async function listarAgendamentos() {

  const lista = document.getElementById("listaCalendario");
  lista.innerHTML = "";

  const snap = await getDocs(collection(db,"agendamentos"));

  snap.forEach(d => {
    const a = d.data();

    lista.innerHTML += `
      <li>
        <strong>${a.data}</strong><br>
        ${a.paciente}<br>
        ${a.descricao || ""}
      </li>
    `;
  });
}

// ================= INIT =================

window.onload = () => {
  listarPacientes();
  listarAtendimentos();
  listarAgendamentos();
};
