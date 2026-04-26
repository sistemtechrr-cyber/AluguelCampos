import { X, MapPin, Clock, User, Calendar, CalendarDays, AlertCircle } from 'lucide-react';
import { useState } from 'react';
import type { Field } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookingModal } from './BookingModal';

type FieldDetailsProps = {
  field: Field;
  onClose: () => void;
  onLoginRequired?: () => void;
};

const DIAS_DA_SEMANA_MAP: Record<string, string> = {
  'domingo': 'Domingo',
  'segunda': 'Segunda-feira',
  'terca': 'Terça-feira',
  'quarta': 'Quarta-feira',
  'quinta': 'Quinta-feira',
  'sexta': 'Sexta-feira',
  'sabado': 'Sábado'
};

export function FieldDetails({ field, onClose, onLoginRequired }: FieldDetailsProps) {
  const { user } = useAuth();
  const [showBooking, setShowBooking] = useState(false);

  const handleAgendar = () => {
    if (!user) {
      onClose();
      onLoginRequired?.();
      return;
    }
    setShowBooking(true);
  };

  // Extrair dias e horários do objeto disponibilidade
  const diasDisponiveis = field.disponibilidade?.dias || [];
  const horariosDisponiveis = field.disponibilidade?.horarios || [];

  // Se ainda existir o campo antigo horarios_disponiveis, usar como fallback
  const horariosFallback = field.horarios_disponiveis || [];

  // Usar os novos horários se existirem, senão usar o fallback
  const horariosParaMostrar = horariosDisponiveis.length > 0 ? horariosDisponiveis : horariosFallback;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
          <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
            <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">
              Detalhes do Campo
            </h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6 text-gray-500" />
            </button>
          </div>

          <div className="p-6">
            <div className="aspect-video w-full rounded-xl overflow-hidden mb-6 bg-gray-100">
              <img
                src={field.foto_url}
                alt={field.nome}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://via.placeholder.com/800x400?text=Sem+Imagem';
                }}
              />
            </div>

            <h3 className="text-3xl font-bold text-gray-900 mb-6 font-['Poppins']">
              {field.nome}
            </h3>

            {/* Esporte e Descrição (se existirem) */}
            {field.esporte && (
              <div className="mb-4 p-4 bg-purple-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Esporte</p>
                <p className="text-base text-gray-900 font-medium">{field.esporte}</p>
              </div>
            )}

            {field.descricao && (
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <p className="text-sm font-medium text-gray-600 mb-1">Descrição</p>
                <p className="text-base text-gray-700">{field.descricao}</p>
              </div>
            )}

            <div className="space-y-4 mb-8">
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <User className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Proprietário</p>
                  <p className="text-base text-gray-900 font-medium">{field.dono}</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <MapPin className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Localização</p>
                  <p className="text-base text-gray-900">{field.localizacao}</p>
                </div>
              </div>

              {/* Dias Disponíveis */}
              {diasDisponiveis.length > 0 && (
                <div className="flex items-start gap-3 p-4 bg-indigo-50 rounded-lg">
                  <CalendarDays className="w-5 h-5 text-indigo-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-600 mb-3">Dias Disponíveis</p>
                    <div className="flex flex-wrap gap-2">
                      {diasDisponiveis.map((dia, index) => (
                        <span
                          key={index}
                          className="px-3 py-2 bg-white border border-indigo-200 rounded-lg text-sm text-gray-700 font-medium"
                        >
                          {DIAS_DA_SEMANA_MAP[dia] || dia}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Horários Disponíveis */}
              <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                <Clock className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-3">Horários Disponíveis</p>
                  {horariosParaMostrar.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                      {horariosParaMostrar.map((horario, index) => (
                        <div
                          key={index}
                          className="px-3 py-2 bg-white border border-blue-200 rounded-lg text-sm text-gray-700 font-medium text-center"
                        >
                          {horario}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-yellow-700">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">Nenhum horário cadastrado ainda</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Informação do intervalo */}
              {field.disponibilidade?.intervalo && (
                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Clock className="w-5 h-5 text-gray-600 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-gray-600 mb-1">Intervalo de Agendamento</p>
                    <p className="text-base text-gray-900">A cada {field.disponibilidade.intervalo}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-green-50 rounded-lg">
                <Calendar className="w-5 h-5 text-green-600 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-600 mb-1">Valor</p>
                  <p className="text-2xl font-bold text-green-600 font-['Poppins']">
                    R$ {typeof field.valor === 'number' ? field.valor.toFixed(2) : parseFloat(field.valor).toFixed(2)}{' '}
                    <span className="text-sm font-normal text-gray-600">/hora</span>
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={handleAgendar}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 px-6 rounded-xl transition-colors shadow-sm font-['Inter']"
            >
              {user ? 'Agendar Horário' : 'Entre para Agendar'}
            </button>
          </div>
        </div>
      </div>

      {showBooking && (
        <BookingModal
          field={field}
          onClose={() => {
            setShowBooking(false);
            onClose();
          }}
        />
      )}
    </>
  );
}