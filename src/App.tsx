import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  BedDouble,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  MessageCircle,
  Calendar,
  CheckCircle2,
  Video,
  X,
  Phone
} from 'lucide-react';

// ============================================================================
// DONNÉES INITIALES & CONFIGURATION CENTRALISÉE BOÉ MULTI-SERVICES
// ============================================================================

const INITIAL_SETTINGS = {
  whatsappNumber: '242064583191',
  phonePrimary: '242064583191',
  phoneSecondary: '242053228723',
  agencyName: 'BOÉ MULTI-SERVICES',
  agencyEmail: 'contact@boemultiservices.cg',
  agencyAddress: 'Pointe-Noire, République du Congo',
};

// Connexion en lecture seule à Supabase (clé publique « publiable » : sans danger dans le site)
const SUPABASE_URL = String(import.meta.env.VITE_SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_KEY = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '');
const IS_SUPABASE_CONFIGURED = Boolean(SUPABASE_URL && SUPABASE_KEY);

// Conversion d'une ligne Supabase (snake_case) vers le format du site public
const fromSupabaseRow = (row) => ({
  id: row.id,
  reference: row.reference,
  title: row.title,
  transactionType: row.transaction_type,
  propertyType: row.property_type,
  rentalFrequency: row.rental_frequency || '',
  neighborhood: row.neighborhood || '',
  price: row.price,
  priceUnit: row.price_unit || '',
  negotiable: row.negotiable || 'fixe',
  priceComment: row.price_comment || '',
  location: row.location,
  bedrooms: row.bedrooms ?? 0,
  bathrooms: row.bathrooms ?? 0,
  area: row.area ?? '',
  status: row.status || 'Disponible',
  published: row.publication_status === 'Publié',
  featured: Boolean(row.featured),
  description: row.description || '',
  amenities: Array.isArray(row.amenities) ? row.amenities : [],
  // Seuls les médias en https:// sont affichés
  media: (Array.isArray(row.media) ? row.media : []).filter(
    (m) => m && typeof m.url === 'string' && m.url.startsWith('https://')
  ),
});

// Les annonces viennent uniquement de Supabase (gérées depuis l'espace Manager)
const INITIAL_PROPERTIES: any[] = [];

// ============================================================================
// COMPOSANT LOGO OFFICIEL BOÉ MULTI-SERVICES
// ============================================================================
function BoeLogo({ compact = false }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <svg
        width={compact ? 38 : 44}
        height={compact ? 38 : 44}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        <circle cx="60" cy="60" r="58" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
        <path
          d="M20 52L60 22L100 52"
          stroke="#0056A3"
          strokeWidth="7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path d="M35 40V27H43V34" fill="#0056A3" />
        <path
          d="M30 47V84H92"
          stroke="#0056A3"
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M58 44V33L86 22V44"
          stroke="#D61F26"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 65L16 71L50 96L60 88V79"
          stroke="#D61F26"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <text
          x="61"
          y="74"
          textAnchor="middle"
          fill="#D61F26"
          fontFamily="Manrope, sans-serif"
          fontWeight="700"
          fontSize="31"
          letterSpacing="1"
        >
          BOÉ
        </text>
      </svg>
      <div className="leading-tight">
        <div className="flex items-baseline gap-1">
          <span className="font-bold text-lg tracking-tight text-[#D61F26]">BOÉ</span>
          <span className="font-bold text-sm tracking-tight text-[#0056A3]">IMMOBILIER</span>
        </div>
        <p className="text-[11px] font-semibold text-slate-600 tracking-wide">Multi-Services</p>
      </div>
    </div>
  );
}

// ============================================================================
// APPLICATION PRINCIPALE
// ============================================================================
export default function App() {
  // Injection de la police Manrope (Google Fonts) : 400, 600, 700
  useEffect(() => {
    const linkId = 'boe-manrope-font';
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  // Données du site public (catalogue et numéros de contact)
  const [properties, setProperties] = useState(IS_SUPABASE_CONFIGURED ? [] : INITIAL_PROPERTIES);
  const [propertiesLoading, setPropertiesLoading] = useState(IS_SUPABASE_CONFIGURED);
  const [propertiesError, setPropertiesError] = useState(false);

  // Lecture des annonces publiées dans Supabase (les brouillons et dépubliées n'y sont jamais renvoyés)
  useEffect(() => {
    if (!IS_SUPABASE_CONFIGURED) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `${SUPABASE_URL}/rest/v1/properties?select=*&publication_status=eq.${encodeURIComponent('Publié')}&order=featured.desc,created_at.desc`,
          { headers: { apikey: SUPABASE_KEY } }
        );
        if (!res.ok) throw new Error('Lecture impossible');
        const rows = await res.json();
        if (!cancelled && Array.isArray(rows)) setProperties(rows.map(fromSupabaseRow));
      } catch {
        // En cas d'erreur réseau : aucune fausse annonce n'est affichée
        if (!cancelled) {
          setProperties([]);
          setPropertiesError(true);
        }
      } finally {
        if (!cancelled) setPropertiesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);
  const settings = INITIAL_SETTINGS;

  // Navigation publique
  const [activeView, setActiveView] = useState('home'); // 'home' | 'detail' | 'sell'
  const [selectedPropertyId, setSelectedPropertyId] = useState('');
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);

  // Assistant de recherche guidée (Loupe / Barre de recherche)
  const [searchWizardOpen, setSearchWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1); // 1: Louer/Acheter/Vendre, 2: Appartement/Studio/Maison, 3: Journalière/Hebdomadaire/Mensuelle
  const [activeFilters, setActiveFilters] = useState({
    transaction: '', // '' | 'Louer' | 'Acheter'
    propertyType: '', // '' | 'Appartement' | 'Studio' | 'Maison'
    frequency: '', // '' | 'journalière' | 'hebdomadaire' | 'mensuelle'
    keyword: '',
  });

  // Formulaire "Devenir partenaire" / Vendre
  const [sellForm, setSellForm] = useState({
    ownerName: '',
    ownerPhone: '',
    propertyType: 'Propriétaire - Mise en vente',
    location: '',
    description: '',
  });
  const [sellSubmitted, setSellSubmitted] = useState(false);

  const [toastMessage, setToastMessage] = useState(null);
  const [bookingDuration, setBookingDuration] = useState(1); // durée de location (jours ou semaines)

  const notify = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Liste des biens publiés uniquement (les annonces dépubliées/supprimées sont invisibles au public)
  const publicProperties = useMemo(() => {
    return properties.filter((p) => p.published !== false);
  }, [properties]);

  // Filtrage issu du questionnaire de recherche guidée
  const filteredProperties = useMemo(() => {
    return publicProperties.filter((prop) => {
      if (activeFilters.transaction && prop.transactionType !== activeFilters.transaction) {
        return false;
      }
      if (activeFilters.propertyType && prop.propertyType !== activeFilters.propertyType) {
        return false;
      }
      if (
        activeFilters.transaction === 'Louer' &&
        activeFilters.frequency &&
        prop.rentalFrequency !== activeFilters.frequency
      ) {
        return false;
      }
      if (activeFilters.keyword.trim()) {
        const q = activeFilters.keyword.toLowerCase();
        const match =
          prop.title.toLowerCase().includes(q) ||
          prop.location.toLowerCase().includes(q) ||
          prop.reference.toLowerCase().includes(q) ||
          prop.propertyType.toLowerCase().includes(q);
        if (!match) return false;
      }
      return true;
    });
  }, [publicProperties, activeFilters]);

  const currentPropertyIndex = publicProperties.findIndex((p) => p.id === selectedPropertyId);
  const selectedProperty =
    currentPropertyIndex >= 0 ? publicProperties[currentPropertyIndex] : null;

  const handleOpenProperty = (id) => {
    setSelectedPropertyId(id);
    setActiveMediaIndex(0);
    setActiveView('detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePrevProperty = () => {
    if (publicProperties.length === 0) return;
    const prevIdx = (currentPropertyIndex - 1 + publicProperties.length) % publicProperties.length;
    handleOpenProperty(publicProperties[prevIdx].id);
  };

  const handleNextProperty = () => {
    if (publicProperties.length === 0) return;
    const nextIdx = (currentPropertyIndex + 1) % publicProperties.length;
    handleOpenProperty(publicProperties[nextIdx].id);
  };

  // Réinitialise la durée quand on change de bien
  useEffect(() => {
    setBookingDuration(1);
  }, [selectedPropertyId]);

  const formatPrice = (price, unit = '') => {
    if (price === null || price === undefined || price === '') return 'Prix non communiqué';
    return `${new Intl.NumberFormat('fr-FR').format(price)} FCFA ${unit}`.trim();
  };

  // Construction des liens WhatsApp (+242) et Téléphone cliquables
  // Numéro national congolais à 9 chiffres (avec le 0 initial), ex. 064583191
  const getNationalNumber = (rawPhone) => {
    let digits = String(rawPhone || '').replace(/\D/g, '');
    if (digits.startsWith('00242')) digits = digits.slice(5);
    else if (digits.startsWith('242')) digits = digits.slice(3);
    return `0${digits.replace(/^0+/, '')}`;
  };

  const formatInternationalCongo = (rawPhone) => `242${getNationalNumber(rawPhone)}`;

  // Affichage : +242 06 458 31 91
  const formatDisplayPhone = (rawPhone) => {
    const local = getNationalNumber(rawPhone).replace(/(\d{2})(\d{3})(\d{2})(\d{2})/, '$1 $2 $3 $4');
    return `+242 ${local}`;
  };

  const buildWhatsAppLink = (message) => {
    const intlPhone = formatInternationalCongo(settings.whatsappNumber);
    return `https://wa.me/${intlPhone}?text=${encodeURIComponent(message)}`;
  };

  const buildTelLink = (rawPhone) => {
    const intlPhone = formatInternationalCongo(rawPhone);
    return `tel:+${intlPhone}`;
  };

  // Ouverture du questionnaire de recherche
  const openSearchWizard = () => {
    setWizardStep(1);
    setSearchWizardOpen(true);
  };

  const resetAllFilters = () => {
    setActiveFilters({
      transaction: '',
      propertyType: '',
      frequency: '',
      keyword: '',
    });
  };

  // ==========================================================================
  // RENDU PRINCIPAL (TYPOGRAPHIE MANROPE : 700 TITRES / 600 SOUS-TITRES / 400 TEXTES)
  // ==========================================================================
  return (
    <div
      style={{ fontFamily: "'Manrope', system-ui, -apple-system, sans-serif" }}
      className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col font-normal antialiased"
    >
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-sm font-semibold flex items-center gap-2.5 border border-slate-700">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="flex-1">{toastMessage}</span>
        </div>
      )}

      {/* ======================================================================
          1. EN-TÊTE ÉPURÉ (LOUER, ACHETER, VENDRE, PARTENAIRE - SANS BARRE DE RECHERCHE)
         ====================================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 h-18 sm:h-20 flex items-center justify-between gap-3">
          <button
            onClick={() => {
              setActiveView('home');
              resetAllFilters();
            }}
            className="text-left focus:outline-none shrink-0"
          >
            <BoeLogo compact={window.innerWidth < 640} />
          </button>

          {/* Navigation Desktop : Louer, Acheter, Vendre, Partenaire */}
          <nav className="hidden md:flex items-center gap-1.5">
            <button
              onClick={() => {
                setActiveView('home');
                setActiveFilters({
                  transaction: 'Louer',
                  propertyType: '',
                  frequency: '',
                  keyword: '',
                });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeView === 'home' && activeFilters.transaction === 'Louer'
                  ? 'bg-[#0056A3] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Louer
            </button>
            <button
              onClick={() => {
                setActiveView('home');
                setActiveFilters({
                  transaction: 'Acheter',
                  propertyType: '',
                  frequency: '',
                  keyword: '',
                });
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeView === 'home' && activeFilters.transaction === 'Acheter'
                  ? 'bg-[#0056A3] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Acheter
            </button>
            <button
              onClick={() => {
                setActiveView('sell');
                setSellSubmitted(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeView === 'sell'
                  ? 'bg-[#D61F26] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Vendre
            </button>
            <button
              onClick={() => {
                setActiveView('sell');
                setSellSubmitted(false);
              }}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
                activeView === 'sell'
                  ? 'bg-[#D61F26] text-white'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              Partenaire
            </button>
          </nav>
        </div>

        {/* Navigation rapide mobile : Louer, Acheter, Vendre, Partenaire */}
        <div className="grid grid-cols-4 md:hidden border-t border-slate-100 px-3 py-2 bg-slate-50 gap-1.5">
          <button
            onClick={() => {
              setActiveView('home');
              setActiveFilters({
                transaction: 'Louer',
                propertyType: '',
                frequency: '',
                keyword: '',
              });
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold text-center truncate ${
              activeView === 'home' && activeFilters.transaction === 'Louer'
                ? 'bg-[#0056A3] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Louer
          </button>
          <button
            onClick={() => {
              setActiveView('home');
              setActiveFilters({
                transaction: 'Acheter',
                propertyType: '',
                frequency: '',
                keyword: '',
              });
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold text-center truncate ${
              activeView === 'home' && activeFilters.transaction === 'Acheter'
                ? 'bg-[#0056A3] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Acheter
          </button>
          <button
            onClick={() => {
              setActiveView('sell');
              setSellSubmitted(false);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold text-center truncate ${
              activeView === 'sell'
                ? 'bg-[#D61F26] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Vendre
          </button>
          <button
            onClick={() => {
              setActiveView('sell');
              setSellSubmitted(false);
            }}
            className={`py-2 px-2 rounded-xl text-xs font-semibold text-center truncate ${
              activeView === 'sell'
                ? 'bg-[#D61F26] text-white'
                : 'bg-white text-slate-700 border border-slate-200'
            }`}
          >
            Partenaire
          </button>
        </div>
      </header>

      {/* ======================================================================
          2. PAGE D'ACCUEIL (UNIQUEMENT LA BARRE DE RECHERCHE GUIDÉE + GRILLE)
         ====================================================================== */}
      {activeView === 'home' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
          {/* Barre de recherche compacte centrée/alignée sans le texte d'accroche */}
          <div className="flex items-center gap-2">
            <button
              onClick={openSearchWizard}
              className="flex items-center justify-between gap-3 w-full sm:w-96 px-4 py-3 bg-white border border-slate-300 hover:border-[#0056A3] rounded-full shadow-xs text-left transition"
            >
              <span className="text-sm font-normal text-slate-500 truncate">
                {activeFilters.transaction
                  ? `${activeFilters.transaction}${
                      activeFilters.propertyType ? ` · ${activeFilters.propertyType}` : ''
                    }${activeFilters.frequency ? ` (${activeFilters.frequency})` : ''}`
                  : 'Que recherchez-vous ? (Louer, Acheter...)'}
              </span>
              <span className="w-8 h-8 rounded-full bg-[#0056A3] text-white flex items-center justify-center shrink-0">
                <Search className="w-4 h-4" />
              </span>
            </button>

            {(activeFilters.transaction ||
              activeFilters.propertyType ||
              activeFilters.frequency ||
              activeFilters.keyword) && (
              <button
                onClick={resetAllFilters}
                className="px-3.5 py-2.5 rounded-full bg-slate-200 hover:bg-slate-300 text-xs font-semibold text-slate-800 shrink-0"
                title="Effacer la recherche"
              >
                Effacer
              </button>
            )}
          </div>

          {/* Grille des biens immobiliers */}
          {filteredProperties.length === 0 && propertiesLoading ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center">
              <p className="text-base font-semibold text-slate-800">Chargement des annonces…</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-10 text-center space-y-3">
              <p className="text-base font-semibold text-slate-800">
                {propertiesError
                  ? 'Impossible de charger les annonces pour le moment. Veuillez réessayer dans quelques instants.'
                  : publicProperties.length === 0
                  ? 'Aucune annonce disponible pour le moment.'
                  : 'Aucun bien ne correspond à votre sélection actuelle.'}
              </p>
              {publicProperties.length > 0 && (
                <>
                  <p className="text-sm font-normal text-slate-500">
                    Essayez d'élargir vos critères de recherche ou consultez l'ensemble de nos biens disponibles.
                  </p>
                  <button
                    onClick={resetAllFilters}
                    className="px-5 py-2.5 rounded-xl bg-[#0056A3] text-white text-sm font-semibold"
                  >
                    Afficher tous les biens
                  </button>
                </>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredProperties.map((prop) => {
                const coverMedia = prop.media[0];
                const hasVideo = prop.media.some((m) => m.type === 'video');
                const badgeColor =
                  prop.status === 'Réservé' || prop.status === 'Vendu'
                    ? 'bg-[#D61F26] text-white'
                    : prop.transactionType === 'Louer'
                    ? 'bg-[#0056A3] text-white'
                    : 'bg-slate-900 text-white';
                const badgeText =
                  prop.status !== 'Disponible'
                    ? prop.status
                    : prop.transactionType === 'Louer'
                    ? 'À louer'
                    : 'À vendre';

                return (
                  <article
                    key={prop.id}
                    onClick={() => handleOpenProperty(prop.id)}
                    className="group bg-white border border-slate-200 hover:border-[#0056A3] rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition cursor-pointer flex flex-col"
                  >
                    {/* Aperçu Média Principal */}
                    <div className="relative aspect-16/10 bg-slate-100 overflow-hidden">
                      {coverMedia?.type === 'video' ? (
                        <video
                          src={coverMedia.url}
                          className="w-full h-full object-cover"
                          muted
                          playsInline
                        />
                      ) : (
                        <img
                          src={coverMedia?.url}
                          alt={prop.title}
                          className="w-full h-full object-cover group-hover:scale-103 transition duration-300"
                        />
                      )}

                      <span
                        className={`absolute top-3 left-3 px-2.5 py-1 rounded-lg text-xs font-semibold ${badgeColor}`}
                      >
                        {badgeText}
                      </span>

                      {hasVideo && (
                        <span className="absolute bottom-3 right-3 px-2.5 py-1 rounded-lg bg-slate-900/80 text-white text-xs font-semibold flex items-center gap-1">
                          <Video className="w-3.5 h-3.5" /> Vidéo
                        </span>
                      )}
                    </div>

                    {/* Informations du Bien */}
                    <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-bold text-[#0056A3]">
                            {formatPrice(prop.price, prop.priceUnit)}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            {prop.reference}
                          </span>
                        </div>
                        <h2 className="text-base font-semibold text-slate-900 line-clamp-2 group-hover:text-[#0056A3] transition">
                          {prop.title}
                        </h2>
                        <p className="text-xs font-normal text-slate-500 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#D61F26] shrink-0" />
                          <span className="truncate">{prop.location}</span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-600">
                        <span>{prop.propertyType}</span>
                        <div className="flex items-center gap-3">
                          {prop.bedrooms > 0 && (
                            <span className="flex items-center gap-1">
                              <BedDouble className="w-3.5 h-3.5 text-slate-400" />
                              {prop.bedrooms} ch.
                            </span>
                          )}
                          {prop.area > 0 && (
                            <span className="flex items-center gap-1">
                              <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
                              {prop.area} m²
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* ======================================================================
          3. PAGE DE DÉTAIL D'UN BIEN (GALERIE + 3 ACTIONS WHATSAPP & APPELS)
         ====================================================================== */}
      {activeView === 'detail' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-6">
          {!selectedProperty ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center space-y-4">
              <p className="text-base font-semibold text-slate-800">
                Cette annonce n’est plus disponible ou a été retirée.
              </p>
              <button
                onClick={() => setActiveView('home')}
                className="px-5 py-2.5 rounded-xl bg-[#0056A3] text-white text-sm font-semibold"
              >
                Retour aux annonces
              </button>
            </div>
          ) : (
            <>
              {/* Barre de navigation entre annonces (Sans cartographie) */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  onClick={() => setActiveView('home')}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0056A3] text-sm font-semibold text-slate-800 transition"
                >
                  <ArrowLeft className="w-4 h-4" /> Retour aux annonces
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrevProperty}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0056A3] text-sm font-semibold text-slate-800 transition"
                  >
                    <ChevronLeft className="w-4 h-4" /> Bien précédent
                  </button>
                  <button
                    onClick={handleNextProperty}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#0056A3] text-sm font-semibold text-slate-800 transition"
                  >
                    Bien suivant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Colonne Gauche : Galerie Photos & Vidéos + Description */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Média Principal */}
                  <div className="bg-slate-900 rounded-2xl overflow-hidden aspect-16/10 relative border border-slate-200">
                    {selectedProperty.media[activeMediaIndex]?.type === 'video' ? (
                      <video
                        key={selectedProperty.media[activeMediaIndex].url}
                        src={selectedProperty.media[activeMediaIndex].url}
                        controls
                        autoPlay
                        className="w-full h-full object-contain bg-black"
                      />
                    ) : (
                      <img
                        src={selectedProperty.media[activeMediaIndex]?.url}
                        alt={selectedProperty.title}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Miniatures Photos & Vidéos */}
                  {selectedProperty.media.length > 1 && (
                    <div className="grid grid-cols-4 sm:grid-cols-5 gap-2.5">
                      {selectedProperty.media.map((m, idx) => (
                        <button
                          key={m.id}
                          onClick={() => setActiveMediaIndex(idx)}
                          className={`relative aspect-video rounded-xl overflow-hidden border-2 transition ${
                            idx === activeMediaIndex
                              ? 'border-[#0056A3] ring-2 ring-[#0056A3]/20'
                              : 'border-transparent opacity-75 hover:opacity-100'
                          }`}
                        >
                          {m.type === 'video' ? (
                            <>
                              <video src={m.url} className="w-full h-full object-cover" muted />
                              <span className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold">
                                ▶ Vidéo
                              </span>
                            </>
                          ) : (
                            <img src={m.url} alt="" className="w-full h-full object-cover" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Colonne Droite : Tarification & Les Trois Actions (Visite, Réservation, Contact) */}
                <aside className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-5 lg:sticky lg:top-24">
                  <div className="space-y-2 border-b border-slate-100 pb-4">
                    <div className="flex items-center justify-between gap-2">
                      <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-[#0056A3] text-xs font-semibold">
                        {selectedProperty.transactionType === 'Louer' ? 'À louer' : 'À vendre'}
                      </span>
                      <span className="text-xs font-semibold text-slate-500">
                        Réf. {selectedProperty.reference}
                      </span>
                    </div>

                    <h1 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
                      {selectedProperty.title}
                    </h1>

                    <p className="text-sm font-normal text-slate-600 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-[#D61F26] shrink-0" />
                      {selectedProperty.location}
                    </p>

                    <div className="pt-2">
                      <span className="text-2xl sm:text-3xl font-bold text-[#0056A3]">
                        {formatPrice(selectedProperty.price, selectedProperty.priceUnit)}
                      </span>
                      {selectedProperty.negotiable === 'debattre' && (
                        <p className="text-sm font-normal text-slate-600">Prix à débattre</p>
                      )}
                      {selectedProperty.priceComment && (
                        <p className="text-sm font-normal text-slate-600">{selectedProperty.priceComment}</p>
                      )}
                    </div>
                  </div>

                  {/* LES TROIS ACTIONS DEMANDÉES */}
                  <div className="space-y-3">
                    {/* A. ORGANISER UNE VISITE -> WhatsApp prérempli */}
                    <a
                      href={buildWhatsAppLink(
                        `Bonjour BOÉ MULTI-SERVICES,\n\nJe souhaite organiser une visite pour le bien immobilier suivant :\n• Référence : ${selectedProperty.reference}\n• Bien : ${selectedProperty.title}\n• Localisation : ${selectedProperty.location}\n\nMerci de m'indiquer vos disponibilités.`
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3.5 px-4 rounded-xl bg-[#0056A3] hover:bg-[#004482] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                    >
                      <Calendar className="w-4 h-4" />
                      Organiser une visite
                    </a>

                    {/* B. RÉSERVER CE BIEN -> uniquement locations journalières / hebdomadaires */}
                    {selectedProperty.transactionType === 'Louer' &&
                      (selectedProperty.rentalFrequency === 'journalière' ||
                        selectedProperty.rentalFrequency === 'hebdomadaire') &&
                      (() => {
                        const isDaily = selectedProperty.rentalFrequency === 'journalière';
                        const unitSingular = isDaily ? 'jour' : 'semaine';
                        const unitLabel = bookingDuration > 1 ? `${unitSingular}s` : unitSingular;
                        const total = selectedProperty.price * bookingDuration;
                        return (
                          <div className="space-y-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600">
                              Pour combien de {isDaily ? 'jours' : 'semaines'} souhaitez-vous louer ?
                            </label>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={() => setBookingDuration((d) => Math.max(1, d - 1))}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-lg font-bold text-slate-800"
                                aria-label="Diminuer la durée"
                              >
                                −
                              </button>
                              <input
                                type="number"
                                min="1"
                                value={bookingDuration}
                                onChange={(e) =>
                                  setBookingDuration(Math.max(1, parseInt(e.target.value, 10) || 1))
                                }
                                className="w-20 px-3 py-2.5 border border-slate-300 rounded-xl text-sm text-center font-semibold bg-white"
                              />
                              <button
                                type="button"
                                onClick={() => setBookingDuration((d) => d + 1)}
                                className="w-10 h-10 rounded-xl bg-white border border-slate-300 text-lg font-bold text-slate-800"
                                aria-label="Augmenter la durée"
                              >
                                +
                              </button>
                              <span className="text-sm font-semibold text-slate-700">{unitLabel}</span>
                            </div>
                            <p className="text-xs font-normal text-slate-600">
                              Total estimé :{' '}
                              <span className="font-semibold text-slate-900">{formatPrice(total)}</span>
                            </p>

                            <a
                              href={buildWhatsAppLink(
                                `Bonjour BOÉ MULTI-SERVICES,\n\nJe souhaite réserver ce bien immobilier :\n• Référence : ${selectedProperty.reference}\n• Bien : ${selectedProperty.title}\n• Localisation : ${selectedProperty.location}\n• Tarif : ${formatPrice(selectedProperty.price, selectedProperty.priceUnit)}\n• Durée souhaitée : ${bookingDuration} ${unitLabel}\n• Total estimé : ${formatPrice(total)}\n\nMerci de m'indiquer la démarche à suivre.`
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-full py-3.5 px-4 rounded-xl bg-[#D61F26] hover:bg-[#b5181e] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Réserver ce bien
                            </a>
                          </div>
                        );
                      })()}

                    {/* C. CONTACTER (WhatsApp + Appel Téléphonique direct) */}
                    <div className="pt-3 border-t border-slate-100 space-y-2.5">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Contacter l’agence directement
                      </p>

                      <a
                        href={buildWhatsAppLink(
                          `Bonjour BOÉ MULTI-SERVICES,\n\nJe vous contacte au sujet du bien :\n• Référence : ${selectedProperty.reference}\n• Bien : ${selectedProperty.title}\n• Localisation : ${selectedProperty.location}\n\nJ'aimerais obtenir plus d'informations.`
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="w-full py-3 px-4 rounded-xl bg-[#1B7F4A] hover:bg-[#15663b] text-white font-semibold text-sm flex items-center justify-center gap-2 transition"
                      >
                        <MessageCircle className="w-4 h-4" />
                        WhatsApp ({formatDisplayPhone(settings.whatsappNumber)})
                      </a>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <a
                          href={buildTelLink(settings.phoneSecondary)}
                          className="py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0056A3]" />
                          Appeler : {formatDisplayPhone(settings.phoneSecondary)}
                        </a>
                        <a
                          href={buildTelLink(settings.phonePrimary)}
                          className="py-3 px-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-1.5 transition"
                        >
                          <Phone className="w-3.5 h-3.5 text-[#0056A3]" />
                          Appeler : {formatDisplayPhone(settings.phonePrimary)}
                        </a>
                      </div>
                    </div>
                  </div>
                </aside>
              </div>
            </>
          )}
        </main>
      )}

      {/* ======================================================================
          4. PAGE VENDRE / DEVENIR PARTENAIRE
         ====================================================================== */}
      {activeView === 'sell' && (
        <main className="flex-1 max-w-2xl w-full mx-auto px-3 sm:px-6 py-6 sm:py-10 space-y-6">
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">
              Vendre ou devenir partenaire
            </h1>
            <p className="text-sm font-normal text-slate-600 leading-relaxed">
              Vous êtes propriétaire, bailleur ou partenaire immobilier à Pointe-Noire ? Confiez-nous la vente ou la gestion locative de votre bien. Remplissez le formulaire ci-dessous ou contactez-nous directement.
            </p>
          </div>

          {sellSubmitted ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-900">Dernière étape : envoyez votre demande</h2>
              <p className="text-sm font-normal text-slate-600 leading-relaxed">
                Merci <strong>{sellForm.ownerName}</strong>. Votre demande est prête : appuyez sur le bouton ci-dessous pour l'envoyer à BOÉ MULTI-SERVICES sur WhatsApp. L'équipe vous recontactera au <strong>{sellForm.ownerPhone}</strong>.
              </p>
              <div className="flex flex-wrap gap-3 pt-2">
                <a
                  href={buildWhatsAppLink(
                    `Bonjour BOÉ MULTI-SERVICES,\n\nJe souhaite proposer un bien / devenir partenaire :\n• Nom : ${sellForm.ownerName}\n• Téléphone : ${sellForm.ownerPhone}\n• Type : ${sellForm.propertyType}\n• Localisation : ${sellForm.location}\n• Détails : ${sellForm.description}`
                  )}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-3 rounded-xl bg-[#1B7F4A] text-white text-sm font-semibold inline-flex items-center gap-2"
                >
                  <MessageCircle className="w-4 h-4" /> Envoyer sur WhatsApp
                </a>
                <button
                  onClick={() => {
                    setSellSubmitted(false);
                    setActiveView('home');
                  }}
                  className="px-5 py-3 rounded-xl border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Retour aux annonces
                </button>
              </div>
            </div>
          ) : (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setSellSubmitted(true);
              }}
              className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Nom et prénom *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Jean-Marc Mavoungou"
                  value={sellForm.ownerName}
                  onChange={(e) => setSellForm({ ...sellForm, ownerName: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:border-[#0056A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Numéro de téléphone (WhatsApp / Appel) *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="Ex: 06 458 31 91"
                  value={sellForm.ownerPhone}
                  onChange={(e) => setSellForm({ ...sellForm, ownerPhone: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:border-[#0056A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Nature de votre demande *
                </label>
                <select
                  value={sellForm.propertyType}
                  onChange={(e) => setSellForm({ ...sellForm, propertyType: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:border-[#0056A3]"
                >
                  <option value="Propriétaire - Mise en vente">Propriétaire — Mise en vente d'un bien</option>
                  <option value="Propriétaire - Mise en location">Propriétaire — Mise en location d'un bien</option>
                  <option value="Partenaire / Apporteur d'affaires">Partenaire / Apporteur d'affaires</option>
                  <option value="Promoteur immobilier">Promoteur immobilier</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Quartier / Localisation du bien *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Côte Sauvage, Loandjili, Centre-ville..."
                  value={sellForm.location}
                  onChange={(e) => setSellForm({ ...sellForm, location: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:border-[#0056A3]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-700 mb-1.5">
                  Description rapide du bien ou du partenariat
                </label>
                <textarea
                  rows="4"
                  placeholder="Nombre de chambres, superficie, prix souhaité ou précisions..."
                  value={sellForm.description}
                  onChange={(e) => setSellForm({ ...sellForm, description: e.target.value })}
                  className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm font-normal focus:outline-none focus:border-[#0056A3]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-[#0056A3] hover:bg-[#004482] text-white text-sm font-semibold transition"
              >
                Envoyer ma proposition
              </button>
            </form>
          )}
        </main>
      )}

      {/* ======================================================================
          6. MODAL QUESTIONNAIRE DE RECHERCHE INTERACTIF (AU CLIC SUR LA LOUPE)
         ====================================================================== */}
      {searchWizardOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-5 sm:p-6 space-y-5 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#0056A3]">
                  Recherche guidée · Étape {wizardStep}
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                  {wizardStep === 1 && 'Que voulez-vous faire ?'}
                  {wizardStep === 2 &&
                    (activeFilters.transaction === 'Louer'
                      ? 'Que voulez-vous louer ?'
                      : 'Quel type de bien souhaitez-vous acheter ?')}
                  {wizardStep === 3 && 'Quelle durée de location recherchez-vous ?'}
                </h2>
              </div>
              <button
                onClick={() => setSearchWizardOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ÉTAPE 1 : Louez, Achetez, Vendre */}
            {wizardStep === 1 && (
              <div className="space-y-3">
                <button
                  onClick={() => {
                    setActiveFilters({
                      transaction: 'Louer',
                      propertyType: '',
                      frequency: '',
                      keyword: '',
                    });
                    setWizardStep(2);
                  }}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-[#0056A3] text-left transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-base font-bold text-slate-900">Louer</p>
                    <p className="text-xs font-normal text-slate-500">
                      Appartement, studio ou maison à louer
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#0056A3]" />
                </button>

                <button
                  onClick={() => {
                    setActiveFilters({
                      transaction: 'Acheter',
                      propertyType: '',
                      frequency: '',
                      keyword: '',
                    });
                    setWizardStep(2);
                  }}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-[#0056A3] text-left transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-base font-bold text-slate-900">Acheter</p>
                    <p className="text-xs font-normal text-slate-500">
                      Acquérir un bien immobilier à Pointe-Noire
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#0056A3]" />
                </button>

                <button
                  onClick={() => {
                    setSearchWizardOpen(false);
                    setActiveView('sell');
                    setSellSubmitted(false);
                  }}
                  className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-[#D61F26] text-left transition flex items-center justify-between"
                >
                  <div>
                    <p className="text-base font-bold text-[#D61F26]">Vendre</p>
                    <p className="text-xs font-normal text-slate-500">
                      Proposer votre bien immobilier à la vente ou location
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-[#D61F26]" />
                </button>
              </div>
            )}

            {/* ÉTAPE 2 : Appartement, Studio, Maison */}
            {wizardStep === 2 && (
              <div className="space-y-3">
                {['Appartement', 'Studio', 'Maison'].map((type) => (
                  <button
                    key={type}
                    onClick={() => {
                      const updated = { ...activeFilters, propertyType: type };
                      setActiveFilters(updated);
                      if (activeFilters.transaction === 'Louer') {
                        setWizardStep(3);
                      } else {
                        setSearchWizardOpen(false);
                        setActiveView('home');
                      }
                    }}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-[#0056A3] text-left transition flex items-center justify-between"
                  >
                    <span className="text-base font-semibold text-slate-900">{type}</span>
                    <ChevronRight className="w-5 h-5 text-[#0056A3]" />
                  </button>
                ))}

                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => {
                      setSearchWizardOpen(false);
                      setActiveView('home');
                    }}
                    className="text-xs font-semibold text-[#0056A3]"
                  >
                    Voir tous les résultats
                  </button>
                </div>
              </div>
            )}

            {/* ÉTAPE 3 : Location journalière, hebdomadaire, mensuelle */}
            {wizardStep === 3 && (
              <div className="space-y-3">
                {[
                  { id: 'journalière', label: 'Location journalière' },
                  { id: 'hebdomadaire', label: 'Location hebdomadaire' },
                  { id: 'mensuelle', label: 'Location mensuelle' },
                ].map((freq) => (
                  <button
                    key={freq.id}
                    onClick={() => {
                      setActiveFilters({ ...activeFilters, frequency: freq.id });
                      setSearchWizardOpen(false);
                      setActiveView('home');
                    }}
                    className="w-full p-4 rounded-xl border-2 border-slate-200 hover:border-[#0056A3] text-left transition flex items-center justify-between"
                  >
                    <span className="text-base font-semibold text-slate-900">{freq.label}</span>
                    <ChevronRight className="w-5 h-5 text-[#0056A3]" />
                  </button>
                ))}

                <div className="pt-2 flex justify-between items-center">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                  >
                    ← Retour
                  </button>
                  <button
                    onClick={() => {
                      setSearchWizardOpen(false);
                      setActiveView('home');
                    }}
                    className="text-xs font-semibold text-[#0056A3]"
                  >
                    Toutes les durées
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ======================================================================
          7. PIED DE PAGE ÉPURÉ
         ====================================================================== */}
      <footer className="bg-white border-t border-slate-200 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <BoeLogo compact />
          <p className="text-xs font-normal text-slate-500">
            © {new Date().getFullYear()} BOÉ MULTI-SERVICES · Pointe-Noire, République du Congo.
          </p>
          <div className="flex items-center gap-4 text-xs font-semibold text-slate-600">
            <button
              onClick={() => {
                setActiveView('home');
                setActiveFilters({
                  transaction: 'Louer',
                  propertyType: '',
                  frequency: '',
                  keyword: '',
                });
              }}
            >
              Louer
            </button>
            <button
              onClick={() => {
                setActiveView('home');
                setActiveFilters({
                  transaction: 'Acheter',
                  propertyType: '',
                  frequency: '',
                  keyword: '',
                });
              }}
            >
              Acheter
            </button>
            <button
              onClick={() => {
                setActiveView('sell');
                setSellSubmitted(false);
              }}
              className="text-[#D61F26]"
            >
              Vendre
            </button>
            <button
              onClick={() => {
                setActiveView('sell');
                setSellSubmitted(false);
              }}
              className="text-[#D61F26]"
            >
              Partenaire
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
