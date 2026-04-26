import { X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase, type Field } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type EditFieldModalProps = {
  field: Field;
  onClose: () => void;
  onSuccess: () => void;
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

const HORARIOS = Array.from({ length: 24 }, (_, i) => {
  const hora = i.toString().padStart(2, '0');
  const horaSeguinte = (i + 1).toString().padStart(2, '0');
  return {
    id: i,
    label: `${hora}:00 - ${horaSeguinte}:00`,
    value: `${hora}:00`,
  };
});

export function EditFieldModal({ field, onClose, onSuccess }: EditFieldModalProps) {
  const { isAdmin, isProprietario } = useAuth();
  const [formData, setFormData] = useState({
    nome: '',
    valor: '',
    foto_url: '',
    dono: '',
    localizacao: '',
  });
  const [diasSelecionados, setDiasSelecionados] = useState<string[]>([]);
  const [horariosSelecionados, setHorariosSelecionados] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormData({
      nome: field.nome,
      valor: field.valor.toString(),
      foto_url: field.foto_url,
      dono: field.dono,
      localizacao: field.localizacao,
    });

    // Load existing disponibilidade
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const disp = (field as any).disponibilidade;
    if (disp?.dias) {
      setDiasSelecionados(disp.dias);
    }
    if (disp?.horarios) {
      setHorariosSelecionados(disp.horarios);
    } else if (field.horarios_disponiveis?.length) {
      setHorariosSelecionados(field.horarios_disponiveis);
    }
  }, [field]);

  const toggleDia = (diaId: string) => {
    setDiasSelecionados((prev) =>
      prev.includes(diaId) ? prev.filter((d) => d !== diaId) : [...prev, diaId]
    );
  };

  const toggleHorario = (horario: string) => {
    setHorariosSelecionados((prev) =>
      prev.includes(horario) ? prev.filter((h) => h !== horario) : [...prev, horario]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

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
        intervalo: '1h',
      };

      const { error: updateError } = await supabase
        .from('fields')
        .update({
          nome: formData.nome,
          valor: parseFloat(formData.valor),
          foto_url: formData.foto_url,
          dono: formData.dono,
          localizacao: formData.localizacao,
          disponibilidade,
          horarios_disponiveis: horariosSelecionados,
        })
        .eq('id', field.id);

      if (updateError) {
        if (
          updateError.message.includes('permission denied') ||
          updateError.message.includes('policy')
        ) {
          throw new Error(
            'Você não tem permissão para editar campos. Apenas administradores podem realizar esta ação.'
          );
        }
        throw updateError;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar campo');
    } finally {
      setLoading(false);
    }
  };

  if (!isAdmin && !isProprietario) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Editar Campo</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nome do Campo</label>
            <input
              type="text"
              required
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Campo Society Vila Verde"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Valor por Hora (R$)
            </label>
            <input
              type="number"
              required
              step="0.01"
              min="0"
              value={formData.valor}
              onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: 150.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL da Foto</label>
            <input
              type="url"
              required
              value={formData.foto_url}
              onChange={(e) => setFormData({ ...formData, foto_url: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="https://exemplo.com/foto.jpg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nome do Proprietário
            </label>
            <input
              type="text"
              required
              value={formData.dono}
              onChange={(e) => setFormData({ ...formData, dono: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: João Silva"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Localização</label>
            <input
              type="text"
              required
              value={formData.localizacao}
              onChange={(e) => setFormData({ ...formData, localizacao: e.target.value })}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Ex: Rua das Flores, 123 - Vila Verde"
            />
          </div>

          {/* Dias da Semana */}
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

          {/* Horários */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Horários Disponíveis (intervalo de 1 hora) *
            </label>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="max-h-48 overflow-y-auto p-2">
                <div className="grid grid-cols-2 gap-1">
                  {HORARIOS.map((horario) => (
                    <button
                      key={horario.id}
                      type="button"
                      onClick={() => toggleHorario(horario.value)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-center ${
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
            </div>
            <p className="mt-2 text-sm text-gray-500">
              Clique nos horários para selecionar. Role para ver mais horários.
            </p>
          </div>

          {/* Resumo */}
          {(diasSelecionados.length > 0 || horariosSelecionados.length > 0) && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">Resumo da Disponibilidade:</h3>
              {diasSelecionados.length > 0 && (
                <p className="text-sm text-blue-800">
                  <strong>Dias:</strong>{' '}
                  {diasSelecionados
                    .map((d) => DIAS_DA_SEMANA.find((dia) => dia.id === d)?.label)
                    .join(', ')}
                </p>
              )}
              {horariosSelecionados.length > 0 && (
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Horários:</strong> {horariosSelecionados.length} horário(s) selecionado(s)
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
              {loading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
