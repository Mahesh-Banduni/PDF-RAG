"use client";

import dynamic from "next/dynamic";

export default function PDFViewer({pdf, fileUrl, onClose, isMdDown }) {
  const PDFView = dynamic(() => import("./PDFViewerClient"), {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 text-white">
        Loading PDF...
      </div>
    ),
  });

  return <PDFView pdf={pdf} fileUrl={fileUrl} onClose={onClose} isMdDown={isMdDown} />;
}
