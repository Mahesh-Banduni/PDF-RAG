"use client";

export default function PDFViewerClient({pdf, fileUrl, onClose, isMdDown }) {
  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-white w-[90%] h-[90%] rounded-lg shadow-lg relative p-2"
        onClick={(e) => e.stopPropagation()} // Prevent closing on inner click
      >
        <div className="flex flex-col justify-between">
          <div>
            <p className={`${isMdDown ? 'text-md' : 'text-lg'} mr-5 line-clamp-1`}>{pdf.title}</p>
          </div>
        <button
          onClick={onClose}
          className="absolute top-1.5 right-4 text-black text-xl z-10 cursor-pointer"
        >
          ✕
        </button>
        </div>

        {!fileUrl ? (
          <div className="flex items-center justify-center h-full">Loading PDF...</div>
        ) : (
          <iframe
            src={fileUrl}
            className="w-full h-[94%] rounded-md mt-2"
            frameBorder="0"
          />
        )}
      </div>
    </div>
  );
}
