
import AddressBook from "@/components/user/profile/AddressBook";

export const metadata = {
  title: "My Addresses | AwakenWithMeheck",
  description: "Manage your saved delivery addresses.",
};

export default function AddressesPage() {
  return (
    <main className="min-h-[70vh] bg-white">
      <div className="mx-auto w-full max-w-5xl px-4 pb-14 pt-6 sm:px-6 lg:px-8">
        <AddressBook />
      </div>
    </main>
  );
}
