
import React, { useState, useEffect } from 'react';
import { Note, GithubConfig } from '../types';

interface GithubSyncProps {
  notes: Note[];
  onClose: () => void;
}

const GithubSync: React.FC<GithubSyncProps> = ({ notes, onClose }) => {
  const [config, setConfig] = useState<GithubConfig>({
    repoUrl: 'https://github.com/Eng-herta/Ainote.git',
    token: localStorage.getItem('gh_token') || '',
    branch: 'main'
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info', msg: string } | null>(null);

  const saveToken = (token: string) => {
    localStorage.setItem('gh_token', token);
    setConfig(prev => ({ ...prev, token }));
  };

  const syncToGithub = async () => {
    if (!config.token) {
      setStatus({ type: 'error', msg: 'Fadlan geli GitHub Personal Access Token.' });
      return;
    }

    setIsSyncing(true);
    setStatus({ type: 'info', msg: 'Notes-ka ayaa loo dirayaa GitHub...' });

    try {
      // Parse owner and repo from URL
      const parts = config.repoUrl.replace('.git', '').split('/');
      const repo = parts.pop();
      const owner = parts.pop();

      if (!owner || !repo) throw new Error('Repository URL-ka sax maaha.');

      for (const note of notes) {
        const path = `notes/${note.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`;
        const content = `# ${note.title}\n\n${note.content}\n\n---\n**Summary:** ${note.summary || 'N/A'}\n**Tags:** ${note.tags.join(', ')}`;
        const base64Content = btoa(unescape(encodeURIComponent(content)));

        // 1. Check if file exists to get SHA
        let sha: string | undefined;
        try {
          const checkRes = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}?ref=${config.branch}`, {
            headers: { 'Authorization': `token ${config.token}` }
          });
          if (checkRes.ok) {
            const data = await checkRes.json();
            sha = data.sha;
          }
        } catch (e) {}

        // 2. Create or Update file
        const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${path}`, {
          method: 'PUT',
          headers: {
            'Authorization': `token ${config.token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: `Sync note: ${note.title}`,
            content: base64Content,
            branch: config.branch,
            sha: sha
          })
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || 'Cillad ayaa dhacday xilliga sync-ga.');
        }
      }

      setStatus({ type: 'success', msg: 'Dhammaan Notes-ka waa lagu guuleystay in loo diro GitHub!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: `Error: ${err.message}` });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-[32px] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-black rounded-xl flex items-center justify-center text-white">
              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg>
            </div>
            <div>
              <h3 className="text-lg font-black text-gray-900">GitHub Connect</h3>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Repository Sync</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12" strokeWidth="3"/></svg>
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Repository URL</label>
            <input 
              type="text" 
              readOnly
              value={config.repoUrl}
              className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-500 outline-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Personal Access Token</label>
            <input 
              type="password" 
              placeholder="ghp_xxxxxxxxxxxx"
              value={config.token}
              onChange={(e) => saveToken(e.target.value)}
              className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-3 text-sm font-bold text-gray-900 focus:ring-4 focus:ring-indigo-50 focus:border-indigo-100 outline-none transition-all"
            />
            <p className="text-[9px] text-gray-400 font-medium">Waxaad ka abuuri kartaa GitHub Settings &gt; Developer Settings.</p>
          </div>

          {status && (
            <div className={`p-4 rounded-2xl text-xs font-bold flex items-center space-x-3 ${
              status.type === 'success' ? 'bg-green-50 text-green-600' : 
              status.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-indigo-50 text-indigo-600'
            }`}>
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                status.type === 'success' ? 'bg-green-500' : 
                status.type === 'error' ? 'bg-red-500' : 'bg-indigo-500 animate-pulse'
              }`} />
              <span>{status.msg}</span>
            </div>
          )}

          <button 
            onClick={syncToGithub}
            disabled={isSyncing || !config.token}
            className="w-full bg-[#1E293B] text-white py-4 rounded-2xl font-black text-sm shadow-xl shadow-gray-200 hover:scale-[1.02] active:scale-95 transition-all disabled:bg-gray-200 disabled:scale-100 flex items-center justify-center space-x-3"
          >
            {isSyncing ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path></svg>
            )}
            <span>{isSyncing ? 'Syncing...' : 'Sync to GitHub'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default GithubSync;
