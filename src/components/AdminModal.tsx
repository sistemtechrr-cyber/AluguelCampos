import { X, AlertCircle, ChevronDown, Users, Search } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AdminModalProps = {
  onClose: () => void;
  onSuccess: () => void;
};

type Proprietario = {
  id: string;
  nome: string;
  email: string;
  tipo: string;
};

const DIAS_DA_SEMANA = [
  { id: 'domingo', label: 'Domingo' },
  { id: 'segunda', label: 'Segunda-feira' },
  { id: 'terca', label: 'Terça-feira' },
  { id: 'quarta', label: 'Quarta-feira' },
  { id: 'quinta', label: 'Quinta-feira' },
  { id: 'sexta', label: 'Sexta-feira' },
  { id: 'sabado', label: 'Sábado' },
];

// Gerar horários de 00:00 às 23:00 (intervalos de 1 hora)
const HORARIOS = Array.from({ length: 24 }, (_, i) => {
  const hora = i.toString().padStart(2, '0');
  const horaSeguinte = (i + 1).toString().padStart(2, '0');
  return {
    id: i,
    label: `${hora}:00 - ${horaSeguinte}:00`,
    value: `${hora}:00`
  };
});

export function AdminModal({ onClose, onSuccess }: AdminModalProps) {
  const { user, isAdmin } = useAuth();
  const [proprietarios, setProprietarios] = useState<Proprietario[]>([]);
  const [selectedProprietario, setSelectedProprietario] = useState<Proprietario | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProprietarios, setLoadingProprietarios] = useState(true);
  
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    foto_url: '',
    localizacao: '',
    esporte: '',
    descricao: '',
  });
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [valorFormatado, setValorFormatado] = useState('');

  // Buscar proprietários (usuários do tipo 'proprietario' e 'admin')
  useEffect(() => {
    fetchProprietarios();
  }, []);

  const fetchProprietarios = async () => {
    setLoadingProprietarios(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email, tipo')
      .in('tipo', ['proprietario', 'admin'])
      .order('nome', { ascending: true });

    if (!error && data) {
      setProprietarios(data);
    }
    setLoadingProprietarios(false);
  };

  // Filtrar proprietários baseado na busca
  const filteredProprietarios = proprietarios.filter(prop =>
    prop.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    prop.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatarValor = (valor: string) => {
    let numeros = valor.replace(/\D/g, '');
    let centavos = parseInt(numeros);
    if (isNaN(centavos)) centavos = 0;
    const valorReal = centavos / 100;
    return valorReal.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatarValor(rawValue);
    setValorFormatado(formatted);
    
    const numerico = parseFloat(
      formatted.replace('R$', '')
        .replace(/\./g, '')
        .replace(',', '.')
        .trim()
    );
    
    setFormData({ ...formData, valor: numerico.toString() });
  };

  const toggleDia = (diaId: string) => {
    setDiasSelecionados(prev =>
      prev.includes(diaId)
        ? prev.filter(d => d !== diaId)
        : [...prev, diaId]
    );
  };

  const toggleHorario = (horario: string) => {
    setHorariosSelecionados(prev =>
      prev.includes(horario)
        ? prev.filter(h => h !== horario)
        : [...prev, horario]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (!selectedProprietario) {
      setError('Selecione um proprietário');
      setLoading(false);
      return;
    }

    if (diasSelecionados.length === 0) {
      setError('Selecione pelo menos um dia da semana');
      setLoading(false);
      return;
    }

    if (horariosSelecionados.length === 0) {
      setError('Selecione pelo menos um horário');
      setLoading(false);
      return;
    }

    try {
      const disponibilidade = {
        dias: diasSelecionados,
        horarios: horariosSelecionados,
        intervalo: '1h'
      };

      const { error: insertError } = await supabase.from('fields').insert({
        nome: formData.nome,
        valor: parseFloat(formData.valor),
        foto_url: formData.foto_url,
        dono: selectedProprietario.nome,
        localizacao: formData.localizacao,
        esporte: formData.esporte,
        descricao: formData.descricao,
        disponibilidade: disponibilidade,
        user_id: selectedProprietario.id  // Usa o ID do proprietário selecionado
      });

      if (insertError) {
        if (insertError.message.includes('permission denied') || insertError.message.includes('policy')) {
          throw new Error('Você não tem permissão para cadastrar campos.');
        }
        throw insertError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cadastrar campo');
    } finally {
      setLoading(false);
    }
  };

  if (!user || !isAdmin) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl z-10">
            <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
              Acesso Negado
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>
          <div className="p-6">
            <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                Apenas administradores podem cadastrar novos campos.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
            Cadastrar Novo Campo
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Nome do Campo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Campo *
            </label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Campo Society Vila Verde"
            />
          </div>

          {/* Valor por Hora com formatação */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por Hora (R$) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">
                R$
              </span>
              <input
                type="text"
                required
                value={valorFormatado}
                onChange={handleValorChange}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                placeholder="0,00"
              />
            </div>
          </div>

          {/* URL da Foto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Foto *
            </label>
            <input
              type="url"
              required
              value={formData.foto_url}
              onChange={(e) =>
                setFormData({ ...formData, foto_url: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          {/* Nome do Proprietário - Select com busca */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Proprietário do Campo *
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowDropdown(!showDropdown)}
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-left flex items-center justify-between bg-white"
              >
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span className={selectedProprietario ? 'text-gray-900' : 'text-gray-500'}>
                    {selectedProprietario ? selectedProprietario.nome : 'Selecione um proprietário'}
                  </span>
                </div>
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {showDropdown && (
                <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                  <div className="p-2 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Buscar proprietário..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                      />
                    </div>
                  </div>
                  <div className="max-h-60 overflow-y-auto">
                    {loadingProprietarios ? (
                      <div className="p-4 text-center text-gray-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-sm mt-2">Carregando...</p>
                      </div>
                    ) : filteredProprietarios.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        <p className="text-sm">Nenhum proprietário encontrado</p>
                      </div>
                    ) : (
                      filteredProprietarios.map((prop) => (
                        <button
                          key={prop.id}
                          type="button"
                          onClick={() => {
                            setSelectedProprietario(prop);
                            setShowDropdown(false);
                            setSearchTerm('');
                          }}
                          className={`w-full px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                            selectedProprietario?.id === prop.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <p className="text-sm font-medium text-gray-900">{prop.nome}</p>
                          <p className="text-xs text-gray-500">{prop.email}</p>
                          <span className="inline-block mt-1 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                            {prop.tipo === 'admin' ? 'Administrador' : 'Proprietário'}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {!selectedProprietario && (
              <p className="mt-1 text-xs text-gray-500">
                Selecione o proprietário que será responsável por este campo
              </p>
            )}
          </div>

          {/* Localização */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Localização *
            </label>
            <input
              type="text"
              required
              value={formData.localizacao}
              onChange={(e) =>
                setFormData({ ...formData, localizacao: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Rua das Flores, 123 - Vila Verde"
            />
          </div>

          {/* Esporte */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Esporte *
            </label>
            <select
              required
              value={formData.esporte}
              onChange={(e) => setFormData({ ...formData, esporte: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
            >
              <option value="">Selecione um esporte</option>
              <option value="Futebol Society">Futebol Society</option>
              <option value="Futebol Suíço">Futebol Suíço</option>
              <option value="Futsal">Futsal</option>
              <option value="Vôlei">Vôlei</option>
              <option value="Basquete">Basquete</option>
              <option value="Tênis">Tênis</option>
              <option value="Beach Tennis">Beach Tennis</option>
            </select>
          </div>

          {/* Descrição */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
              rows={3}
              placeholder="Descreva as características do campo..."
            />
          </div>

          {/* Dias da Semana - Seleção Múltipla */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Dias Disponíveis *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
              {DIAS_DA_SEMANA.map((dia) => (
                <button
                  key={dia.id}
                  type="button"
                  onClick={() => toggleDia(dia.id)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    diasSelecionados.includes(dia.id)
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {dia.label}
                </button>
              ))}
            </div>
          </div>

          {/* Horários - Scroll com intervalos de 1 hora */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horários Disponíveis (intervalo de 1 hora) *
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                {HORARIOS.map((horario) => (
                  <button
                    key={horario.id}
                    type="button"
                    onClick={() => toggleHorario(horario.value)}
                    className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      horariosSelecionados.includes(horario.value)
                        ? 'bg-blue-600 text-white shadow-md'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {horario.label}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Clique nos horários para selecionar. Role para ver mais horários.
            </p>
          </div>

          {/* Resumo da Disponibilidade */}
          {(diasSelecionados.length > 0 || horariosSelecionados.length > 0) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                Resumo da Disponibilidade:
              </h3>
              {diasSelecionados.length > 0 && (
                <p className="text-sm text-blue-800">
                  <strong>Dias:</strong>{' '}
                  {diasSelecionados.map(d => 
                    DIAS_DA_SEMANA.find(dia => dia.id === d)?.label
                  ).join(', ')}
                </p>
              )}
              {horariosSelecionados.length > 0 && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Horários:</strong>{' '}
                  {horariosSelecionados.length} horário(s) selecionado(s)
                </p>
              )}
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Cadastrando...' : 'Cadastrar Campo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}