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

// ==================== PACIENTES ====================

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
    alert("Digite o nome do paciente!");
    return;
  }

  await addDoc(collection(db, "pacientes"), paciente);

  document.querySelectorAll("#pacientes input, #pacientes textarea").forEach(campo => {
    campo.value = "";
  });

  listarPacientes();
}

async function listarPacientes() {
  const lista = document.getElementById("listaPacientes");
  const selectPaciente = document.getElementById("nome");

  lista.innerHTML = "";
  pacientesMap = {};

  if (selectPaciente) {
    selectPaciente.innerHTML = `<option value="">Selecione o paciente</option>`;
  }

  const querySnapshot = await getDocs(collection(db, "pacientes"));

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    pacientesMap[data.nome] = id;

    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${data.nome}</strong><br>
      Telefone: ${data.telefone || ""}<br>
      CPF: ${data.cpf || ""}<br>
      Saúde: ${data.saude || "Nenhuma"}<br><br>

      <button onclick="verFicha('${id}')">Ficha</button>
      <button onclick="editarPaciente('${id}')">Editar</button>
      <button onclick="excluirPaciente('${id}')">Excluir</button>
    `;
    lista.appendChild(li);

    if (selectPaciente) {
      const option = document.createElement("option");
      option.value = data.nome;
      option.textContent = data.nome;
      selectPaciente.appendChild(option);
    }
  });
}

async function editarPaciente(id) {
  const nome = prompt("Nome:");
  if (!nome) return;

  await updateDoc(doc(db, "pacientes", id), {
    nome,
    telefone: prompt("Telefone:"),
    cpf: prompt("CPF:"),
    rg: prompt("RG:"),
    nascimento: prompt("Data de nascimento:"),
    endereco: prompt("Endereço:"),
    saude: prompt("Problema de saúde:"),
    observacoes: prompt("Observações:")
  });

  listarPacientes();
}

async function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;
  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
}

// ==================== FICHA ====================

async function verFicha(idPaciente) {
  const pacientesSnapshot = await getDocs(collection(db, "pacientes"));
  const atendimentosSnapshot = await getDocs(collection(db, "atendimentos"));

  let paciente = null;
  let historico = [];

  pacientesSnapshot.forEach((docItem) => {
    if (docItem.id === idPaciente) {
      paciente = docItem.data();
    }
  });

  atendimentosSnapshot.forEach((docItem) => {
    const item = docItem.data();
    if (item.pacienteId === idPaciente) {
      historico.push(item);
    }
  });

  let html = `
    <div id="fichaPdf">
      <h2>Ficha do Paciente</h2>
      <p><strong>Nome:</strong> ${paciente.nome || ""}</p>
      <p><strong>Telefone:</strong> ${paciente.telefone || ""}</p>
      <p><strong>CPF:</strong> ${paciente.cpf || ""}</p>
      <p><strong>RG:</strong> ${paciente.rg || ""}</p>
      <p><strong>Nascimento:</strong> ${paciente.nascimento || ""}</p>
      <p><strong>Endereço:</strong> ${paciente.endereco || ""}</p>
      <p><strong>Saúde:</strong> ${paciente.saude || ""}</p>
      <p><strong>Observações:</strong> ${paciente.observacoes || ""}</p>

      <h3>Histórico de atendimentos</h3>
  `;

  if (historico.length === 0) {
    html += `<p>Nenhum atendimento registrado.</p>`;
  }

  historico.forEach((item) => {
    html += `
      <p><strong>Data:</strong> ${item.data}</p>
      <p><strong>Procedimento:</strong> ${item.feito}</p>
      <p><strong>Próximo retorno:</strong> ${item.proximo}</p>
      <hr>
    `;
  });

  html += `
      </div>
      <button onclick="gerarPDF()">Gerar PDF</button>
  `;

  document.getElementById("conteudoFicha").innerHTML = html;
  document.getElementById("modalFicha").style.display = "flex";
}

function gerarPDF() {
  const elemento = document.getElementById("fichaPdf");

  html2pdf().from(elemento).save("ficha-paciente.pdf");
}

function fecharFicha() {
  document.getElementById("modalFicha").style.display = "none";
}

// ==================== ATENDIMENTOS ====================

async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  const pacienteId = pacientesMap[nome];

  if (!pacienteId) {
    alert("Paciente não selecionado!");
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

async function listar() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));
  const pacientes = {};

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    if (!pacientes[data.nome]) pacientes[data.nome] = [];
    pacientes[data.nome].push({ ...data, id });
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

async function excluir(id) {
  await deleteDoc(doc(db, "atendimentos", id));
  listar();
}

// ==================== ALERTAS ====================

function verificarAlertas(pacientes) {
  const listaAlertas = document.getElementById("alertas");
  listaAlertas.innerHTML = "";

  for (let nome in pacientes) {
    pacientes[nome].forEach((item) => {
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

// ==================== BUSCA ====================

function filtrar() {
  const busca = document.getElementById("busca").value.toLowerCase();

  document.querySelectorAll("#lista > li").forEach((li) => {
    li.style.display = li.innerText.toLowerCase().includes(busca) ? "" : "none";
  });
}

// ==================== CALENDÁRIO ====================

async function carregarCalendario() {
  const lista = document.getElementById("listaCalendario");
  if (!lista) return;

  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));
  let retornos = [];

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();

    if (data.proximo && data.proximo.trim() !== "") {
      const partes = data.proximo.split("/");
      let dataObj = null;

      if (partes.length === 3) {
        dataObj = new Date(partes[2], partes[1] - 1, partes[0]);
      }

      retornos.push({
        nome: data.nome,
        feito: data.feito,
        proximo: data.proximo,
        dataObj
      });
    }
  });

  retornos.sort((a, b) => a.dataObj - b.dataObj);

  retornos.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `
      <strong>${item.nome}</strong><br>
      Procedimento: ${item.feito}<br>
      Retorno: ${item.proximo}
    `;
    lista.appendChild(li);
  });
}

// ==================== ABAS ====================

function mostrarAba(aba) {
  document.getElementById("pacientes").style.display = "none";
  document.getElementById("atendimentos").style.display = "none";
  document.getElementById("calendario").style.display = "none";

  document.getElementById(aba).style.display = "block";

  if (aba === "calendario") {
    carregarCalendario();
  }
}

// ==================== GLOBAL ====================

window.salvarPaciente = salvarPaciente;
window.salvar = salvar;
window.excluir = excluir;
window.filtrar = filtrar;
window.editarPaciente = editarPaciente;
window.excluirPaciente = excluirPaciente;
window.verFicha = verFicha;
window.fecharFicha = fecharFicha;
window.gerarPDF = gerarPDF;
window.carregarCalendario = carregarCalendario;
window.mostrarAba = mostrarAba;

listarPacientes();
listar();
