import { useState, useEffect } from 'react';
import { Plus, Trash2, Calendar, Sun, PartyPopper } from 'lucide-react';

interface AgendaSettings {
  startDate: string;
  endDate: string;
  startTime: string;
  endTime: string;
  lessonDays: number[];
}

interface Vacation {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
}

interface AgendaEvent {
  id: string;
  title: string;
  date: string;
  startTime: string | null;
  endTime: string | null;
  description: string;
}

interface AgendaViewProps {
  language: 'tr' | 'nl';
  apiRequest: (endpoint: string, options?: RequestInit) => Promise<any>;
}

const DAY_NAMES_NL = ['Zondag', 'Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag'];
const DAY_NAMES_TR = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export default function AgendaView({ language, apiRequest }: AgendaViewProps) {
  const [settings, setSettings] = useState<AgendaSettings | null>(null);
  const [vacations, setVacations] = useState<Vacation[]>([]);
  const [events, setEvents] = useState<AgendaEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Settings form
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('12:00');
  const [lessonDays, setLessonDays] = useState<number[]>([0, 6]); // default Sunday & Saturday

  // Vacation form
  const [showVacationForm, setShowVacationForm] = useState(false);
  const [vacName, setVacName] = useState('');
  const [vacStart, setVacStart] = useState('');
  const [vacEnd, setVacEnd] = useState('');

  // Event form
  const [showEventForm, setShowEventForm] = useState(false);
  const [evtTitle, setEvtTitle] = useState('');
  const [evtDate, setEvtDate] = useState('');
  const [evtStart, setEvtStart] = useState('');
  const [evtEnd, setEvtEnd] = useState('');
  const [evtDesc, setEvtDesc] = useState('');

  const dayNames = language === 'tr' ? DAY_NAMES_TR : DAY_NAMES_NL;

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [settingsRes, vacRes, evtRes] = await Promise.all([
        apiRequest('/agenda/settings'),
        apiRequest('/agenda/vacations'),
        apiRequest('/agenda/events'),
      ]);
      if (settingsRes.settings) {
        const s = settingsRes.settings;
        setSettings(s);
        setStartDate(s.startDate);
        setEndDate(s.endDate);
        setStartTime(s.startTime);
        setEndTime(s.endTime);
        setLessonDays(s.lessonDays || [0, 6]);
      }
      setVacations((vacRes.vacations || []).sort((a: Vacation, b: Vacation) => a.startDate.localeCompare(b.startDate)));
      setEvents((evtRes.events || []).sort((a: AgendaEvent, b: AgendaEvent) => a.date.localeCompare(b.date)));
    } catch (err) {
      console.error('Load agenda error:', err);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    if (!startDate || !endDate || !startTime || !endTime) {
      alert(language === 'tr' ? 'Tüm alanları doldurun' : 'Vul alle velden in');
      return;
    }
    try {
      await apiRequest('/agenda/settings', {
        method: 'PUT',
        body: JSON.stringify({ startDate, endDate, startTime, endTime, lessonDays }),
      });
      alert(language === 'tr' ? 'Ayarlar kaydedildi' : 'Instellingen opgeslagen');
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const toggleDay = (day: number) => {
    setLessonDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  const addVacation = async () => {
    if (!vacName || !vacStart || !vacEnd) return;
    try {
      await apiRequest('/agenda/vacations', {
        method: 'POST',
        body: JSON.stringify({ name: vacName, startDate: vacStart, endDate: vacEnd }),
      });
      setVacName(''); setVacStart(''); setVacEnd('');
      setShowVacationForm(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const deleteVacation = async (id: string) => {
    if (!confirm(language === 'tr' ? 'Bu tatili silmek istediğinizden emin misiniz?' : 'Weet u zeker dat u deze vakantie wilt verwijderen?')) return;
    await apiRequest(`/agenda/vacations/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const addEvent = async () => {
    if (!evtTitle || !evtDate) return;
    try {
      await apiRequest('/agenda/events', {
        method: 'POST',
        body: JSON.stringify({ title: evtTitle, date: evtDate, startTime: evtStart || null, endTime: evtEnd || null, description: evtDesc }),
      });
      setEvtTitle(''); setEvtDate(''); setEvtStart(''); setEvtEnd(''); setEvtDesc('');
      setShowEventForm(false);
      loadAll();
    } catch (err: any) {
      alert(err.message || 'Error');
    }
  };

  const deleteEvent = async (id: string) => {
    if (!confirm(language === 'tr' ? 'Bu etkinliği silmek istediğinizden emin misiniz?' : 'Weet u zeker dat u dit evenement wilt verwijderen?')) return;
    await apiRequest(`/agenda/events/${id}`, { method: 'DELETE' });
    loadAll();
  };

  const formatDate = (d: string) => {
    const date = new Date(d + 'T00:00:00');
    return date.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  // Count total lesson days
  const countLessonDays = () => {
    if (!startDate || !endDate || lessonDays.length === 0) return 0;
    let count = 0;
    const start = new Date(startDate + 'T00:00:00');
    const end = new Date(endDate + 'T00:00:00');
    const vacSet = new Set<string>();
    for (const v of vacations) {
      const vs = new Date(v.startDate + 'T00:00:00');
      const ve = new Date(v.endDate + 'T00:00:00');
      for (let d = new Date(vs); d <= ve; d.setDate(d.getDate() + 1)) {
        vacSet.add(d.toISOString().split('T')[0]);
      }
    }
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      if (lessonDays.includes(d.getDay()) && !vacSet.has(d.toISOString().split('T')[0])) {
        count++;
      }
    }
    return count;
  };

  if (loading) return <div className="text-center py-8 text-gray-500">{language === 'tr' ? 'Yükleniyor...' : 'Laden...'}</div>;

  return (
    <div className="space-y-6">
      {/* Lesson Structure Settings */}
      <div className="bg-emerald-50 rounded-xl p-4 sm:p-6">
        <h3 className="text-lg font-bold text-emerald-800 mb-4 flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          {language === 'tr' ? 'Ders Yapısı' : 'Lesstructuur'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'tr' ? 'Başlangıç Tarihi' : 'Startdatum'}
            </label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'tr' ? 'Bitiş Tarihi' : 'Einddatum'}
            </label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'tr' ? 'Ders Başlangıç Saati' : 'Begintijd les'}
            </label>
            <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {language === 'tr' ? 'Ders Bitiş Saati' : 'Eindtijd les'}
            </label>
            <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {language === 'tr' ? 'Ders Günleri' : 'Lesdagen'}
          </label>
          <div className="flex flex-wrap gap-2">
            {dayNames.map((name, i) => (
              <button key={i} onClick={() => toggleDay(i)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                  lessonDays.includes(i)
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white text-gray-500 border hover:border-emerald-300'
                }`}>
                {name}
              </button>
            ))}
          </div>
        </div>

        {startDate && endDate && (
          <div className="text-sm text-emerald-700 mb-4">
            {language === 'tr' ? 'Toplam ders günü' : 'Totaal lesdagen'}: <strong>{countLessonDays()}</strong>
            {' '}({formatDate(startDate)} — {formatDate(endDate)})
          </div>
        )}

        <button onClick={saveSettings}
          className="bg-emerald-600 text-white px-5 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition">
          {language === 'tr' ? 'Kaydet' : 'Opslaan'}
        </button>
      </div>

      {/* Vacation Days */}
      <div className="bg-orange-50 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-orange-800 flex items-center gap-2">
            <Sun className="w-5 h-5" />
            {language === 'tr' ? 'Tatil Günleri' : 'Vakantiedagen'}
          </h3>
          <button onClick={() => setShowVacationForm(v => !v)}
            className="flex items-center gap-1 bg-orange-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition">
            <Plus className="w-4 h-4" />
            {language === 'tr' ? 'Ekle' : 'Toevoegen'}
          </button>
        </div>

        {showVacationForm && (
          <div className="bg-white rounded-lg p-4 mb-4 border border-orange-200 space-y-3">
            <input type="text" placeholder={language === 'tr' ? 'Tatil adı (ör. Kış Tatili)' : 'Naam (bijv. Kerstvakantie)'}
              value={vacName} onChange={e => setVacName(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{language === 'tr' ? 'Başlangıç' : 'Van'}</label>
                <input type="date" value={vacStart} onChange={e => setVacStart(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{language === 'tr' ? 'Bitiş' : 'Tot'}</label>
                <input type="date" value={vacEnd} onChange={e => setVacEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={addVacation}
                className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-700">
                {language === 'tr' ? 'Kaydet' : 'Opslaan'}
              </button>
              <button onClick={() => setShowVacationForm(false)}
                className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100">
                {language === 'tr' ? 'İptal' : 'Annuleren'}
              </button>
            </div>
          </div>
        )}

        {vacations.length === 0 ? (
          <p className="text-sm text-orange-600">{language === 'tr' ? 'Henüz tatil günü eklenmedi' : 'Nog geen vakantiedagen toegevoegd'}</p>
        ) : (
          <div className="space-y-2">
            {vacations.map(v => (
              <div key={v.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-orange-100">
                <div>
                  <span className="font-medium text-sm">{v.name}</span>
                  <span className="text-xs text-gray-500 ml-2">{formatDate(v.startDate)} — {formatDate(v.endDate)}</span>
                </div>
                <button onClick={() => deleteVacation(v.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Events */}
      <div className="bg-blue-50 rounded-xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-blue-800 flex items-center gap-2">
            <PartyPopper className="w-5 h-5" />
            {language === 'tr' ? 'Etkinlikler' : 'Evenementen'}
          </h3>
          <button onClick={() => setShowEventForm(v => !v)}
            className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700 transition">
            <Plus className="w-4 h-4" />
            {language === 'tr' ? 'Ekle' : 'Toevoegen'}
          </button>
        </div>

        {showEventForm && (
          <div className="bg-white rounded-lg p-4 mb-4 border border-blue-200 space-y-3">
            <input type="text" placeholder={language === 'tr' ? 'Etkinlik adı' : 'Evenement titel'}
              value={evtTitle} onChange={e => setEvtTitle(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" />
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">{language === 'tr' ? 'Tarih' : 'Datum'}</label>
                <input type="date" value={evtDate} onChange={e => setEvtDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{language === 'tr' ? 'Başlangıç' : 'Van'}</label>
                <input type="time" value={evtStart} onChange={e => setEvtStart(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">{language === 'tr' ? 'Bitiş' : 'Tot'}</label>
                <input type="time" value={evtEnd} onChange={e => setEvtEnd(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm" />
              </div>
            </div>
            <textarea placeholder={language === 'tr' ? 'Açıklama (opsiyonel)' : 'Beschrijving (optioneel)'}
              value={evtDesc} onChange={e => setEvtDesc(e.target.value)}
              className="w-full border rounded-lg px-3 py-2 text-sm" rows={2} />
            <div className="flex gap-2">
              <button onClick={addEvent}
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-700">
                {language === 'tr' ? 'Kaydet' : 'Opslaan'}
              </button>
              <button onClick={() => setShowEventForm(false)}
                className="text-gray-500 px-4 py-1.5 rounded-lg text-sm hover:bg-gray-100">
                {language === 'tr' ? 'İptal' : 'Annuleren'}
              </button>
            </div>
          </div>
        )}

        {events.length === 0 ? (
          <p className="text-sm text-blue-600">{language === 'tr' ? 'Henüz etkinlik eklenmedi' : 'Nog geen evenementen toegevoegd'}</p>
        ) : (
          <div className="space-y-2">
            {events.map(ev => (
              <div key={ev.id} className="flex items-center justify-between bg-white rounded-lg px-4 py-3 border border-blue-100">
                <div>
                  <span className="font-medium text-sm">{ev.title}</span>
                  <span className="text-xs text-gray-500 ml-2">
                    {formatDate(ev.date)}
                    {ev.startTime && ev.endTime && ` · ${ev.startTime} - ${ev.endTime}`}
                  </span>
                  {ev.description && <p className="text-xs text-gray-400 mt-0.5">{ev.description}</p>}
                </div>
                <button onClick={() => deleteEvent(ev.id)} className="text-red-400 hover:text-red-600 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
