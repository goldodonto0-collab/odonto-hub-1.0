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

let pacientesMap = {}; // 🔥 guardar ids

// 👤 SALVAR PACIENTE
async function salvarPaciente() {
  const nome = document.getElementById("nomePaciente").value;
  const telefone = document.getElementById("telefonePaciente").value;

  if (!nome.trim()) {
    alert("Digite o nome!");
    return;
  }

  await addDoc(collection(db, "pacientes"), {
    nome,
    telefone
  });

  document.getElementById("nomePaciente").value = "";
  document.getElementById("telefonePaciente").value = "";

  listarPacientes();
}

// 📋 LISTAR PACIENTES
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
    li.textContent = `${data.nome} - ${data.telefone || ""}`;
    lista.appendChild(li);
  });
}

// 📝 SALVAR ATENDIMENTO (AGORA CORRETO)
async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  if (!nome.trim()) {
    alert("Digite o nome!");
    return;
  }

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

// 📄 LISTAR ATENDIMENTOS
async function listar() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));

  const pacientes = {};

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    if (!pacientes[data.nome]) {
      pacientes[data.nome] = [];
    }

    pacientes[data.nome].push({
      ...data,
      id
    });
  });

  for (let nome in pacientes) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${nome}</strong>`;

    const subLista = document.createElement("ul");

    pacientes[nome].forEach((item) => {
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

// ❌ EXCLUIR
async function excluir(id) {
  await deleteDoc(doc(db, "atendimentos", id));
  listar();
}

// 🔔 ALERTA
function verificarAlertas(pacientes) {
  const listaAlertas = document.getElementById("alertas");
  if (!listaAlertas) return;

  listaAlertas.innerHTML = "";

  for (let nome in pacientes) {
    pacientes[nome].forEach((item) => {
      const texto = (item.proximo || "").toLowerCase();

      if (
        texto.includes("retorno") ||
        texto.includes("hoje") ||
        texto.includes("amanhã")
      ) {
        const li = document.createElement("li");
        li.classList.add("alerta");
        li.textContent = `${nome} - ${item.proximo}`;
        listaAlertas.appendChild(li);
      }
    });
  }
}

// 🔍 BUSCA
function filtrar() {
  const busca = document.getElementById("busca").value.toLowerCase();
  const lista = document.getElementById("lista");
  const pacientes = lista.getElementsByTagName("li");

  for (let i = 0; i < pacientes.length; i++) {
    const nome = pacientes[i].innerText.toLowerCase();
    pacientes[i].style.display = nome.includes(busca) ? "" : "none";
  }
}

window.salvarPaciente = salvarPaciente;
window.salvar = salvar;
window.excluir = excluir;
window.filtrar = filtrar;

listarPacientes();
listar();
