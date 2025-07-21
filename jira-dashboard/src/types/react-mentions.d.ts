declare module 'react-mentions' {
    import * as React from 'react';
  
    export interface MentionData {
      id: string;
      display: string;
    }
  
    export interface MentionProps {
        trigger: string | RegExp;
        data: MentionData[] | ((search: string, callback: (data: MentionData[]) => void) => void);
        markup?: string;
        displayTransform?: (id: string, display: string) => string;
        appendSpaceOnAdd?: boolean;
      
        // ✅ Agrega esta línea:
        renderSuggestion?: (
          entry: MentionData,
          search: string,
          highlightedDisplay: React.ReactNode,
          index: number,
          focused: boolean
        ) => React.ReactNode;
      }
  
    export interface MentionsInputProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
      value: string;
      onChange: (event: React.ChangeEvent<HTMLTextAreaElement>) => void;
      children?: React.ReactNode;
      className?: string;
      classNames?: {
        control?: string;
        highlighter?: string;
        input?: string;
      };
      style?: any;
      markup?: string;
      placeholder?: string;
    }
  
    export const MentionsInput: React.FC<MentionsInputProps>;
    export const Mention: React.FC<MentionProps>;
  }
  