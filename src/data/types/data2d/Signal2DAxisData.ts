import { Signal2DAxisData as NMRSignal2DAxisData } from 'nmr-processing/lib/types/NMRSignal2D';

export interface Signal2DAxisData extends NMRSignal2DAxisData {
  originDelta: number;
}