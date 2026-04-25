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

let itens = [];
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

// ================= PACIENTE =================

window.salvarPaciente = async () => {

  const paciente = {
    nome: document.getElementById("nomePaciente").value,
    telefone: document.getElementById("telefonePaciente").value,
    cpf: document.getElementById("cpfPaciente").value,
    rg: document.getElementById("rgPaciente").value,
    nascimento: document.getElementById("nascimentoPaciente").value,
    endereco: document.getElementById("enderecoPaciente").value,
    observacoes: document.getElementById("observacoesPaciente").value
  };

  if (!paciente.nome) return alert("Nome obrigatório");

  if (editandoPacienteId) {
    await updateDoc(doc(db, "pacientes", editandoPacienteId), paciente);
    editandoPacienteId = null;
  } else {
    await addDoc(collection(db, "pacientes"), paciente);
  }

  limparCamposPaciente();
  listarPacientes();
};

function limparCamposPaciente() {
  document.getElementById("nomePaciente").value = "";
  document.getElementById("telefonePaciente").value = "";
  document.getElementById("cpfPaciente").value = "";
  document.getElementById("rgPaciente").value = "";
  document.getElementById("nascimentoPaciente").value = "";
  document.getElementById("enderecoPaciente").value = "";
  document.getElementById("observacoesPaciente").value = "";
}

// ================= LISTAR PACIENTES =================

async function listarPacientes() {

  const lista = document.getElementById("listaPacientes");
  const select = document.getElementById("nome");
  const selectOrc = document.getElementById("pacienteOrcamento");

  lista.innerHTML = "";
  select.innerHTML = `<option value="">Selecione</option>`;
  selectOrc.innerHTML = `<option value="">Selecione</option>`;

  const snap = await getDocs(collection(db, "pacientes"));

  snap.forEach(d => {
    const data = d.data();

    lista.innerHTML += `
      <li>
        <strong>${data.nome}</strong><br>

        <button onclick="editarPaciente('${d.id}', '${data.nome}', '${data.telefone || ''}', '${data.cpf || ''}', '${data.rg || ''}', '${data.nascimento || ''}', '${data.endereco || ''}', '${data.observacoes || ''}')">Editar</button>

        <button onclick="excluirPaciente('${d.id}')">Excluir</button>

        <button onclick="imprimirPaciente('${data.nome}', '${data.telefone || ''}', '${data.cpf || ''}', '${data.endereco || ''}', '${data.observacoes || ''}')">Imprimir</button>
      </li>
    `;

    select.innerHTML += `<option value="${data.nome}">${data.nome}</option>`;
    selectOrc.innerHTML += `<option value="${data.nome}">${data.nome}</option>`;
  });
}

// ================= EDITAR =================

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

// ================= EXCLUIR =================

window.excluirPaciente = async (id) => {
  if (!confirm("Excluir paciente?")) return;

  await deleteDoc(doc(db, "pacientes", id));
  listarPacientes();
};

// ================= IMPRIMIR =================

window.imprimirPaciente = (nome, tel, cpf, end, obs) => {

  const win = window.open("", "_blank");

  win.document.write(`
    <html>
    <head>
      <title>Ficha do Paciente</title>
      <style>
        body { font-family: Arial; padding: 30px; }
        .box { border: 1px solid #ddd; padding: 20px; border-radius: 10px; }
        h2 { color: #2563eb; }
      </style>
    </head>
    <body>

      <div class="box">
        <h2>Ficha do Paciente</h2>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>Telefone:</strong> ${tel}</p>
        <p><strong>CPF:</strong> ${cpf}</p>
        <p><strong>Endereço:</strong> ${end}</p>
        <p><strong>Observações:</strong> ${obs}</p>
      </div>

      <script>window.print()</script>

    </body>
    </html>
  `);

  win.document.close();
};

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

// ================= ORÇAMENTO =================

window.adicionarItemOrcamento = () => {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = Number(document.getElementById("valorOrcamento").value);

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

    lista.innerHTML += `
      <li>
        ${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)}
        <button onclick="remover(${index})">X</button>
      </li>
    `;
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

window.remover = (i) => {
  itens.splice(i, 1);
  atualizar();
};

// ================= SALVAR ORÇAMENTO =================

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

// ================= HISTÓRICO =================

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

// ================= PDF =================

window.gerarPDF = function (data) {

  const wrapper = document.createElement("div");

  let itensHTML = "";

  data.itens.forEach(i => {
    itensHTML += `
      <tr>
        <td>${i.dente}</td>
        <td>${i.proc}</td>
        <td>R$ ${i.valor.toFixed(2)}</td>
      </tr>
    `;
  });

  wrapper.innerHTML = `
    <div style="width:800px;padding:30px;font-family:Arial;background:white;">

      <h2>Orçamento Odontológico</h2>

      <p><strong>Paciente:</strong> ${data.paciente}</p>
      <p><strong>Data:</strong> ${data.data}</p>

      <table border="1" width="100%">
        <tr>
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <h3>Total: R$ ${data.total.toFixed(2)}</h3>

    </div>
  `;

  document.body.appendChild(wrapper);

  html2canvas(wrapper).then(canvas => {

    const img = canvas.toDataURL("image/png");
    const pdf = new jspdf.jsPDF("p","mm","a4");

    const w = 210;
    const h = (canvas.height * w) / canvas.width;

    pdf.addImage(img,"PNG",0,0,w,h);
    pdf.save("orcamento.pdf");

    document.body.removeChild(wrapper);
  });
};

// ================= INIT =================

window.onload = () => {
  criarOdontograma();
  listarPacientes();
  listarOrcamentos();
};
