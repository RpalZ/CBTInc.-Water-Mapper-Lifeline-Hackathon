import { useState } from 'react';

interface CreateVehicleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: 'truck' | 'car'; capacity: number; locationId?: string }) => void;
  locations: { id: string; name: string; label: string }[];
}

export default function CreateVehicleModal({ isOpen, onClose, onSave, locations }: CreateVehicleModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'truck' | 'car'>('truck');
  const [capacity, setCapacity] = useState(1000);
  const [locationId, setLocationId] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, capacity, locationId: locationId || undefined });
    setName('');
    setType('truck');
    setCapacity(1000);
    setLocationId('');
  };

  const depots = locations.filter(l => l.label === 'depot');

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-zinc-800 p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Add New Vehicle</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Vehicle Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="e.g., Truck 01"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Vehicle Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setType('truck')}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'truck' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'border-gray-200 dark:border-zinc-700'}`}
              >
                🚛 Truck
              </button>
              <button
                type="button"
                onClick={() => setType('car')}
                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${type === 'car' ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30' : 'border-gray-200 dark:border-zinc-700'}`}
              >
                🚗 Car
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Capacity (Leters)</label>
            <input
              type="number"
              min="0"
              required
              value={capacity}
              onChange={(e) => setCapacity(Number(e.target.value))}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Assign to Depot</label>
            <select
              value={locationId}
              onChange={(e) => setLocationId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">No Depot Assigned</option>
              {depots.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800 mt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 font-medium">Cancel</button>
            <button type="submit" className="flex-1 px-4 py-2 rounded-lg bg-blue-600 text-white font-medium">Create Vehicle</button>
          </div>
        </form>
      </div>
    </div>
  );
}
