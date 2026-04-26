import { X, Plus, Coins, History, User, ChevronDown, Search, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AdminCreditsProps = {
  onClose: () => void;
};

type Owner = {
  id: string;
  nome: string;
  email: string;
  saldo_creditos: number;
  tipo: string;
};

type HistoricoItem = {
  id: string;
  owner_id: string;
  owner_nome: string;
  admin_nome: string;
  quantidade: number;
  observacao: string | null;
  created_at: string;
};

type ActiveTab = 'owners' | 'history';

export function AdminCredits({ onClose }: AdminCreditsProps) {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('owners');
  const [owners, setOwners] = useState<Owner[]>([]);
  const [historico, setHistorico] = useState<HistoricoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [addingTo, setAddingTo] = useState<Owner | null>(null);
  const [creditAmount, setCreditAmount] = useState('');
  const [observacao, setObservacao] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchOwners();
    fetchHistorico();
  }, []);

  const fetchOwners = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('users')
      .select('id, nome, email, saldo_creditos, tipo')
      .in('tipo', ['proprietario', 'admin'])
      .order('nome', { ascending: true });

    if (!error && data) setOwners(data);
    setLoading(false);
  };

  const fetchHistorico = async () => {
    setLoadingHistory(true);
    const { data, error } = await supabase
      .from('historico_creditos')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);

    if (!error && data) setHistorico(data);
    setLoadingHistory(false);
  };

  const handleAddCredits = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addingTo || !profile) return;

    const qty = parseInt(creditAmount);
    if (isNaN(qty) || qty <= 0) {
      setError('Informe uma quantidade valida de creditos');
      return;
    }

    setSubmitting(true);
    setError('');

    const novoSaldo = (addingTo.saldo_creditos ?? 0) + qty;

    const { error: updateError } = await supabase
      .from('users')
      .update({ saldo_creditos: novoSaldo })
      .eq('id', addingTo.id);

    if (updateError) {
      setError('Erro ao atualizar creditos: ' + updateError.message);
      setSubmitting(false);
      return;
    }

    const { error: histError } = await supabase
      .from('historico_creditos')
      .insert({
        owner_id: addingTo.id,
        admin_id: profile.id,
        admin_nome: profile.nome,
        owner_nome: addingTo.nome,
        quantidade: qty,
        observacao: observacao.trim() || null,
      });

    if (histError) {
      console.error('Erro ao registrar historico:', histError);
    }

    setOwners(prev => prev.map(o =>
      o.id === addingTo.id ? { ...o, saldo_creditos: novoSaldo } : o
    ));

    setSuccessMsg(`${qty} credito${qty !== 1 ? 's' : ''} adicionado${qty !== 1 ? 's' : ''} para ${addingTo.nome}`);
    setAddingTo(null);
    setCreditAmount('');
    setObservacao('');
    setSubmitting(false);

    fetchHistorico();

    setTimeout(() => setSuccessMsg(''), 4000);
  };

  const filteredOwners = owners.filter(o =>
    o.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
              <Coins className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Gerenciar Creditos</h2>
              <p className="text-sm text-gray-500">Adicione creditos aos proprietarios de quadras</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Mensagem de sucesso */}
        {successMsg && (
          <div className="mx-6 mt-4 p-3 bg-green-50 border border-green-200 rounded-xl text-green-800 text-sm font-medium flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full" />
            {successMsg}
          </div>
        )}

        {/* Tabs */}
        <div className="px-6 pt-4 flex gap-2 border-b border-gray-100">
          <button
            onClick={() => setActiveTab('owners')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'owners'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <User className="w-4 h-4" />
            Proprietarios
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-sm font-semibold transition-colors border-b-2 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <History className="w-4 h-4" />
            Historico de Recargas
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'owners' && (
            <div className="p-6 space-y-4">
              {/* Busca */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar proprietario..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                />
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : filteredOwners.length === 0 ? (
                <div className="text-center py-12 text-gray-500">Nenhum proprietario encontrado</div>
              ) : (
                <div className="space-y-3">
                  {filteredOwners.map(owner => (
                    <div key={owner.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                            <User className="w-5 h-5 text-gray-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{owner.nome}</p>
                            <p className="text-sm text-gray-500">{owner.email}</p>
                            <span className={`inline-block mt-1 px-2 py-0.5 text-xs font-medium rounded ${
                              owner.tipo === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                            }`}>
                              {owner.tipo === 'admin' ? 'Administrador' : 'Proprietario'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className={`text-center px-4 py-2 rounded-xl border-2 ${
                            owner.saldo_creditos <= 0
                              ? 'bg-red-50 border-red-200 text-red-700'
                              : owner.saldo_creditos <= 3
                                ? 'bg-yellow-50 border-yellow-200 text-yellow-700'
                                : 'bg-green-50 border-green-200 text-green-700'
                          }`}>
                            <p className="text-xs font-medium">Creditos</p>
                            <p className="text-2xl font-bold leading-tight">{owner.saldo_creditos ?? 0}</p>
                          </div>

                          <button
                            onClick={() => {
                              setAddingTo(owner);
                              setCreditAmount('');
                              setObservacao('');
                              setError('');
                            }}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm rounded-xl transition-colors shadow-sm"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm text-gray-500">{historico.length} registro{historico.length !== 1 ? 's' : ''} encontrado{historico.length !== 1 ? 's' : ''}</p>
                <button
                  onClick={fetchHistorico}
                  disabled={loadingHistory}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingHistory ? 'animate-spin' : ''}`} />
                  Atualizar
                </button>
              </div>

              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : historico.length === 0 ? (
                <div className="text-center py-12">
                  <History className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma recarga registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {historico.map(item => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-xl p-4 hover:shadow-sm transition-shadow">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <Plus className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.owner_nome}</p>
                            <p className="text-sm text-gray-500">
                              Adicionado por <span className="font-medium text-gray-700">{item.admin_nome}</span>
                            </p>
                            {item.observacao && (
                              <p className="text-xs text-gray-400 mt-1 italic">"{item.observacao}"</p>
                            )}
                          </div>
                        </div>

                        <div className="text-right flex-shrink-0">
                          <div className="flex items-center gap-1 justify-end">
                            <span className="text-2xl font-bold text-green-600">+{item.quantidade}</span>
                            <span className="text-sm text-gray-500">credito{item.quantidade !== 1 ? 's' : ''}</span>
                          </div>
                          <p className="text-xs text-gray-400 mt-1">{formatDate(item.created_at)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal Adicionar Creditos */}
      {addingTo && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900 font-['Poppins']">Adicionar Creditos</h3>
              <button onClick={() => setAddingTo(null)} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleAddCredits} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div className="bg-gray-50 rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">{addingTo.nome}</p>
                  <p className="text-sm text-gray-500">{addingTo.email}</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-xs text-gray-500">Saldo atual</p>
                  <p className="text-xl font-bold text-gray-900">{addingTo.saldo_creditos ?? 0}</p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantidade de Creditos *
                </label>
                <div className="flex gap-2">
                  {[10, 20, 30, 50].map(n => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setCreditAmount(String(n))}
                      className={`flex-1 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                        creditAmount === String(n)
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-blue-300'
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="1"
                  value={creditAmount}
                  onChange={e => setCreditAmount(e.target.value)}
                  className="mt-2 w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ou digite outro valor..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observacao (opcional)
                </label>
                <input
                  type="text"
                  value={observacao}
                  onChange={e => setObservacao(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                  placeholder="Ex: Pagamento PIX comprovante #123"
                />
              </div>

              {creditAmount && parseInt(creditAmount) > 0 && (
                <div className="bg-blue-50 rounded-xl p-3 flex items-center justify-between">
                  <span className="text-sm text-blue-700">Novo saldo apos adicao:</span>
                  <span className="text-xl font-bold text-blue-700">
                    {(addingTo.saldo_creditos ?? 0) + parseInt(creditAmount)} creditos
                  </span>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAddingTo(null)}
                  disabled={submitting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={submitting || !creditAmount || parseInt(creditAmount) <= 0}
                  className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      Adicionando...
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      Adicionar Creditos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
