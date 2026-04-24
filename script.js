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
  appId: "1:159249022645:web:08b5fe64f2f0db4c9708fc",
  measurementId: "G-B56CBCXFTS"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function salvar() {
  const nome = document.getElementById("nome").value;
  const feito = document.getElementById("feito").value;
  const proximo = document.getElementById("proximo").value;

  if (!nome.trim()) {
    alert("Digite o nome!");
    return;
  }

  await addDoc(collection(db, "pacientes"), {
    nome: nome,
    feito: feito,
    proximo: proximo,
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

  const querySnapshot = await getDocs(collection(db, "pacientes"));

  const pacientes = {};

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();
    const id = docItem.id;

    if (!pacientes[data.nome]) {
      pacientes[data.nome] = [];
    }

    pacientes[data.nome].push({
      ...data,
      id: id
    });
  });

  for (let nome in pacientes) {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${nome}</strong>`;

    const subLista = document.createElement("ul");

    pacientes[nome].forEach((item) => {
      const subLi = document.createElement("li");

      subLi.innerHTML = `
        ${item.feito} | ${item.proximo} | ${item.data || ""}
        <button onclick="excluir('${item.id}')">Excluir</button>
      `;

      subLista.appendChild(subLi);
    });

    li.appendChild(subLista);
    lista.appendChild(li);
  }
}

async function excluir(id) {
  await deleteDoc(doc(db, "pacientes", id));
  listar();
}

window.salvar = salvar;
window.excluir = excluir;

listar();
function filtrar() {
  const busca = document.getElementById("busca").value.toLowerCase();
  const lista = document.getElementById("lista");
  const pacientes = lista.getElementsByTagName("li");

  for (let i = 0; i < pacientes.length; i++) {
    const nome = pacientes[i].innerText.toLowerCase();

    if (nome.includes(busca)) {
      pacientes[i].style.display = "";
    } else {
      pacientes[i].style.display = "none";
    }
  }
}

window.filtrar = filtrar;
