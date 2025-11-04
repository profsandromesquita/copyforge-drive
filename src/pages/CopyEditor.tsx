import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CopyEditorProvider, useCopyEditor } from '@/hooks/useCopyEditor';
import { EditorHeader } from '@/components/copy-editor/EditorHeader';
import { BlockToolbar } from '@/components/copy-editor/BlockToolbar';
import { SessionCanvas } from '@/components/copy-editor/SessionCanvas';
import { EditorSidebar } from '@/components/copy-editor/EditorSidebar';

const CopyEditorContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { loadCopy, setCopyId } = useCopyEditor();

  useEffect(() => {
    if (!id) {
      navigate('/dashboard');
      return;
    }

    setCopyId(id);
    loadCopy(id);
  }, [id, loadCopy, setCopyId, navigate]);

  return (
    <div className="h-screen flex flex-col">
      <EditorHeader />
      <BlockToolbar />
      <div className="flex flex-1 overflow-hidden">
        <SessionCanvas />
        <EditorSidebar />
      </div>
    </div>
  );
};

const CopyEditor = () => {
  return (
    <CopyEditorProvider>
      <CopyEditorContent />
    </CopyEditorProvider>
  );
};

export default CopyEditor;
