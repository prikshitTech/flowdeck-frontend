import { useMatch } from 'react-router-dom';

export default function useWorkspaceId(): string | undefined {
  return useMatch('/w/:workspaceId/*')?.params.workspaceId;
}
