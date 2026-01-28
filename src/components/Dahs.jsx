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

  /* ===== LocalStorage ===== */
  useEffect(() => {
    const dados = JSON.parse(localStorage.getItem("pedidos"));
    if (dados) setPedidos(dados);
  }, []);

  useEffect(() => {
    localStorage.setItem("pedidos", JSON.stringify(pedidos));
  }, [pedidos]);

  /* ===== Produtos ===== */
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
    if (!cliente.trim()) {
      alert("Digite o nome do cliente.");
      return false;
    }

    if (!pagamento) {
      alert("Escolha a forma de pagamento.");
      return false;
    }

    for (let p of produtos) {
      if (!p.nome.trim()) {
        alert("Digite o nome de todos os produtos.");
        return false;
      }
      if (!p.valor || Number(p.valor) <= 0) {
        alert("Digite um valor válido.");
        return false;
      }
      if (!p.marca) {
        alert("Selecione a marca.");
        return false;
      }
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
      pagamento,
      produtos,
      total: calcularTotal(),
    };

    setPedidos([novoPedido, ...pedidos]);
    setCliente("");
    setPagamento("");
    setProdutos([{ nome: "", valor: "", marca: "" }]);
  }

  /* ===== IMPORTAR EXCEL / CSV ===== */
  function importarExcel(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(sheet);

      const novosPedidos = rows.map((row) => {
        const produtos = [
          {
            nome: row.Produto,
            valor: row.Valor,
            marca: row.Marca?.toLowerCase(),
          },
        ];

        return {
          id: Date.now() + Math.random(),
          cliente: row.Cliente,
          pagamento: row.Pagamento?.toLowerCase(),
          produtos,
          total: calcularTotal(produtos, row.Pagamento?.toLowerCase()),
        };
      });

      setPedidos((prev) => [...novosPedidos, ...prev]);
    };

    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  /* ===== FILTRO ===== */
  const pedidosFiltrados = pedidos.filter(
    (p) =>
      (!filtroPagamento || p.pagamento === filtroPagamento) &&
      (!filtroMarca ||
        p.produtos.some((prod) => prod.marca === filtroMarca))
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

          {produtos.map((produto, index) => (
            <div className="row" key={index}>
              <input
                placeholder="Produto"
                value={produto.nome}
                onChange={(e) =>
                  atualizarProduto(index, "nome", e.target.value)
                }
              />

              <input
                type="number"
                placeholder="Valor"
                value={produto.valor}
                onChange={(e) =>
                  atualizarProduto(index, "valor", e.target.value)
                }
              />

              <select
                value={produto.marca}
                onChange={(e) =>
                  atualizarProduto(index, "marca", e.target.value)
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

        <label
          style={{
            background: "#334155",
            color: "#fff",
            padding: "12px",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 600,
            textAlign: "center",
          }}
        >
          Importar Excel
          <input
            type="file"
            accept=".xlsx,.csv"
            onChange={importarExcel}
            style={{ display: "none" }}
          />
        </label>
      </div>

      {/* ===== FILTRO ===== */}
      {mostrarFiltro && (
        <div className="card">
          <h2>Filtrar Pedidos</h2>

          <div className="row">
            <select onChange={(e) => setFiltroPagamento(e.target.value)}>
              <option value="">Pagamento</option>
              <option value="pix">Pix</option>
              <option value="debito">Débito</option>
              <option value="credito">Crédito</option>
            </select>

            <select onChange={(e) => setFiltroMarca(e.target.value)}>
              <option value="">Marca</option>
              <option value="boticario">Boticário</option>
              <option value="natura">Natura</option>
              <option value="eudora">Eudora</option>
            </select>
          </div>
        </div>
      )}

      {/* ===== LISTA ===== */}
      <div className="card">
        <h2>Pedidos</h2>

        {pedidosFiltrados.length === 0 ? (
          <p className="empty">
            Não há pedidos com esse pagamento e essa marca.
          </p>
        ) : (
          pedidosFiltrados.map((p) => (
            <div key={p.id} className={`pedido ${p.pagamento}`}>
              <div>
                <strong>{p.cliente}</strong>
                {p.produtos.map((prod, i) => (
                  <div key={i} style={{ fontSize: "0.8rem" }}>
                    {prod.nome} — {prod.marca}
                  </div>
                ))}
              </div>
              <span>R$ {p.total}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
