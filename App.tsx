import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Monitor, Share2, AlertCircle, Play, RefreshCw, Info, Settings2, Languages, Moon, Sun } from 'lucide-react';
import { Node, Link, TopologyType, Language, SimulationResult, PacketState } from './types';
import { TRANSLATIONS } from './constants';
import TopologyVisualizer from './components/TopologyVisualizer';

const App: React.FC = () => {
  // --- State ---
  const [language, setLanguage] = useState<Language>('fr'); // Default to French
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Theme state
  
  const [topology, setTopology] = useState<TopologyType>(TopologyType.BUS);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [links, setLinks] = useState<Link[]>([]);
  const [breakMode, setBreakMode] = useState<boolean>(false);
  const [senderId, setSenderId] = useState<string>('');
  const [receiverId, setReceiverId] = useState<string>('');
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  
  // Animation States
  const [packetPositions, setPacketPositions] = useState<PacketState[]>([]);
  const [nodeStatuses, setNodeStatuses] = useState<Record<string, 'accepted' | 'rejected'>>({});
  
  const [lastResult, setLastResult] = useState<SimulationResult | null>(null);

  const t = TRANSLATIONS[language];
  const containerRef = useRef<HTMLDivElement>(null);

  // --- Topology Generation ---
  const generateTopology = useCallback(() => {
    if (!containerRef.current) return;
    const { width, height } = containerRef.current.getBoundingClientRect();
    const centerX = width / 2;
    const centerY = height / 2;

    let newNodes: Node[] = [];
    let newLinks: Link[] = [];

    const createNode = (id: string, x: number, y: number, label: string, type: 'device' | 'switch' | 'backbone' | 'terminator' = 'device'): Node => ({
      id, x, y, label, type, active: true
    });

    const createLink = (source: string, target: string): Link => ({
      id: `${source}-${target}`, source, target, active: true
    });

    switch (topology) {
      case TopologyType.BUS:
        // Bus: Backbone line + Drop lines alternating above/below + Terminators
        const busCount = 6;
        const spacing = width / (busCount + 1); // Maintain spacing logic
        const yBackbone = centerY;
        const deviceOffset = 90; 
        
        // Backbone Nodes
        for (let i = 0; i < busCount; i++) {
          newNodes.push(createNode(`b${i}`, spacing * (i + 1), yBackbone, ``, 'backbone'));
        }
        
        // Device Nodes (Rename Node -> PC)
        for (let i = 0; i < busCount; i++) {
          const yDevice = i % 2 === 0 ? yBackbone - deviceOffset : yBackbone + deviceOffset;
          newNodes.push(createNode(`n${i}`, spacing * (i + 1), yDevice, `PC ${i + 1}`, 'device'));
        }

        // Terminators (Ends of the bus)
        const termOffset = 30; // Distance from last backbone node
        const firstBackboneX = spacing;
        const lastBackboneX = spacing * busCount;
        
        newNodes.push(createNode('t_left', firstBackboneX - termOffset, yBackbone, 'Term', 'terminator'));
        newNodes.push(createNode('t_right', lastBackboneX + termOffset, yBackbone, 'Term', 'terminator'));

        // Links: Backbone segments
        for (let i = 0; i < busCount - 1; i++) {
          newLinks.push(createLink(`b${i}`, `b${i+1}`));
        }

        // Links: Terminators
        newLinks.push(createLink('t_left', 'b0'));
        newLinks.push(createLink(`b${busCount-1}`, 't_right'));

        // Links: Drop cables
        for (let i = 0; i < busCount; i++) {
          newLinks.push(createLink(`n${i}`, `b${i}`));
        }
        break;

      case TopologyType.RING:
        const ringCount = 6;
        const radius = Math.min(width, height) / 3;
        for (let i = 0; i < ringCount; i++) {
          const angle = (i / ringCount) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + radius * Math.cos(angle);
          const y = centerY + radius * Math.sin(angle);
          newNodes.push(createNode(`n${i}`, x, y, `PC ${i + 1}`));
        }
        // Connect in circle
        for (let i = 0; i < ringCount; i++) {
          newLinks.push(createLink(`n${i}`, `n${(i + 1) % ringCount}`));
        }
        break;

      case TopologyType.STAR:
        // Central Switch
        newNodes.push(createNode('switch', centerX, centerY, 'Switch', 'switch'));
        
        const starCount = 6;
        const starRadius = Math.min(width, height) / 3;
        for (let i = 0; i < starCount; i++) {
          const angle = (i / starCount) * 2 * Math.PI;
          const x = centerX + starRadius * Math.cos(angle);
          const y = centerY + starRadius * Math.sin(angle);
          const id = `n${i}`;
          newNodes.push(createNode(id, x, y, `PC ${i + 1}`));
          newLinks.push(createLink('switch', id));
        }
        break;

      case TopologyType.MESH:
        // Full Mesh: Every device connected to every other device
        // Use 4 devices to form a square/tetrahedron projection (K4) instead of a pentagram (K5)
        const meshCount = 4; 
        const meshRadius = Math.min(width, height) / 3;
        
        for (let i = 0; i < meshCount; i++) {
          const angle = (i / meshCount) * 2 * Math.PI - Math.PI / 2;
          const x = centerX + meshRadius * Math.cos(angle);
          const y = centerY + meshRadius * Math.sin(angle);
          newNodes.push(createNode(`n${i}`, x, y, `PC ${i + 1}`));
        }

        // Create Full Mesh connections: Connect every node to every subsequent node
        for (let i = 0; i < meshCount; i++) {
          for (let j = i + 1; j < meshCount; j++) {
            newLinks.push(createLink(`n${i}`, `n${j}`));
          }
        }
        break;
    }

    setNodes(newNodes);
    setLinks(newLinks);
    
    // Select default valid devices (not backbone/switch/terminator)
    const validDevices = newNodes.filter(n => n.type === 'device');
    setSenderId(validDevices[0]?.id || '');
    setReceiverId(validDevices[1]?.id || '');
    
    setLastResult(null);
    setPacketPositions([]);
    setNodeStatuses({});
  }, [topology]);

  // Initial generation
  useEffect(() => {
    const timer = setTimeout(generateTopology, 100);
    return () => clearTimeout(timer);
  }, [generateTopology]);

  useEffect(() => {
    const handleResize = () => generateTopology();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [generateTopology]);


  // --- Logic Handlers ---

  const toggleNode = (id: string) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, active: !n.active } : n));
  };

  const toggleLink = (id: string) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, active: !l.active } : l));
  };

  // --- Simulation Engine ---
  const runSimulation = () => {
    if (isSimulating || !senderId || !receiverId) return;
    
    setIsSimulating(true);
    setLastResult(null);
    setNodeStatuses({});
    setPacketPositions([]);

    // Build Graph (Adjacency List)
    const adj: Record<string, string[]> = {};
    nodes.forEach(n => adj[n.id] = []);
    
    links.forEach(l => {
      // Logic: Link must be active. 
      // Nodes must be active (broken node stops traffic passing through it).
      const sourceNode = nodes.find(n => n.id === l.source);
      const targetNode = nodes.find(n => n.id === l.target);
      
      if (l.active && sourceNode?.active && targetNode?.active) {
        adj[l.source].push(l.target);
        adj[l.target].push(l.source);
      }
    });

    // Determine Targets
    // For BUS, we attempt to send to ALL other devices to simulate broadcast.
    // For others, we just aim for the receiver.
    let targetNodesIds: string[] = [];
    if (topology === TopologyType.BUS) {
      targetNodesIds = nodes
        .filter(n => n.type === 'device' && n.id !== senderId)
        .map(n => n.id);
    } else {
      targetNodesIds = [receiverId];
    }

    // Calculate paths to all targets
    const paths: string[][] = [];
    const reachedTargets: string[] = [];

    targetNodesIds.forEach(tid => {
      const path = findPathBFS(senderId, tid, adj, nodes);
      if (path) {
        paths.push(path);
        reachedTargets.push(tid);
      }
    });

    // Analyze overall success
    // Success if the intended receiver was reached.
    const isSuccess = reachedTargets.includes(receiverId);

    // If no paths found at all (e.g. sender broken or isolated), simulate short fail at sender
    if (paths.length === 0) {
       paths.push([senderId]); // Just show packet at sender then die
    }

    animatePackets(paths, isSuccess, reachedTargets);
  };

  const findPathBFS = (start: string, end: string, adj: Record<string, string[]>, allNodes: Node[]): string[] | null => {
    const startNode = allNodes.find(n => n.id === start);
    if (!startNode || !startNode.active) return null;

    const queue: string[][] = [[start]];
    const visited = new Set<string>();
    visited.add(start);

    while (queue.length > 0) {
      const path = queue.shift()!;
      const node = path[path.length - 1];

      if (node === end) {
        return path;
      }

      for (const neighbor of adj[node] || []) {
        if (!visited.has(neighbor)) {
          visited.add(neighbor);
          queue.push([...path, neighbor]);
        }
      }
    }
    return null;
  };

  const animatePackets = (paths: string[][], overallSuccess: boolean, reachedTargets: string[]) => {
    let tick = 0;
    // Find max length to know when animation ends
    const maxTick = Math.max(...paths.map(p => p.length));
    
    const interval = setInterval(() => {
      if (tick >= maxTick) {
        clearInterval(interval);
        setIsSimulating(false);
        setPacketPositions([]);
        
        // Set final status icons
        const finalStatuses: Record<string, 'accepted' | 'rejected'> = {};
        
        reachedTargets.forEach(tid => {
          if (tid === receiverId) {
            finalStatuses[tid] = 'accepted';
          } else {
            // In BUS topology, other nodes reject the packet
            // Only show rejection if NOT in Bus mode (per user request)
            if (topology !== TopologyType.BUS) {
              finalStatuses[tid] = 'rejected';
            }
          }
        });
        setNodeStatuses(finalStatuses);

        // Result Text
        setLastResult({
          success: overallSuccess,
          path: paths.find(p => p[p.length-1] === receiverId) || [],
          log: overallSuccess ? t.logs.arrived : t.logs.dropped
        });
        return;
      }

      // Calculate positions for this tick
      const currentPackets: PacketState[] = [];
      paths.forEach((path, idx) => {
        // If path is shorter than current tick, it stays at the end (or disappears? let's keep at end)
        // Actually, physically, it disappears after being processed. 
        // But for visual clarity, let's stop rendering it if it's done.
        if (tick < path.length) {
          const nodeId = path[tick];
          const node = nodes.find(n => n.id === nodeId);
          if (node) {
            currentPackets.push({ id: `p-${idx}`, x: node.x, y: node.y });
          }
        }
      });

      setPacketPositions(currentPackets);
      tick++;
    }, 1500);
  };

  // --- Dynamic Styling Classes ---
  const themeClasses = {
    bg: isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-50 text-slate-900',
    sidebar: isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white/80 border-slate-200',
    sidebarHeader: isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-100/50 border-slate-200',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    input: isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200 focus:border-blue-500' : 'bg-white border-slate-300 text-slate-900 focus:border-blue-500',
    buttonSecondary: isDarkMode ? 'bg-slate-800 text-slate-300 border-slate-600 hover:bg-slate-700' : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100',
    buttonToggle: isDarkMode ? 'border-slate-600 text-slate-400 hover:text-white' : 'border-slate-300 text-slate-500 hover:text-slate-900',
    buttonActive: 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20',
    resultBox: isDarkMode ? 'bg-slate-950/50 border-slate-800 text-slate-200' : 'bg-white border-slate-200 text-slate-800 shadow-sm',
    legend: isDarkMode ? 'bg-slate-900/90 border-slate-700 text-slate-300' : 'bg-white/90 border-slate-200 text-slate-700',
  };

  return (
    <div className={`flex h-screen w-full font-sans transition-colors duration-300 ${themeClasses.bg}`}>
      {/* Sidebar Controls */}
      <div className={`w-80 flex flex-col border-r backdrop-blur-sm z-10 shadow-xl transition-colors duration-300 ${themeClasses.sidebar}`}>
        <div className={`p-6 border-b transition-colors duration-300 ${themeClasses.sidebarHeader}`}>
          <div className="flex items-center gap-2">
            <Share2 className="text-blue-500" size={24} />
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-emerald-400 text-transparent bg-clip-text">NetSim</h1>
          </div>
          <p className={`text-[10px] font-bold mb-2 ml-8 ${themeClasses.textMuted}`}>by abdeslam ezzaghi</p>
          <p className={`text-xs ${themeClasses.textMuted}`}>{t.subtitle}</p>
          
          <div className="flex gap-2 mt-4">
            <button 
              onClick={() => setLanguage(l => l === 'en' ? 'fr' : 'en')}
              className={`flex items-center gap-2 text-xs border rounded px-2 py-1 transition-colors ${themeClasses.buttonToggle}`}
            >
              <Languages size={14} />
              {language === 'en' ? "Français" : "English"}
            </button>
            <button 
              onClick={() => setIsDarkMode(d => !d)}
              className={`flex items-center gap-2 text-xs border rounded px-2 py-1 transition-colors ${themeClasses.buttonToggle}`}
            >
              {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
              {isDarkMode ? "Light Mode" : "Dark Mode"}
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Topology Selection */}
          <section>
            <label className={`text-sm font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
              <Settings2 size={16} /> {t.selectTopology}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {Object.values(TopologyType).map((type) => (
                <button
                  key={type}
                  onClick={() => setTopology(type)}
                  className={`p-2 rounded text-sm transition-all border ${
                    topology === type 
                      ? themeClasses.buttonActive
                      : themeClasses.buttonSecondary
                  }`}
                >
                  {t.topology[type]}
                </button>
              ))}
            </div>
          </section>

          {/* Configuration */}
          <section>
             <label className={`text-sm font-semibold uppercase tracking-wider mb-3 block flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
               <Monitor size={16} /> {t.controls}
             </label>
             
             <div className="space-y-4">
               <div>
                 <span className={`text-xs block mb-1 ${themeClasses.textMuted}`}>{t.sender}</span>
                 <select 
                   value={senderId} 
                   onChange={(e) => setSenderId(e.target.value)}
                   className={`w-full rounded p-2 text-sm outline-none transition-colors ${themeClasses.input}`}
                   disabled={isSimulating}
                 >
                   {nodes.filter(n => n.type === 'device').map(n => (
                     <option key={n.id} value={n.id}>{n.label}</option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <span className={`text-xs block mb-1 ${themeClasses.textMuted}`}>{t.receiver}</span>
                 <select 
                    value={receiverId} 
                    onChange={(e) => setReceiverId(e.target.value)}
                    className={`w-full rounded p-2 text-sm outline-none transition-colors ${themeClasses.input}`}
                    disabled={isSimulating}
                 >
                   {nodes.filter(n => n.type === 'device').map(n => (
                     <option key={n.id} value={n.id}>{n.label}</option>
                   ))}
                 </select>
               </div>

               <button
                onClick={() => setBreakMode(!breakMode)}
                className={`w-full py-2 px-3 rounded flex items-center justify-center gap-2 text-sm font-medium transition-all border ${
                  breakMode 
                    ? 'bg-red-500/20 text-red-500 border-red-500/50' 
                    : themeClasses.buttonSecondary
                }`}
               >
                 <AlertCircle size={16} />
                 {t.breakMode}
               </button>
               {breakMode && <p className="text-xs text-red-500 italic">{t.breakModeDesc}</p>}
             </div>
          </section>

          {/* Action */}
          <section>
            <button
              onClick={runSimulation}
              disabled={isSimulating || !senderId || !receiverId || senderId === receiverId}
              className={`w-full py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
                isSimulating 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed dark:bg-slate-700 dark:text-slate-500'
                  : 'bg-gradient-to-r from-blue-600 to-emerald-600 hover:from-blue-500 hover:to-emerald-500 text-white shadow-blue-500/20'
              }`}
            >
               {isSimulating ? <RefreshCw className="animate-spin" size={18} /> : <Play size={18} fill="currentColor" />}
               {t.sendData}
            </button>
          </section>

           {/* Results Area */}
           {lastResult && (
            <section className={`rounded-lg p-4 border animate-in fade-in slide-in-from-bottom-4 transition-colors ${themeClasses.resultBox}`}>
              <h3 className={`text-sm font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}>
                <Info size={16} /> {t.simulationResults}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className={themeClasses.textMuted}>{t.status}:</span>
                  <span className={lastResult.success ? "text-emerald-500 font-bold" : "text-red-500 font-bold"}>
                    {lastResult.success ? t.success : t.failure}
                  </span>
                </div>
                <div className={`text-xs ${themeClasses.textMuted}`}>
                  {lastResult.log}
                </div>
              </div>
            </section>
          )}

        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className={`flex-1 relative flex flex-col transition-colors duration-300 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        <div ref={containerRef} className="flex-1 relative overflow-hidden">
           <TopologyVisualizer 
             nodes={nodes} 
             links={links} 
             packetPositions={packetPositions} 
             nodeStatuses={nodeStatuses}
             onNodeClick={toggleNode}
             onLinkClick={toggleLink}
             breakMode={breakMode}
             topology={topology}
             senderId={senderId}
             receiverId={receiverId}
             isDarkMode={isDarkMode}
             senderLabel={t.sender}
             receiverLabel={t.receiver}
           />
           
           {/* Legend Overlay */}
           <div className={`absolute bottom-6 left-6 p-3 rounded-lg shadow-xl backdrop-blur text-xs space-y-2 pointer-events-none transition-colors border ${themeClasses.legend}`}>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-600 border border-blue-400"></div>
                <span>{t.sender}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-emerald-600 border border-emerald-400"></div>
                <span>{t.receiver}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-900 border border-red-500"></div>
                <span>{t.legend.broken}</span>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default App;