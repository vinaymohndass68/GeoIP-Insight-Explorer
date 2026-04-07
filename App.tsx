
import React, { useState, useEffect, useCallback } from 'react';
import { Search, MapPin, Globe, Cpu, Hash, Clock, Landmark, Sparkles, AlertCircle, Loader2, X, Info, RefreshCw, Link as LinkIcon, ShieldAlert } from 'lucide-react';
import { fetchIpData } from './services/ipService';
import { getLocationInsights, getIpLocationViaSearch, SearchGroundingSource } from './services/geminiService';
import { IpData, LocationInsight } from './types';
import WorldMap from './components/WorldMap';

const App: React.FC = () => {
  const [ipInput, setIpInput] = useState('');
  const [ipData, setIpData] = useState<IpData | null>(null);
  const [insight, setInsight] = useState<LocationInsight | null>(null);
  const [sources, setSources] = useState<SearchGroundingSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDeepSearching, setIsDeepSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = useCallback(async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    setLoading(true);
    setError(null);
    setSources([]);
    setIsDeepSearching(false);
    
    try {
      // Try standard APIs first
      const data = await fetchIpData(ipInput);
      setIpData(data);
      loadAiInsights(data);
    } catch (err: any) {
      if (err.message === 'API_BLOCK') {
        // All APIs blocked by network - trigger AI Deep Search
        setIsDeepSearching(true);
        try {
          const { data, sources: searchSources } = await getIpLocationViaSearch(ipInput);
          setIpData(data);
          setSources(searchSources);
          loadAiInsights(data);
        } catch (searchErr: any) {
          setError("Even Deep Search was unable to bypass your network's restrictions. Please check your internet connection.");
          setIpData(null);
        }
      } else {
        setError(err.message || 'An unexpected error occurred.');
        setIpData(null);
      }
    } finally {
      setLoading(false);
    }
  }, [ipInput]);

  const loadAiInsights = async (data: IpData) => {
    if (data.city) {
      try {
        const aiInsight = await getLocationInsights(data.city, data.country_name);
        setInsight(aiInsight);
      } catch (aiErr) {
        console.warn("Could not load AI insights:", aiErr);
      }
    }
  };

  useEffect(() => {
    handleSearch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearSearch = () => {
    setIpInput('');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 selection:bg-blue-500/30">
      <header className="max-w-6xl mx-auto mb-10 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-cyan-300 to-indigo-400">
          GeoIP Insight Explorer
        </h1>
        <p className="text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
          Uncover the physical reality behind any digital address. Real-time geolocation enhanced by Gemini AI insights.
        </p>
      </header>

      <div className="max-w-2xl mx-auto mb-12">
        <form onSubmit={handleSearch} className="relative group">
          <input
            type="text"
            value={ipInput}
            onChange={(e) => setIpInput(e.target.value)}
            placeholder="Enter an IP address (e.g., 8.8.8.8)"
            className={`w-full bg-slate-900 border-2 rounded-2xl py-4 px-6 pl-14 pr-32 text-lg focus:outline-none transition-all shadow-2xl group-hover:border-slate-700 ${error ? 'border-red-900/50' : 'border-slate-800 focus:border-blue-500/50'}`}
          />
          <Search className={`absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 transition-colors ${error ? 'text-red-500' : 'text-slate-500'}`} />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
            {ipInput && !loading && (
              <button type="button" onClick={clearSearch} className="p-2 text-slate-500 hover:text-slate-300 transition-colors">
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-500 text-white px-5 py-2 rounded-xl font-semibold tracking-wide transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-900/20"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Trace IP'}
            </button>
          </div>
        </form>

        {isDeepSearching && loading && (
          <div className="mt-4 flex items-center justify-center gap-3 text-amber-400 animate-pulse bg-amber-950/20 py-2 rounded-xl border border-amber-900/30">
            <Sparkles className="w-4 h-4" />
            <span className="text-sm font-bold uppercase tracking-wider">APIs Blocked: Activating AI Deep Search...</span>
          </div>
        )}

        {error && (
          <div className="mt-5 relative overflow-hidden flex flex-col gap-4 text-red-100 bg-red-950/30 border border-red-900/40 p-6 rounded-2xl animate-in fade-in slide-in-from-top-3 duration-300 shadow-xl">
            <div className="absolute top-0 left-0 w-1.5 h-full bg-red-600/80" />
            <div className="flex items-start gap-4">
              <div className="bg-red-900/40 p-2.5 rounded-xl flex-shrink-0">
                <ShieldAlert className="w-6 h-6 text-red-400" />
              </div>
              <div className="flex flex-col flex-grow pr-8">
                <span className="font-bold text-xs uppercase tracking-[0.2em] text-red-400 mb-1">Critical Connection Issue</span>
                <p className="text-[15px] text-red-100/90 leading-relaxed font-semibold">{error}</p>
                <div className="mt-4 space-y-3 bg-red-950/40 p-4 rounded-xl border border-red-900/20">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-300 uppercase tracking-wider">
                    <Info className="w-3.5 h-3.5" />
                    Technical Details
                  </div>
                  <p className="text-xs text-red-200/60 leading-relaxed">
                    Standard geolocation providers are currently unreachable from your location. This is often caused by 
                    <strong> Android/Mobile Firewalls</strong>, <strong>Corporate VPNs</strong>, or strict <strong>Ad-Blockers</strong>.
                  </p>
                  <button 
                    onClick={() => handleSearch()}
                    className="mt-2 flex items-center gap-2 text-[11px] font-bold text-white bg-red-600/20 hover:bg-red-600/40 px-3 py-1.5 rounded-lg border border-red-600/30 transition-all uppercase tracking-widest"
                  >
                    <RefreshCw className="w-3 h-3" />
                    Retry Deep Search
                  </button>
                </div>
              </div>
            </div>
            <button onClick={() => setError(null)} className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-white/10 text-red-400/70 hover:text-white transition-all">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {ipData && (
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl overflow-hidden relative group/card">
              {isDeepSearching && (
                <div className="absolute top-4 left-4 bg-amber-500/10 text-amber-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border border-amber-500/20 flex items-center gap-2">
                  <Sparkles className="w-3 h-3" /> AI Deep Search Active
                </div>
              )}
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover/card:opacity-10 transition-opacity pointer-events-none">
                <Globe className="w-32 h-32" />
              </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 mt-4 md:mt-0">
                <div>
                  <span className="text-blue-400 font-bold uppercase tracking-widest text-xs mb-2 block">Detected Node</span>
                  <h2 className="text-4xl font-mono font-bold text-white tracking-tight">{ipData.ip}</h2>
                </div>
                <div className="flex gap-3 flex-wrap">
                  <div className="bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-700/50">
                    <span className="text-slate-500 text-[10px] block font-black uppercase tracking-widest mb-0.5">ISP</span>
                    <span className="text-sm font-semibold text-slate-200">{ipData.org || 'Unavailable'}</span>
                  </div>
                  <div className="bg-slate-800/40 px-4 py-2 rounded-xl border border-slate-700/50">
                    <span className="text-slate-500 text-[10px] block font-black uppercase tracking-widest mb-0.5">ASN</span>
                    <span className="text-sm font-semibold text-slate-200">{ipData.asn || 'N/A'}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                <InfoItem icon={<MapPin className="text-blue-400" />} label="Location" value={`${ipData.city || 'Unknown'}, ${ipData.country_name || 'Global'}`} />
                <InfoItem icon={<Hash className="text-purple-400" />} label="Postal" value={ipData.postal || 'N/A'} />
                <InfoItem icon={<Clock className="text-emerald-400" />} label="Timezone" value={ipData.timezone || 'UTC'} />
                <InfoItem icon={<Cpu className="text-amber-400" />} label="Region" value={ipData.region || 'N/A'} />
              </div>
            </div>

            <div className="bg-slate-900 rounded-3xl p-8 border border-slate-800 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-400" />
                  Geospatial Visualization
                </h3>
                <div className="flex gap-4 text-slate-500 text-[11px] font-mono tracking-wider bg-slate-800/30 px-3 py-1.5 rounded-lg border border-slate-700/50">
                  <span>LAT: {ipData.latitude?.toFixed(4) ?? '0.0000'}°</span>
                  <span>LNG: {ipData.longitude?.toFixed(4) ?? '0.0000'}°</span>
                </div>
              </div>
              <WorldMap lat={ipData.latitude || 0} lng={ipData.longitude || 0} />
              
              {/* Search Grounding Sources (Mandatory per API rules) */}
              {sources.length > 0 && (
                <div className="mt-8 pt-6 border-t border-slate-800">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-500 mb-4 flex items-center gap-2">
                    <LinkIcon className="w-3 h-3" />
                    Search Intelligence Sources
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {sources.slice(0, 4).map((source, i) => (
                      <a 
                        key={i} 
                        href={source.uri} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-slate-950/50 p-3 rounded-xl border border-slate-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all group"
                      >
                        <div className="bg-slate-800 p-1.5 rounded group-hover:bg-blue-500/20 transition-colors">
                          <Globe className="w-3 h-3 text-slate-400 group-hover:text-blue-400" />
                        </div>
                        <span className="text-xs font-medium text-slate-400 group-hover:text-slate-200 truncate">{source.title}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-gradient-to-br from-indigo-900/40 via-slate-900 to-slate-950 rounded-3xl p-8 border border-indigo-500/20 shadow-2xl relative h-full flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="bg-gradient-to-tr from-indigo-500 to-purple-500 p-2.5 rounded-xl shadow-lg shadow-indigo-500/20">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <h3 className="text-xl font-bold">Local Intelligence</h3>
              </div>

              {!insight ? (
                <div className="space-y-6 flex-grow">
                  <div className="space-y-3">
                    <div className="h-4 bg-slate-800/50 rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-800/50 rounded-full w-full animate-pulse"></div>
                    <div className="h-4 bg-slate-800/50 rounded-full w-2/3 animate-pulse"></div>
                  </div>
                  <div className="h-24 bg-slate-800/30 rounded-2xl w-full animate-pulse mt-8"></div>
                </div>
              ) : (
                <div className="space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-1000 flex-grow">
                  <section>
                    <h4 className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-3">Regional Summary</h4>
                    <p className="text-slate-300 leading-relaxed text-[15px]">{insight.summary}</p>
                  </section>
                  <section>
                    <h4 className="text-amber-400 text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" />
                      Did You Know?
                    </h4>
                    <p className="text-slate-300 leading-relaxed italic text-[15px] bg-slate-800/20 p-4 rounded-xl border border-slate-700/30">
                      "{insight.funFact}"
                    </p>
                  </section>
                  <section className="mt-auto">
                    <div className="bg-indigo-500/10 p-5 rounded-2xl border border-indigo-500/20 shadow-inner">
                      <h4 className="text-blue-300 text-xs font-black uppercase tracking-[0.2em] mb-3 flex items-center gap-2">
                        <Landmark className="w-4 h-4" />
                        Top Landmark
                      </h4>
                      <p className="text-white font-bold text-lg">{insight.topLandmark}</p>
                    </div>
                  </section>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <footer className="max-w-6xl mx-auto mt-24 pb-8 text-center text-slate-600 text-sm font-medium">
        <p className="opacity-60 hover:opacity-100 transition-opacity">
          &copy; 2024 GeoIP Insight Explorer • Powered by Gemini AI & D3.js
        </p>
      </footer>
    </div>
  );
};

const InfoItem: React.FC<{ icon: React.ReactNode; label: string; value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-2 group/item">
    <div className="flex items-center gap-2 text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] group-hover/item:text-slate-400 transition-colors">
      {icon}
      {label}
    </div>
    <div className="text-lg font-bold text-slate-100 truncate pr-2" title={value}>{value}</div>
  </div>
);

export default App;
