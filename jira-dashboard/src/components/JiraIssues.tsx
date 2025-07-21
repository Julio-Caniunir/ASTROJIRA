import React, { useEffect, useState } from 'react';
import Select from 'react-select';
import { MentionsInput, Mention } from 'react-mentions';
import mentionStyles from '../types/mentionStyles.module.css';
import styles from './JiraIssues.module.css';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from 'react-beautiful-dnd';
function renderADFToReact(adf: any): React.ReactNode {
  if (!adf) return null;  

  const renderNode = (node: any, index: number): React.ReactNode => {
    // 🔵 Mención
    if (node.type === 'mention') {
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
          {node.attrs.text}
        </span>

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

    // Recursivo para contenido anidado
    if (Array.isArray(node.content)) {
      return node.content.map((child: any, idx: number) => renderNode(child, idx));
    }

    return null;
  };

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

export default function JiraIssues() {
  const [issues, setIssues] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIssue, setSelectedIssue] = useState<IssueDetail | null>(null);
  const [selectedSubtask, setSelectedSubtask] = useState<SubtaskDetail | null>(null);
  const [showGreenIssues, setShowGreenIssues] = useState(true);
  const [greenExpanded, setGreenExpanded] = useState(false);

  const [showRedIssues, setShowRedIssues] = useState(true);
  const [subtaskStatus, setSubtaskStatus] = useState('');
  const [mentionText, setMentionText] = useState('');
  const [mentionUsers, setMentionUsers] = useState<{ id: string; display: string }[]>([]);
  const [isUpdating, setIsUpdating] = useState(false); // Agrega esto dentro de tu componente JiraIssues
  const displayMap: Record<string, string> = {
    'To Do': 'Por hacer',
    'Done': 'Hecho',
  };

  const [statusOptions, setStatusOptions] = useState<string[]>([]);
  const greenIssues = issues
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

  const redIssues = issues
    .filter(issue => !greenIssues.includes(issue))
    .sort((a, b) => {
      const numA = parseInt(a.key.match(/\d+/)?.[0] || '0', 10);
      const numB = parseInt(b.key.match(/\d+/)?.[0] || '0', 10);
      return numA - numB;
    });
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

  // 🔽 Nuevo efecto: obtener usuarios mencionables cuando cambia la subtarea seleccionada
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

  return (
    <div className={styles.container}>
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
                              {issue.key} <span title="T&C completados">🟢</span>
                              {isSegmented && ' 📦'}
                              {isTournament && ' 🏆'}
                              {isPromotion && ' 🎁'}
                            </strong>
                            <p>{issue.fields.summary}</p>
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
                        {issue.key} <span title="Faltan publicar T&C">🔴</span>
                        {isSegmented && ' 📦'}
                        {isTournament && ' 🏆'}
                        {isPromotion && ' 🎁'}
                      </strong>
                      <p>{issue.fields.summary}</p>
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
                    <h4>📋 Subtareas:</h4>
                    <ul className={styles.subtaskList}>
                      {selectedIssue.fields.subtasks.map((subtask) => {
                        const summary = subtask.fields.summary.toLowerCase();
                        const isTyc = summary.includes('publicación de banners y t&c') || summary.includes('publicación de landing y t&c');
                        const isDone = subtask.fields.status.name.toLowerCase() === 'done';

                        return (
                          <li key={subtask.key} className={styles.subtaskItem}>
                            {/* Icono de estado */}
                            <span>{isDone ? '🟢' : '🔴'}</span>

                            {/* Botón estilo original */}
                            <button
                              onClick={() => openSubtask(subtask.key)}
                              className={styles.subtaskButton}
                            >
                              <strong style={{ color: '#0033cc' }}>{subtask.key}</strong>: {subtask.fields.summary} —{' '}
                              {!isTyc && <em>{subtask.fields.status.name}</em>}
                            </button>

                            {/* Dropdown solo si es TYC */}
                            {isTyc && (
                              <Select
                                value={{
                                  label: displayMap[subtask.fields.status.name] || subtask.fields.status.name,
                                  value: subtask.fields.status.name,
                                }}
                                options={statusOptions
                                  .filter((status) => ['To Do', 'Done'].includes(status))
                                  .map((status) => ({
                                    label: `${status === 'Done' ? '🟢' : '🔴'} ${displayMap[status] || status}`,
                                    value: status,
                                  }))
                                }

                                onChange={async (selectedOption) => {
                                  const newStatus = selectedOption?.value;
                                  if (!newStatus || newStatus === subtask.fields.status.name) return;

                                  try {
                                    const res = await fetch(`/api/issue/${subtask.key}`, {
                                      method: 'POST',
                                      headers: { 'Content-Type': 'application/json' },
                                      body: JSON.stringify({ newStatus }),
                                    });

                                    if (!res.ok) throw new Error();
                                    alert(`✅ Estado actualizado a ${newStatus}`);
                                    await openModal(selectedIssue);
                                  } catch (err) {
                                    alert('❌ No se pudo actualizar el estado');
                                    console.error(err);
                                  }
                                }}
                                styles={{
                                  control: (base) => ({
                                    ...base,
                                    minWidth: 160,
                                    borderRadius: 6,
                                    fontSize: '14px',
                                    padding: '1px 2px',
                                  }),
                                }}
                                classNamePrefix="react-select"
                              />
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
                      {renderADFToReact(selectedIssue.fields.description)}
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
                          <div>{renderADFToReact(comment.body)}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className={styles.noComments}>💬 Sin comentarios.</p>
                )}
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
            <div className={styles.statusControl}>
              <label><strong>🟢 Estado:</strong></label>
              <select
                value={subtaskStatus}
                onChange={(e) => setSubtaskStatus(e.target.value)}
                className={styles.statusSelect}
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>

              <button
                disabled={
                  isUpdating || !selectedSubtask || subtaskStatus === selectedSubtask.fields.status.name
                }
                onClick={async () => {
                  setIsUpdating(true);
                  try {
                    const res = await fetch(`/api/issue/${selectedSubtask.key}`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ newStatus: subtaskStatus }),
                    });

                    if (!res.ok) throw new Error('Error al cambiar estado');

                    alert('Estado actualizado');
                    closeSubtask(); // o await openSubtask(selectedSubtask.key) si quieres recargar
                  } catch (error) {
                    console.error('Error al actualizar estado:', error);
                    alert('No se pudo actualizar el estado');
                  } finally {
                    setIsUpdating(false);
                  }
                }}
                className={styles.changeStatusButton}
              >
                {isUpdating ? 'Cambiando...' : 'Cambiar estado'}
              </button>
            </div>
            {selectedSubtask.fields.assignee?.displayName && (
              <p>👤 {selectedSubtask.fields.assignee.displayName}</p>
            )}
            {selectedSubtask.fields.description && (
              <div>
                <h4>📝 Descripción:</h4>
                <div className={styles.description}>
                  {renderADFToReact(selectedSubtask.fields.description)}
                </div>
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
                        {renderADFToReact(comment.body)}
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
                markup="@[{__display__}](id:{__id__})"
                className={mentionStyles.mentions}
                classNames={{
                  input: mentionStyles.input
                }}
                placeholder="Escribe un comentario con @ para mencionar..."
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
                  renderSuggestion={(entry, search, highlightedDisplay) => (
                    <div key={entry.id}>{highlightedDisplay}</div>
                  )}
                  displayTransform={(id, display) => `@${display}`}
                />
              </MentionsInput>






              <button
                onClick={async () => {
                  if (!mentionText.trim()) return alert('Escribe un comentario primero');
                  try {
                    const res = await fetch(`/api/issue/${selectedSubtask.key}/comment`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ comment: mentionText }),
                    });
                    if (!res.ok) throw new Error();
                    alert('✅ Comentario enviado');
                    setMentionText('');
                    await openSubtask(selectedSubtask.key); // recarga la subtarea
                  } catch (err) {
                    alert('❌ Error al enviar comentario');
                    console.error(err);
                  }
                }}
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

  );

}
