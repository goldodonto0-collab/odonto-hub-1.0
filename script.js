async function carregarCalendario() {
  const lista = document.getElementById("listaCalendario");
  if (!lista) return;

  lista.innerHTML = "";

  const querySnapshot = await getDocs(collection(db, "atendimentos"));
  let retornos = [];

  querySnapshot.forEach((docItem) => {
    const data = docItem.data();

    if (data.proximo && data.proximo.trim() !== "") {
      retornos.push({
        nome: data.nome,
        feito: data.feito,
        proximo: data.proximo
      });
    }
  });

  retornos.sort((a, b) => a.proximo.localeCompare(b.proximo));

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
window.carregarCalendario = carregarCalendario;
