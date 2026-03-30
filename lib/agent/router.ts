
import { prisma } from '@/lib/prisma';

export type RouterAction = 
  | { type: 'CREATE_TASK'; taskType: string; prompt: string; params?: any }
  | { type: 'ASK_CLARIFY'; question: string; options: { label: string; value: string }[] }
  | { type: 'EXECUTE_TOOL'; tool: string; args: any }
  | { type: 'CHAT'; response: string }
  | { type: 'REJECT'; reason: string };

export class CommandRouter {
  
  static async route(message: string, context: any): Promise<RouterAction> {
    const lowerMsg = message.trim().toLowerCase();

    // 1. SLASH COMMANDS
    if (lowerMsg.startsWith('/fix')) return { type: 'CREATE_TASK', taskType: 'BUG_FIX', prompt: message.replace('/fix', '').trim() };
    if (lowerMsg.startsWith('/feature')) return { type: 'CREATE_TASK', taskType: 'FEATURE', prompt: message.replace('/feature', '').trim() };
    if (lowerMsg.startsWith('/refactor')) return { type: 'CREATE_TASK', taskType: 'REFACTOR', prompt: message.replace('/refactor', '').trim() };
    if (lowerMsg.startsWith('/test')) return { type: 'CREATE_TASK', taskType: 'TEST', prompt: message.replace('/test', '').trim() };
    if (lowerMsg.startsWith('/ui')) return { type: 'CREATE_TASK', taskType: 'UI_IMPROVEMENT', prompt: message.replace('/ui', '').trim() };

    // 2. URL DETECTION
    // Regex for simple URL detection
    const urlMatch = message.match(/(https?:\/\/[^\s]+)|(www\.[^\s]+)/);
    if (urlMatch) {
      const url = urlMatch[0].startsWith('http') ? urlMatch[0] : `https://${urlMatch[0]}`;
      // Clarify intent for URL
      return {
        type: 'ASK_CLARIFY',
        question: `Ich habe eine URL erkannt: ${url}. Was soll ich tun?`,
        options: [
          { label: '🔍 Seite analysieren (SEO/Content)', value: `/analyze ${url}` },
          { label: '🐛 Fehler auf Seite beheben', value: `/fix url ${url}` },
          { label: '🧪 Daten extrahieren', value: `/extract ${url}` }
        ]
      };
    }

    // 3. KEYWORD TRIGGERS
    if (lowerMsg === 'finder' || lowerMsg === 'files' || lowerMsg === 'dateien') {
      return {
        type: 'ASK_CLARIFY',
        question: 'Was möchtest du mit den Dateien tun?',
        options: [
          { label: '📂 Dateien im Repo durchsuchen', value: '/search files' },
          { label: '🗺️ Projektstruktur anzeigen', value: '/tree' },
          { label: '💻 Lokalen Finder öffnen', value: '[OPEN_FileManager]' } // Uses existing tag trigger
        ]
      };
    }
    
    if (lowerMsg.includes('status') || lowerMsg === 'tasks') {
        return { type: 'EXECUTE_TOOL', tool: 'CHECK_STATUS', args: {} };
    }

    // 4. AUTO-DETECT (Fallback to General Task if it looks like a request)
    // Heuristic: If message is long (> 3 words) and contains action verbs, assume Task.
    if (message.split(' ').length > 2) {
       // We can return a generic task or let LLM decide. 
       // For "Radical Fix", we prefer Creating Tasks over chit-chat if it sounds imperative.
       const imperitives = ['fix', 'create', 'make', 'update', 'change', 'run', 'test', 'deploy', 'machen', 'erstelle', 'ändere'];
       if (imperitives.some(v => lowerMsg.includes(v))) {
           return { type: 'CREATE_TASK', taskType: 'GENERAL', prompt: message };
       }
    }

    // Default: Just Chat (LLM will handle it, effectively bypassing this router)
    return { type: 'CHAT', response: '' };
  }
}
