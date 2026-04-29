// App.tsx
import { useEffect, useState } from 'react';
import { Plus, LogIn, Settings, AlertCircle, Phone, Mail, MapPin, Facebook, Instagram, Twitter, Calendar, Clock, MapPin as MapPinIcon, ArrowRight, Coins } from 'lucide-react';
import { supabase, type Field } from './lib/supabase';
import { FieldCard } from './components/FieldCard';
import { FieldDetails } from './components/FieldDetails';
import { AdminModal } from './components/AdminModal';
import { LoginModal } from './components/LoginModal';
import { RegisterModal } from './components/RegisterModal';
import { UserMenu } from './components/UserMenu';
import { FieldManagement } from './components/FieldManagement';
import { EditFieldModal } from './components/EditFieldModal';
import { OwnerDashboardPage } from './components/OwnerDashboardPage';
import { AdminCredits } from './components/AdminCredits';
import { useAuth } from './contexts/AuthContext';

// Função para embaralhar array (algoritmo Fisher-Yates)
const shuffleArray = (array: Field[]) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

function App() {
  const [fields, setFields] = useState<Field[]>([]);
  const [shuffledFields, setShuffledFields] = useState<Field[]>([]);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [showFieldManagement, setShowFieldManagement] = useState(false);
  const [showAdminCredits, setShowAdminCredits] = useState(false);
  const [editingField, setEditingField] = useState<Field | null>(null);
  const [deletingField, setDeletingField] = useState<Field | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [loading, setLoading] = useState(true);
  const { user, isAdmin, isProprietario, profile } = useAuth();

  const fetchFields = async () => {
    setLoading(true);
    
    let query = supabase
      .from('fields')
      .select('*')
      .order('created_at', { ascending: false });

    // Se for proprietário, buscar apenas seus campos
    if (isProprietario && profile?.id) {
      query = query.eq('user_id', profile.id);
    }
    // Se for admin, busca todos os campos (sem filtro)
    // Se for user comum, busca todos os campos disponíveis

    const { data, error } = await query;

    if (!error && data) {
      setFields(data);
      // Embaralhar os campos para exibição aleatória
      const shuffled = shuffleArray(data);
      setShuffledFields(shuffled);
    }
    setLoading(false);
  };

  // Função para reembaralhar os campos (pode ser chamada por um botão se quiser)
  const reshuffleFields = () => {
    if (fields.length > 0) {
      const shuffled = shuffleArray(fields);
      setShuffledFields(shuffled);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [isProprietario, profile?.id]);

  // Reembaralhar quando os campos forem atualizados
  useEffect(() => {
    if (fields.length > 0) {
      const shuffled = shuffleArray(fields);
      setShuffledFields(shuffled);
    }
  }, [fields]);

  const handleDeleteField = async () => {
    if (!deletingField) return;

    setDeleting(true);
    setDeleteError('');

    const { error } = await supabase
      .from('fields')
      .delete()
      .eq('id', deletingField.id);

    if (error) {
      setDeleteError('Erro ao excluir campo. Tente novamente.');
      setDeleting(false);
    } else {
      setDeletingField(null);
      setDeleting(false);
      fetchFields();
    }
  };

  // Landing Page para usuários não logados
  if (!user) {
    // Embaralhar os campos para a landing page também
    const featuredFields = shuffleArray([...fields]).slice(0, 3);

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
        {/* Header da Landing Page */}
        <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 font-['Poppins']">
                  Aluguel de Campos
                </h1>
              </div>
              <button
                onClick={() => setShowLoginModal(true)}
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm"
              >
                <LogIn className="w-5 h-5" />
                Entrar
              </button>
            </div>
          </div>
        </header>

        <main>
          {/* Hero Section */}
          <section className="relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
              <h1 className="text-4xl md:text-6xl font-bold font-['Poppins'] mb-6">
                Encontre o Campo Perfeito para seu Jogo
              </h1>
              <p className="text-lg md:text-xl mb-8 max-w-2xl mx-auto">
                Reserve campos esportivos de forma fácil e rápida. Futebol, vôlei, basquete e muito mais!
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg inline-flex items-center gap-2"
              >
                Começar Agora
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </section>

          {/* Benefícios */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 font-['Poppins']">
                Por que escolher nossa plataforma?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Calendar className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Reserva Rápida</h3>
                  <p className="text-gray-600">Agende seus horários em poucos cliques, sem complicação</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MapPinIcon className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Diversas Localizações</h3>
                  <p className="text-gray-600">Encontre campos perto de você com as melhores avaliações</p>
                </div>
                <div className="text-center p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Horários Flexíveis</h3>
                  <p className="text-gray-600">Disponibilidade de horários variados para se adaptar à sua rotina</p>
                </div>
              </div>
            </div>
          </section>

          {/* Campos em Destaque */}
          <section className="py-16 bg-gray-100">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-4 font-['Poppins']">
                Campos em Destaque
              </h2>
              <p className="text-center text-gray-600 mb-12">
                Conheça alguns dos nossos melhores campos disponíveis
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse">
                      <div className="aspect-video bg-gray-200" />
                      <div className="p-5 space-y-3">
                        <div className="h-6 bg-gray-200 rounded w-3/4" />
                        <div className="h-4 bg-gray-200 rounded w-1/2" />
                        <div className="h-8 bg-gray-200 rounded w-1/3" />
                      </div>
                    </div>
                  ))
                ) : (
                  featuredFields.map((field) => (
                    <div key={field.id} className="bg-white rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow">
                      <img src={field.foto_url} alt={field.nome} className="w-full h-48 object-cover" />
                      <div className="p-5">
                        <h3 className="text-xl font-semibold mb-2">{field.nome}</h3>
                        <p className="text-gray-600 text-sm mb-2">{field.localizacao}</p>
                        <p className="text-blue-600 font-bold text-lg">R$ {field.valor}/hora</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowLoginModal(true)}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Ver todos os campos
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Como Funciona */}
          <section className="py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <h2 className="text-3xl font-bold text-center text-gray-900 mb-12 font-['Poppins']">
                Como Funciona?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
                  <h3 className="text-lg font-semibold mb-2">Cadastre-se</h3>
                  <p className="text-gray-600">Crie sua conta gratuitamente</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
                  <h3 className="text-lg font-semibold mb-2">Encontre um campo</h3>
                  <p className="text-gray-600">Escolha o campo ideal para você</p>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
                  <h3 className="text-lg font-semibold mb-2">Reserve e jogue</h3>
                  <p className="text-gray-600">Confirme o horário e divirta-se!</p>
                </div>
              </div>
            </div>
          </section>

          {/* Call to Action */}
          <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
              <h2 className="text-3xl font-bold mb-4 font-['Poppins']">
                Pronto para começar?
              </h2>
              <p className="text-lg mb-8">
                Junte-se a milhares de pessoas que já estão usando nossa plataforma
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-3 rounded-xl transition-colors shadow-lg"
              >
                Criar conta gratuita
              </button>
            </div>
          </section>
        </main>

        {/* Footer igual ao anterior */}
        <footer className="bg-gray-900 text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <h3 className="text-xl font-bold font-['Poppins'] mb-4">Aluguel de Campos</h3>
                <p className="text-gray-400 text-sm leading-relaxed">
                  Encontre o campo perfeito para seu jogo. Oferecemos os melhores campos esportivos para você praticar seu esporte favorito.
                </p>
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Poppins'] mb-4">Contato</h3>
                <div className="space-y-3">
                  <a href="tel:+5595988012131" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                    <Phone className="w-5 h-5" />
                    <span>(95) 9 8801-2131</span>
                  </a>
                  <a href="mailto:sistemtechrr@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                    <Mail className="w-5 h-5" />
                    <span>sistemtechrr@gmail.com</span>
                  </a>
                  <div className="flex items-center gap-3 text-gray-400">
                    <MapPin className="w-5 h-5" />
                    <span>Roraima, Brasil</span>
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold font-['Poppins'] mb-4">Redes Sociais</h3>
                <div className="flex gap-4">
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                    <Facebook className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                    <Instagram className="w-5 h-5" />
                  </a>
                  <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                    <Twitter className="w-5 h-5" />
                  </a>
                </div>
              </div>
            </div>
            <div className="border-t border-gray-800 mt-8 pt-8 text-center">
              <p className="text-gray-400 text-sm">
                &copy; {new Date().getFullYear()} Aluguel de Campos. Todos os direitos reservados.
              </p>
              <p className="text-gray-500 text-xs mt-2">
                Desenvolvido por SistemTech RR
              </p>
            </div>
          </div>
        </footer>

        {/* Modais */}
        {showLoginModal && (
          <LoginModal
            onClose={() => setShowLoginModal(false)}
            onSwitchToRegister={() => {
              setShowLoginModal(false);
              setShowRegisterModal(true);
            }}
          />
        )}

        {showRegisterModal && (
          <RegisterModal
            onClose={() => setShowRegisterModal(false)}
            onSwitchToLogin={() => {
              setShowRegisterModal(false);
              setShowLoginModal(true);
            }}
          />
        )}
      </div>
    );
  }

  // App normal para usuários logados
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col">
      <header className="bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-['Poppins']">
                Aluguel de Campos
              </h1>
              <p className="text-gray-600 mt-1 font-['Inter']">
                {isProprietario 
                  ? 'Gerencie seus campos' 
                  : 'Encontre o campo perfeito para seu jogo'}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {isAdmin && (
                <>
                  <button
                    onClick={() => setShowAdminModal(true)}
                    className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Plus className="w-5 h-5" />
                    <span className="hidden sm:inline">Cadastrar Campo</span>
                  </button>
                  <button
                    onClick={() => setShowFieldManagement(true)}
                    className="flex items-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Settings className="w-5 h-5" />
                    <span className="hidden sm:inline">Gerenciar</span>
                  </button>
                  <button
                    onClick={() => setShowAdminCredits(true)}
                    className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-3 rounded-xl transition-colors shadow-sm"
                  >
                    <Coins className="w-5 h-5" />
                    <span className="hidden sm:inline">Créditos</span>
                  </button>
                </>
              )}
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isProprietario ? (
          <OwnerDashboardPage />
        ) : loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="bg-white rounded-xl overflow-hidden shadow-sm animate-pulse"
              >
                <div className="aspect-video bg-gray-200" />
                <div className="p-5 space-y-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                  <div className="h-8 bg-gray-200 rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : shuffledFields.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 text-lg font-['Inter']">
              Nenhum campo cadastrado ainda
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {shuffledFields.map((field) => (
                <FieldCard
                  key={field.id}
                  field={field}
                  onClick={() => setSelectedField(field)}
                  onEdit={isAdmin ? (field) => setEditingField(field) : undefined}
                  onDelete={isAdmin ? (field) => setDeletingField(field) : undefined}
                  isAdmin={isAdmin}
                />
              ))}
            </div>
            
            {/* Botão opcional para reembaralhar (pode ser adicionado se desejar) */}
            {shuffledFields.length > 0 && (
              <div className="flex justify-center mt-8">
                <button
                  onClick={reshuffleFields}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                >
                  <ArrowRight className="w-4 h-4" />
                  Embaralhar Campos
                </button>
              </div>
            )}
          </>
        )}
      </main>

      <footer className="bg-gray-900 text-white mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <h3 className="text-xl font-bold font-['Poppins'] mb-4">Aluguel de Campos</h3>
              <p className="text-gray-400 text-sm leading-relaxed">
                Encontre o campo perfeito para seu jogo. Oferecemos os melhores campos esportivos para você praticar seu esporte favorito.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Poppins'] mb-4">Contato</h3>
              <div className="space-y-3">
                <a href="tel:+5595988012131" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Phone className="w-5 h-5" />
                  <span>(95) 9 8801-2131</span>
                </a>
                <a href="mailto:sistemtechrr@gmail.com" className="flex items-center gap-3 text-gray-400 hover:text-white transition-colors">
                  <Mail className="w-5 h-5" />
                  <span>sistemtechrr@gmail.com</span>
                </a>
                <div className="flex items-center gap-3 text-gray-400">
                  <MapPin className="w-5 h-5" />
                  <span>Roraima, Brasil</span>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-xl font-bold font-['Poppins'] mb-4">Redes Sociais</h3>
              <div className="flex gap-4">
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
                  <Facebook className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-pink-600 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 bg-gray-800 rounded-full flex items-center justify-center hover:bg-blue-400 transition-colors">
                  <Twitter className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center">
            <p className="text-gray-400 text-sm">
              &copy; {new Date().getFullYear()} Aluguel de Campos. Todos os direitos reservados.
            </p>
            <p className="text-gray-500 text-xs mt-2">
              Desenvolvido por SistemTech RR
            </p>
          </div>
        </div>
      </footer>

      {selectedField && (
        <FieldDetails
          field={selectedField}
          onClose={() => setSelectedField(null)}
          onLoginRequired={() => setShowLoginModal(true)}
        />
      )}

      {showAdminModal && (
        <AdminModal
          onClose={() => setShowAdminModal(false)}
          onSuccess={fetchFields}
        />
      )}

      {showFieldManagement && (
        <FieldManagement
          onClose={() => setShowFieldManagement(false)}
          onEdit={(field) => setEditingField(field)}
        />
      )}

      {showAdminCredits && (
        <AdminCredits
          onClose={() => setShowAdminCredits(false)}
        />
      )}

      {editingField && (
        <EditFieldModal
          field={editingField}
          onClose={() => setEditingField(null)}
          onSuccess={() => {
            fetchFields();
            setEditingField(null);
          }}
        />
      )}

      {deletingField && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl">
            <div className="p-6">
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
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {deleteError}
                </div>
              )}
              <p className="text-gray-700 mb-2">
                Tem certeza que deseja excluir o campo <strong>{deletingField.nome}</strong>?
              </p>
              <p className="text-sm text-gray-600 mb-6">Todos os dados serão permanentemente removidos.</p>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setDeletingField(null);
                    setDeleteError('');
                  }}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteField}
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
                >
                  {deleting ? 'Excluindo...' : 'Excluir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;