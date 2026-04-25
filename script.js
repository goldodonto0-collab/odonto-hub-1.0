import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import {
  getFirestore,
  addDoc,
  collection,
  getDocs
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

const LOGO_URL = "https://i.imgur.com/2Bvio9f.jpeg";

let itens = [];

const dentes = [18,17,16,15,14,13,12,11,21,22,23,24,25,26,27,28,29,19,48,47,46,45,44,43,42,41,31,32,33,34,35,36,37,38,39,49];

// ABA
window.mostrarAba = (aba) => {
  document.querySelectorAll(".aba").forEach(a => a.style.display = "none");
  document.getElementById(aba).style.display = "block";
};

// PACIENTE
window.salvarPaciente = async () => {
  const nome = document.getElementById("nomePaciente").value;
  if (!nome) return alert("Nome obrigatório");

  await addDoc(collection(db, "pacientes"), { nome });
  listarPacientes();
};

// LISTAR PACIENTES
async function listarPacientes() {
  const lista = document.getElementById("listaPacientes");
  const select = document.getElementById("pacienteOrcamento");

  lista.innerHTML = "";
  select.innerHTML = "";

  const snap = await getDocs(collection(db, "pacientes"));

  snap.forEach(d => {
    const data = d.data();
    lista.innerHTML += `<li>${data.nome}</li>`;
    select.innerHTML += `<option>${data.nome}</option>`;
  });
}

// ODONTOGRAMA
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

// ORÇAMENTO
window.adicionarItemOrcamento = () => {
  const dente = document.getElementById("denteSelecionado").value;
  const proc = document.getElementById("procedimentoOrcamento").value;
  const valor = parseFloat(document.getElementById("valorOrcamento").value);

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
    lista.innerHTML += `<li>${i.dente} - ${i.proc} - R$ ${i.valor.toFixed(2)} <button onclick="remover(${index})">X</button></li>`;
  });

  document.getElementById("totalOrcamento").innerText = total.toFixed(2);
}

window.remover = (i) => {
  itens.splice(i, 1);
  atualizar();
};

// SALVAR
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

// HISTÓRICO
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

// PDF (MANTIDO SIMPLES E FUNCIONAL)
window.gerarPDF = async function (data) {

  const { jsPDF } = window.jspdf;

  const wrapper = document.createElement("div");

  let itensHTML = "";

  data.itens.forEach(i => {
    itensHTML += `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${i.dente}</td>
        <td style="padding:8px;border:1px solid #ddd;">${i.proc}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">
          R$ ${Number(i.valor).toFixed(2)}
        </td>
      </tr>
    `;
  });

  wrapper.innerHTML = `
    <div id="pdfArea" style="
      width: 800px;
      padding: 30px;
      font-family: Arial;
      background: white;
    ">

      <div style="display:flex;justify-content:space-between;border-bottom:2px solid #0b5ed7;padding-bottom:10px;">
        <img src="https://i.imgur.com/2Bvio9f.jpeg" width="140">
        <div style="text-align:right;">
          <h2 style="margin:0;color:#0b5ed7;">Clínica Odontológica</h2>
          <small>Orçamento Profissional</small>
        </div>
      </div>

      <p><b>Paciente:</b> ${data.paciente}</p>
      <p><b>Data:</b> ${data.data}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:15px;">
        <tr style="background:#0b5ed7;color:white;">
          <th>Dente</th>
          <th>Procedimento</th>
          <th>Valor</th>
        </tr>
        ${itensHTML}
      </table>

      <h3 style="text-align:right;color:#0b5ed7;margin-top:20px;">
        Total: R$ ${data.total.toFixed(2)}
      </h3>

    </div>
  `;

  document.body.appendChild(wrapper);

  const element = document.getElementById("pdfArea");

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff"
  });

  const imgData = canvas.toDataURL("image/png");

  const pdf = new jsPDF("p", "mm", "a4");

  const imgWidth = 210;
  const imgHeight = (canvas.height * imgWidth) / canvas.width;

  pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
  pdf.save(`orcamento-${data.paciente}.pdf`);

  document.body.removeChild(wrapper);
};
  wrapper.innerHTML = `
    <div style="
      font-family: Arial;
      width: 210mm;
      padding: 20px;
      background: white;
      color: #2d3748;
    ">

      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        border-bottom:2px solid #0b5ed7;
        padding-bottom:10px;
        margin-bottom:20px;
      ">
        <img src="https://i.imgur.com/2Bvio9f.jpeg" crossorigin="anonymous" style="width:140px;">
        <div style="text-align:right;">
          <h2 style="margin:0; color:#0b5ed7;">Clínica Odontológica</h2>
          <p style="margin:0;">Orçamento Profissional</p>
        </div>
      </div>

      <p><strong>Paciente:</strong> ${data.paciente}</p>
      <p><strong>Data:</strong> ${data.data}</p>

      <table style="width:100%; border-collapse:collapse; margin-top:15px;">
        <thead>
          <tr style="background:#0b5ed7; color:white;">
            <th style="padding:10px;">Dente</th>
            <th style="padding:10px;">Procedimento</th>
            <th style="padding:10px;">Valor</th>
          </tr>
        </thead>
        <tbody>
          ${itensHTML}
        </tbody>
      </table>

      <h3 style="text-align:right; margin-top:20px; color:#0b5ed7;">
        Total: R$ ${data.total.toFixed(2)}
      </h3>

    </div>
  `;

  document.body.appendChild(wrapper);

  setTimeout(() => {
    html2pdf().set({
      margin: 0,
      filename: `orcamento-${data.paciente}.pdf`,
      image: { type: "jpeg", quality: 1 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        allowTaint: false,
        backgroundColor: "#ffffff"
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait"
      }
    }).from(wrapper).save().then(() => {
      document.body.removeChild(wrapper);
    });
  }, 300);
};
// INIT
window.onload = () => {
  criarOdontograma();
  listarPacientes();
  listarOrcamentos();
};
