'use client';

import { useState } from 'react';
import Image from 'next/image';
import AdminPropertyActions from './AdminPropertyActions';

interface AdminPayment {
  id: string;
  orderRef: string;
  amount: number;
  currency: string;
  method: string;
  planType: string;
  transactionId: string | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string | null;
  status: string;
  completedAt: string | null;
  createdAt: string;
}

interface PendingProperty {
  id: string;
  hostId: string;
  title: string;
  description: string;
  location: string;
  city: string;
  neighborhood: string | null;
  address: string | null;
  price: number;
  priceUnit: string;
  type: string;
  listingType: string;
  bedrooms: number;
  bathrooms: number;
  area: number;
  amenities: string[];
  images: string[];
  tags?: string[];
  badge: string | null;
  createdAt: string;
  updatedAt: string;
  host: {
    id: string;
    name: string;
    email: string;
    initials: string;
    title: string;
    location: string;
  };
  payments: AdminPayment[];
}

interface NewAgent {
  id: string;
  name: string;
  initials: string;
  title: string;
  location: string;
  yearsExperience: number | null;
  specializations: string[];
  createdAt: string;
  avatar: string | null;
}

interface Props {
  pendingProperties: PendingProperty[];
  newAgents: NewAgent[];
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.max(0, Math.floor(diff / 60000));
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (days > 0) return days === 1 ? 'Yesterday' : `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${mins}m ago`;
}

function formatPrice(price: number, unit: string): string {
  const formatted = price >= 1000000
    ? `$${(price / 1000000).toFixed(1)}M`
    : price >= 1000
    ? `$${(price / 1000).toFixed(0)}k`
    : `$${price.toLocaleString()}`;
  if (unit === 'monthly') return `${formatted}/mo`;
  if (unit === 'nightly') return `${formatted}/nt`;
  return formatted;
}

function paymentBadgeClass(status: string) {
  if (status === 'COMPLETED') return 'bg-emerald-50 text-emerald-700';
  if (status === 'FAILED') return 'bg-red-50 text-red-600';
  return 'bg-amber-50 text-amber-700';
}

export default function AdminApprovalsClient({ pendingProperties, newAgents }: Props) {
  const [activeTab, setActiveTab] = useState<'agents' | 'properties'>('properties');
  const [properties, setProperties] = useState(pendingProperties);
  const [selectedProperty, setSelectedProperty] = useState<PendingProperty | null>(null);
  const [editForm, setEditForm] = useState<PendingProperty | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);

  const currentProperty = editForm || selectedProperty;

  function openProperty(property: PendingProperty, edit = false) {
    setSelectedProperty(property);
    setEditForm({ ...property, amenities: [...property.amenities], images: [...property.images] });
    setIsEditing(edit);
  }

  function updateEdit<K extends keyof PendingProperty>(key: K, value: PendingProperty[K]) {
    setEditForm((current) => current ? { ...current, [key]: value } : current);
  }

  async function savePropertyEdits() {
    if (!editForm) return;
    setIsSaving(true);
    try {
      const response = await fetch(`/api/admin/property/${editForm.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          title: editForm.title,
          description: editForm.description,
          city: editForm.city,
          neighborhood: editForm.neighborhood,
          address: editForm.address,
          price: editForm.price,
          priceUnit: editForm.priceUnit,
          type: editForm.type,
          listingType: editForm.listingType,
          bedrooms: editForm.bedrooms,
          bathrooms: editForm.bathrooms,
          area: editForm.area,
          amenities: editForm.amenities,
          images: editForm.images,
          tags: editForm.tags || [],
          badge: editForm.badge,
        }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to save listing changes.');
      }

      const updatedProperty = {
        ...editForm,
        location: editForm.address || editForm.neighborhood || editForm.city,
      };

      setProperties((current) =>
        current.map((property) => property.id === updatedProperty.id ? updatedProperty : property)
      );
      setSelectedProperty(updatedProperty);
      setEditForm(updatedProperty);
      setIsEditing(false);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to save listing changes.');
    } finally {
      setIsSaving(false);
    }
  }

  async function updatePaymentStatus(paymentId: string, status: 'COMPLETED' | 'FAILED' | 'PENDING') {
    setProcessingPaymentId(paymentId);
    try {
      const response = await fetch(`/api/admin/payments/${paymentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success) {
        throw new Error(payload.error || 'Unable to update payment status.');
      }

      const patchPayment = (payment: AdminPayment): AdminPayment =>
        payment.id === paymentId
          ? {
              ...payment,
              status,
              completedAt: status === 'COMPLETED' ? new Date().toISOString() : null,
            }
          : payment;

      setProperties((current) =>
        current.map((property) => ({ ...property, payments: property.payments.map(patchPayment) }))
      );
      setSelectedProperty((current) =>
        current ? { ...current, payments: current.payments.map(patchPayment) } : current
      );
      setEditForm((current) =>
        current ? { ...current, payments: current.payments.map(patchPayment) } : current
      );
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Unable to update payment status.');
    } finally {
      setProcessingPaymentId(null);
    }
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-white p-10 rounded-[2rem] border border-[#f2f4f6] shadow-sm">
        <div className="max-w-xl">
          <h1 className="text-3xl font-black text-[#002045] tracking-tighter mb-3" style={{ fontFamily: 'var(--font-headline)' }}>
            Quality Assurance Queue
          </h1>
          <p className="text-[#74777f] font-medium leading-relaxed">
            Review listings, verify payment references, and edit submissions before publishing.
          </p>
        </div>

        <div className="flex bg-[#f7f9fb] p-1.5 rounded-2xl shrink-0 overflow-x-auto custom-scrollbar">
          <button
            onClick={() => setActiveTab('properties')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center whitespace-nowrap ${activeTab === 'properties' ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
          >
            <span className="material-symbols-outlined text-lg">domain</span>
            New Listings
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] font-black ${activeTab === 'properties' ? 'bg-white/20 text-white' : 'bg-[#845326]/10 text-[#845326]'}`}>
              {properties.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all gap-3 flex items-center whitespace-nowrap ${activeTab === 'agents' ? 'bg-[#002045] text-white shadow-xl shadow-[#002045]/10' : 'text-[#74777f] hover:text-[#002045]'}`}
          >
            <span className="material-symbols-outlined text-lg">person_check</span>
            New Agents
            <span className={`ml-1 px-2 py-0.5 rounded-full text-[8px] font-black ${activeTab === 'agents' ? 'bg-white/20 text-white' : 'bg-[#845326]/10 text-[#845326]'}`}>
              {newAgents.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === 'properties' ? (
        <div className="grid grid-cols-1 gap-6">
          {properties.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-[#f2f4f6]">
              <span className="material-symbols-outlined text-6xl text-[#f2f4f6] mb-4">check_circle</span>
              <p className="text-[#c4c6cf] font-black text-[10px] uppercase tracking-widest">No pending listings. All clear.</p>
            </div>
          ) : properties.map((listing) => {
            const latestPayment = listing.payments[0];
            const hasCompletedPayment = listing.payments.some((payment) => payment.status === 'COMPLETED');

            return (
              <div
                key={listing.id}
                className="bg-white p-8 rounded-[2rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-8 group hover:shadow-2xl hover:shadow-[#002045]/5 transition-all"
              >
                <div className="w-full md:w-32 h-32 rounded-2xl bg-[#f7f9fb] shrink-0 border border-[#f2f4f6] overflow-hidden relative">
                  {listing.images[0] ? (
                    <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center opacity-20">
                      <span className="material-symbols-outlined text-4xl">image</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded bg-[#fef9f2] text-[#845326] text-[8px] font-black uppercase tracking-widest">Pending Review</span>
                    <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{timeAgo(listing.createdAt)}</span>
                  </div>
                  <h4 className="text-xl font-black text-[#002045] tracking-tight">{listing.title}</h4>
                  <p className="text-xs font-bold text-[#74777f] uppercase tracking-wide">
                    {listing.city} / Submitted by <span className="text-[#002045]">{listing.host.name}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className={`rounded-full px-3 py-1 text-[9px] font-black uppercase tracking-widest ${hasCompletedPayment ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                      {hasCompletedPayment ? 'Payment verified' : 'Payment not verified'}
                    </span>
                    {latestPayment ? (
                      <span className="rounded-full bg-[#f7f9fb] px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#74777f]">
                        Ref: {latestPayment.transactionId || latestPayment.orderRef}
                      </span>
                    ) : (
                      <span className="rounded-full bg-red-50 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-red-600">
                        No payment record
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-left shrink-0 space-y-4">
                  <p className="text-xl font-black text-[#002045] mb-4">{formatPrice(listing.price, listing.priceUnit)}</p>
                  <AdminPropertyActions
                    propertyId={listing.id}
                    currentStatus="PENDING"
                    onView={() => openProperty(listing)}
                    onEdit={() => openProperty(listing, true)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {newAgents.length === 0 ? (
            <div className="py-20 text-center bg-white rounded-[2rem] border border-[#f2f4f6]">
              <span className="material-symbols-outlined text-6xl text-[#f2f4f6] mb-4">group</span>
              <p className="text-[#c4c6cf] font-black text-[10px] uppercase tracking-widest">No new agent registrations this month.</p>
            </div>
          ) : newAgents.map((agent) => (
            <div key={agent.id} className="bg-white p-8 rounded-[2rem] border border-[#f2f4f6] flex flex-col md:flex-row items-center gap-10">
              <div className="w-20 h-20 rounded-2xl bg-[#002045] shrink-0 flex items-center justify-center text-[#fab983] font-black text-xl overflow-hidden relative">
                {agent.avatar ? <Image src={agent.avatar} alt={agent.name} fill className="object-cover" /> : <span>{agent.initials}</span>}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-[#f7f9fb] text-[#002045] text-[8px] font-black uppercase tracking-widest">New Registration</span>
                  <span className="text-[9px] font-bold text-[#c4c6cf] uppercase tracking-widest">{timeAgo(agent.createdAt)}</span>
                </div>
                <h4 className="text-2xl font-black text-[#002045] tracking-tighter">{agent.name}</h4>
                <p className="text-xs font-bold text-[#74777f]">{agent.location} / {agent.yearsExperience ?? 0} yrs / {agent.specializations.slice(0, 2).join(', ') || 'No specialization'}</p>
              </div>
              <span className="px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest bg-emerald-50 text-emerald-700 text-center">
                Active Member
              </span>
            </div>
          ))}
        </div>
      )}

      {currentProperty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="relative mx-auto w-full max-w-6xl max-h-[92vh] overflow-y-auto rounded-[2rem] bg-white shadow-2xl">
            <button
              onClick={() => {
                setSelectedProperty(null);
                setEditForm(null);
                setIsEditing(false);
              }}
              className="absolute right-4 top-4 z-10 text-[#74777f] hover:text-[#002045] text-xl font-black cursor-pointer"
            >
              x
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 p-8">
              <aside className="rounded-[2rem] overflow-hidden bg-[#f7f9fb] border border-[#f2f4f6] shadow-sm h-full">
                {currentProperty.images[0] ? (
                  <div className="relative h-80 w-full">
                    <Image src={currentProperty.images[0]} alt={currentProperty.title} fill className="object-cover" />
                  </div>
                ) : (
                  <div className="flex h-80 items-center justify-center text-[#c4c6cf]">
                    <span className="material-symbols-outlined text-6xl">image</span>
                  </div>
                )}

                <div className="space-y-5 p-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#845326]">Submitting Agent</p>
                    <p className="text-base font-black text-[#002045]">{currentProperty.host.name}</p>
                    <p className="text-sm text-[#74777f]">{currentProperty.host.email}</p>
                    <p className="text-sm text-[#74777f]">{currentProperty.host.title || currentProperty.host.location}</p>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-[#74777f]">Payment Verification</p>
                    {currentProperty.payments.length > 0 ? (
                      currentProperty.payments.slice(0, 5).map((payment) => (
                        <div key={payment.id} className="rounded-2xl bg-white border border-[#f2f4f6] p-4 space-y-2">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-xs font-black text-[#002045] uppercase">{payment.planType}</p>
                            <span className={`rounded-full px-2 py-1 text-[8px] font-black uppercase tracking-widest ${paymentBadgeClass(payment.status)}`}>
                              {payment.status}
                            </span>
                          </div>
                          <p className="text-[11px] text-[#74777f]"><strong>Order ref:</strong> {payment.orderRef}</p>
                          <p className="text-[11px] text-[#74777f]"><strong>Name used:</strong> {payment.customerName}</p>
                          <p className="text-[11px] text-[#74777f]"><strong>Payment ref:</strong> {payment.transactionId || 'Not captured'}</p>
                          <p className="text-[11px] text-[#74777f]"><strong>Amount:</strong> {payment.amount.toLocaleString()} {payment.currency}</p>
                          <p className="text-[11px] text-[#74777f]"><strong>Date:</strong> {new Date(payment.createdAt).toLocaleString()}</p>
                          <div className="flex flex-wrap gap-2 pt-2">
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'COMPLETED')}
                              disabled={processingPaymentId === payment.id}
                              className="rounded-lg bg-emerald-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-emerald-700 disabled:opacity-50"
                            >
                              Verify Paid
                            </button>
                            <button
                              onClick={() => updatePaymentStatus(payment.id, 'FAILED')}
                              disabled={processingPaymentId === payment.id}
                              className="rounded-lg bg-red-50 px-3 py-1.5 text-[9px] font-black uppercase tracking-widest text-red-600 disabled:opacity-50"
                            >
                              Mark Failed
                            </button>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-600">
                        No payment records found for this submitting agent.
                      </p>
                    )}
                  </div>
                </div>
              </aside>

              <section className="space-y-6">
                <div className="flex justify-end gap-2 pr-10">
                  <button
                    onClick={() => setIsEditing((value) => !value)}
                    className="rounded-xl border border-[#002045] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-[#002045] hover:bg-[#002045] hover:text-white transition-all"
                  >
                    {isEditing ? 'Cancel Edit' : 'Edit Before Publish'}
                  </button>
                  {isEditing && (
                    <button
                      onClick={savePropertyEdits}
                      disabled={isSaving}
                      className="rounded-xl bg-[#845326] px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white disabled:opacity-50"
                    >
                      {isSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  )}
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-[#845326] mb-2">Listing Details</p>
                  {isEditing ? (
                    <input value={currentProperty.title} onChange={(event) => updateEdit('title', event.target.value)} className="w-full rounded-xl border border-[#f2f4f6] px-4 py-3 text-2xl font-black text-[#002045] outline-none focus:ring-2 focus:ring-[#002045]/10" />
                  ) : (
                    <h2 className="text-3xl font-black text-[#002045] tracking-tight">{currentProperty.title}</h2>
                  )}
                  <p className="text-sm text-[#74777f] mt-2">{currentProperty.city}{currentProperty.neighborhood ? ` / ${currentProperty.neighborhood}` : ''}</p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <DetailField label="Price" editing={isEditing} value={currentProperty.price} onChange={(value) => updateEdit('price', Number(value))} display={formatPrice(currentProperty.price, currentProperty.priceUnit)} type="number" />
                  <DetailField label="Area" editing={isEditing} value={currentProperty.area} onChange={(value) => updateEdit('area', Number(value))} display={`${currentProperty.area} m2`} type="number" />
                  <DetailField label="Bedrooms" editing={isEditing} value={currentProperty.bedrooms} onChange={(value) => updateEdit('bedrooms', Number(value))} display={String(currentProperty.bedrooms)} type="number" />
                  <DetailField label="Bathrooms" editing={isEditing} value={currentProperty.bathrooms} onChange={(value) => updateEdit('bathrooms', Number(value))} display={String(currentProperty.bathrooms)} type="number" />
                </div>

                {isEditing && (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Listing Type</p>
                      <select value={currentProperty.listingType} onChange={(event) => updateEdit('listingType', event.target.value)} className="mt-2 w-full rounded-lg border border-[#f2f4f6] px-3 py-2 font-black text-[#002045] outline-none">
                        {['Buy', 'Rent', 'Short Stay', 'Auction'].map((option) => <option key={option} value={option}>{option}</option>)}
                      </select>
                    </div>
                    <DetailField label="Property Type" editing value={currentProperty.type} onChange={(value) => updateEdit('type', value)} display={currentProperty.type} />
                    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
                      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Price Unit</p>
                      <select value={currentProperty.priceUnit} onChange={(event) => updateEdit('priceUnit', event.target.value)} className="mt-2 w-full rounded-lg border border-[#f2f4f6] px-3 py-2 font-black text-[#002045] outline-none">
                        <option value="sale">Sale</option>
                        <option value="monthly">Monthly</option>
                        <option value="nightly">Nightly</option>
                      </select>
                    </div>
                  </div>
                )}

                <div className="space-y-2 rounded-[1.5rem] border border-[#f2f4f6] p-6 bg-[#fafbfc]">
                  <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Full Description</p>
                  {isEditing ? (
                    <textarea rows={7} value={currentProperty.description} onChange={(event) => updateEdit('description', event.target.value)} className="w-full rounded-xl border border-[#f2f4f6] px-4 py-3 text-sm leading-relaxed text-[#4b5363] outline-none" />
                  ) : (
                    <p className="text-sm leading-relaxed text-[#4b5363] whitespace-pre-wrap">{currentProperty.description}</p>
                  )}
                </div>

                <div className="space-y-3 rounded-[1.5rem] border border-[#f2f4f6] p-6 bg-[#fafbfc]">
                  <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Location</p>
                  {isEditing ? (
                    <div className="space-y-3">
                      <input value={currentProperty.city} onChange={(event) => updateEdit('city', event.target.value)} placeholder="City" className="w-full rounded-lg border border-[#f2f4f6] px-3 py-2 text-sm outline-none" />
                      <input value={currentProperty.neighborhood || ''} onChange={(event) => updateEdit('neighborhood', event.target.value)} placeholder="Neighborhood" className="w-full rounded-lg border border-[#f2f4f6] px-3 py-2 text-sm outline-none" />
                      <input value={currentProperty.address || ''} onChange={(event) => updateEdit('address', event.target.value)} placeholder="Address" className="w-full rounded-lg border border-[#f2f4f6] px-3 py-2 text-sm outline-none" />
                    </div>
                  ) : (
                    <>
                      <p className="text-sm text-[#4b5363]">{currentProperty.address ?? 'Address not provided'}</p>
                      {currentProperty.neighborhood && <p className="text-sm text-[#4b5363]">Neighborhood: {currentProperty.neighborhood}</p>}
                    </>
                  )}
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">Amenities</p>
                  {isEditing ? (
                    <textarea
                      value={currentProperty.amenities.join(', ')}
                      onChange={(event) => updateEdit('amenities', event.target.value.split(',').map((item) => item.trim()).filter(Boolean))}
                      className="w-full rounded-xl border border-[#f2f4f6] px-4 py-3 text-sm outline-none"
                    />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {currentProperty.amenities.length > 0 ? currentProperty.amenities.map((amenity) => (
                        <span key={amenity} className="rounded-full bg-[#f7f9fb] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#002045]">{amenity}</span>
                      )) : <span className="text-sm text-[#74777f]">No amenities listed.</span>}
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailField({
  label,
  editing,
  value,
  display,
  onChange,
  type = 'text',
}: {
  label: string;
  editing: boolean;
  value: string | number;
  display: string;
  onChange: (value: string) => void;
  type?: 'text' | 'number';
}) {
  return (
    <div className="rounded-[1.5rem] border border-[#f2f4f6] p-4 bg-[#fafbfc]">
      <p className="text-[10px] uppercase tracking-widest text-[#74777f] font-black">{label}</p>
      {editing ? (
        <input
          type={type}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 w-full rounded-lg border border-[#f2f4f6] px-3 py-2 font-black text-[#002045] outline-none"
        />
      ) : (
        <p className="text-lg font-black text-[#002045]">{display}</p>
      )}
    </div>
  );
}
