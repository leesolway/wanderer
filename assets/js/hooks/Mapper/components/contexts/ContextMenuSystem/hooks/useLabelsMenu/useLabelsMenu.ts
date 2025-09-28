import { MenuItem } from 'primereact/menuitem';
import { PrimeIcons } from 'primereact/api';
import { useCallback, useRef } from 'react';
import { SolarSystemRawType } from '@/hooks/Mapper/types';
import { getSystemById } from '@/hooks/Mapper/helpers';
import clsx from 'clsx';
import { LABELS, LABELS_INFO, LABELS_ORDER } from '@/hooks/Mapper/components/map/constants.ts';
import { GRADIENT_MENU_ACTIVE_CLASSES } from '@/hooks/Mapper/constants.ts';
import { LabelsManager } from '@/hooks/Mapper/utils/labelsManager.ts';
import { useMapGetOption } from '@/hooks/Mapper/mapRootProvider/hooks/api';

export const getLabels = (labels: string | null) => (labels ? (labels ?? '').split(',') : []);
export const updateLabels = (labels: string | null, label: string) => {
  const parsedLabels = new Set(getLabels(labels));

  if (parsedLabels.has(label)) {
    parsedLabels.delete(label);
  } else {
    parsedLabels.add(label);
  }

  return [...parsedLabels].join(',');
};

export const useLabelsMenu = (
  systems: SolarSystemRawType[],
  systemId: string | undefined,
  onSystemLabels: (val: string) => void,
  onCustomLabelDialog: () => void,
): (() => MenuItem[]) => {
  const ref = useRef({ onSystemLabels, systemId, systems, onCustomLabelDialog });
  ref.current = { onSystemLabels, systemId, systems, onCustomLabelDialog };

  // Read custom labels catalog from options (may be array or JSON string)
  const rawCustom = useMapGetOption('custom_labels');
  const customDefs: Array<{ id: string; name: string; shortName: string }> =
    Array.isArray(rawCustom)
      ? (rawCustom as Array<{ id: string; name: string; shortName: string }>)
      : typeof rawCustom === 'string'
        ? (() => {
            try {
              const parsed = JSON.parse(rawCustom);
              return Array.isArray(parsed) ? parsed : [];
            } catch {
              return [];
            }
          })()
        : [];

  const CUSTOM_LABELS_INFO: Record<string, { id: string; name: string; shortName: string }> =
    customDefs.reduce((acc, x) => ({ ...acc, [x.id]: x }), {} as Record<string, { id: string; name: string; shortName: string }>);

  const RUNTIME_LABELS_ORDER: string[] = [...LABELS_ORDER, ...Object.keys(CUSTOM_LABELS_INFO)];

  const resolveInfo = (id: string) => (LABELS_INFO as any)[id] ?? CUSTOM_LABELS_INFO[id] ?? { id, name: id, shortName: id };

  return useCallback(() => {
    const { onSystemLabels, systemId, systems, onCustomLabelDialog } = ref.current;
    const system = systemId ? getSystemById(systems, systemId) : undefined;
    const labels = new LabelsManager(system?.labels ?? '');

    if (!system) {
      return [
        {
          label: 'Labels',
          icon: PrimeIcons.BOLT,
          items: [],
        },
      ];
    }

    const hasLabels = labels?.list?.length > 0;
    const statusList = hasLabels ? RUNTIME_LABELS_ORDER : RUNTIME_LABELS_ORDER.filter(x => x !== LABELS.clear);

    return [
      {
        label: 'Labels',
        icon: PrimeIcons.BOOKMARK,
        className: clsx({ [GRADIENT_MENU_ACTIVE_CLASSES]: hasLabels }),
        items: [
          ...(labels.customLabel.length > 0
            ? [
                {
                  label: 'Clear custom label',
                  icon: 'pi pi-trash',
                  command: () => {
                    labels.updateCustomLabel('');
                    onSystemLabels(labels.toString());
                  },
                },
              ]
            : []),
          {
            label: 'Custom label',
            icon: 'pi pi-language',
            command: onCustomLabelDialog,
          },
          { separator: true },
          ...statusList.map(x => ({
            label: resolveInfo(x).name,
            icon: x === LABELS.clear ? PrimeIcons.TRASH : PrimeIcons.BOOKMARK,
            command: () => {
              if (x === LABELS.clear) {
                labels.clearLabels();
                onSystemLabels(labels.toString());
                return;
              }

              labels.toggleLabel(x);
              onSystemLabels(labels.toString());
            },
            className: clsx({ [GRADIENT_MENU_ACTIVE_CLASSES]: labels.hasLabel(x) }),
          })),
        ],
      },
    ];
  }, [CUSTOM_LABELS_INFO, RUNTIME_LABELS_ORDER]);
};
