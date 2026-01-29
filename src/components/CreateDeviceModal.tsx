import { useState } from 'react';

interface CreateDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; vehicleId?: string }) => void;
  vehicles: { id: string; name: string }[];
}

export default function CreateDeviceModal({ isOpen, onClose, onSave, vehicles }: CreateDeviceModalProps) {
  const [name, setName] = useState('');
  const [vehicleId, setVehicleId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, vehicleId: vehicleId || undefined });
    setName('');
    setVehicleId('');
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Device</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Device Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Sensor Node A"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Vehicle</label>
            <select
              value={vehicleId}
              onChange={(e) => setVehicleId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">No Vehicle Assigned</option>
              {vehicles.map(v => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800 mt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-800 text-gray-700 dark:text-gray-300 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">Create Device</button>
          </div>
        </form>
      </div>
    </div>
  );
}
