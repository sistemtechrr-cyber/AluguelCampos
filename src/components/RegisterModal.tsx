import { useState } from 'react';
import { X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface RegisterModalProps {
  onClose: () => void;
  onSwitchToLogin?: () => void;
}

export function RegisterModal({ onClose, onSwitchToLogin }: RegisterModalProps) {
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [celular, setCelular] = useState(''); // Armazena o valor formatado para exibição
  const [celularNumerico, setCelularNumerico] = useState(''); // Armazena apenas números
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { signUp } = useAuth();

  // Função para formatar o celular para exibição
  const formatCelular = (value: string) => {
    // Remove tudo que não é número
    const numeros = value.replace(/\D/g, '');
    
    // Aplica a máscara: (XX) XXXXX-XXXX
    if (numeros.length <= 2) {
      return numeros;
    } else if (numeros.length <= 7) {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2)}`;
    } else {
      return `(${numeros.slice(0, 2)}) ${numeros.slice(2, 7)}-${numeros.slice(7, 11)}`;
    }
  };

  const handleCelularChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorDigitado = e.target.value;
    const apenasNumeros = valorDigitado.replace(/\D/g, '');
    
    // Atualiza o estado com apenas números (para salvar no banco)
    setCelularNumerico(apenasNumeros);
    
    // Formata para exibição no campo
    const formatted = formatCelular(valorDigitado);
    setCelular(formatted);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!nome.trim()) {
      setError('Nome é obrigatório');
      return;
    }

    if (!email.trim()) {
      setError('Email é obrigatório');
      return;
    }

    if (!celularNumerico.trim()) {
      setError('Celular é obrigatório');
      return;
    }

    // Validação do celular (deve ter pelo menos 10 dígitos e no máximo 11)
    if (celularNumerico.length < 10 || celularNumerico.length > 11) {
      setError('Celular inválido. Digite um número com 10 ou 11 dígitos (com DDD)');
      return;
    }

    if (!password) {
      setError('Senha é obrigatória');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);

    try {
      // Envia o celular como número puro (sem formatação) para o banco de dados
      const { error } = await signUp(email, password, nome, celularNumerico);

      if (error) {
        throw error;
      }

      onClose();
      setNome('');
      setEmail('');
      setCelular('');
      setCelularNumerico('');
      setPassword('');
      setConfirmPassword('');
      
      // Mostrar mensagem de sucesso (opcional)
      alert('Conta criada com sucesso! Faça login para continuar.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro ao criar conta. Tente novamente.';
      if (message.includes('User already registered')) {
        setError('Este email já está cadastrado');
      } else if (message.includes('Password should be at least 6 characters')) {
        setError('A senha deve ter pelo menos 6 caracteres');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 font-['Poppins']">Criar Conta</h2>
            <p className="text-gray-600 text-sm mt-0.5">Preencha os dados abaixo para se cadastrar</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Nome Completo */}
          <div>
            <label htmlFor="nome" className="block text-sm font-medium text-gray-700 mb-2">
              Nome completo *
            </label>
            <input
              id="nome"
              type="text"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Digite seu nome"
              disabled={loading}
              required
            />
          </div>

          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="seu@email.com"
              disabled={loading}
              required
            />
          </div>

          {/* Celular */}
          <div>
            <label htmlFor="celular" className="block text-sm font-medium text-gray-700 mb-2">
              Celular *
            </label>
            <input
              id="celular"
              type="tel"
              value={celular}
              onChange={handleCelularChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="(11) 99999-9999"
              disabled={loading}
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              Digite apenas números - será formatado automaticamente
            </p>
          </div>

          {/* Senha */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Senha *
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Mínimo 6 caracteres"
              disabled={loading}
              required
            />
          </div>

          {/* Confirmar Senha */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar senha *
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
              placeholder="Digite a senha novamente"
              disabled={loading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>

          <div className="text-center text-sm">
            <span className="text-gray-600">Já tem uma conta? </span>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSwitchToLogin?.();
              }}
              className="text-blue-600 hover:text-blue-700 font-semibold"
            >
              Faça login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}