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

let pacientesMap = {};

// SALVAR PACIENTE
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

  if (!paciente.nome.trim()) {
    alert("Digite o nome!");
    return;
  }

  await addDoc(collection(db, "pacientes"), paciente);

  document.querySelectorAll("#pacientes input, #pacientes textarea").forEach(campo => {
    campo.value = "";
  });

  listarPacientes();
}

// LISTAR PACIENTES
async function listarPacientes() {
  const lista = document.getElementById("listaPacientes");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "pacientes"));
  pacientesMap = {};

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    pacientesMap[data.nome] = id;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.nome}</strong><br>
      Telefone: ${data.telefone || ""}<br>
      CPF: ${data.cpf || ""}<br>
      Saúde: ${data.saude || "Nenhuma"}<br>
      <button onclick="editarPaciente('${id}')">Editar</button>
      <button onclick="excluirPaciente('${id}')">Excluir</button>
    `;
    lista.appendChild(li);
  });
}

// EDITAR PACIENTE
async function editarPaciente(id) {
  const nome = prompt("Nome:");
  if (!nome) return;

  await updateDoc(doc(db, "pacientes", id), {
    nome,
    telefone: prompt("Telefone:"),
    cpf: prompt("CPF:"),
    rg: prompt("RG:"),
    nascimento: prompt("Data nascimento:"),
    endereco: prompt("Endereço:"),
    saude: prompt("Problema de saúde:"),
    observacoes: prompt("Observações:")
  });

  listarPacientes();
}

// EXCLUIR PACIENTE
async function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;
  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
}

// SALVAR ATENDIMENTO
async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  const pacienteId = pacientesMap[nome];
  if (!pacienteId) {
    alert("Paciente não cadastrado!");
    return;
  }

  await addDoc(collection(db, "atendimentos"), {
    pacienteId,
    nome,
    feito,
    proximo,
    data: new Date().toLocaleDateString()
  });

  document.getElementById("nome").value = "";
  document.getElementById("feito").value = "";
  document.getElementById("proximo").value = "";

  listar();
}

// LISTAR ATENDIMENTOS
async function listar() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));
  const pacientes = {};

  querySnapshot.forEach(docItem => {
    const data = docItem.data();
    const id = docItem.id;

    if (!pacientes[data.nome]) pacientes[data.nome] = [];
    pacientes[data.nome].push({ ...data, id });
  });

  for (let nome in pacientes) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${nome}</strong>`;

    const subLista = document.createElement("ul");

    pacientes[nome].forEach(item => {
      const subLi = document.createElement("li");
      subLi.innerHTML = `
        ${item.feito} | ${item.proximo} | ${item.data}
        <button onclick="excluir('${item.id}')">Excluir</button>
      `;
      subLista.appendChild(subLi);
    });

    li.appendChild(subLista);
    lista.appendChild(li);
  }

  verificarAlertas(pacientes);
}

// EXCLUIR ATENDIMENTO
async function excluir(id) {
  await deleteDoc(doc(db, "atendimentos", id));
  listar();
}

// ALERTAS
function verificarAlertas(pacientes) {
  const listaAlertas = document.getElementById("alertas");
  listaAlertas.innerHTML = "";

  for (let nome in pacientes) {
    pacientes[nome].forEach(item => {
      const texto = (item.proximo || "").toLowerCase();

      if (texto.includes("retorno") || texto.includes("hoje") || texto.includes("amanhã")) {
        const li = document.createElement("li");
        li.classList.add("alerta");
        li.textContent = `${nome} - ${item.proximo}`;
        listaAlertas.appendChild(li);
      }
    });
  }
}

// BUSCA
function filtrar() {
  const busca = document.getElementById("busca").value.toLowerCase();
  document.querySelectorAll("#lista > li").forEach(li => {
    li.style.display = li.innerText.toLowerCase().includes(busca) ? "" : "none";
  });
}

// ABAS
function mostrarAba(aba) {
  document.getElementById("pacientes").style.display = "none";
  document.getElementById("atendimentos").style.display = "none";
  document.getElementById(aba).style.display = "block";
}

window.salvarPaciente = salvarPaciente;
window.salvar = salvar;
window.excluir = excluir;
window.filtrar = filtrar;
window.editarPaciente = editarPaciente;
window.excluirPaciente = excluirPaciente;
window.mostrarAba = mostrarAba;

listarPacientes();
listar();
