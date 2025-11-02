import { forwardRef, useState, useEffect } from 'react';

const PdfModal = forwardRef(({ pdfCollection, onClose, removePdf }, ref) => {
  const [deletingIds, setDeletingIds] = useState([]);

  const handleDelete = async (pdfId) => {
    setDeletingIds((prev) => [...prev, pdfId]);
    try {
      await removePdf(pdfId);
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== pdfId));
    }
  };

  // Allow closing with ESC key
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <div
      className="z-50 flex items-center justify-center fixed inset-0 bg-black/30 backdrop-blur-sm"
      aria-modal="true"
      role="dialog"
    >
      {/* ⬇️ This ref connects to parent click-outside logic */}
      <div
        ref={ref}
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg w-11/12 max-w-3xl p-6 relative"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            My PDFs
          </h3>
          <button
            onClick={onClose}
            className="text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white text-2xl font-bold"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        {pdfCollection.length === 0 ? (
          <div className="text-gray-500 dark:text-gray-400 text-center py-6">
            No PDFs uploaded yet.
          </div>
        ) : (
          <div className="overflow-x-auto max-h-96">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                    Title
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-900 dark:text-white">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {pdfCollection.map((pdfItem) => {
                  const isDeleting = deletingIds.includes(pdfItem.pdfId);
                  return (
                    <tr
                      key={pdfItem.pdfId}
                      className={`hover:bg-gray-100 dark:hover:bg-gray-700 transition-opacity duration-300 ${
                        isDeleting ? 'opacity-50' : 'opacity-100'
                      }`}
                    >
                      <td className="px-4 py-2 text-sm text-gray-900 dark:text-white break-words">
                        {pdfItem.title}
                      </td>
                      <td className="px-4 py-2 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(pdfItem.pdfId)}
                            disabled={isDeleting}
                            className={`px-3 py-1 rounded-xl text-sm text-white ${
                              isDeleting
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-red-600 hover:bg-red-500'
                            }`}
                          >
                            {isDeleting ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
});

PdfModal.displayName = 'PdfModal';
export default PdfModal;
