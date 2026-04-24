import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs,
  deleteDoc,
  doc
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

// PACIENTES
async function salvarPaciente() {
  const paciente = {
    nome: nomePaciente.value,
    telefone: telefonePaciente.value,
    cpf: cpfPaciente.value,
    rg: rgPaciente.value,
    nascimento: nascimentoPaciente.value,
    endereco: enderecoPaciente.value,
    saude: saudePaciente.value,
    observacoes: observacoesPaciente.value
  };

  await addDoc(collection(db, "pacientes"), paciente);

  document.querySelectorAll("#pacientes input, #pacientes textarea").forEach(c => c.value = "");

  listarPacientes();
}

async function listarPacientes() {
  listaPacientes.innerHTML = "";
  nome.innerHTML = `<option value="">Selecione o paciente</option>`;
  pacientesMap = {};

  const dados = await getDocs(collection(db, "pacientes"));

  dados.forEach(docItem => {
    const data = docItem.data();
    const id = docItem.id;

    pacientesMap[data.nome] = id;

    listaPacientes.innerHTML += `
      <li>
        <strong>${data.nome}</strong><br>
        ${data.telefone || ""}
        <br><br>
        <button onclick="verFicha('${id}')">Ficha</button>
        <button onclick="excluirPaciente('${id}')">Excluir</button>
      </li>
    `;

    nome.innerHTML += `<option value="${data.nome}">${data.nome}</option>`;
  });
}

async function excluirPaciente(id) {
  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
}

// FICHA
async function verFicha(idPaciente) {
  const pacientes = await getDocs(collection(db, "pacientes"));
  const atendimentos = await getDocs(collection(db, "atendimentos"));

  let paciente = null;
  let historico = "";

  pacientes.forEach(p => {
    if (p.id === idPaciente) paciente = p.data();
  });

  atendimentos.forEach(a => {
    const item = a.data();
    if (item.pacienteId === idPaciente) {
      historico += `
        <p><strong>Data:</strong> ${item.data}</p>
        <p><strong>Procedimento:</strong> ${item.feito}</p>
        <p><strong>Retorno:</strong> ${item.proximo}</p>
        <hr>
      `;
    }
  });

  conteudoFicha.innerHTML = `
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

      <h3>Histórico</h3>
      ${historico}
    </div>

    <button onclick="gerarPDF()">Gerar PDF</button>
  `;

  modalFicha.style.display = "flex";
}

function gerarPDF() {
  const elemento = document.getElementById("fichaPdf");

  html2pdf().from(elemento).set({
    margin: 10,
    filename: "ficha-paciente.pdf",
    html2canvas: { scale: 2 },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
  }).save();
}

function fecharFicha() {
  modalFicha.style.display = "none";
}

// ATENDIMENTOS
async function salvar() {
  const pacienteId = pacientesMap[nome.value];

  await addDoc(collection(db, "atendimentos"), {
    pacienteId,
    nome: nome.value,
    feito: feito.value,
    proximo: proximo.value,
    data: new Date().toLocaleDateString()
  });

  feito.value = "";
  proximo.value = "";

  listar();
}

async function listar() {
  lista.innerHTML = "";

  const dados = await getDocs(collection(db, "atendimentos"));

  dados.forEach(docItem => {
    const data = docItem.data();
    const id = docItem.id;

    lista.innerHTML += `
      <li>
        <strong>${data.nome}</strong><br>
        ${data.feito} - ${data.proximo} - ${data.data}
        <button onclick="excluir('${id}')">Excluir</button>
      </li>
    `;
  });
}

async function excluir(id) {
  await deleteDoc(doc(db, "atendimentos", id));
  listar();
}

// BUSCA
function filtrar() {
  const termo = busca.value.toLowerCase();

  document.querySelectorAll("#lista li").forEach(li => {
    li.style.display = li.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
}

// CALENDÁRIO
async function carregarCalendario() {
  listaCalendario.innerHTML = "";

  const dados = await getDocs(collection(db, "atendimentos"));

  dados.forEach(docItem => {
    const data = docItem.data();

    if (data.proximo) {
      listaCalendario.innerHTML += `
        <li>
          <strong>${data.nome}</strong><br>
          ${data.feito}<br>
          Retorno: ${data.proximo}
        </li>
      `;
    }
  });
}

// ABAS
function mostrarAba(aba) {
  pacientes.style.display = "none";
  atendimentos.style.display = "none";
  calendario.style.display = "none";

  document.getElementById(aba).style.display = "block";

  if (aba === "calendario") carregarCalendario();
}

window.salvarPaciente = salvarPaciente;
window.salvar = salvar;
window.excluir = excluir;
window.filtrar = filtrar;
window.excluirPaciente = excluirPaciente;
window.verFicha = verFicha;
window.fecharFicha = fecharFicha;
window.gerarPDF = gerarPDF;
window.mostrarAba = mostrarAba;

listarPacientes();
listar();
