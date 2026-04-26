import { X, Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Ban } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, type Field } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type BookingModalProps = {
  field: Field;
  onClose: () => void;
};

type Booking = {
  id: string;
  horario: string;
  data: string;
};

const DIAS_DA_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MESES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export function BookingModal({ field, onClose }: BookingModalProps) {
  const { user } = useAuth();
  const [selectedHorario, setSelectedHorario] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableHorarios, setAvailableHorarios] = useState<string[]>([]);
  const [ownerCredits, setOwnerCredits] = useState<number | null>(null);
  const [checkingCredits, setCheckingCredits] = useState(true);

  const horariosDisponiveis = field.disponibilidade?.horarios || field.horarios_disponiveis || [];
  const diasDisponiveis = field.disponibilidade?.dias || [];

  useEffect(() => {
    checkOwnerCredits();
  }, []);

  const checkOwnerCredits = async () => {
    setCheckingCredits(true);
    if (!field.user_id) {
      setOwnerCredits(0);
      setCheckingCredits(false);
      return;
    }

    const { data, error } = await supabase
      .from('users')
      .select('saldo_creditos')
      .eq('id', field.user_id)
      .maybeSingle();

    if (!error && data) {
      setOwnerCredits(data.saldo_creditos ?? 0);
    } else {
      setOwnerCredits(0);
    }
    setCheckingCredits(false);
  };

  const fetchBookings = async (date: Date) => {
    if (!date) return;
    setLoadingHorarios(true);
    const dateStr = date.toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('bookings')
      .select('horario, data')
      .eq('field_id', field.id)
      .eq('data', dateStr);

    if (!error && data) {
      setBookings(data);
    }
    setLoadingHorarios(false);
  };

  useEffect(() => {
    if (selectedDate) {
      fetchBookings(selectedDate);
    }
  }, [selectedDate]);

  useEffect(() => {
    if (selectedDate && horariosDisponiveis.length > 0) {
      const bookedHorarios = bookings.map(b => b.horario);
      const available = horariosDisponiveis.filter(h => !bookedHorarios.includes(h));
      setAvailableHorarios(available);
    } else {
      setAvailableHorarios(horariosDisponiveis);
    }
  }, [bookings, selectedDate, horariosDisponiveis]);

  const isDayAvailable = (date: Date): boolean => {
    if (diasDisponiveis.length === 0) return true;
    const dayNames = ['domingo', 'segunda', 'terca', 'quarta', 'quinta', 'sexta', 'sabado'];
    const dayOfWeek = dayNames[date.getDay()];
    return diasDisponiveis.includes(dayOfWeek);
  };

  const isPastDate = (date: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const generateCalendarDays = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDayOfMonth.getDay();
    const daysInMonth = lastDayOfMonth.getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < startingDayOfWeek; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
    return days;
  };

  const handleDateSelect = (date: Date) => {
    if (isPastDate(date)) return;
    if (!isDayAvailable(date)) return;
    setSelectedDate(date);
    setSelectedHorario('');
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate || !selectedHorario) return;

    setLoading(true);
    setError('');

    if (ownerCredits === null || ownerCredits <= 0) {
      setError('A agenda deste campo está temporariamente indisponível. Entre em contato com o proprietário.');
      setLoading(false);
      return;
    }

    const dateStr = selectedDate.toISOString().split('T')[0];

    const { error: insertError } = await supabase.from('bookings').insert({
      field_id: field.id,
      user_id: user.id,
      horario: selectedHorario,
      data: dateStr,
      status: 'confirmed',
    });

    if (insertError) {
      setError('Erro ao realizar agendamento. Tente novamente.');
      setLoading(false);
      return;
    }

    const { error: deductError } = await supabase
      .from('users')
      .update({ saldo_creditos: ownerCredits - 1 })
      .eq('id', field.user_id!);

    if (deductError) {
      console.error('Erro ao debitar crédito:', deductError);
    } else {
      setOwnerCredits(ownerCredits - 1);
    }

    setSuccess(true);
    setLoading(false);
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  if (checkingCredits) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verificando disponibilidade...</p>
        </div>
      </div>
    );
  }

  if (ownerCredits !== null && ownerCredits <= 0) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Ban className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 font-['Poppins']">
            Agenda Indisponivel
          </h3>
          <p className="text-gray-600 mb-2">
            A agenda do campo <span className="font-semibold text-gray-800">{field.nome}</span> esta temporariamente indisponivel.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Entre em contato com o proprietario para mais informacoes.
          </p>
          <button
            onClick={onClose}
            className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2 font-['Poppins']">
            Agendamento Confirmado!
          </h3>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-gray-800">{field.nome}</span>
          </p>
          <p className="text-gray-600 mb-1">
            Data: <span className="font-semibold text-gray-800">
              {selectedDate?.toLocaleDateString('pt-BR')}
            </span>
          </p>
          <p className="text-gray-600 mb-6">
            Horario: <span className="font-semibold text-gray-800">{selectedHorario}</span>
          </p>
          <button
            onClick={onClose}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    );
  }

  const calendarDays = generateCalendarDays();

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">Agendar Horario</h2>
            <p className="text-sm text-gray-500 mt-0.5">{field.nome}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-600" />
              Selecione uma Data
            </label>
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-gray-50 border-b border-gray-200">
                <button type="button" onClick={previousMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <h3 className="text-base font-semibold text-gray-900">
                  {MESES[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <button type="button" onClick={nextMonth} className="p-1 hover:bg-gray-200 rounded-lg transition-colors">
                  <ChevronRight className="w-5 h-5 text-gray-600" />
                </button>
              </div>
              <div className="grid grid-cols-7 gap-1 p-3 border-b border-gray-100">
                {DIAS_DA_SEMANA.map((dia, index) => (
                  <div key={index} className="text-center text-xs font-medium text-gray-500 py-1">{dia}</div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1 p-3">
                {calendarDays.map((date, index) => {
                  if (!date) return <div key={index} className="aspect-square" />;
                  const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();
                  const isPast = isPastDate(date);
                  const isAvailable = isDayAvailable(date);
                  const canSelect = !isPast && isAvailable;
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => canSelect && handleDateSelect(date)}
                      disabled={!canSelect}
                      className={`aspect-square rounded-lg text-sm font-medium transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white shadow-md'
                          : !canSelect
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            : 'hover:bg-blue-100 text-gray-700'
                      }`}
                    >
                      <div className="flex flex-col items-center justify-center h-full">
                        <span>{date.getDate()}</span>
                        {!isAvailable && !isPast && <div className="w-1 h-1 bg-red-500 rounded-full mt-1" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-blue-600 rounded-full" />
                <span className="text-gray-600">Selecionado</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-full" />
                <span className="text-gray-600">Indisponivel</span>
              </div>
            </div>
          </div>

          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Horarios Disponiveis para {selectedDate.toLocaleDateString('pt-BR')}
              </label>
              {loadingHorarios ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                </div>
              ) : availableHorarios.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
                  {availableHorarios.map((horario) => (
                    <button
                      key={horario}
                      type="button"
                      onClick={() => setSelectedHorario(horario)}
                      className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                        selectedHorario === horario
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {horario}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg">
                  <Clock className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">Nenhum horario disponivel para esta data</p>
                  <p className="text-xs text-gray-400 mt-1">Selecione outra data</p>
                </div>
              )}
            </div>
          )}

          {selectedDate && selectedHorario && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">Resumo do Agendamento</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Campo:</span>
                  <span className="font-medium text-gray-900">{field.nome}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Data:</span>
                  <span className="font-medium text-gray-900">{selectedDate.toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Horario:</span>
                  <span className="font-medium text-gray-900">{selectedHorario}</span>
                </div>
                <div className="flex justify-between pt-2 mt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-semibold">Valor total:</span>
                  <span className="font-bold text-blue-600 text-lg">
                    R$ {typeof field.valor === 'number' ? field.valor.toFixed(2) : parseFloat(field.valor).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !selectedHorario || !selectedDate}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : 'Confirmar Agendamento'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
