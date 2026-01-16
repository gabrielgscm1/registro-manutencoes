function CamposDinamicos({ campos, setCampos }) {
  // Função para capitalizar primeira letra de cada palavra
  const capitalizar = (texto) => {
    return texto
      .toLowerCase()
      .split(' ')
      .map(palavra => palavra.charAt(0).toUpperCase() + palavra.slice(1))
      .join(' ')
  }

  const adicionarCampo = () => {
    setCampos([...campos, { chave: '', valor: '' }])
  }

  const removerCampo = (index) => {
    if (campos.length > 1) {
      setCampos(campos.filter((_, i) => i !== index))
    } else {
      setCampos([{ chave: '', valor: '' }])
    }
  }

  const atualizarCampo = (index, field, value) => {
    const novosCampos = [...campos]
    // Capitalizar tanto a chave quanto o valor
    novosCampos[index][field] = capitalizar(value)
    setCampos(novosCampos)
  }

  return (
    <div className="form-section">
      <label>Campos Adicionais</label>
      <p className="help-text">Adicione informações extras (óleo, marca, etc.)</p>

      <div className="campos-container">
        {campos.map((campo, index) => (
          <div key={index} className="campo-row">
            <input
              type="text"
              placeholder="Nome do campo"
              value={campo.chave}
              onChange={(e) => atualizarCampo(index, 'chave', e.target.value)}
            />
            <input
              type="text"
              placeholder="Valor"
              value={campo.valor}
              onChange={(e) => atualizarCampo(index, 'valor', e.target.value)}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm btn-remover"
              onClick={() => removerCampo(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>

      <button type="button" className="btn btn-secondary" onClick={adicionarCampo}>
        + Adicionar Campo
      </button>
    </div>
  )
}

export default CamposDinamicos
