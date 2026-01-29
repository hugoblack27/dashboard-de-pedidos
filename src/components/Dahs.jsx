import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import "../css/Dash.css";

const TAXAS = {
  boticario: 15,
  natura: 30,
  eudora: 20,
};

export default function Dashboard() {
  const [cliente, setCliente] = useState("");
  const [pagamento, setPagamento] = useState("");
  const [produtos, setProdutos] = useState([
    { nome: "", valor: "", marca: "" },
  ]);
  const [pedidos, setPedidos] = useState([]);

  const [mostrarFiltro, setMostrarFiltro] = useState(false);
  const [filtroPagamento, setFiltroPagamento] = useState("");
  const [filtroMarca, setFiltroMarca] = useState("");

  /* ===== LOCALSTORAGE ===== */
  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("pedidos"));
    if (dados) setPedidos(dados);
  }, []);

  useEffect(() => {
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
  }, [pedidos]);

  /* ===== PRODUTOS ===== */
  function adicionarProduto() {
    setProdutos([...produtos, { nome: "", valor: "", marca: "" }]);
  }

  function atualizarProduto(index, campo, valor) {
    const copia = [...produtos];
    copia[index][campo] = valor;
    setProdutos(copia);
  }

  /* ===== TOTAL ===== */
  function calcularTotal(lista = produtos, forma = pagamento) {
    let total = 0;

    lista.forEach((p) => {
      let valor = Number(p.valor || 0);

      if (forma === "credito" && TAXAS[p.marca]) {
        valor += valor * (TAXAS[p.marca] / 100);
      }

      total += valor;
    });

    return total.toFixed(2);
  }

  /* ===== VALIDAÇÃO ===== */
  function validarFormulario() {
    if (!cliente.trim()) return alert("Digite o nome do cliente.");
    if (!pagamento) return alert("Escolha a forma de pagamento.");

    for (let p of produtos) {
      if (!p.nome.trim()) return alert("Digite o nome do produto.");
      if (!p.valor || Number(p.valor) <= 0)
        return alert("Digite um valor válido.");
      if (!p.marca) return alert("Selecione a marca.");
    }

    return true;
  }

  /* ===== SALVAR ===== */
  function salvarPedido(e) {
    e.preventDefault();
    if (!validarFormulario()) return;

    const novoPedido = {
      id: Date.now(),
      cliente,
      pagamento: pagamento.toLowerCase(),
      produtos: produtos.map((p) => ({
        nome: p.nome,
        valor: p.valor,
        marca: p.marca.toLowerCase(),
      })),
      total: calcularTotal(),
    };

    setPedidos([novoPedido, ...pedidos]);
    setCliente("");
    setPagamento("");
    setProdutos([{ nome: "", valor: "", marca: "" }]);
  }

  /* ===== IMPORTAR EXCEL ===== */
  function importarExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const agrupados = {};

      rows.forEach((row) => {
        const key = `${row.Cliente}-${row.Pagamento}`;

        if (!agrupados[key]) {
          agrupados[key] = {
            id: Date.now() + Math.random(),
            cliente: row.Cliente,
            pagamento: row.Pagamento?.toLowerCase(),
            produtos: [],
          };
        }

        agrupados[key].produtos.push({
          nome: row.Produto,
          marca: row.Marca?.toLowerCase(),
          valor: row.Valor,
        });
      });

      const final = Object.values(agrupados).map((p) => ({
        ...p,
        total: calcularTotal(p.produtos, p.pagamento),
      }));

      setPedidos((prev) => [...final, ...prev]);
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  /* ===== EXPORTAR ===== */
  function exportarExcel() {
    const linhas = [];

    pedidos.forEach((pedido) => {
      pedido.produtos.forEach((prod) => {
        linhas.push({
          Cliente: pedido.cliente,
          Pagamento: pedido.pagamento,
          Produto: prod.nome,
          Marca: prod.marca,
          Valor: prod.valor,
        });
      });
    });

    const ws = XLSX.utils.json_to_sheet(linhas);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pedidos");

    XLSX.writeFile(wb, "pedidos.xlsx");
  }

  /* ===== FILTRO ===== */
  const pedidosFiltrados = pedidos.filter(
    (p) =>
      (!filtroPagamento || p.pagamento === filtroPagamento) &&
      (!filtroMarca || p.produtos.some((x) => x.marca === filtroMarca))
  );

  return (
    <div className="dashboard">
      <h1>Dashboard de Pedidos</h1>

      {/* ===== NOVO PEDIDO ===== */}
      <div className="card">
        <h2>Novo Pedido</h2>

        <form onSubmit={salvarPedido}>
          <input
            placeholder="Nome do cliente"
            value={cliente}
            onChange={(e) => setCliente(e.target.value)}
          />

          {produtos.map((p, i) => (
            <div className="row" key={i}>
              <input
                placeholder="Produto"
                value={p.nome}
                onChange={(e) =>
                  atualizarProduto(i, "nome", e.target.value)
                }
              />
              <input
                type="number"
                placeholder="Valor"
                value={p.valor}
                onChange={(e) =>
                  atualizarProduto(i, "valor", e.target.value)
                }
              />
              <select
                value={p.marca}
                onChange={(e) =>
                  atualizarProduto(i, "marca", e.target.value)
                }
              >
                <option value="">Marca</option>
                <option value="boticario">Boticário</option>
                <option value="natura">Natura</option>
                <option value="eudora">Eudora</option>
              </select>
            </div>
          ))}

          <button type="button" onClick={adicionarProduto}>
            + Adicionar Produto
          </button>

          <select
            value={pagamento}
            onChange={(e) => setPagamento(e.target.value)}
          >
            <option value="">Forma de pagamento</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>

          <div className={`total ${pagamento}`}>
            Total: R$ {calcularTotal()}
          </div>

          <button type="submit">Salvar Pedido</button>
        </form>
      </div>

      {/* ===== AÇÕES ===== */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <button onClick={() => setMostrarFiltro(!mostrarFiltro)}>
          Filtrar
        </button>

        <button onClick={exportarExcel}>Exportar Excel</button>

        <label
          style={{
            background: "#334155",
            color: "#fff",
            padding: "12px",
            borderRadius: "12px",
            cursor: "pointer",
          }}
        >
          Importar Excel
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={importarExcel}
            hidden
          />
        </label>
      </div>

      {/* ===== FILTRO ===== */}
      {mostrarFiltro && (
        <div className="row" style={{ marginBottom: "20px" }}>
          <select
            value={filtroPagamento}
            onChange={(e) => setFiltroPagamento(e.target.value)}
          >
            <option value="">Todos os pagamentos</option>
            <option value="pix">Pix</option>
            <option value="debito">Débito</option>
            <option value="credito">Crédito</option>
          </select>

          <select
            value={filtroMarca}
            onChange={(e) => setFiltroMarca(e.target.value)}
          >
            <option value="">Todas as marcas</option>
            <option value="boticario">Boticário</option>
            <option value="natura">Natura</option>
            <option value="eudora">Eudora</option>
          </select>
        </div>
      )}

      {/* ===== LISTA ===== */}
      <div className="card">
        <h2>Pedidos</h2>

        {pedidosFiltrados.length === 0 ? (
          <p className="empty">
            Não há pedidos com esse filtro.
          </p>
        ) : (
          pedidosFiltrados.map((p) => (
            <div key={p.id} className={`pedido ${p.pagamento}`}>
              <div>
                <strong>{p.cliente}</strong>

                <div className="produtos-lista">
                  {p.produtos.map((prod, i) => (
                    <div key={i} className="produto-item">
                      {prod.nome}
                      <small>{prod.marca}</small>
                    </div>
                  ))}
                </div>
              </div>

              <span className="pedido-total">
                R$ {p.total}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
