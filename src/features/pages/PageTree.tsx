import { memo, useCallback, useState } from 'react';
import { FiChevronDown, FiChevronRight, FiFileText, FiPlus } from 'react-icons/fi';
import { NavLink } from 'react-router-dom';

import IconButton from '@/components/ui/IconButton';
import { cn } from '@/utils/cn';
import type { PageTreeNode } from '@/types/models';

interface TreeItemProps {
  node: PageTreeNode;
  workspaceId: string;
  expanded: Set<string>;
  canWrite: boolean;
  onToggle: (id: string) => void;
  onAddChild: (parentId: string) => void;
}

const TreeItem = memo(function TreeItem({ node, workspaceId, expanded, canWrite, onToggle, onAddChild }: TreeItemProps) {
  const open = expanded.has(node.id);
  const hasChildren = node.children.length > 0;

  return (
    <li>
      <div className="group flex items-center gap-0.5" style={{ paddingLeft: node.depth * 12 }}>
        <button
          type="button"
          aria-label={open ? `Collapse ${node.title}` : `Expand ${node.title}`}
          onClick={() => onToggle(node.id)}
          className={cn('flex h-6 w-6 items-center justify-center text-stone-400', !hasChildren && 'invisible')}
        >
          {open ? <FiChevronDown /> : <FiChevronRight />}
        </button>
        <NavLink
          to={`/w/${workspaceId}/pages/${node.id}`}
          className={({ isActive }) =>
            cn(
              'flex min-w-0 flex-1 items-center gap-2 rounded px-1.5 py-1 text-sm',
              isActive
                ? 'bg-stone-200/70 font-medium dark:bg-stone-800'
                : 'text-stone-600 hover:bg-stone-100 dark:text-stone-300 dark:hover:bg-stone-800/60'
            )
          }
        >
          <FiFileText className="shrink-0 text-stone-400" />
          <span className="truncate">{node.title}</span>
        </NavLink>
        {canWrite && (
          <IconButton
            label={`Add page inside ${node.title}`}
            icon={<FiPlus />}
            onClick={() => onAddChild(node.id)}
            className="h-6 w-6 opacity-0 group-hover:opacity-100 focus:opacity-100"
          />
        )}
      </div>
      {open && hasChildren && (
        <ul>
          {node.children.map((child) => (
            <TreeItem
              key={child.id}
              node={child}
              workspaceId={workspaceId}
              expanded={expanded}
              canWrite={canWrite}
              onToggle={onToggle}
              onAddChild={onAddChild}
            />
          ))}
        </ul>
      )}
    </li>
  );
});

interface PageTreeProps {
  nodes: PageTreeNode[];
  workspaceId: string;
  canWrite: boolean;
  onAddChild: (parentId: string) => void;
}

function PageTree({ nodes, workspaceId, canWrite, onAddChild }: PageTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(nodes.map((node) => node.id)));

  const toggle = useCallback((id: string) => {
    setExpanded((current) => {
      const next = new Set(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }

      return next;
    });
  }, []);

  return (
    <ul className="flex flex-col gap-0.5">
      {nodes.map((node) => (
        <TreeItem
          key={node.id}
          node={node}
          workspaceId={workspaceId}
          expanded={expanded}
          canWrite={canWrite}
          onToggle={toggle}
          onAddChild={onAddChild}
        />
      ))}
    </ul>
  );
}

export default memo(PageTree);
