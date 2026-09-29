import NewListingWizard from '@/components/dashboard/NewListingWizard';

export const metadata = { title: 'New listing' };

/**
 * Staff create listings with the same guided wizard agents use, instead of the
 * old free-form /post-property?as=admin form. The admin layout has already
 * checked the role; a staff listing publishes straight away and is not
 * metered, so the wizard runs in `staff` mode and returns to the inventory.
 */
export default function AdminNewListingPage() {
  return <NewListingWizard staff doneHref="/dashboard/admin/properties" />;
}
