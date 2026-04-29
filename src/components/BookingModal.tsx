import { X, Calendar, Clock, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Repeat } from 'lucide-react';
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
  
  // Estados para agendamento recorrente
  const [isRecurring, setIsRecurring] = useState(false);
  const [weeksCount, setWeeksCount] = useState(1);
  const [recurringBookings, setRecurringBookings] = useState<{ date: Date; horario: string }[]>([]);
  const [calculatingAvailability, setCalculatingAvailability] = useState(false);

  const horariosDisponiveis = field.disponibilidade?.horarios || field.horarios_disponiveis || [];
  const diasDisponiveis = field.disponibilidade?.dias || [];
  const valorPorHora = typeof field.valor === 'number' ? field.valor : parseFloat(field.valor);

  // Buscar saldo de créditos do proprietário (silencioso, sem mostrar para o usuário)
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

  // Verificar disponibilidade para datas recorrentes
  const checkRecurringAvailability = async (startDate: Date, weeks: number, horario: string) => {
    const unavailableDates: Date[] = [];
    const availableDates: Date[] = [];
    
    for (let i = 0; i < weeks; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + (i * 7));
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Verificar se já existe reserva
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id')
        .eq('field_id', field.id)
        .eq('data', dateStr)
        .eq('horario', horario);
      
      if (existingBookings && existingBookings.length > 0) {
        unavailableDates.push(currentDate);
      } else {
        availableDates.push(currentDate);
      }
    }
    
    return { availableDates, unavailableDates };
  };

  const handleRecurringChange = async (weeks: number) => {
    setWeeksCount(weeks);
    if (selectedDate && selectedHorario && weeks > 0) {
      setCalculatingAvailability(true);
      const { availableDates, unavailableDates } = await checkRecurringAvailability(selectedDate, weeks, selectedHorario);
      
      const bookingsList = availableDates.map(date => ({
        date,
        horario: selectedHorario
      }));
      
      setRecurringBookings(bookingsList);
      
      if (unavailableDates.length > 0) {
        setError(`Atenção: ${unavailableDates.length} data(s) não estão disponíveis para este horário. Apenas ${availableDates.length} semana(s) serão agendadas.`);
      } else {
        setError('');
      }
      setCalculatingAvailability(false);
    }
  };

  useEffect(() => {
    if (selectedDate && isRecurring && selectedHorario) {
      handleRecurringChange(weeksCount);
    } else if (!isRecurring && selectedDate && selectedHorario) {
      setRecurringBookings([{ date: selectedDate, horario: selectedHorario }]);
    }
  }, [selectedDate, selectedHorario, isRecurring, weeksCount]);

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
    setIsRecurring(false);
    setWeeksCount(1);
    setRecurringBookings([]);
  };

  const handleHorarioSelect = async (horario: string) => {
    setSelectedHorario(horario);
    setError('');
    
    if (selectedDate) {
      if (isRecurring) {
        await handleRecurringChange(weeksCount);
      } else {
        setRecurringBookings([{ date: selectedDate, horario }]);
      }
    }
  };

  // Calcular valor total
  const calcularValorTotal = () => {
    const quantidadeSemanas = isRecurring && recurringBookings.length > 1 ? recurringBookings.length : 1;
    return valorPorHora * quantidadeSemanas;
  };

  const valorTotal = calcularValorTotal();
  const quantidadeSemanas = isRecurring && recurringBookings.length > 1 ? recurringBookings.length : 1;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedDate || !selectedHorario) return;
    if (recurringBookings.length === 0) {
      setError('Nenhuma data disponível para agendamento');
      return;
    }

    setLoading(true);
    setError('');

    // Verificar se o proprietário tem créditos suficientes (silencioso)
    if (ownerCredits === null || ownerCredits <= 0) {
      setError('Desculpe, não foi possível realizar o agendamento no momento. Tente novamente mais tarde.');
      setLoading(false);
      return;
    }

    // Calcular custo total (1 crédito por dia normal, 2 créditos por semana no recorrente)
    let totalCost;
    if (isRecurring && recurringBookings.length > 1) {
      totalCost = recurringBookings.length * 2;
    } else {
      totalCost = 1;
    }

    if (ownerCredits < totalCost) {
      setError('Desculpe, não foi possível realizar o agendamento no momento. Tente novamente mais tarde.');
      setLoading(false);
      return;
    }

    // Criar todos os agendamentos
    const allBookings = recurringBookings.map(booking => ({
      field_id: field.id,
      user_id: user.id,
      horario: booking.horario,
      data: booking.date.toISOString().split('T')[0],
      status: 'confirmed',
    }));

    const { error: insertError } = await supabase
      .from('bookings')
      .insert(allBookings);

    if (insertError) {
      setError('Erro ao realizar agendamento. Tente novamente.');
      setLoading(false);
      return;
    }

    // Debitar créditos do proprietário (silencioso)
    const { error: deductError } = await supabase
      .from('users')
      .update({ saldo_creditos: ownerCredits - totalCost })
      .eq('id', field.user_id!);

    if (deductError) {
      console.error('Erro ao debitar créditos:', deductError);
    } else {
      setOwnerCredits(ownerCredits - totalCost);
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
            <AlertCircle className="w-8 h-8 text-red-600" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3 font-['Poppins']">
            Agenda Indisponível
          </h3>
          <p className="text-gray-600 mb-2">
            O campo <span className="font-semibold text-gray-800">{field.nome}</span> está temporariamente indisponível para agendamentos.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Tente novamente mais tarde.
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
            {isRecurring && recurringBookings.length > 1 ? 'Agendamentos Confirmados!' : 'Agendamento Confirmado!'}
          </h3>
          <p className="text-gray-600 mb-2">
            <span className="font-semibold text-gray-800">{field.nome}</span>
          </p>
          {isRecurring && recurringBookings.length > 1 ? (
            <>
              <p className="text-gray-600 mb-1">
                {recurringBookings.length} semana(s) agendadas
              </p>
              <p className="text-lg font-bold text-green-600 mb-4">
                Valor total: R$ {valorTotal.toFixed(2)}
              </p>
              <div className="bg-gray-50 rounded-lg p-3 mb-4 text-left max-h-32 overflow-y-auto">
                <p className="text-xs font-semibold text-gray-600 mb-2">Datas agendadas:</p>
                {recurringBookings.map((booking, idx) => (
                  <p key={idx} className="text-xs text-gray-500">
                    {booking.date.toLocaleDateString('pt-BR')} - {booking.horario}
                  </p>
                ))}
              </div>
            </>
          ) : (
            <>
              <p className="text-gray-600 mb-1">
                Data: <span className="font-semibold text-gray-800">
                  {selectedDate?.toLocaleDateString('pt-BR')}
                </span>
              </p>
              <p className="text-gray-600 mb-1">
                Horário: <span className="font-semibold text-gray-800">{selectedHorario}</span>
              </p>
              <p className="text-lg font-bold text-green-600 mb-4">
                Valor total: R$ {valorTotal.toFixed(2)}
              </p>
            </>
          )}
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
            <h2 className="text-xl font-bold text-gray-900 font-['Poppins']">Agendar Horário</h2>
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

          {/* Calendário */}
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
                <span className="text-gray-600">Indisponível</span>
              </div>
            </div>
          </div>

          {/* Horários Disponíveis */}
          {selectedDate && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                Horários Disponíveis para {selectedDate.toLocaleDateString('pt-BR')}
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
                      onClick={() => handleHorarioSelect(horario)}
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
                  <p className="text-gray-500 text-sm">Nenhum horário disponível para esta data</p>
                  <p className="text-xs text-gray-400 mt-1">Selecione outra data</p>
                </div>
              )}
            </div>
          )}

          {/* Opção de Agendamento Recorrente */}
          {selectedDate && selectedHorario && availableHorarios.includes(selectedHorario) && (
            <div className="border-t border-gray-100 pt-4">
              <label className="flex items-center gap-2 cursor-pointer mb-3">
                <input
                  type="checkbox"
                  checked={isRecurring}
                  onChange={(e) => {
                    setIsRecurring(e.target.checked);
                    if (!e.target.checked) {
                      setWeeksCount(1);
                      setRecurringBookings([{ date: selectedDate, horario: selectedHorario }]);
                      setError('');
                    } else if (selectedDate && selectedHorario) {
                      handleRecurringChange(weeksCount);
                    }
                  }}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <Repeat className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-gray-700">
                  Agendamento recorrente (semanal)
                </span>
              </label>

              {isRecurring && (
                <div className="ml-6 space-y-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-2">
                      Quantas semanas deseja alugar?
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min="1"
                        max="12"
                        value={weeksCount}
                        onChange={(e) => {
                          const weeks = parseInt(e.target.value) || 1;
                          setWeeksCount(Math.min(Math.max(weeks, 1), 12));
                          handleRecurringChange(Math.min(Math.max(weeks, 1), 12));
                        }}
                        className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-center focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">semana(s)</span>
                      {calculatingAvailability && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
                      )}
                    </div>
                  </div>

                  {recurringBookings.length === 0 && !calculatingAvailability && selectedHorario && (
                    <div className="bg-yellow-50 rounded-lg p-3">
                      <p className="text-sm text-yellow-800">
                        ⚠️ Este horário não está disponível para todas as semanas selecionadas.
                        Por favor, escolha menos semanas ou outro horário.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Resumo do Agendamento com Valor Total */}
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
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium text-gray-900">{selectedHorario}</span>
                </div>
                {isRecurring && recurringBookings.length > 1 && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Quantidade de semanas:</span>
                    <span className="font-medium text-gray-900">{quantidadeSemanas} semana(s)</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 mt-2 border-t border-blue-200">
                  <span className="text-gray-700 font-semibold">Valor por hora:</span>
                  <span className="font-semibold text-gray-900">R$ {valorPorHora.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-700 font-semibold">Valor total:</span>
                  <span className="font-bold text-blue-600 text-lg">R$ {valorTotal.toFixed(2)}</span>
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
              disabled={loading || !selectedHorario || !selectedDate || (isRecurring && recurringBookings.length === 0)}
              className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Agendando...' : isRecurring && recurringBookings.length > 1 ? `Agendar ${recurringBookings.length} Semanas - R$ ${valorTotal.toFixed(2)}` : `Confirmar Agendamento - R$ ${valorTotal.toFixed(2)}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}