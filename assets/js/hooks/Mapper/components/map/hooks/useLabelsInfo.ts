import { useMemo } from 'react';
import { LabelsManager } from '@/hooks/Mapper/utils/labelsManager';
import { LABELS_INFO, LABELS_ORDER } from '@/hooks/Mapper/components/map/constants';
import { useMapGetOption } from '@/hooks/Mapper/mapRootProvider/hooks/api';
interface UseLabelsInfoParams {
  labels: string | null;
  linkedSigPrefix: string | null;
  isShowLinkedSigId: boolean;
}

export type LabelInfo = {
  id: string;
  shortName: string;
};

export function useLabelsInfo({ labels, linkedSigPrefix, isShowLinkedSigId }: UseLabelsInfoParams) {
  const labelsManager = useMemo(() => new LabelsManager(labels ?? ''), [labels]);

  // Merge built-in labels with env-driven custom labels
  const rawCustom = useMapGetOption('custom_labels');
  const customDefs: Array<{ id: string; name: string; shortName: string }> = useMemo(() => {
    if (Array.isArray(rawCustom)) return rawCustom as Array<{ id: string; name: string; shortName: string }>;
    if (typeof rawCustom === 'string') {
      try {
        const parsed = JSON.parse(rawCustom);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [rawCustom]);

  const CUSTOM_LABELS_INFO: Record<string, { id: string; name: string; shortName: string }> = useMemo(
    () => customDefs.reduce((acc, x) => ({ ...acc, [x.id]: x }), {} as Record<string, { id: string; name: string; shortName: string }>),
    [customDefs],
  );

  const INFO: Record<string, { id: string; name: string; shortName: string }> = useMemo(
    () => ({ ...(LABELS_INFO as any), ...CUSTOM_LABELS_INFO }),
    [CUSTOM_LABELS_INFO],
  );

  const ORDER: string[] = useMemo(() => [...LABELS_ORDER, ...Object.keys(CUSTOM_LABELS_INFO)], [CUSTOM_LABELS_INFO]);

  const labelsInfo = useMemo(() => {
    const tokens = labelsManager.list;
    if (!tokens) return [] as LabelInfo[];
    return ORDER.filter(x => tokens.includes(x)).map(x => {
      const def = INFO[x];
      return def ? ({ id: def.id, shortName: def.shortName } as LabelInfo) : ({ id: x, shortName: x } as LabelInfo);
    });
  }, [labelsManager, INFO, ORDER]);

  const labelCustom = useMemo(() => {
    if (isShowLinkedSigId && linkedSigPrefix) {
      return labelsManager.customLabel ? `${linkedSigPrefix}・${labelsManager.customLabel}` : linkedSigPrefix;
    }
    return labelsManager.customLabel;
  }, [linkedSigPrefix, isShowLinkedSigId, labelsManager]);

  return { labelsInfo, labelCustom };
}
