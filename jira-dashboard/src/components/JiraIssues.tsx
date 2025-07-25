import React, { useEffect, useState, useMemo } from 'react';
import Select from 'react-select';
import { MentionsInput, Mention } from 'react-mentions';
import mentionStyles from './mentionStyles.module.css';
import styles from './JiraIssues.module.css';
import Navigation from './Navigation';

import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
function renderADFToReact(adf: any, attachments: any[] = []): React.ReactNode {
  if (!adf) return null;
  

  
  // Si el comentario es un string simple, lo renderizamos directamente
  if (typeof adf === 'string') {
    return <span>{adf}</span>;
  }

  const renderNode = (node: any, index: number): React.ReactNode => {
    // 🔵 Mención
    if (node.type === 'mention') {
      const mentionText = node.attrs?.text || node.attrs?.displayName || '@usuario';
      return (
    
      
        <span
          key={index}
          style={{
            backgroundColor: '#e6f0ff',
            color: '#0052cc',
            padding: '2px 6px',
            borderRadius: '4px',
            fontWeight: 500,
            marginRight: '4px',
            display: 'inline-block',
          }}
        >
          {mentionText}
        </span>
      );
    }

    // 🖼️ Media Group
    if (node.type === 'mediaGroup') {
      return (
        <div key={index} style={{ margin: '0.5rem 0' }}>
          {Array.isArray(node.content) 
            ? node.content.map((child: any, idx: number) => renderNode(child, idx))
            : null
          }
        </div>
      );
    }

    // 🖼️ Media
    if (node.type === 'media') {
      const fileId = node.attrs?.id;
      
      // Función para obtener el icono según la extensión del archivo
      const getFileIcon = (filename: string) => {
        if (!filename) return '📄';
        const ext = filename.toLowerCase().split('.').pop();
        switch (ext) {
          case 'pdf': return '📕';
          case 'doc':
          case 'docx': return '📘';
          case 'xls':
          case 'xlsx': return '📗';
          case 'ppt':
          case 'pptx': return '📙';
          case 'jpg':
          case 'jpeg':
          case 'png':
          case 'gif': return '🖼️';
          case 'zip':
          case 'rar': return '🗜️';
          case 'txt': return '📝';
          default: return '📄';
        }
      };
      
      // Buscar el archivo en la lista de attachments usando el ID
      const attachment = attachments.find(att => att.id === fileId);
      
      // Determinar la URL de descarga según si encontramos el attachment o no
      let downloadUrl = '#';
      if (fileId) {
        if (attachment) {
          // Usar el attachment ID normal
          downloadUrl = `/api/attachment/${attachment.id}`;
        } else {
           // El fileId es probablemente un Media Services ID
           downloadUrl = `/api/attachment/${fileId}?mediaId=true`;
         }
      }
      
      const filename = attachment?.filename || 'Archivo adjunto';
      const fileIcon = getFileIcon(filename);
      
      return (
        <a
          key={index}
          href={downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ 
            display: 'inline-block',
            padding: '8px 12px', 
            backgroundColor: '#f5f5f5', 
            borderRadius: '4px',
            margin: '4px 0',
            fontSize: '0.9em',
            color: '#0052cc',
            textDecoration: 'none',
            border: '1px solid #ddd',
            cursor: 'pointer'
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.backgroundColor = '#e6f0ff';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.backgroundColor = '#f5f5f5';
          }}
        >
          {fileIcon} {filename}
        </a>
      );
    }

    // 🔗 Texto con posible link
    if (node.type === 'text') {
      const text = node.text || '';
      const linkMark = node.marks?.find((mark: any) => mark.type === 'link');

      if (linkMark) {
        return (
          <a
            key={index}
            href={linkMark.attrs.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#0052cc', textDecoration: 'underline' }}
          >
            {text}
          </a>
        );
      }

      // 🔍 Detectar URLs en texto plano
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const parts = text.split(urlRegex);

      return (
        <React.Fragment key={index}>
          {parts.map((part: string, i: number) =>
            urlRegex.test(part) ? (
              <a
                key={i}
                href={part}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: '#0052cc', textDecoration: 'underline' }}
              >
                {part}
              </a>
            ) : (
              <span key={i}>{part}</span>
            )
          )}
        </React.Fragment>
      );
    }

    // 🔗 Nodo tipo link directo (no común)
    if (node.type === 'link') {
      return (
        <a
          key={index}
          href={node.attrs.href}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#0052cc', textDecoration: 'underline' }}
        >
          {node.attrs.href}
        </a>
      );
    }

    // 🧾 Tarjetas tipo inlineCard
    if (node.type === 'inlineCard' && node.attrs?.url) {
      return (
        <a
          key={index}
          href={node.attrs.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-block',
            color: '#0052cc',
            backgroundColor: '#f4f5f7',
            padding: '6px 10px',
            borderRadius: '4px',
            textDecoration: 'none',
            margin: '4px 0',
          }}
        >
          {node.attrs.url}
        </a>
      );
    }

    // 📄 Párrafo
    if (node.type === 'paragraph') {
      return (
        <p key={index} style={{ margin: '0.5rem 0' }}>
          {Array.isArray(node.content) 
            ? node.content.map((child: any, idx: number) => renderNode(child, idx))
            : null
          }
        </p>
      );
    }

    // 📄 Documento
    if (node.type === 'doc') {
      return (
        <div key={index}>
          {Array.isArray(node.content) 
            ? node.content.map((child: any, idx: number) => renderNode(child, idx))
            : null
          }
        </div>
      );
    }

    // Recursivo para contenido anidado
    if (Array.isArray(node.content)) {
      return node.content.map((child: any, idx: number) => renderNode(child, idx));
    }

    return null;
  };

  // Si adf tiene una estructura de documento, procesamos su contenido
  if (adf.type === 'doc' && Array.isArray(adf.content)) {
    return (
      <div>
        {adf.content.map((node: any, index: number) => renderNode(node, index))}
      </div>
    );
  }

  return renderNode(adf, 0);
}



type SubtaskSummary = {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
  };
};

type Issue = {
  key: string;
  fields: {
    summary: string;
    status: { name: string };
    duedate?: string;
    assignee?: {
      displayName: string;
    };
    subtasks?: SubtaskSummary[];
    priority?: { name: string };
    labels?: string[];
  };
};

type IssueDetail = Issue & {
  fields: Issue['fields'] & {
    description?: any;
  };
  comments?: Array<{
    id: string;
    body: string;
    author: string;
    created: string;
  }>;
};

type SubtaskDetail = IssueDetail;

interface JiraIssuesProps {
  userInfo?: { email: string; name: string } | null;
  isAuthenticated?: boolean;
  authStatus?: string | null;
}

export default function JiraIssues({ userInfo, isAuthenticated, authStatus }: JiraIssuesProps) {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<SubtaskDetail | null>(null);
  const [showGreenIssues, setShowGreenIssues] = useState(true);
  const [greenExpanded, setGreenExpanded] = useState(false);

  const [showRedIssues, setShowRedIssues] = useState(true);
  const [subtaskStatus, setSubtaskStatus] = useState('');
  const [subtaskStatuses, setSubtaskStatuses] = useState<Record<string, string>>({});
  const [subtaskTransitions, setSubtaskTransitions] = useState<Record<string, string[]>>({});
  const [mentionText, setMentionText] = useState('');
  const [mentionUsers, setMentionUsers] = useState<{ id: string; display: string }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false);
  const [previousRedIssueKeys, setPreviousRedIssueKeys] = useState<Set<string>>(new Set());
  const [showAllSubtasks, setShowAllSubtasks] = useState(false);
  const displayMap: Record<string, string> = {
    'To Do': 'Por hacer',
    'Done': 'Hecho',
  };

  const [statusOptions, setStatusOptions] = useState<string[]>([]);



  // Memoizar greenIssues para evitar recálculos innecesarios
  const greenIssues = useMemo(() => {
    return issues
      .filter(issue =>
        issue.fields.subtasks?.some(sub => {
          const summary = sub.fields.summary.toLowerCase();
          const status = sub.fields.status.name.toLowerCase();
          return (
            status === 'done' &&
            (
              summary.includes('publicación de banners y t&c') ||
              summary.includes('publicación de landing y t&c')
            )
          );
        })
      )
      .sort((a, b) => {
        const numA = parseInt(a.key.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.key.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
  }, [issues]);

  // Memoizar redIssues para evitar recálculos innecesarios
  const redIssues = useMemo(() => {
    return issues
      .filter(issue => !greenIssues.includes(issue))
      .sort((a, b) => {
        const numA = parseInt(a.key.match(/\d+/)?.[0] || '0', 10);
        const numB = parseInt(b.key.match(/\d+/)?.[0] || '0', 10);
        return numA - numB;
      });
  }, [issues, greenIssues]);

  // Función para reproducir sonido de notificación estilo Zelda: Song of Storms COMPLETA (~30 segundos)
  const playNotificationSound = () => {
    if (typeof window === 'undefined') return; // Evitar ejecución en SSR
    try {
      // Crear un contexto de audio
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      // Crear oscilador con envolvente más natural y menos robótica
      const createOcarinaNote = (frequency: number, startTime: number, duration: number, volume: number, vibrato: boolean = false, harmonics: boolean = false) => {
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        const filterNode = audioContext.createBiquadFilter();
        
        // Conectar: oscilador -> filtro -> ganancia -> destino
        oscillator.connect(filterNode);
        filterNode.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Configurar filtro para sonido más cálido y menos robótico
        filterNode.type = 'lowpass';
        filterNode.frequency.setValueAtTime(frequency * 3, audioContext.currentTime + startTime);
        filterNode.Q.setValueAtTime(1.2, audioContext.currentTime + startTime);
        
        // Usar forma de onda más cálida (triangle + sine)
        oscillator.type = 'triangle';
        
        // Frecuencia base con ligero vibrato para sonido más natural
        if (vibrato) {
          const lfo = audioContext.createOscillator();
          const lfoGain = audioContext.createGain();
          lfo.connect(lfoGain);
          lfoGain.connect(oscillator.frequency);
          
          lfo.frequency.setValueAtTime(4.8, audioContext.currentTime + startTime); // Vibrato de 4.8Hz
          lfoGain.gain.setValueAtTime(frequency * 0.012, audioContext.currentTime + startTime); // Vibrato sutil
          lfo.type = 'sine';
          
          lfo.start(audioContext.currentTime + startTime);
          lfo.stop(audioContext.currentTime + startTime + duration);
        }
        
        oscillator.frequency.setValueAtTime(frequency, audioContext.currentTime + startTime);
        
        // Envolvente más natural como una ocarina real
        gainNode.gain.setValueAtTime(0, audioContext.currentTime + startTime);
        gainNode.gain.linearRampToValueAtTime(volume * 0.3, audioContext.currentTime + startTime + 0.02); // Ataque rápido
        gainNode.gain.linearRampToValueAtTime(volume, audioContext.currentTime + startTime + 0.08); // Subida suave
        gainNode.gain.setValueAtTime(volume * 0.9, audioContext.currentTime + startTime + duration * 0.7); // Sostener
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration); // Release natural
        
        // Reproducir
        oscillator.start(audioContext.currentTime + startTime);
        oscillator.stop(audioContext.currentTime + startTime + duration);
        
        // Agregar armónicos si se especifica
        if (harmonics) {
          // Quinta perfecta (armónico natural)
          const harmonic1 = audioContext.createOscillator();
          const harmonic1Gain = audioContext.createGain();
          harmonic1.connect(harmonic1Gain);
          harmonic1Gain.connect(audioContext.destination);
          harmonic1.type = 'sine';
          harmonic1.frequency.setValueAtTime(frequency * 1.5, audioContext.currentTime + startTime);
          harmonic1Gain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
          harmonic1Gain.gain.linearRampToValueAtTime(volume * 0.15, audioContext.currentTime + startTime + 0.1);
          harmonic1Gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          harmonic1.start(audioContext.currentTime + startTime);
          harmonic1.stop(audioContext.currentTime + startTime + duration);
          
          // Octava inferior (profundidad)
          const harmonic2 = audioContext.createOscillator();
          const harmonic2Gain = audioContext.createGain();
          harmonic2.connect(harmonic2Gain);
          harmonic2Gain.connect(audioContext.destination);
          harmonic2.type = 'triangle';
          harmonic2.frequency.setValueAtTime(frequency * 0.5, audioContext.currentTime + startTime);
          harmonic2Gain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
          harmonic2Gain.gain.linearRampToValueAtTime(volume * 0.1, audioContext.currentTime + startTime + 0.05);
          harmonic2Gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          harmonic2.start(audioContext.currentTime + startTime);
          harmonic2.stop(audioContext.currentTime + startTime + duration);
        }
        
        return { oscillator, gainNode, filterNode };
      };
      
      // 🌩️ Song of Storms COMPLETA - Melodía original completa del juego (~30 segundos)
       const createFullSongOfStorms = () => {
         // Secuencia completa original con velocidad natural del juego: D F D. D F D. E F E F E C A. A D F G A. A D F G E. D F D. D F D. E F E F E C A. A D F G A. A D.
         const completeMelody = [
           // PRIMERA PARTE: D F D. D F D.
           { freq: 587.33, duration: 0.5, volume: 0.28, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.5, volume: 0.26, vibrato: false, harmonics: false }, // F5
           { freq: 1174.66, duration: 0.8, volume: 0.32, vibrato: true, harmonics: true },  // D6 (octava alta)
           { freq: 587.33, duration: 0.5, volume: 0.28, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.5, volume: 0.26, vibrato: false, harmonics: false }, // F5
           { freq: 1174.66, duration: 0.8, volume: 0.32, vibrato: true, harmonics: true },  // D6 (octava alta)
           
           // SEGUNDA PARTE: E F E F E C A.
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1396.91, duration: 0.3, volume: 0.26, vibrato: false, harmonics: false }, // F6
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1396.91, duration: 0.3, volume: 0.26, vibrato: false, harmonics: false }, // F6
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1046.50, duration: 0.4, volume: 0.22, vibrato: false, harmonics: false }, // C6
           { freq: 880.00, duration: 0.8, volume: 0.30, vibrato: true, harmonics: true },   // A5
           
           // TERCERA PARTE: A D F G A.
           { freq: 880.00, duration: 0.4, volume: 0.28, vibrato: false, harmonics: false },  // A5
           { freq: 587.33, duration: 0.4, volume: 0.26, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.4, volume: 0.24, vibrato: false, harmonics: false }, // F5
           { freq: 783.99, duration: 0.4, volume: 0.25, vibrato: false, harmonics: false }, // G5
           { freq: 880.00, duration: 0.6, volume: 0.30, vibrato: true, harmonics: true },   // A5
           
           // CUARTA PARTE: A D F G E.
           { freq: 880.00, duration: 0.4, volume: 0.28, vibrato: false, harmonics: false },  // A5
           { freq: 587.33, duration: 0.4, volume: 0.26, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.4, volume: 0.24, vibrato: false, harmonics: false }, // F5
           { freq: 783.99, duration: 0.4, volume: 0.25, vibrato: false, harmonics: false }, // G5
           { freq: 659.25, duration: 0.6, volume: 0.27, vibrato: true, harmonics: true },   // E5
           
           // QUINTA PARTE (repetición): D F D. D F D.
           { freq: 587.33, duration: 0.5, volume: 0.28, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.5, volume: 0.26, vibrato: false, harmonics: false }, // F5
           { freq: 1174.66, duration: 0.8, volume: 0.32, vibrato: true, harmonics: true },  // D6 (octava alta)
           { freq: 587.33, duration: 0.5, volume: 0.28, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.5, volume: 0.26, vibrato: false, harmonics: false }, // F5
           { freq: 1174.66, duration: 0.8, volume: 0.32, vibrato: true, harmonics: true },  // D6 (octava alta)
           
           // SEXTA PARTE (repetición): E F E F E C A.
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1396.91, duration: 0.3, volume: 0.26, vibrato: false, harmonics: false }, // F6
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1396.91, duration: 0.3, volume: 0.26, vibrato: false, harmonics: false }, // F6
           { freq: 1318.51, duration: 0.3, volume: 0.24, vibrato: false, harmonics: false }, // E6
           { freq: 1046.50, duration: 0.4, volume: 0.22, vibrato: false, harmonics: false }, // C6
           { freq: 880.00, duration: 0.8, volume: 0.30, vibrato: true, harmonics: true },   // A5
           
           // SÉPTIMA PARTE (repetición): A D F G A.
           { freq: 880.00, duration: 0.4, volume: 0.28, vibrato: false, harmonics: false },  // A5
           { freq: 587.33, duration: 0.4, volume: 0.26, vibrato: false, harmonics: false }, // D5
           { freq: 698.46, duration: 0.4, volume: 0.24, vibrato: false, harmonics: false }, // F5
           { freq: 783.99, duration: 0.4, volume: 0.25, vibrato: false, harmonics: false }, // G5
           { freq: 880.00, duration: 0.6, volume: 0.30, vibrato: true, harmonics: true },   // A5
           
           // FINAL: A D. (nota final larga)
           { freq: 880.00, duration: 0.5, volume: 0.28, vibrato: false, harmonics: false },  // A5
           { freq: 587.33, duration: 1.5, volume: 0.32, vibrato: true, harmonics: true },   // D5 (final largo)
         ];
        
        let currentTime = 0;
         const pauseBetweenNotes = 0.1; // Pausa natural entre notas como en el juego original
         
         // 🎵 REPRODUCIR SOLO LA MELODÍA COMPLETA ORIGINAL (una sola vez)
         completeMelody.forEach((note, index) => {
           createOcarinaNote(note.freq, currentTime, note.duration, note.volume, note.vibrato, note.harmonics);
           currentTime += note.duration + pauseBetweenNotes;
         });
      };
      
      // 🌪️ Efectos de tormenta mejorados y extendidos
      const createExtendedStormEffect = () => {
        // Viento constante de fondo
        const createWindLayer = (startTime: number, duration: number, intensity: number) => {
          const bufferSize = audioContext.sampleRate * 0.2;
          const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
          const data = buffer.getChannelData(0);
          
          // Ruido rosa filtrado para simular viento
          for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * intensity;
          }
          
          const windSource = audioContext.createBufferSource();
          const windGain = audioContext.createGain();
          const windFilter = audioContext.createBiquadFilter();
          
          windSource.buffer = buffer;
          windSource.loop = true;
          windSource.connect(windFilter);
          windFilter.connect(windGain);
          windGain.connect(audioContext.destination);
          
          windFilter.type = 'bandpass';
          windFilter.frequency.setValueAtTime(800 + Math.random() * 400, audioContext.currentTime + startTime);
          windFilter.Q.setValueAtTime(0.5, audioContext.currentTime + startTime);
          
          windGain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
          windGain.gain.linearRampToValueAtTime(intensity * 0.3, audioContext.currentTime + startTime + 1);
          windGain.gain.setValueAtTime(intensity * 0.3, audioContext.currentTime + startTime + duration - 2);
          windGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + duration);
          
          windSource.start(audioContext.currentTime + startTime);
          windSource.stop(audioContext.currentTime + startTime + duration);
        };
        
        // Truenos ocasionales
        const createThunder = (startTime: number) => {
          const thunderOsc = audioContext.createOscillator();
          const thunderGain = audioContext.createGain();
          const thunderFilter = audioContext.createBiquadFilter();
          
          thunderOsc.connect(thunderFilter);
          thunderFilter.connect(thunderGain);
          thunderGain.connect(audioContext.destination);
          
          thunderOsc.type = 'sawtooth';
          thunderOsc.frequency.setValueAtTime(60, audioContext.currentTime + startTime);
          thunderOsc.frequency.exponentialRampToValueAtTime(20, audioContext.currentTime + startTime + 0.8);
          
          thunderFilter.type = 'lowpass';
          thunderFilter.frequency.setValueAtTime(200, audioContext.currentTime + startTime);
          
          thunderGain.gain.setValueAtTime(0, audioContext.currentTime + startTime);
          thunderGain.gain.linearRampToValueAtTime(0.15, audioContext.currentTime + startTime + 0.05);
          thunderGain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + startTime + 0.8);
          
          thunderOsc.start(audioContext.currentTime + startTime);
          thunderOsc.stop(audioContext.currentTime + startTime + 0.8);
        };
        
        // Crear capas de viento con diferentes intensidades
        createWindLayer(0, 30, 0.02);   // Viento suave constante
        createWindLayer(5, 20, 0.04);   // Viento medio
        createWindLayer(15, 15, 0.03);  // Viento variable
        
        // Truenos en momentos específicos
        createThunder(8);   // Primer trueno
        createThunder(16);  // Segundo trueno
        createThunder(25);  // Trueno final
      };
      
      // 🎼 Ejecutar la composición completa
      createFullSongOfStorms();
      createExtendedStormEffect();
      
      
    } catch (error) {
      console.error('Error al reproducir sonido de notificación:', error);
    }
  };
    const onDragEnd = async (result: DropResult) => {
      const { source, destination, draggableId } = result;
    
      if (!destination || source.droppableId === destination.droppableId) return;
    
      const newStatus = destination.droppableId === 'green' ? 'Done' : 'To Do';
    
      try {
        const res = await fetch(`/api/issue/${draggableId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newStatus }),
        });
    
        if (!res.ok) throw new Error();
        
        // Opcional: recarga desde backend
        const updated = await fetch('/api/issues').then(res => res.json());
        const filtered = updated.issues.filter((issue: Issue) =>
          issue.fields.status.name.toLowerCase().includes('publicación de piezas')
        );
        setIssues(filtered);
      } catch (error) {
        alert('❌ Error al actualizar el estado');
        console.error(error);
      }
    };
  useEffect(() => {
    let isMounted = true;

    const fetchIssues = () => {
      fetch('/api/issues')
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          const filtered = (data.issues || []).filter((issue: Issue) =>
            issue.fields.status.name.toLowerCase().includes('publicación de piezas')
          );
          setIssues(filtered);
        })
        .catch((err) => console.error('Error cargando issues:', err))
        .finally(() => {
          if (isMounted) setLoading(false);
        });
    };

    fetchIssues(); // primera carga

    const intervalId = setInterval(fetchIssues, 60000); // cada 60 segundos

    // 🔽 Nuevo: limpiar si se desmonta
    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  // Efecto para cargar credenciales de correo al inicializar


  // Efecto para detectar nuevas tarjetas en la sección roja y reproducir sonido
  useEffect(() => {
    if (loading || typeof window === 'undefined') return; // No verificar durante la carga inicial o en SSR
    
    const currentRedIssueKeys = new Set(redIssues.map(issue => issue.key));
    
    // Detectar nuevas tarjetas (que están en currentRedIssueKeys pero no en previousRedIssueKeys)
    const newRedIssues = [...currentRedIssueKeys].filter(key => !previousRedIssueKeys.has(key));
    
    if (newRedIssues.length > 0 && previousRedIssueKeys.size > 0) {
      // Solo reproducir sonido si no es la primera carga (previousRedIssueKeys.size > 0)

      playNotificationSound();
    }
    
    // Actualizar el estado anterior
    setPreviousRedIssueKeys(currentRedIssueKeys);
  }, [redIssues, loading]); // Removido previousRedIssueKeys de las dependencias para evitar bucle infinito

  // Efecto: obtener usuarios mencionables cuando cambia la subtarea seleccionada
  useEffect(() => {
    if (!selectedSubtask) return;

    fetch(`/api/issue/${selectedSubtask.key}?mentions=true`)
      .then(res => res.json())
      .then((usersFromJira) => {
        const formattedUsers = (usersFromJira || []).map((user: any) => ({
          id: user.accountId,
          display: user.displayName,
        }));
        setMentionUsers(formattedUsers);
      })
      .catch(err => console.error('Error al obtener usuarios para mencionar:', err));
  }, [selectedSubtask]);




  const openModal = async (issue: Issue) => {
    try {
      const res = await fetch(`/api/issue/${issue.key}`);
      const data = await res.json();
      const transitionsRes = await fetch(`/api/issue/${issue.key}?transitions=true`);
      const transitions = await transitionsRes.json();
      setStatusOptions(transitions);
      setSelectedIssue(data);
      setSelectedSubtask(null);

      if (data.fields.subtasks?.length) {
        const initialStatuses = data.fields.subtasks.reduce((acc: Record<string, string>, sub: SubtaskSummary) => {
          acc[sub.key] = sub.fields.status.name;
          return acc;
        }, {});
        setSubtaskStatuses(initialStatuses);

        const transitionPromises = data.fields.subtasks.map((sub: SubtaskSummary) =>
          fetch(`/api/issue/${sub.key}?transitions=true`).then(res => res.json())
        );
        const transitionsPerSubtask = await Promise.all(transitionPromises);
        const transitionsMap = data.fields.subtasks.reduce((acc: Record<string, string[]>, sub: SubtaskSummary, index: number) => {
          acc[sub.key] = transitionsPerSubtask[index] || [];
          return acc;
        }, {});
        setSubtaskTransitions(transitionsMap);
      }
    } catch (err) {
      console.error('Error al cargar detalles del issue:', err);
    }
  };

  const closeModal = () => {
    setSelectedIssue(null);
    setSelectedSubtask(null);
  };

  const openSubtask = async (subtaskKey: string) => {
    try {
      const res = await fetch(`/api/issue/${subtaskKey}`);
      const data = await res.json();
      setSelectedSubtask(data);
      setSubtaskStatus(data.fields.status.name);

      // Obtener opciones de transición desde el backend (debes implementar esto)
      const statusRes = await fetch(`/api/issue/${subtaskKey}?transitions=true`);
      const statusData = await statusRes.json(); // espera un array de strings
      setStatusOptions(statusData);
    } catch (err) {
      console.error('Error al cargar subtarea:', err);
    }
  };


  const closeSubtask = () => setSelectedSubtask(null);

  // Event listener para cerrar modales con Escape
  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (selectedSubtask) {
          // Si hay una subtarea abierta, cerrarla primero
          setSelectedSubtask(null);
        } else if (selectedIssue) {
          // Si hay un issue abierto, cerrarlo
          setSelectedIssue(null);
        }
      }
    };

    // Agregar el event listener cuando hay modales abiertos
    if (selectedIssue || selectedSubtask) {
      document.addEventListener('keydown', handleEscapeKey);
    }

    // Cleanup: remover el event listener
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [selectedIssue, selectedSubtask]);

  // Función para enviar comentarios a subtareas
  const handleSendComment = async () => {
    if (!mentionText.trim()) return alert('Escribe un comentario primero');
    try {
      const res = await fetch(`/api/issue/${selectedSubtask?.key}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: mentionText }),
      });
      if (!res.ok) throw new Error();
      alert('✅ Comentario enviado');
      setMentionText('');
      if (selectedSubtask) {
        await openSubtask(selectedSubtask.key); // recarga la subtarea
      }
    } catch (err) {
      alert('❌ Error al enviar comentario');
      console.error(err);
    }
  };

  // Función para enviar comentarios al issue principal
   const handleSendCommentToIssue = async () => {
     if (!mentionText.trim()) return alert('Escribe un comentario primero');
     try {
       const res = await fetch(`/api/issue/${selectedIssue?.key}/comment`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ comment: mentionText }),
       });
       if (!res.ok) throw new Error();
       alert('✅ Comentario enviado');
       setMentionText('');
       if (selectedIssue) {
         await openModal(selectedIssue); // recarga el issue principal
       }
     } catch (err) {
       alert('❌ Error al enviar comentario');
       console.error(err);
     }
   };







  // Función para generar el contenido del correo
  const generateEmailContent = (): string => {
    const totalIssues = issues.length;
    const greenCount = greenIssues.length;
    const redCount = redIssues.length;
    
    // Función para extraer fechas de los títulos
    const extractDateFromTitle = (title: string): Date[] => {
      const dates: Date[] = [];
      const currentYear = new Date().getFullYear();
      
      const patterns = [
        /\b(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi,
        /\b(\d{1,2})\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE|ENE|FEB|MAR|ABR|MAY|JUN|JUL|AGO|SEP|OCT|NOV|DIC)\b/gi,
        /\b(\d{1,2})\/(\d{1,2})\)/g,
        /\b(\d{1,2})\/(\d{1,2})\b/g,
        /\b(\d{2})(\d{2})\b/g,
        /\b(\d{1,2})\s+Y\s+(\d{1,2})\s+DE\s+(ENERO|FEBRERO|MARZO|ABRIL|MAYO|JUNIO|JULIO|AGOSTO|SEPTIEMBRE|OCTUBRE|NOVIEMBRE|DICIEMBRE)\b/gi
      ];
      
      const monthMap: { [key: string]: number } = {
        'ENERO': 0, 'ENE': 0, 'FEBRERO': 1, 'FEB': 1, 'MARZO': 2, 'MAR': 2,
        'ABRIL': 3, 'ABR': 3, 'MAYO': 4, 'MAY': 4, 'JUNIO': 5, 'JUN': 5,
        'JULIO': 6, 'JUL': 6, 'AGOSTO': 7, 'AGO': 7, 'SEPTIEMBRE': 8, 'SEP': 8,
        'OCTUBRE': 9, 'OCT': 9, 'NOVIEMBRE': 10, 'NOV': 10, 'DICIEMBRE': 11, 'DIC': 11
      };
      
      patterns.forEach((pattern, index) => {
        let match;
        while ((match = pattern.exec(title)) !== null) {
          if (index <= 1) {
            const day = parseInt(match[1]);
            const monthStr = match[2].toUpperCase();
            const month = monthMap[monthStr];
            
            if (month !== undefined && day >= 1 && day <= 31) {
              const date = new Date(currentYear, month, day);
              dates.push(date);
            }
          } else if (index === 2 || index === 3 || index === 4) {
            const day = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            
            if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
              const date = new Date(currentYear, month, day);
              dates.push(date);
            }
          } else if (index === 5) {
            const day1 = parseInt(match[1]);
            const day2 = parseInt(match[2]);
            const monthStr = match[3].toUpperCase();
            const month = monthMap[monthStr];
            
            if (month !== undefined) {
              [day1, day2].forEach(day => {
                if (day >= 1 && day <= 31) {
                  const date = new Date(currentYear, month, day);
                  dates.push(date);
                }
              });
            }
          }
        }
      });
      
      return dates;
    };
    
    // Calcular días con y sin promociones
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    
    const issueDates = new Set<number>();
    
    issues.forEach((issue: any) => {
      const datesFromTitle = extractDateFromTitle(issue.fields.summary);
      datesFromTitle.forEach(date => {
        if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
          issueDates.add(date.getDate());
        }
      });
    });
    
    const daysWithPromotions = issueDates.size;
    const daysWithoutPromotions = daysInMonth - daysWithPromotions;
    const coveragePercentage = Math.round((daysWithPromotions / daysInMonth) * 100);
    
    // Generar lista de días sin promociones
    const daysWithoutPromosList: number[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      if (!issueDates.has(day)) {
        daysWithoutPromosList.push(day);
      }
    }
    
    const monthNames = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    
    return `
      <h2>📊 Reporte de Promociones - ${monthNames[currentMonth]} ${currentYear}</h2>
      <p><strong>Fecha:</strong> ${new Date().toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })}</p>
      
      <h3>📈 Resumen de Cobertura</h3>
      <ul>
        <li><strong>Total de días en el mes:</strong> ${daysInMonth}</li>
        <li><strong>✅ Días con promociones:</strong> ${daysWithPromotions}</li>
        <li><strong>❌ Días sin promociones:</strong> ${daysWithoutPromotions}</li>
        <li><strong>📊 Porcentaje de cobertura:</strong> ${coveragePercentage}%</li>
      </ul>
      
      ${daysWithoutPromotions > 0 ? `
      <h3>🚨 Días sin Promociones (${daysWithoutPromotions})</h3>
      <p style="color: #d32f2f; font-weight: bold;">Los siguientes días no tienen promociones programadas:</p>
      <div style="background-color: #ffebee; padding: 15px; border-radius: 8px; border-left: 4px solid #d32f2f;">
        ${daysWithoutPromosList.map(day => `<span style="display: inline-block; margin: 2px 5px; padding: 4px 8px; background-color: #f44336; color: white; border-radius: 4px; font-weight: bold;">${day}</span>`).join('')}
      </div>
      ` : `
      <h3>🎉 ¡Excelente Cobertura!</h3>
      <p style="color: #2e7d32; font-weight: bold;">Todos los días del mes tienen promociones programadas.</p>
      `}
      
      <h3>📋 Resumen de Tarjetas</h3>
      <ul>
        <li><strong>Total de tarjetas:</strong> ${totalIssues}</li>
        <li><strong>✅ Completadas (Verde):</strong> ${greenCount}</li>
        <li><strong>🔴 Pendientes (Rojo):</strong> ${redCount}</li>
        <li><strong>📊 Porcentaje completado:</strong> ${totalIssues > 0 ? Math.round((greenCount / totalIssues) * 100) : 0}%</li>
      </ul>
      
      ${redCount > 0 ? `
      <h3>🚨 Tarjetas Pendientes (${redCount})</h3>
      <ul>
        ${redIssues.slice(0, 10).map(issue => `
          <li><strong>${issue.key}:</strong> ${issue.fields.summary}</li>
        `).join('')}
        ${redCount > 10 ? `<li><em>... y ${redCount - 10} más</em></li>` : ''}
      </ul>
      ` : ''}
      
      ${greenCount > 0 ? `
      <h3>✅ Tarjetas Completadas Recientemente (${Math.min(greenCount, 5)})</h3>
      <ul>
        ${greenIssues.slice(0, 5).map(issue => `
          <li><strong>${issue.key}:</strong> ${issue.fields.summary}</li>
        `).join('')}
      </ul>
      ` : ''}
      
      <hr>
      <p><em>Reporte generado automáticamente por Jira Dashboard</em></p>
    `;
  };



  return (
    <div>
      <Navigation currentPage="issues" />
      <div className={styles.container} style={{ marginTop: '70px', minHeight: 'calc(100vh - 70px)' }}>
      <div className={styles.issueSection}>
        <h3 className={styles.title1}>PUBLICACIÓN DE PIEZAS</h3>




        <div className={styles.issueGridWrapper}>
          {/* Sección VERDE */}
          <div className={styles.collapsibleGroup}>
            <button
              onClick={() => setShowGreenIssues(!showGreenIssues)}
              className={styles.collapsibleToggle}
            >
              🟢 PUBLICADO & T&C SUBIDOS ({greenIssues.length}) {showGreenIssues ? '▲' : '▼'}
            </button>
            {showGreenIssues && (
              <div className={styles.issueGrid}>
                {(() => {
                  const allGreenIssues = [
                    // 🎁 PROMOCIONES
                    ...greenIssues.filter(issue => {
                      const summary = issue.fields.summary.toUpperCase();
                      return !summary.includes('SEGMENTADA') && !summary.includes('TORNEO');
                    }),
                    // 📦 SEGMENTADAS
                    ...greenIssues.filter(issue => {
                      const summary = issue.fields.summary.toUpperCase();
                      return summary.includes('SEGMENTADA') && !summary.includes('TORNEO');
                    }),
                    // 🏆 TORNEOS
                    ...greenIssues.filter(issue => {
                      const summary = issue.fields.summary.toUpperCase();
                      return summary.includes('TORNEO');
                    }),
                  ];

                  const rowsToShow = 2;
                  const cardsPerRow = 4; // ajusta si tu grid muestra más/menos
                  const visibleCount = greenExpanded ? allGreenIssues.length : rowsToShow * cardsPerRow;
                  const visibleIssues = allGreenIssues.slice(0, visibleCount);

                  return (
                    <>
                      {visibleIssues.map(issue => {
                        const summary = issue.fields.summary.toUpperCase();
                        const isSegmented = summary.includes('SEGMENTADA');
                        const isTournament = summary.includes('TORNEO');
                        const isPromotion = !isSegmented && !isTournament;

                        const cardClass = `${styles.issueCard} ${isSegmented
                          ? styles.segmentedCard
                          : isTournament
                            ? styles.tournamentCard
                            : styles.promotionCard
                          }`;

                        return (
                          <div
                            key={issue.key}
                            onClick={() => openModal(issue)}
                            className={cardClass}
                          >
                            <strong>
                              {issue.key}
                              <span style={{ color: 'green', marginLeft: '10px' }}>●</span>
                            </strong>
                            <p>
                              {isPromotion && '🎁 '}
                              {isSegmented && '📦 '}
                              {isTournament && '🏆 '}
                              {issue.fields.summary}
                            </p>
                          </div>
                        );
                      })}

                      {/* Botón para expandir */}
                      {allGreenIssues.length > rowsToShow * cardsPerRow && (
                        <button
                          className={styles.expandButton}
                          onClick={() => setGreenExpanded(!greenExpanded)}
                        >
                          {greenExpanded ? '➖ Ver menos' : '➕ Ver más'}
                        </button>
                      )}

                    </>
                  );
                })()}
              </div>

            )}




          </div>

          {/* Sección ROJA */}
          <div className={styles.collapsibleGroup}>
            <button
              onClick={() => setShowRedIssues(!showRedIssues)}
              className={styles.collapsibleToggle}
            >
              🔴 FALTA PUBLICAR & SUBIR T&C ({redIssues.length}) {showRedIssues ? '▲' : '▼'}
            </button>
            {showRedIssues && (
              <div className={styles.issueGrid}>
                {[
                  ...redIssues.filter(issue => {
                    const summary = issue.fields.summary.toUpperCase();
                    return !summary.includes('SEGMENTADA') && !summary.includes('TORNEO');
                  }),
                  ...redIssues.filter(issue => {
                    const summary = issue.fields.summary.toUpperCase();
                    return summary.includes('SEGMENTADA') && !summary.includes('TORNEO');
                  }),
                  ...redIssues.filter(issue => {
                    const summary = issue.fields.summary.toUpperCase();
                    return summary.includes('TORNEO');
                  }),
                ].map(issue => {
                  const summary = issue.fields.summary.toUpperCase();
                  const isSegmented = summary.includes('SEGMENTADA');
                  const isTournament = summary.includes('TORNEO');
                  const isPromotion = !isSegmented && !isTournament;

                  const cardClass = `${styles.issueCard} ${isSegmented
                    ? styles.segmentedCard
                    : isTournament
                      ? styles.tournamentCard
                      : styles.promotionCard
                    }`;

                  return (
                    <div
                      key={issue.key}
                      onClick={() => openModal(issue)}
                      className={cardClass}
                    >
                      <strong>
                        {issue.key}
                        <span style={{ color: 'red', marginLeft: '10px' }}>●</span>
                      </strong>
                      <p>
                        {isPromotion && '🎁 '}
                        {isSegmented && '📦 '}
                        {isTournament && '🏆 '}
                        {issue.fields.summary}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}




          </div>
        </div>



      </div>



      {selectedIssue && (
        <div className={styles.modalOverlay} onClick={closeModal}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <button onClick={closeModal} className={styles.closeIcon}>✖</button>

            <div className={styles.modalHeader}>
              <h2>{selectedIssue.key}</h2>
              <p><strong>{selectedIssue.fields.summary}</strong></p>
            </div>

            <div className={styles.modalBody}>
              {/* Columna izquierda */}
              <div className={styles.columnLeft}>
                {selectedIssue.fields.duedate && (
                  <p>📅 <strong>Fecha límite:</strong> {new Date(selectedIssue.fields.duedate).toLocaleDateString()}</p>
                )}
                {selectedIssue.fields.assignee?.displayName && (
                  <p>👤 <strong>Responsable:</strong> {selectedIssue.fields.assignee.displayName}</p>
                )}
                {selectedIssue.fields.priority?.name && (
                  <p>⚡ <strong>Prioridad:</strong> {selectedIssue.fields.priority.name}</p>
                )}
                {selectedIssue.fields.labels && selectedIssue.fields.labels.length > 0 && (
                  <p>🏷️ <strong>Etiquetas:</strong> {selectedIssue.fields.labels.join(', ')}</p>
                )}

                {(selectedIssue.fields as any).attachment?.length > 0 && (
                  <div className={styles.attachmentsSection}>
                    <h4>📎 Archivos adjuntos:</h4>
                    <ul className={styles.attachmentList}>
                      {(selectedIssue.fields as any).attachment?.map((file: any) => (
                        <li key={file.id}>
                          <a href={file.content} target="_blank" rel="noopener noreferrer">
                            📄 {file.filename} ({(file.size / 1024).toFixed(1)} KB)
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedIssue.fields.subtasks?.length ? (
                  <div className={styles.subtaskSection}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                      <h4 style={{ margin: 0 }}>📋 Subtareas:</h4>
                      {selectedIssue.fields.subtasks.some(subtask => {
                        const summary = subtask.fields.summary.toLowerCase();
                        return !(summary.includes('publicación de banners y t&c') || summary.includes('publicación de landing y t&c'));
                      }) && (
                        <button
                          onClick={() => setShowAllSubtasks(!showAllSubtasks)}
                          className={styles.expandButton}
                          style={{
                            background: 'none',
                            border: '1px solid var(--primary)',
                            color: 'var(--primary)',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontSize: '0.8rem',
                            fontWeight: '500',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {showAllSubtasks ? '🔼 Ocultar otras' : '🔽 Mostrar todas'}
                        </button>
                      )}
                    </div>
                    <ul className={styles.subtaskList}>
                      {selectedIssue.fields.subtasks
                        .filter((subtask) => {
                          const summary = subtask.fields.summary.toLowerCase();
                          const hasDropdown = summary.includes('publicación de banners y t&c') || summary.includes('publicación de landing y t&c');
                          return hasDropdown || showAllSubtasks;
                        })
                        .map((subtask) => {
                        const currentStatus = subtaskStatuses[subtask.key] || subtask.fields.status.name;
                        const availableTransitions = subtaskTransitions[subtask.key] || [];

                        const summary = subtask.fields.summary.toLowerCase();
                        const showDropdown = summary.includes('publicación de banners y t&c') || summary.includes('publicación de landing y t&c');

                        const statusDisplayMap: { [key: string]: string } = {
                          'To Do': 'Por Hacer',
                          'Done': 'Hecho',
                        };
                        const simplifiedOptions = [
                          { value: 'To Do', label: 'Por Hacer' },
                          { value: 'Done', label: 'Hecho' },
                        ];
                        const currentDisplayStatus = statusDisplayMap[currentStatus] || currentStatus;

                        const formatOptionLabel = ({ value, label }: { value: string, label: string }) => (
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <span style={{ color: value === 'Done' ? 'green' : 'red', marginRight: '8px' }}>●</span>
                            {label}
                          </div>
                        );

                        return (
                          <li key={subtask.key} className={styles.subtaskItem}>
                            <span onClick={() => openSubtask(subtask.key)} style={{ cursor: 'pointer', flexGrow: 1 }}>
                              {subtask.fields.summary}
                            </span>
                            {showDropdown ? (
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }} onClick={(e) => e.stopPropagation()}>
                                <Select
                                  value={{ label: currentDisplayStatus, value: currentStatus }}
                                  onChange={async (selectedOption) => {
                                    if (selectedOption && selectedIssue) {
                                      const newStatus = selectedOption.value;
                                      setSubtaskStatuses(prev => ({ ...prev, [subtask.key]: newStatus }));
                                      setIsUpdating(true);
                                      try {
                                        const res = await fetch(`/api/issue/${subtask.key}`,
                                          {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ newStatus }),
                                          });
                                        if (!res.ok) throw new Error('Error al cambiar estado');
                                        // No mostramos alerta para una experiencia más fluida
                                        await openModal(selectedIssue); // Recargamos para confirmar
                                      } catch (error) {
                                        console.error('Error al actualizar estado:', error);
                                        alert('No se pudo actualizar el estado');
                                        // Revertir el estado en la UI si falla
                                        setSubtaskStatuses(prev => ({ ...prev, [subtask.key]: currentStatus }));
                                      } finally {
                                        setIsUpdating(false);
                                      }
                                    }
                                  }}
                                  options={simplifiedOptions}
                                  formatOptionLabel={formatOptionLabel}
                                  className={styles.statusSelect}
                                  styles={{
                                    container: (base) => ({ ...base, width: '160px' }),
                                    option: (base) => ({ ...base, fontSize: '15px' }),
                                    singleValue: (base) => ({ ...base, fontSize: '15px' }),
                                  }}
                                  isSearchable={false}
                                  isDisabled={isUpdating}
                                />
                              </div>
                            ) : (
                              <strong style={{ opacity: showAllSubtasks ? 1 : 0.7 }}>{subtask.fields.status.name}</strong>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.noSubtasks}>No hay subtareas.</p>
                )}


              </div>

              {/* Columna derecha */}
              <div className={styles.columnRight}>
                {selectedIssue.fields.description && (
                  <div>
                    <h4>📝 Descripción:</h4>
                    <div className={styles.description}>
                      {renderADFToReact(selectedIssue.fields.description, (selectedIssue.fields as any).attachment || [])}
                    </div>
                  </div>
                )}

                {selectedIssue.comments?.length ? (
                  <div className={styles.commentsSection}>
                    <h4>💬 Comentarios:</h4>
                    <ul className={styles.commentList}>
                      {selectedIssue.comments.map((comment) => (
                        <li key={comment.id}>
                          <p>
                            <strong>{comment.author}</strong>{' '}
                            <em className={styles.commentDate}>
                              ({new Date(comment.created).toLocaleString()})
                            </em>
                          </p>
                          <div>{renderADFToReact(comment.body, (selectedIssue.fields as any).attachment || [])}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.noComments}>💬 Sin comentarios.</p>
                )}

                {/* Campo para agregar comentarios al issue principal */}
                <div className={styles.commentInputWrapper}>
                  <h4>🗨️ Agregar comentario:</h4>
                  <MentionsInput
                    value={mentionText}
                    onChange={(e) => setMentionText(e.target.value)}
                    onKeyDown={(e) => {
                      // Enviar comentario con Ctrl+Enter o Shift+Enter
                      if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
                        e.preventDefault();
                        if (mentionText.trim()) {
                          handleSendCommentToIssue();
                        }
                      }
                    }}
                    markup="@[{__display__}](id:{__id__})"
                    className={mentionStyles.mentions}
                    classNames={{
                      input: mentionStyles.input
                    }}
                    placeholder="Escribe un comentario con @ para mencionar... (Ctrl+Enter para enviar)"
                  >
                    <Mention
                      trigger="@"
                      markup="@[{__display__}](id:{__id__})"
                      data={(search, callback) => {
                        fetch(`/api/issue/${selectedIssue?.key}?mentions=true&query=${search}`)
                          .then(res => res.json())
                          .then(users => {
                            const safeUsers = (users || [])
                              .map((u: { accountId?: string; id?: string; displayName?: string; display?: string }) => ({
                                id: u.accountId || u.id,
                                display: u.displayName || u.display,
                              }))
                              .filter((u: { id: string; display: string }) => u.id && u.display);
                            callback(safeUsers);
                          })
                          .catch(() => callback([]));
                      }}
                      renderSuggestion={(entry, search, highlightedDisplay, index, focused) => (
                        <div 
                          key={entry.id} 
                          className={focused ? styles.mentionFocused : ''}
                          style={{
                            padding: '8px 12px',
                            backgroundColor: focused ? '#e3f2fd' : 'transparent',
                            cursor: 'pointer',
                            borderRadius: '4px',
                            transition: 'background-color 0.2s ease'
                          }}
                        >
                          👤 {highlightedDisplay}
                        </div>
                      )}
                      displayTransform={(id, display) => `@${display}`}
                    />
                  </MentionsInput>
                  <button
                    onClick={handleSendCommentToIssue}
                    className={styles.commentButton}
                  >
                    💬 Comentar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}


      {/* Modal Subtarea */}
      {selectedSubtask && (
        <div className={styles.modalOverlay} onClick={closeSubtask}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <h3>{selectedSubtask.key}</h3>
            <p><strong>{selectedSubtask.fields.summary}</strong></p>
            {selectedSubtask.fields.duedate && (
              <p>📅 Fecha límite: {new Date(selectedSubtask.fields.duedate).toLocaleDateString()}</p>
            )}
            <p><strong>🟢 Estado actual:</strong> {selectedSubtask.fields.status.name}</p>
            {selectedSubtask.fields.assignee?.displayName && (
              <p>👤 {selectedSubtask.fields.assignee.displayName}</p>
            )}
            {selectedSubtask.fields.description && (
              <div>
                <h4>📝 Descripción:</h4>
                <div className={styles.description}>
                  {renderADFToReact(selectedSubtask.fields.description, (selectedSubtask.fields as any).attachment || [])}
                </div>
              </div>
            )}

            {(selectedSubtask.fields as any).attachment?.length > 0 && (
              <div className={styles.attachmentsSection}>
                <h4>📎 Archivos adjuntos:</h4>
                <ul className={styles.attachmentList}>
                  {(selectedSubtask.fields as any).attachment?.map((file: any) => (
                    <li key={file.id}>
                      <a href={file.content} target="_blank" rel="noopener noreferrer">
                        📄 {file.filename} ({(file.size / 1024).toFixed(1)} KB)
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {selectedSubtask.comments?.length ? (
              <div className={styles.commentsSection}>
                <h4>💬 Comentarios:</h4>
                <ul className={styles.commentList}>
                  {selectedSubtask.comments.map((comment) => (
                    <li key={comment.id} className={styles.commentItem}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <p>
                          <span className={styles.commentAuthor}>{comment.author}</span>{' '}
                          <em className={styles.commentDate}>
                            ({new Date(comment.created).toLocaleString()})
                          </em>
                        </p>
                        <button
                          onClick={async () => {
                            const confirmDelete = confirm('¿Eliminar este comentario?');
                            if (!confirmDelete) return;

                            try {
                              const res = await fetch(`/api/issue/${selectedSubtask.key}/comment/${comment.id}`, {
                                method: 'DELETE',
                              });

                              if (!res.ok) throw new Error();
                              await openSubtask(selectedSubtask.key); // Recarga la subtarea
                            } catch (err) {
                              alert('❌ No se pudo eliminar el comentario');
                              console.error(err);
                            }
                          }}
                          className={styles.deleteCommentButton}
                          title="Eliminar comentario"
                        >
                          ❌
                        </button>
                      </div>
                      <div className={styles.commentBody}>
                        {renderADFToReact(comment.body, (selectedSubtask.fields as any).attachment || [])}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className={styles.noComments}>💬 Sin comentarios.</p>
            )}

            <div className={styles.commentInputWrapper}>
              <h4>🗨️ Agregar comentario:</h4>
              <MentionsInput
                value={mentionText}
                onChange={(e) => setMentionText(e.target.value)}
                onKeyDown={(e) => {
                  // Enviar comentario con Ctrl+Enter o Shift+Enter
                  if ((e.ctrlKey || e.shiftKey) && e.key === 'Enter') {
                    e.preventDefault();
                    if (mentionText.trim()) {
                      handleSendComment();
                    }
                  }
                }}
                markup="@[{__display__}](id:{__id__})"
                className={mentionStyles.mentions}
                classNames={{
                  input: mentionStyles.input
                }}
                placeholder="Escribe un comentario con @ para mencionar... (Ctrl+Enter para enviar)"
              >
                <Mention
                  trigger="@"
                  markup="@[{__display__}](id:{__id__})"
                  data={(search, callback) => {
                    fetch(`/api/issue/${selectedSubtask?.key}?mentions=true&query=${search}`)
                      .then(res => res.json())
                      .then(users => {
                        const safeUsers = (users || [])
                          .map((u: { accountId?: string; id?: string; displayName?: string; display?: string }) => ({
                            id: u.accountId || u.id,
                            display: u.displayName || u.display,
                          }))
                          .filter((u: { id: string; display: string }) => u.id && u.display);
                        callback(safeUsers);
                      })
                      .catch(() => callback([]));
                  }}
                  renderSuggestion={(entry, search, highlightedDisplay, index, focused) => (
                    <div 
                      key={entry.id} 
                      className={focused ? styles.mentionFocused : ''}
                      style={{
                        padding: '8px 12px',
                        backgroundColor: focused ? '#e3f2fd' : 'transparent',
                        cursor: 'pointer',
                        borderRadius: '4px',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      👤 {highlightedDisplay}
                    </div>
                  )}
                  displayTransform={(id, display) => `@${display}`}
                />
              </MentionsInput>






              <button
                onClick={handleSendComment}
                className={styles.commentButton}
              >
                💬 Comentar
              </button>
            </div>

            <button onClick={closeSubtask} className={styles.closeButton}>❌ Cerrar</button>
          </div>
        </div>
      )}
      

    </div>

    </div>
  );
}
