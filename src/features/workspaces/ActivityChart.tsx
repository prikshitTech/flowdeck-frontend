import { memo, useMemo } from 'react';

import type { DayCount } from '@/types/models';

interface ActivityChartProps {
  title: string;
  unit: string;
  data: DayCount[];
}

const CHART_HEIGHT = 140;

function ActivityChart({ title, unit, data }: ActivityChartProps) {
  const peak = useMemo(() => Math.max(1, ...data.map((point) => point.count)), [data]);

  if (data.length === 0) {
    return <p className="py-8 text-center text-sm text-stone-500">No {unit} in this period.</p>;
  }

  return (
    <figure>
      <figcaption className="sr-only">{title}</figcaption>
      <div className="flex items-end gap-[2px] border-b border-stone-200 dark:border-stone-700" style={{ height: CHART_HEIGHT }}>
        {data.map((point) => (
          <div key={point.day} className="group relative flex h-full flex-1 items-end justify-center">
            <div
              className="w-full max-w-6 rounded-t bg-brand-600 dark:bg-brand-500"
              style={{ height: `${Math.max((point.count / peak) * 100, 2)}%` }}
            />
            <span
              role="tooltip"
              className="pointer-events-none absolute bottom-full mb-1 hidden rounded bg-stone-900 px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block dark:bg-stone-100 dark:text-stone-900"
            >
              {point.day}: {point.count} {unit}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-1 flex justify-between text-xs text-stone-500">
        <span>{data[0].day}</span>
        <span>
          Peak {peak} {unit}
        </span>
        <span>{data[data.length - 1].day}</span>
      </div>
      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th>Day</th>
            <th>{unit}</th>
          </tr>
        </thead>
        <tbody>
          {data.map((point) => (
            <tr key={point.day}>
              <td>{point.day}</td>
              <td>{point.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

export default memo(ActivityChart);
