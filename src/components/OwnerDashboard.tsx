import { X, Plus, Coins, Calendar, MapPin, Clock, TrendingUp, QrCode, Copy, Phone, Mail, AlertCircle, CheckCircle, CreditCard as Edit, Trash2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, type Field } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { EditFieldModal } from './EditFieldModal';
import { AdminModal } from './AdminModal';

const PIX_KEY = '95988012131';
const CONTACT_PHONE = '(95) 9 8801-2131';
const CONTACT_EMAIL = 'sistemtechrr@gmail.com';

type Booking = {
  id: string;
  field_id: string;
  user_id: string;
  horario: string;
  data: string;
  status: string;
  created_at: string;
  fields?: { nome: string; localizacao: string };
  users?: { nome: string; email: string };
};

type OwnerDashboardProps = {
  onClose: () => void;
};

function BuyCreditsModal({ isOpen, onClose, currentSaldo }: { isOpen: boolean; onClose: () => void; currentSaldo: number }) {
  const [copiedPix, setCopiedPix] = useState(false);

  if (!isOpen) return null;

  const handleCopyPix = () => {
    try {
      navigator.clipboard.writeText(PIX_KEY);
      setCopiedPix(true);
      setTimeout(() => setCopiedPix(false), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  const saldoCritico = currentSaldo <= 3 && currentSaldo > 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl relative my-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-5 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                <Coins className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white font-['Poppins']">Comprar Créditos</h3>
                <p className="text-blue-100 text-sm">Recarregue sua agenda</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
          <div className="bg-gray-50 rounded-xl p-4 text-center">
            <p className="text-sm text-gray-600 mb-1">Seu saldo atual</p>
            <p className={`text-4xl font-bold ${
              currentSaldo <= 0 ? 'text-red-600' :
              saldoCritico ? 'text-yellow-600' :
              'text-green-600'
            }`}>
              {currentSaldo}
            </p>
            <p className="text-sm text-gray-500">crédito{currentSaldo !== 1 ? 's' : ''}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-semibold text-gray-700">Como comprar:</p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                Faça um PIX com o valor desejado
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                Envie o comprovante para nosso contato
              </li>
              <li className="flex items-start gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                Seus créditos serão adicionados em breve
              </li>
            </ol>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <QrCode className="w-4 h-4 text-blue-600" />
              <p className="text-sm font-semibold text-blue-800">Chave PIX</p>
            </div>
            <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-lg px-3 py-2">
              <span className="flex-1 text-sm font-mono text-gray-800 break-all">{PIX_KEY}</span>
              <button
                onClick={handleCopyPix}
                className="flex items-center gap-1 px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded-md transition-colors flex-shrink-0"
              >
                <Copy className="w-3 h-3" />
                {copiedPix ? 'Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-semibold text-gray-700">Enviar comprovante para:</p>
            <a
              href="https://wa.me/559588012131"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-xl hover:bg-green-100 transition-colors"
            >
              <div className="w-10 h-10 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <Phone className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">WhatsApp</p>
                <p className="text-xs text-green-700">{CONTACT_PHONE}</p>
              </div>
            </a>
            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-800">Email</p>
                <p className="text-xs text-gray-600">{CONTACT_EMAIL}</p>
              </div>
            </a>
          </div>
        </div>

        <div className="p-6 pt-0 border-t border-gray-100">
          <button
            onClick={onClose}
            className="w-full px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

export function OwnerDashboard({ onClose }: OwnerDashboardProps) {
  const { profile, refreshProfile } = useAuth();
  const [fields, setFields] = useState<Field[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'fields' | 'bookings'>('fields');
  const [showBuyCredits, setShowBuyCredits] = useState(false);
  const [showAddField, setShowAddField] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [deletingField, setDeletingField] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  const saldo = profile?.saldo_creditos ?? 0;
  const saldoCritico = saldo <= 3 && saldo > 0;
  const saldoZerado = saldo <= 0;

  useEffect(() => {
    fetchData();
  }, [profile?.id]);

  const fetchData = async () => {
    if (!profile?.id) return;
    setLoading(true);

    const [fieldsRes, bookingsRes] = await Promise.all([
      supabase
        .from('fields')
        .select('*')
        .eq('user_id', profile.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('bookings')
        .select('*, fields(nome, localizacao), users(nome, email)')
        .order('data', { ascending: false })
        .limit(50),
    ]);

    if (!fieldsRes.error && fieldsRes.data) setFields(fieldsRes.data);

    if (!bookingsRes.error && bookingsRes.data) {
      const fieldIds = (fieldsRes.data ?? []).map((f: Field) => f.id);
      const ownerBookings = bookingsRes.data.filter((b: Booking) => fieldIds.includes(b.field_id));
      setBookings(ownerBookings);
    }

    setLoading(false);
  };

  const handleDeleteField = async () => {
    if (!deletingField) return;
    setDeleting(true);
    setDeleteError('');

    const { error } = await supabase.from('fields').delete().eq('id', deletingField.id);

    if (error) {
      setDeleteError('Erro ao excluir campo. Tente novamente.');
      setDeleting(false);
    } else {
      setDeletingField(null);
      setDeleting(false);
      fetchData();
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR');
  };

  const statusLabel = (status: string) => {
    if (status === 'confirmed') return { label: 'Confirmado', cls: 'bg-green-100 text-green-700' };
    if (status === 'cancelled') return { label: 'Cancelado', cls: 'bg-red-100 text-red-700' };
    return { label: 'Pendente', cls: 'bg-yellow-100 text-yellow-700' };
  };

  const todayBookings = bookings.filter(b => {
    const today = new Date().toISOString().split('T')[0];
    return b.data === today;
  });

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-600 to-green-700 px-6 py-5 flex items-center justify-between flex-shrink-0">
            <div>
              <h2 className="text-2xl font-bold text-white font-['Poppins']">Minha Dashboard</h2>
              <p className="text-green-100 text-sm mt-0.5">Olá, {profile?.nome}</p>
            </div>
            <div className="flex items-center gap-3">
              {/* Saldo */}
              <button
                onClick={() => setShowBuyCredits(true)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                  saldoZerado
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse'
                    : saldoCritico
                    ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
                    : 'bg-white/20 hover:bg-white/30 text-white'
                }`}
              >
                <Coins className="w-4 h-4" />
                <span>{saldo} crédito{saldo !== 1 ? 's' : ''}</span>
                {saldoZerado && <AlertCircle className="w-4 h-4" />}
              </button>
              <button onClick={onClose} className="w-9 h-9 flex items-center justify-center bg-white/20 hover:bg-white/30 rounded-xl transition-colors text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Alerta saldo baixo */}
          {(saldoCritico || saldoZerado) && (
            <div className={`px-6 py-3 flex items-center gap-3 ${saldoZerado ? 'bg-red-50 border-b border-red-200' : 'bg-yellow-50 border-b border-yellow-200'}`}>
              <AlertCircle className={`w-5 h-5 flex-shrink-0 ${saldoZerado ? 'text-red-600' : 'text-yellow-600'}`} />
              <p className={`text-sm font-medium ${saldoZerado ? 'text-red-800' : 'text-yellow-800'}`}>
                {saldoZerado
                  ? 'Seu saldo zerou! Novos agendamentos estão bloqueados.'
                  : `Saldo baixo: apenas ${saldo} crédito${saldo !== 1 ? 's' : ''} restante${saldo !== 1 ? 's' : ''}.`}
              </p>
              <button
                onClick={() => setShowBuyCredits(true)}
                className={`ml-auto text-sm font-semibold underline ${saldoZerado ? 'text-red-700' : 'text-yellow-700'}`}
              >
                Comprar créditos
              </button>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 px-6 pt-4 border-b border-gray-100 flex-shrink-0">
            <button
              onClick={() => setActiveTab('fields')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'fields' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <MapPin className="w-4 h-4" />
              Meus Campos
            </button>
            <button
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === 'bookings' ? 'border-green-600 text-green-700' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Calendar className="w-4 h-4" />
              Agendamentos
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <div className="w-8 h-8 border-4 border-green-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : activeTab === 'fields' ? (
              <div className="space-y-5">
                {/* Dashboard Stats Cards */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <MapPin className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{fields.length}</p>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">Campo{fields.length !== 1 ? 's' : ''} cadastrado{fields.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <Calendar className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">Agendamento{bookings.length !== 1 ? 's' : ''} total</p>
                  </div>
                  <div className="bg-gradient-to-br from-amber-50 to-amber-100 border border-amber-200 rounded-xl p-4 text-center">
                    <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center mx-auto mb-2">
                      <TrendingUp className="w-5 h-5 text-white" />
                    </div>
                    <p className="text-3xl font-bold text-amber-600">{todayBookings.length}</p>
                    <p className="text-xs text-gray-600 mt-0.5 font-medium">Agendamento{todayBookings.length !== 1 ? 's' : ''} hoje</p>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-500">{fields.length} campo{fields.length !== 1 ? 's' : ''} cadastrado{fields.length !== 1 ? 's' : ''}</p>
                  <button
                    onClick={() => setShowAddField(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold text-sm rounded-xl transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Novo Campo
                  </button>
                </div>

                {fields.length === 0 ? (
                  <div className="text-center py-16">
                    <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum campo cadastrado</p>
                    <p className="text-sm text-gray-400 mt-1">Clique em "Novo Campo" para começar</p>
                  </div>
                ) : (
                  fields.map((field) => (
                    <div key={field.id} className="bg-white border border-gray-200 rounded-xl hover:border-green-200 transition-colors overflow-hidden">
                      <div className="flex gap-4 p-4">
                        <img
                          src={field.foto_url}
                          alt={field.nome}
                          className="w-28 h-20 object-cover rounded-lg flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900">{field.nome}</h3>
                          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                            <MapPin className="w-3 h-3" />
                            {field.localizacao}
                          </p>
                          {field.esporte && (
                            <span className="inline-block mt-1.5 px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                              {field.esporte}
                            </span>
                          )}
                          <p className="text-lg font-bold text-green-600 mt-1">
                            R$ {field.valor.toFixed(2)}/hora
                          </p>
                        </div>
                        <div className="flex flex-col gap-2 flex-shrink-0">
                          <button
                            onClick={() => setEditingField(field)}
                            className="flex items-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => setDeletingField(field)}
                            className="flex items-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 text-sm font-medium rounded-lg transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                            Excluir
                          </button>
                        </div>
                      </div>
                      {field.disponibilidade?.horarios && field.disponibilidade.horarios.length > 0 && (
                        <div className="px-4 pb-4 flex items-center gap-2">
                          <Clock className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                          <p className="text-xs text-gray-500">
                            {field.disponibilidade.horarios.length} horário{field.disponibilidade.horarios.length !== 1 ? 's' : ''} disponível{field.disponibilidade.horarios.length !== 1 ? 'eis' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-gray-500">{bookings.length} agendamento{bookings.length !== 1 ? 's' : ''} no total</p>

                {bookings.length === 0 ? (
                  <div className="text-center py-16">
                    <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 font-medium">Nenhum agendamento ainda</p>
                    <p className="text-sm text-gray-400 mt-1">Os agendamentos dos seus campos aparecerão aqui</p>
                  </div>
                ) : (
                  bookings.map((booking) => {
                    const { label, cls } = statusLabel(booking.status);
                    return (
                      <div key={booking.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-semibold text-gray-900">{booking.fields?.nome ?? 'Campo'}</p>
                              <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${cls}`}>{label}</span>
                            </div>
                            <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {booking.fields?.localizacao}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                                {formatDate(booking.data)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-gray-400" />
                                {booking.horario}
                              </span>
                            </div>
                          </div>
                          {booking.status === 'confirmed' && (
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Buy Credits Modal */}
      <BuyCreditsModal
        isOpen={showBuyCredits}
        onClose={() => setShowBuyCredits(false)}
        currentSaldo={saldo}
      />

      {/* Add Field Modal */}
      {showAddField && (
        <AdminModal
          onClose={() => setShowAddField(false)}
          onSuccess={() => {
            setShowAddField(false);
            fetchData();
          }}
        />
      )}

      {/* Edit Field Modal */}
      {editingField && (
        <EditFieldModal
          field={editingField}
          onClose={() => setEditingField(null)}
          onSuccess={() => {
            setEditingField(null);
            fetchData();
          }}
        />
      )}

      {/* Delete Confirm */}
      {deletingField && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Confirmar Exclusão</h3>
                <p className="text-sm text-gray-600">Esta ação não pode ser desfeita</p>
              </div>
            </div>
            {deleteError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{deleteError}</div>
            )}
            <p className="text-gray-700 mb-2">
              Tem certeza que deseja excluir <strong>{deletingField.nome}</strong>?
            </p>
            <p className="text-sm text-gray-500 mb-6">Todos os dados serão permanentemente removidos.</p>
            <div className="flex gap-3">
              <button
                onClick={() => { setDeletingField(null); setDeleteError(''); }}
                disabled={deleting}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleDeleteField}
                disabled={deleting}
                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {deleting ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
