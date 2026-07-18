import { ImbaCeoCockpit } from '@/components/imba/ImbaCeoCockpit';
import { ImbaOsStateProvider } from '@/components/imba/ImbaOsState';

export default function ImbaOsHome() {
  return (
    <ImbaOsStateProvider>
      <ImbaCeoCockpit />
    </ImbaOsStateProvider>
  );
}
