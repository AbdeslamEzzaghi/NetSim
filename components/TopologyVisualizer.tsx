import React, { useMemo } from 'react';
import { Node, Link, TopologyType, PacketState } from '../types';
import { Monitor, Server, AlertTriangle, ZapOff, CheckCircle2, XCircle, Circle, Network } from 'lucide-react';

interface VisualizerProps {
  nodes: Node[];
  links: Link[];
  packetPositions: PacketState[];
  nodeStatuses: Record<string, 'accepted' | 'rejected'>;
  onNodeClick: (id: string) => void;
  onLinkClick: (id: string) => void;
  breakMode: boolean;
  topology: TopologyType;
  senderId: string;
  receiverId: string;
  isDarkMode: boolean;
  senderLabel: string;
  receiverLabel: string;
}

const TopologyVisualizer: React.FC<VisualizerProps> = ({
  nodes,
  links,
  packetPositions,
  nodeStatuses,
  onNodeClick,
  onLinkClick,
  breakMode,
  topology,
  senderId,
  receiverId,
  isDarkMode,
  senderLabel,
  receiverLabel,
}) => {

  const getNodeColor = (node: Node) => {
    if (!node.active) return "fill-red-900 stroke-red-500";
    if (node.id === senderId) return "fill-blue-600 stroke-blue-400";
    if (node.id === receiverId) return "fill-emerald-600 stroke-emerald-400";
    if (node.type === 'switch') return "fill-purple-600 stroke-purple-400";
    
    // Theme dependent colors
    if (node.type === 'backbone') return isDarkMode ? "fill-slate-600 stroke-slate-500" : "fill-slate-300 stroke-slate-400";
    if (node.type === 'terminator') return isDarkMode ? "fill-slate-400 stroke-slate-500" : "fill-slate-300 stroke-slate-400";
    return isDarkMode ? "fill-slate-700 stroke-slate-500" : "fill-slate-200 stroke-slate-400";
  };

  const getLinkColor = (link: Link) => {
    if (!link.active) return "stroke-red-500/50";
    return isDarkMode ? "stroke-slate-500" : "stroke-slate-400";
  };

  const getTextColor = () => isDarkMode ? "fill-slate-300" : "fill-slate-600";

  // Memoize SVG content
  const svgContent = useMemo(() => {
    return (
      <>
        {/* Draw Links */}
        {links.map((link) => {
          const source = nodes.find((n) => n.id === link.source);
          const target = nodes.find((n) => n.id === link.target);

          if (!source || !target) return null;

          const isBroken = !link.active;

          return (
            <g
              key={link.id}
              onClick={() => breakMode && onLinkClick(link.id)}
              className={breakMode ? "cursor-pointer hover:opacity-70" : ""}
            >
              {/* Invisible wide stroke for easier clicking */}
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                stroke="transparent"
                strokeWidth="20"
              />
              {/* Actual Link */}
              <line
                x1={source.x}
                y1={source.y}
                x2={target.x}
                y2={target.y}
                className={`transition-colors duration-300 ${getLinkColor(link)}`}
                strokeWidth={isBroken ? 2 : 4}
                strokeDasharray={isBroken ? "5,5" : "0"}
              />
              {isBroken && (
                <g transform={`translate(${(source.x + target.x) / 2 - 12}, ${(source.y + target.y) / 2 - 12})`}>
                   <ZapOff className="text-red-500 w-6 h-6" />
                </g>
              )}
            </g>
          );
        })}

        {/* Draw Nodes */}
        {nodes.map((node) => {
          const isBroken = !node.active;
          const isSender = node.id === senderId;
          const isReceiver = node.id === receiverId;
          const status = nodeStatuses[node.id];
          const isBackbone = node.type === 'backbone';
          const isTerminator = node.type === 'terminator';

          // Terminator Nodes (Rectangular caps)
          if (isTerminator) {
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                className="pointer-events-none"
              >
                <rect 
                  x={-6} y={-12} width={12} height={24} 
                  rx={2}
                  className={`${getNodeColor(node)} transition-colors duration-300`}
                />
              </g>
            );
          }

          // Backbone nodes are small dots
          if (isBackbone) {
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => breakMode && onNodeClick(node.id)}
                className={`${breakMode ? "cursor-pointer" : ""} transition-all duration-300`}
              >
                <circle
                  r={isBroken ? 6 : 4}
                  className={`${getNodeColor(node)} transition-colors duration-300`}
                />
                 {isBroken && (
                   <AlertTriangle size={12} className="text-red-500 -ml-1.5 -mt-1.5" />
                 )}
              </g>
            );
          }

          // Device and Switch Nodes
          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              onClick={() => breakMode && onNodeClick(node.id)}
              className={`${breakMode ? "cursor-pointer" : ""} transition-all duration-300`}
            >
              <circle
                r={node.type === 'switch' ? 30 : 24}
                className={`${getNodeColor(node)} stroke-2 transition-colors duration-300`}
              />
              
              <foreignObject 
                x={node.type === 'switch' ? -15 : -12} 
                y={node.type === 'switch' ? -15 : -12} 
                width={node.type === 'switch' ? 30 : 24} 
                height={node.type === 'switch' ? 30 : 24} 
                className="pointer-events-none"
              >
                <div className={`flex items-center justify-center w-full h-full ${node.id === senderId || node.id === receiverId || node.type === 'switch' ? 'text-white' : (isDarkMode ? 'text-white' : 'text-slate-700')}`}>
                  {isBroken ? (
                    <AlertTriangle size={node.type === 'switch' ? 24 : 18} className="text-red-200" />
                  ) : node.type === 'switch' ? (
                    <Network size={24} />
                  ) : (
                    <Monitor size={18} />
                  )}
                </div>
              </foreignObject>

              {/* Status Overlay (Accepted/Rejected) */}
              {status && (
                <g transform="translate(10, -30)">
                  {status === 'accepted' ? (
                     <CheckCircle2 className="text-emerald-400 bg-slate-900 rounded-full" size={20} />
                  ) : (
                     <XCircle className="text-red-400 bg-slate-900 rounded-full" size={20} />
                  )}
                </g>
              )}

              {/* Label */}
              <text
                y={node.type === 'switch' ? 45 : 38}
                textAnchor="middle"
                className={`${getTextColor()} text-xs font-mono pointer-events-none select-none transition-colors duration-300`}
              >
                {/* Use a tspan to potentially break line or just style, keeping it clean */}
                <tspan x="0">{node.label}</tspan>
                {(isSender || isReceiver) && (
                   <tspan x="0" dy="1.2em" className="font-bold fill-current opacity-80" fontSize="10">
                      {isSender ? `(${senderLabel})` : `(${receiverLabel})`}
                   </tspan>
                )}
              </text>
            </g>
          );
        })}

        {/* Packets Animation */}
        {packetPositions.map((pkt) => (
          <g
            key={pkt.id}
            transform={`translate(${pkt.x}, ${pkt.y})`}
            className="transition-transform duration-100 ease-linear will-change-transform"
          >
            <circle r={6} className="fill-yellow-400 stroke-yellow-200 animate-pulse" />
            <circle r={10} className="fill-yellow-400/30 animate-ping" />
          </g>
        ))}
      </>
    );
  }, [nodes, links, packetPositions, nodeStatuses, breakMode, senderId, receiverId, onNodeClick, onLinkClick, isDarkMode, senderLabel, receiverLabel]);

  return (
    <svg className={`w-full h-full border-t shadow-inner transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke={isDarkMode ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)"} strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
      {svgContent}
    </svg>
  );
};

export default TopologyVisualizer;