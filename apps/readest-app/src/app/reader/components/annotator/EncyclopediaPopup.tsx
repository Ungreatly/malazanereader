import React, { useEffect, useRef, useState } from 'react';
import { Position } from '@/utils/sel';
import { useTranslation } from '@/hooks/useTranslation';
import Popup from '@/components/Popup';

interface EncyclopediaEntry {
  name: string;
  category: string;
  description: string;
}

interface EncyclopediaData {
  entries: Record<string, EncyclopediaEntry>;
}

interface EncyclopediaPopupProps {
  text: string;
  position: Position;
  trianglePosition: Position;
  popupWidth: number;
  popupHeight: number;
  onDismiss?: () => void;
}

let cachedData: EncyclopediaData | null = null;

const loadEncyclopedia = async (): Promise<EncyclopediaData> => {
  if (cachedData) return cachedData;
  const response = await fetch('/malazan_encyclopedia.json');
  if (!response.ok) throw new Error('Failed to load Malazan Encyclopedia');
  cachedData = await response.json();
  return cachedData!;
};

const findEntry = (data: EncyclopediaData, query: string): EncyclopediaEntry | undefined => {
  const normalized = query.toLowerCase().trim();

  // Exact match
  if (data.entries[normalized]) return data.entries[normalized];

  // Partial match: search term is contained in an entry key or vice versa
  for (const [key, entry] of Object.entries(data.entries)) {
    if (key.includes(normalized) || normalized.includes(key)) {
      return entry;
    }
  }

  // Word-based match: any individual word matches a key or entry name
  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (word.length < 3) continue;
    for (const [key, entry] of Object.entries(data.entries)) {
      if (key.includes(word) || entry.name.toLowerCase().includes(word)) {
        return entry;
      }
    }
  }

  return undefined;
};

const EncyclopediaPopup: React.FC<EncyclopediaPopupProps> = ({
  text,
  position,
  trianglePosition,
  popupWidth,
  popupHeight,
  onDismiss,
}) => {
  const _ = useTranslation();
  const mainRef = useRef<HTMLElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);
  const [entry, setEntry] = useState<EncyclopediaEntry | null>(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const lookup = async () => {
      setLoading(true);
      setError(false);
      setEntry(null);

      try {
        const data = await loadEncyclopedia();
        if (cancelled) return;
        const found = findEntry(data, text);
        if (found) {
          setEntry(found);
        } else {
          setError(true);
        }
      } catch {
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    lookup();
    return () => {
      cancelled = true;
    };
  }, [text]);

  return (
    <div>
      <Popup
        trianglePosition={trianglePosition}
        width={popupWidth}
        height={popupHeight}
        position={position}
        className='select-text'
        onDismiss={onDismiss}
      >
        <div className='relative flex h-full flex-col'>
          <main ref={mainRef} className='flex-grow overflow-y-auto px-4 pb-4 pt-4 font-sans'>
            {loading && (
              <div className='flex h-full items-center justify-center'>
                <span className='loading loading-spinner loading-md' />
              </div>
            )}
            {error && (
              <div className='flex h-full flex-col items-center justify-center text-center'>
                <h1 className='text-lg font-bold'>{_('No Entry Found')}</h1>
                <p className='not-eink:opacity-75 mt-2 text-sm'>
                  {_('No Malazan Encyclopedia entry found for "{{text}}".', { text })}
                </p>
              </div>
            )}
            {entry && (
              <>
                <hgroup>
                  <h1 className='text-lg font-bold'>{entry.name}</h1>
                  <p className='not-eink:opacity-75 text-sm italic'>{entry.category}</p>
                </hgroup>
                <p className='mt-3 text-sm leading-relaxed'>{entry.description}</p>
              </>
            )}
          </main>
          <footer ref={footerRef} className={`mt-auto ${entry ? 'block' : 'hidden'}`}>
            <div className='not-eink:opacity-60 flex items-center px-4 py-2 text-sm'>
              Source: Malazan Encyclopedia
            </div>
          </footer>
        </div>
      </Popup>
    </div>
  );
};

export default EncyclopediaPopup;
