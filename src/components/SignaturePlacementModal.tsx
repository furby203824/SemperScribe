"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Move, Download, Trash2 } from "lucide-react";

// Dynamically import react-pdf to avoid SSR issues
const Document = dynamic(() => import("react-pdf").then((mod) => mod.Document), { ssr: false });
const Page = dynamic(() => import("react-pdf").then((mod) => mod.Page), { ssr: false });

// Configure PDF.js worker on client side only
if (typeof window !== "undefined") {
  import("react-pdf").then((pdfjs) => {
    pdfjs.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.pdfjs.version}/build/pdf.worker.min.mjs`;
  });
}

// PDF page dimensions in points (8.5" x 11" at 72 DPI)
const PDF_WIDTH = 612;
const PDF_HEIGHT = 792;

export interface SignaturePosition {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface SignaturePlacementModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (positions: SignaturePosition[]) => void;
  pdfBlob: Blob | null;
  totalPages: number;
}

export function SignaturePlacementModal({
  open,
  onClose,
  onConfirm,
  pdfBlob,
  totalPages,
}: SignaturePlacementModalProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [signatureBoxes, setSignatureBoxes] = useState<SignaturePosition[]>([]);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Create object URL from blob
  useEffect(() => {
    if (pdfBlob) {
      const url = URL.createObjectURL(pdfBlob);
      setPdfUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [pdfBlob]);

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setCurrentPage(totalPages); // Start on last page (where signature usually is)
      setCurrentRect(null);
      setSignatureBoxes([]);
      setIsDrawing(false);
    }
  }, [open, totalPages]);

  // Handle page load to get dimensions
  const onPageLoadSuccess = useCallback(({ width, height }: { width: number; height: number }) => {
    setPageSize({ width, height });
  }, []);

  // Get boxes for current page
  const currentPageBoxes = signatureBoxes.filter(box => box.page === currentPage);

  // Draw the rectangle overlay
  const drawOverlay = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || pageSize.width === 0) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Match canvas size to page size
    canvas.width = pageSize.width;
    canvas.height = pageSize.height;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Scale factors
    const scaleX = pageSize.width / PDF_WIDTH;
    const scaleY = pageSize.height / PDF_HEIGHT;

    // Draw all saved boxes for current page
    currentPageBoxes.forEach((box, index) => {
      const scaledX = box.x * scaleX;
      const scaledY = (PDF_HEIGHT - box.y - box.height) * scaleY;
      const scaledWidth = box.width * scaleX;
      const scaledHeight = box.height * scaleY;

      // Draw semi-transparent fill
      ctx.fillStyle = "rgba(59, 130, 246, 0.2)";
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw border
      ctx.strokeStyle = "#3b82f6";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Draw label
      ctx.fillStyle = "#3b82f6";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.setLineDash([]);
      ctx.fillText(`SIGN ${index + 1}`, scaledX + scaledWidth / 2, scaledY + scaledHeight / 2 + 4);
    });

    // Draw current rectangle being drawn
    if (currentRect) {
      const scaledX = currentRect.x * scaleX;
      const scaledY = (PDF_HEIGHT - currentRect.y - currentRect.height) * scaleY;
      const scaledWidth = currentRect.width * scaleX;
      const scaledHeight = currentRect.height * scaleY;

      ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
      ctx.fillRect(scaledX, scaledY, scaledWidth, scaledHeight);

      ctx.strokeStyle = "#22c55e";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      ctx.fillStyle = "#22c55e";
      ctx.font = "bold 12px sans-serif";
      ctx.textAlign = "center";
      ctx.setLineDash([]);
      ctx.fillText("NEW", scaledX + scaledWidth / 2, scaledY + scaledHeight / 2 + 4);
    }
  }, [currentRect, currentPageBoxes, pageSize]);

  // Redraw overlay when rect or size changes
  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Convert screen coordinates to PDF coordinates
  const screenToPdfCoords = useCallback((screenX: number, screenY: number) => {
    const container = containerRef.current;
    if (!container || pageSize.width === 0) return { x: 0, y: 0 };

    const pageElement = container.querySelector(".react-pdf__Page__canvas") as HTMLElement;
    if (!pageElement) return { x: 0, y: 0 };

    const pageRect = pageElement.getBoundingClientRect();

    const relX = screenX - pageRect.left;
    const relY = screenY - pageRect.top;

    const scaleX = PDF_WIDTH / pageRect.width;
    const scaleY = PDF_HEIGHT / pageRect.height;

    const pdfX = relX * scaleX;
    const pdfY = PDF_HEIGHT - (relY * scaleY);

    return { x: pdfX, y: pdfY };
  }, [pageSize]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const coords = screenToPdfCoords(e.clientX, e.clientY);
    if (coords.x === 0 && coords.y === 0) return;
    setStartPoint(coords);
    setIsDrawing(true);
    setCurrentRect(null);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDrawing || !startPoint) return;

    const coords = screenToPdfCoords(e.clientX, e.clientY);

    const x = Math.min(startPoint.x, coords.x);
    const y = Math.min(startPoint.y, coords.y);
    const width = Math.abs(coords.x - startPoint.x);
    const height = Math.abs(coords.y - startPoint.y);

    setCurrentRect({ x, y, width, height });
  };

  const handleMouseUp = () => {
    // If we have a valid rectangle, add it to the list
    if (currentRect && currentRect.width > 10 && currentRect.height > 10) {
      setSignatureBoxes(prev => [...prev, {
        page: currentPage,
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
      }]);
    }
    setIsDrawing(false);
    setStartPoint(null);
    setCurrentRect(null);
  };

  const handleRemoveBox = (index: number) => {
    // Find the actual index in signatureBoxes array
    const boxesToRemove = signatureBoxes.filter(box => box.page === currentPage);
    const boxToRemove = boxesToRemove[index];
    setSignatureBoxes(prev => prev.filter(box => box !== boxToRemove));
  };

  const handleClearCurrentPage = () => {
    setSignatureBoxes(prev => prev.filter(box => box.page !== currentPage));
  };

  const handleConfirm = () => {
    if (signatureBoxes.length > 0) {
      onConfirm(signatureBoxes);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      setCurrentRect(null);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      setCurrentRect(null);
    }
  };

  // Count total boxes across all pages
  const totalBoxes = signatureBoxes.length;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Place Signature Fields</DialogTitle>
          <DialogDescription>
            Draw rectangles where you want signature fields. You can add multiple signature boxes on any page.
          </DialogDescription>
        </DialogHeader>

        {/* Page navigation and box count */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-2">
            {totalPages > 1 && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToPrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {totalBoxes} signature field{totalBoxes !== 1 ? 's' : ''} total
              {currentPageBoxes.length > 0 && ` (${currentPageBoxes.length} on this page)`}
            </span>
            {currentPageBoxes.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleClearCurrentPage}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-1" />
                Clear Page
              </Button>
            )}
          </div>
        </div>

        {/* PDF preview with overlay */}
        <div className="flex-1 flex items-center justify-center bg-muted/30 rounded-lg p-4 min-h-[500px] overflow-auto border border-border">
          <div
            ref={containerRef}
            className="relative cursor-crosshair shadow-lg"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {pdfUrl && (
              <Document
                file={pdfUrl}
                loading={<div className="p-8 text-muted-foreground">Loading PDF...</div>}
                error={<div className="p-8 text-destructive">Failed to load PDF</div>}
              >
                <Page
                  pageNumber={currentPage}
                  width={550}
                  onLoadSuccess={onPageLoadSuccess}
                  renderTextLayer={false}
                  renderAnnotationLayer={false}
                />
              </Document>
            )}

            {/* Drawing overlay canvas */}
            <canvas
              ref={canvasRef}
              className="absolute top-0 left-0 pointer-events-none"
              style={{ width: pageSize.width, height: pageSize.height }}
            />

            {/* Instructions overlay when no boxes drawn on this page */}
            {currentPageBoxes.length === 0 && !currentRect && !isDrawing && pageSize.width > 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="bg-card/95 px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 border border-border">
                  <Move className="h-5 w-5 text-primary" />
                  <span className="text-sm text-card-foreground">Click and drag to draw signature areas</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List of boxes on current page */}
        {currentPageBoxes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {currentPageBoxes.map((_, index) => (
              <div
                key={index}
                className="flex items-center gap-1 bg-primary/10 text-primary px-2 py-1 rounded text-sm"
              >
                <span>Signature {index + 1}</span>
                <button
                  onClick={() => handleRemoveBox(index)}
                  className="hover:bg-primary/20 rounded p-0.5"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={signatureBoxes.length === 0}
          >
            <Download className="mr-2 h-4 w-4" />
            Save & Download PDF ({totalBoxes} field{totalBoxes !== 1 ? 's' : ''})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
