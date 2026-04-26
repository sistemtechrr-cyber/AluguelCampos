import { MapPin, Edit, Trash2 } from 'lucide-react';
import type { Field } from '../lib/supabase';

type FieldCardProps = {
  field: Field;
  onClick: () => void;
  onEdit?: (field: Field) => void;
  onDelete?: (field: Field) => void;
  isAdmin?: boolean;
};

export function FieldCard({ field, onClick, onEdit, onDelete, isAdmin }: FieldCardProps) {
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(field);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete?.(field);
  };

  return (
    <div
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100 hover:border-blue-200 relative group"
    >
      <div
        onClick={onClick}
        className="aspect-video w-full overflow-hidden bg-gray-100 cursor-pointer"
      >
        <img
          src={field.foto_url}
          alt={field.nome}
          className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
        />
      </div>
      <div className="p-5">
        <div onClick={onClick} className="cursor-pointer">
          <h3 className="font-semibold text-lg text-gray-900 mb-2 font-['Inter']">
            {field.nome}
          </h3>
          <div className="flex items-center text-gray-500 text-sm mb-3">
            <MapPin className="w-4 h-4 mr-1" />
            <span className="truncate">{field.localizacao}</span>
          </div>
          <div className="flex items-baseline">
            <span className="text-2xl font-bold text-blue-600 font-['Poppins']">
              R$ {field.valor.toFixed(2)}
            </span>
            <span className="text-gray-500 text-sm ml-1">/hora</span>
          </div>
        </div>

        {isAdmin && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
            <button
              onClick={handleEdit}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium text-sm rounded-lg transition-colors"
            >
              <Edit className="w-4 h-4" />
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-sm rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Excluir
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
