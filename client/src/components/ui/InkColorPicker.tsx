import { type InkColor } from '@lorcana/shared';
import { InkColorGrid } from './InkColorGrid.js';

interface InkColorPickerProps {
  selected: InkColor[];
  onChange: (colors: InkColor[]) => void;
  max?: number;
}

export function InkColorPicker({ selected, onChange, max = 2 }: InkColorPickerProps) {
  return <InkColorGrid selected={selected} onChange={onChange} max={max} />;
}
