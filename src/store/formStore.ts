import { create } from 'zustand';
import { Navmc10274Data } from '@/types/navmc';

interface FormState {
  formData: Navmc10274Data;
  setField: (field: keyof Navmc10274Data, value: string) => void;
  resetForm: () => void;
  loadForm: (data: Navmc10274Data) => void;
}

export const DEFAULT_NAVMC_DATA: Navmc10274Data = {
  actionNo: '',
  ssic: '',
  date: new Date().toISOString().split('T')[0], // YYYY-MM-DD
  from: '',
    orgStation: '',
    to: '',
  via: '',
  subject: '',
  reference: '',
  enclosure: '',
  supplementalInfo: '',
  copyTo: '',
};

export const useFormStore = create<FormState>((set) => ({
  formData: DEFAULT_NAVMC_DATA,
  setField: (field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        [field]: value,
      },
    })),
  resetForm: () => set({ formData: DEFAULT_NAVMC_DATA }),
  loadForm: (data) => set({ formData: data }),
}));
