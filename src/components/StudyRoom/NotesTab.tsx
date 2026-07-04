import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText } from 'lucide-react';

interface NotesTabProps {
  roomId: string;
  user: { id: string };
}

export function NotesTab({ roomId, user }: NotesTabProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchNotes();
  }, [roomId]);

  async function fetchNotes() {
    const { data } = await supabase
      .from('shared_notes')
      .select('content')
      .eq('room_id', roomId)
      .maybeSingle();

    if (data?.content) {
      setContent((data.content as unknown as string) || '');
    }
  }

  const saveNotes = async () => {
    setSaving(true);
    try {
      await supabase
        .from('shared_notes')
        .upsert({
          room_id: roomId,
          content: content,
          last_edited_by: user.id,
          version: 1,
        }, { onConflict: 'room_id' });
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-gray-50">
      <div className="flex items-center justify-between p-3 bg-white border-b border-gray-100">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-primary-500" />
          <h3 className="font-medium text-gray-900">Shared Notes</h3>
        </div>
        <button
          onClick={saveNotes}
          disabled={saving}
          className="btn-primary text-sm px-3 py-1.5"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
      <div className="flex-1 p-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Start taking notes together...\n\n- Use bullet points\n- Write equations\n- Summarize key concepts`}
          className="w-full h-full p-4 bg-white rounded-xl border border-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
        />
      </div>
    </div>
  );
}
