import type { ReactElement } from 'react';
import AdminKeyForm from '../../components/AdminKeyForm/AdminKeyForm';
import OptionsManager from '../../components/OptionsManager/OptionsManager';
import { useAdminKey } from '../../hooks/useAdminKey';

/** Shown on the key form after the server rejects the stored key. */
const KEY_REJECTED_MESSAGE = 'Your admin key was rejected. Enter it again.';

/** Shows the admin-key form until a verified key is held, then the options editor. */
const OptionsPage = (): ReactElement => {
  const { adminKey, isVerifying, error, verifyAndStore, clearAdminKey } = useAdminKey();

  if (adminKey === null) {
    return <AdminKeyForm onVerify={verifyAndStore} isVerifying={isVerifying} errorMessage={error} />;
  }

  return <OptionsManager adminKey={adminKey} onUnauthorized={() => clearAdminKey(KEY_REJECTED_MESSAGE)} />;
};
OptionsPage.displayName = 'OptionsPage';

export default OptionsPage;
