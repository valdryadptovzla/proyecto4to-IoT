import { createContext, useContext } from 'react';

import { EnergyAppState, useEnergyAppState } from './useEnergyApp';

const EnergyAppContext = createContext<EnergyAppState | null>(null);

export function EnergyAppProvider({ children }: { children: React.ReactNode }) {
  const value = useEnergyAppState();
  return <EnergyAppContext.Provider value={value}>{children}</EnergyAppContext.Provider>;
}

export function useEnergyApp() {
  const context = useContext(EnergyAppContext);
  if (!context) {
    throw new Error('useEnergyApp debe usarse dentro de EnergyAppProvider');
  }

  return context;
}
