import { memo, useMemo, useState } from 'react';
import { FiFileText, FiHash, FiSearch, FiTrello } from 'react-icons/fi';
import { Link, useSearchParams } from 'react-router-dom';

import LoadMoreSentinel from '@/components/common/LoadMoreSentinel';
import useDebounce from '@/hooks/useDebounce';
import useInfiniteList from '@/hooks/useInfiniteList';
import useRequest from '@/hooks/useRequest';
import { EmptyState, PageHeader, Panel } from '@/components/ui/Display';
import { insightApi } from '@/api/services';
import { cn } from '@/utils/cn';
import { getErrorMessage } from '@/utils/errors';
import { timeAgo } from '@/utils/format';
import { useAppSelector } from '@/store/hooks';
import type { SearchHit, SearchKind } from '@/types/models';

const KINDS: { value: SearchKind; label: string; icon: typeof FiFileText }[] = [
  { value: 'page', label: 'Pages', icon: FiFileText },
  { value: 'card', label: 'Cards', icon: FiTrello },
  { value: 'message', label: 'Messages', icon: FiHash }
];

function linkFor(workspaceId: string, hit: SearchHit): string {
  if (hit.kind === 'page') {
    return `/w/${workspaceId}/pages/${hit.id}`;
  }

  if (hit.kind === 'card') {
    return `/w/${workspaceId}/boards/${hit.parentId}`;
  }

  return `/w/${workspaceId}/channels/${hit.parentId}`;
}

const ResultRow = memo(function ResultRow({ hit, workspaceId }: { hit: SearchHit; workspaceId: string }) {
  const Icon = KINDS.find((kind) => kind.value === hit.kind)?.icon ?? FiFileText;

  return (
    <li>
      <Link to={linkFor(workspaceId, hit)} className="flex gap-3 px-4 py-3 hover:bg-stone-50 dark:hover:bg-stone-800/50">
        <Icon className="mt-1 shrink-0 text-stone-400" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{hit.title}</p>
          {hit.snippet && <p className="line-clamp-2 text-sm text-stone-500">{hit.snippet}</p>}
          <p className="mt-0.5 text-xs text-stone-400">
            {hit.kind} · {timeAgo(hit.updatedAt)}
          </p>
        </div>
      </Link>
    </li>
  );
});

export default function SearchScreen() {
  const workspace = useAppSelector((state) => state.workspaces.current)!;
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState(params.get('q') ?? '');
  const [kinds, setKinds] = useState<SearchKind[]>(['page', 'card', 'message']);

  const query = useDebounce(draft.trim(), 350);
  const suggestTerm = useDebounce(draft.trim(), 200);
  const ready = query.length >= 2 && kinds.length > 0;
  const kindKey = kinds.join(',');

  const results = useInfiniteList(
    (page) =>
      ready
        ? insightApi.search(workspace.id, { q: query, kinds: kindKey, page, limit: 20 })
        : Promise.resolve({ items: [], meta: { page: 1, limit: 20, total: 0, pages: 1, hasNext: false, hasPrevious: false, byKind: {} } }),
    `${workspace.id}:${query}:${kindKey}`
  );

  const suggestions = useRequest(
    () => (suggestTerm ? insightApi.suggest(workspace.id, suggestTerm) : Promise.resolve([])),
    [workspace.id, suggestTerm]
  );

  const toggleKind = (kind: SearchKind) => {
    setKinds((current) => (current.includes(kind) ? current.filter((item) => item !== kind) : [...current, kind]));
  };

  const suggestionLinks = useMemo(
    () =>
      (suggestions.data ?? []).map((suggestion) => ({
        ...suggestion,
        to: `/w/${workspace.id}/${suggestion.kind === 'page' ? 'pages' : suggestion.kind === 'board' ? 'boards' : 'channels'}/${suggestion.id}`
      })),
    [suggestions.data, workspace.id]
  );

  return (
    <div className="mx-auto w-full max-w-3xl p-4 sm:p-6">
      <PageHeader title="Search" description={`Find pages, cards and messages in ${workspace.name}.`} />

      <div className="relative mb-3">
        <FiSearch className="absolute top-1/2 left-3 -translate-y-1/2 text-stone-400" />
        <input
          type="search"
          aria-label="Search"
          autoFocus
          value={draft}
          onChange={(event) => {
            setDraft(event.target.value);
            setParams(event.target.value ? { q: event.target.value } : {}, { replace: true });
          }}
          placeholder="Search for a word or phrase"
          className="h-11 w-full rounded-md border border-stone-300 bg-white pr-3 pl-9 text-sm focus:border-brand-600 focus:outline-none dark:border-stone-700 dark:bg-stone-900"
        />
      </div>

      {suggestionLinks.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {suggestionLinks.map((suggestion) => (
            <Link
              key={`${suggestion.kind}-${suggestion.id}`}
              to={suggestion.to}
              className="rounded border border-stone-200 px-2 py-1 text-xs text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:text-stone-300"
            >
              {suggestion.kind}: {suggestion.label}
            </Link>
          ))}
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filter by type">
        {KINDS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={kinds.includes(value)}
            onClick={() => toggleKind(value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm',
              kinds.includes(value)
                ? 'border-brand-600 bg-brand-50 text-brand-800 dark:bg-brand-800/30 dark:text-brand-100'
                : 'border-stone-300 text-stone-600 dark:border-stone-700 dark:text-stone-300'
            )}
          >
            <Icon /> {label}
          </button>
        ))}
      </div>

      <Panel>
        {!ready && <EmptyState icon={<FiSearch />} title="Type at least two characters" />}
        {ready && results.error != null && <p className="p-4 text-sm text-red-600">{getErrorMessage(results.error)}</p>}
        {ready && !results.loading && results.items.length === 0 && results.error == null && (
          <EmptyState icon={<FiSearch />} title="No matches" message="Try a different word, or include more types." />
        )}
        <ul className="divide-y divide-stone-100 dark:divide-stone-800">
          {results.items.map((hit) => (
            <ResultRow key={`${hit.kind}-${hit.id}`} hit={hit} workspaceId={workspace.id} />
          ))}
        </ul>
        {ready && <LoadMoreSentinel hasMore={results.hasMore} loading={results.loading} onLoadMore={results.loadMore} />}
      </Panel>
    </div>
  );
}
