import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Loader2, MapPin, Building2, BrainCircuit } from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapUpdater({ coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (coordinates) {
      map.flyTo(coordinates, 16, { duration: 2 });
    }
  }, [coordinates, map]);
  return null;
}

export default function App() {
  const [address, setAddress] = useState('');
  const [status, setStatus] = useState('');
  const [content, setContent] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [coordinates, setCoordinates] = useState(null); // [lat, lng]
  
  const ws = useRef(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [content, status]);

  const handleAnalyze = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;

    setIsAnalyzing(true);
    setContent('');
    setStatus('Connecting to Agent...');
    setCoordinates([40.7128, -74.0060]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address })
      });

      if (!response.body) throw new Error('ReadableStream not supported');

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.replace('data: ', '').trim();
            if (!dataStr) continue;
            
            try {
              const data = JSON.parse(dataStr);
              if (data.type === 'status') {
                setStatus(data.content);
                if (data.content.includes('"lat":') && data.content.includes('"lon":')) {
                  try {
                    const matchLat = data.content.match(/"lat":\\s*([-\\d.]+)/);
                    const matchLon = data.content.match(/"lon":\\s*([-\\d.]+)/);
                    if (matchLat && matchLon) {
                        setCoordinates([parseFloat(matchLat[1]), parseFloat(matchLon[1])]);
                    }
                  } catch(e) {}
                }
              } else if (data.type === 'content_chunk') {
                setContent((prev) => prev + data.content);
                setStatus('Synthesizing Assessment...');
              } else if (data.type === 'done') {
                setIsAnalyzing(false);
                setStatus('Analysis Complete');
              } else if (data.type === 'error') {
                setIsAnalyzing(false);
                setStatus(`Error: ${data.content}`);
              }
            } catch (e) {
              console.error('Error parsing JSON chunk', e, dataStr);
            }
          }
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setStatus('Connection Failed.');
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <motion.header 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/20 rounded-xl border border-indigo-500/30">
              <Building2 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                Agentic Site Intelligence
              </h1>
              <p className="text-slate-400 text-sm">Powered by LangGraph & Claude 3.5</p>
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left Column: Input & Map */}
          <div className="space-y-8">
            <motion.form 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              onSubmit={handleAnalyze} 
              className="glass-panel p-2 flex gap-2"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input 
                  type="text" 
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter NYC Address (e.g., 350 5th Ave, Manhattan)"
                  className="w-full bg-transparent border-none py-4 pl-12 pr-4 text-lg focus:outline-none focus:ring-0 placeholder-slate-500"
                  disabled={isAnalyzing}
                />
              </div>
              <button 
                type="submit" 
                disabled={isAnalyzing || !address.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 px-8 rounded-xl font-medium transition-colors flex items-center gap-2"
              >
                {isAnalyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <BrainCircuit className="w-5 h-5" />}
                Analyze
              </button>
            </motion.form>

            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="glass-panel overflow-hidden h-[500px] relative z-0"
            >
              <MapContainer 
                center={coordinates || [40.7128, -74.0060]} 
                zoom={12} 
                style={{ height: '100%', width: '100%', backgroundColor: '#0f172a' }}
                zoomControl={false}
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                />
                {coordinates && (
                  <Marker position={coordinates}>
                    <Popup>Subject Property</Popup>
                  </Marker>
                )}
                <MapUpdater coordinates={coordinates} />
              </MapContainer>
              
              {/* Overlay Status */}
              <AnimatePresence>
                {status && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute bottom-6 left-6 right-6 bg-slate-900/80 backdrop-blur-md border border-slate-700 p-4 rounded-xl flex items-center gap-4 z-[400]"
                  >
                    {isAnalyzing && <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />}
                    <p className="font-mono text-sm text-slate-300">{status}</p>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>

          {/* Right Column: AI Output */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-panel p-8 h-[600px] lg:h-[calc(500px+100px)] flex flex-col"
          >
            <div className="flex items-center gap-2 mb-6 pb-4 border-b border-slate-700/50">
              <BrainCircuit className="w-6 h-6 text-cyan-400" />
              <h2 className="text-xl font-semibold">Agent Reasoning & Assessment</h2>
            </div>
            
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto pr-4 prose prose-invert prose-indigo max-w-none"
            >
              {!content && !isAnalyzing ? (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-4">
                  <MapPin className="w-12 h-12 opacity-20" />
                  <p>Enter an address to unleash the agent.</p>
                </div>
              ) : (
                <div className="whitespace-pre-wrap font-sans leading-relaxed text-slate-300">
                  {content}
                  {isAnalyzing && (
                    <motion.span 
                      animate={{ opacity: [1, 0, 1] }} 
                      transition={{ duration: 1, repeat: Infinity }}
                      className="inline-block w-2 h-4 bg-indigo-500 ml-1 translate-y-1"
                    />
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
