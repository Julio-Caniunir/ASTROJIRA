import React from 'react';
import styles from './CalendarTooltip.module.css';
import { calendarUtils } from '../config/calendar.config';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: string;
  activeDate: string;
  dayName?: string;
}

interface CalendarTooltipProps {
  tooltip: TooltipState;
  onClose: () => void;
}

const CalendarTooltip: React.FC<CalendarTooltipProps> = ({ tooltip, onClose }) => {
  if (!tooltip.visible) return null;

  const handleItemClick = (issueKey: string) => {
    const jiraUrl = calendarUtils.generateJiraUrl(issueKey);
    window.open(jiraUrl, '_blank');
  };

  const parseTooltipContent = (content: string) => {
    return content.split('\n').map((line, index) => {
      const issueKey = line.split(':')[0];
      const issueTitle = line.split(':').slice(1).join(':').trim();
      
      return {
        key: index,
        issueKey,
        issueTitle,
        isLast: index === content.split('\n').length - 1
      };
    });
  };

  const tooltipItems = parseTooltipContent(tooltip.content);

  return (
    <>
      {/* Overlay to close tooltip */}
      <div
        onClick={onClose}
        className={styles.tooltipOverlay}
        aria-label="Cerrar tooltip"
      />

      <div
        onClick={(e) => e.stopPropagation()}
        className={styles.tooltip}
        style={{
          left: tooltip.x,
          top: tooltip.y
        }}
        role="dialog"
        aria-labelledby="tooltip-header"
        aria-describedby="tooltip-content"
      >
        <TooltipHeader dayName={tooltip.dayName} />
        <TooltipContent items={tooltipItems} onItemClick={handleItemClick} />
      </div>
    </>
  );
};

interface TooltipHeaderProps {
  dayName?: string;
}

const TooltipHeader: React.FC<TooltipHeaderProps> = ({ dayName }) => {
  return (
    <div className={styles.tooltipHeader} id="tooltip-header">
      <span>Promociones</span>
      {dayName && (
        <span style={{
          backgroundColor: 'rgba(255, 255, 255, 0.2)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '10px',
          fontWeight: '700'
        }}>
          {dayName}
        </span>
      )}
    </div>
  );
};

interface TooltipItem {
  key: number;
  issueKey: string;
  issueTitle: string;
  isLast: boolean;
}

interface TooltipContentProps {
  items: TooltipItem[];
  onItemClick: (issueKey: string) => void;
}

const TooltipContent: React.FC<TooltipContentProps> = ({ items, onItemClick }) => {
  return (
    <div id="tooltip-content">
      {items.map((item) => (
        <TooltipItem
          key={item.key}
          item={item}
          onClick={() => onItemClick(item.issueKey)}
        />
      ))}
    </div>
  );
};

interface TooltipItemProps {
  item: TooltipItem;
  onClick: () => void;
}

const TooltipItem: React.FC<TooltipItemProps> = ({ item, onClick }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onClick();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick();
    }
  };

  return (
    <div 
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={styles.tooltipItem}
      style={{
        marginBottom: item.isLast ? '0' : '8px'
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir issue ${item.issueKey} en Jira`}
    >
      <div className={styles.issueKey}>
        {item.issueKey}
        <span style={{
          fontSize: '10px',
          opacity: 0.7,
          fontWeight: '400'
        }}>↗</span>
      </div>
      <div className={styles.issueTitle}>
        {item.issueTitle}
      </div>
    </div>
  );
};

export default CalendarTooltip;