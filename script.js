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

  if (!paciente.nome.trim()) {
    alert("Digite o nome do paciente.");
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
  const select = document.getElementById("nome");

  lista.innerHTML = "";
  pacientesMap = {};

  if (select) {
    select.innerHTML = `<option value="">Selecione o paciente</option>`;
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
      CPF: ${data.cpf || ""}<br><br>

      <button onclick="verFicha('${id}')">Ficha</button>
      <button onclick="editarPaciente('${id}')">Editar</button>
      <button onclick="excluirPaciente('${id}')">Excluir</button>
    `;

    lista.appendChild(li);

    if (select) {
      const option = document.createElement("option");
      option.value = data.nome;
      option.textContent = data.nome;
      select.appendChild(option);
    }
  });
}

async function editarPaciente(id) {
  const novoNome = prompt("Novo nome:");
  if (!novoNome) return;

  await updateDoc(doc(db, "pacientes", id), {
    nome: novoNome
  });

  listarPacientes();
}

async function excluirPaciente(id) {
  if (!confirm("Deseja excluir este paciente?")) return;

  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
}

// ================= FICHA =================

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

      <h3>Histórico de Atendimentos</h3>
  `;

  historico.forEach((item) => {
    html += `
      <p><strong>Data:</strong> ${item.data}</p>
      <p><strong>Procedimento:</strong> ${item.feito}</p>
      <p><strong>Retorno:</strong> ${item.proximo}</p>
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
  const fichaOriginal = document.getElementById("fichaPdf");

  if (!fichaOriginal) {
    alert("Nenhuma ficha encontrada.");
    return;
  }

  const copia = fichaOriginal.cloneNode(true);

  copia.style.position = "absolute";
  copia.style.left = "-9999px";
  copia.style.top = "0";
  copia.style.display = "block";
  copia.style.background = "#fff";
  copia.style.padding = "20px";
  copia.style.width = "800px";

  document.body.appendChild(copia);

  const opcoes = {
    margin: 10,
    filename: "ficha-paciente.pdf",
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: {
      unit: "mm",
      format: "a4",
      orientation: "portrait"
    }
  };

  html2pdf().set(opcoes).from(copia).save().then(() => {
    document.body.removeChild(copia);
  });
}

function fecharFicha() {
  document.getElementById("modalFicha").style.display = "none";
}

// ================= ATENDIMENTOS =================

async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  const pacienteId = pacientesMap[nome];

  if (!pacienteId) {
    alert("Selecione um paciente.");
    return;
  }

  await addDoc(collection(db, "atendimentos"), {
    pacienteId,
    nome,
    feito,
    proximo,
    data: new Date().toLocaleDateString()
  });

  document.getElementById("feito").value = "";
  document.getElementById("proximo").value = "";

  listar();
}

async function listar() {
  const lista = document.getElementById("lista");
  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));
  const agrupado = {};

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    if (!agrupado[data.nome]) {
      agrupado[data.nome] = [];
    }

    agrupado[data.nome].push({ ...data, id });
  });

  for (let nome in agrupado) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${nome}</strong>`;

    const sub = document.createElement("ul");

    agrupado[nome].forEach((item) => {
      const subLi = document.createElement("li");
      subLi.innerHTML = `
        ${item.feito} | ${item.proximo} | ${item.data}
        <button onclick="excluir('${item.id}')">Excluir</button>
      `;
      sub.appendChild(subLi);
    });

    li.appendChild(sub);
    lista.appendChild(li);
  }
}

async function excluir(id) {
  await deleteDoc(doc(db, "atendimentos", id));
  listar();
}

// ================= BUSCA =================

function filtrar() {
  const termo = document.getElementById("busca").value.toLowerCase();

  document.querySelectorAll("#lista > li").forEach((item) => {
    item.style.display = item.innerText.toLowerCase().includes(termo) ? "" : "none";
  });
}

// ================= CALENDÁRIO =================

async function carregarCalendario() {
  const lista = document.getElementById("listaCalendario");
  if (!lista) return;

  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();

    if (data.proximo) {
      const li = document.createElement("li");
      li.innerHTML = `
        <strong>${data.nome}</strong><br>
        ${data.feito}<br>
        Retorno: ${data.proximo}
      `;
      lista.appendChild(li);
    }
  });
}

// ================= ABAS =================

function mostrarAba(aba) {
  document.getElementById("pacientes").style.display = "none";
  document.getElementById("atendimentos").style.display = "none";
  document.getElementById("calendario").style.display = "none";

  document.getElementById(aba).style.display = "block";

  if (aba === "calendario") {
    carregarCalendario();
  }
}

// ================= GLOBAL =================

window.salvarPaciente = salvarPaciente;
window.salvar = salvar;
window.excluir = excluir;
window.filtrar = filtrar;
window.editarPaciente = editarPaciente;
window.excluirPaciente = excluirPaciente;
window.verFicha = verFicha;
window.fecharFicha = fecharFicha;
window.gerarPDF = gerarPDF;
window.mostrarAba = mostrarAba;

listarPacientes();
listar();
