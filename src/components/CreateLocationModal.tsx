import { useState } from 'react';

interface CreateLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { name: string; type: 'depot' | 'community'; demand: number }) => void;
  coordinates: { lat: number; lng: number } | null;
}

export default function CreateLocationModal({ isOpen, onClose, onSave, coordinates }: CreateLocationModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState<'depot' | 'community'>('community');
  const [demand, setDemand] = useState(0);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ name, type, demand });
    // Reset form
    setName('');
    setType('community');
    setDemand(0);
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-2xl w-full max-w-md border border-gray-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">Add New Location</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
            Coordinates: {coordinates?.lat.toFixed(5)}, {coordinates?.lng.toFixed(5)}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name Input */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Location Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="e.g., North District Center"
              />
            </div>

            {/* Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Location Type
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setType('community')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium transition-all
                    ${type === 'community' 
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' 
                      : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'}
                  `}
                >
                  🏠 Community
                </button>
                <button
                  type="button"
                  onClick={() => setType('depot')}
                  className={`
                    px-4 py-2 rounded-lg border text-sm font-medium transition-all
                    ${type === 'depot' 
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                      : 'border-gray-200 dark:border-zinc-700 hover:bg-gray-50 dark:hover:bg-zinc-800 text-gray-600 dark:text-gray-400'}
                  `}
                >
                  🏭 Depot
                </button>
              </div>
            </div>

            {/* Demand Input (Only for Community) */}
            {type === 'community' && (
              <div className="animate-in slide-in-from-top-2 duration-200">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Daily Water Demand (L)
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={demand}
                  onChange={(e) => setDemand(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800 mt-6">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-zinc-800 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-0.5"
              >
                Create Location
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
