# Optimized LLM Prompt for NAVMC 10274 (AA Form) Component Development

## 1. Title
**Develop a Standalone "Smart PDF Form" Component for NAVMC 10274 (AA Form)**

## 2. Introduction
We are building a modern administrative application for the US Marine Corps. We need to implement a specific feature that allows users to fill out the **NAVMC 10274 (Administrative Action Form)**.

This feature currently exists in a legacy codebase, and we want to extract/re-implement it as a clean, standalone module in our new application. The core challenge is that this is not a dynamic HTML-to-PDF generation; it is a **coordinate-based overlay system** where text is drawn onto an existing, official government PDF template using precise X/Y coordinates (measured in Points).

## 3. Feature Description
The feature consists of two main parts: an **Editor Interface** and a **PDF Generator**.

### Core Functionality
1.  **Data Entry (The Editor):**
    *   A React component with form fields corresponding to the official NAVMC 10274 (e.g., "Action No", "From", "To", "Supplemental Information").
    *   Support for "Variable Placeholders" (e.g., typing `{{NAME}}` should be visually distinct or just standard text).
    *   The "Supplemental Information" field is a large text area that may contain more text than fits on a single page.

2.  **PDF Generation (The Service):**
    *   Loads static PDF templates (`page1.pdf` cover sheet, `page2.pdf` main form, `page3.pdf` continuation sheet) from the public assets folder.
    *   Maps user input to specific X/Y coordinates on the PDF page.
    *   **Smart Text Wrapping:** Automatically wraps text to fit within defined box widths.
    *   **Overflow Handling:** If "Supplemental Information" exceeds the space on Page 2, the system must automatically append Page 3 and continue the text there.
    *   **Placeholder Highlighting:** If the text contains placeholders (e.g., `{{UNIT}}`), the PDF generator must draw a yellow background rectangle behind that specific text segment.

## 4. Technical Requirements

### Stack
*   **Language:** TypeScript
*   **Framework:** React
*   **State Management:** Zustand
*   **PDF Library:** `pdf-lib` (Strict requirement: do not use other libraries).
*   **Styling:** Tailwind CSS + shadcn/ui (if available, otherwise standard CSS).

### Architecture
Follow a strict **UI -> Store -> Service** data flow:
1.  **`useFormStore` (Zustand):** Holds the raw form data.
2.  **`AAFormEditor` (React):** Reads/Writes to the store.
3.  **`navmc10274Generator` (Service):** Pure function that takes data + template ArrayBuffers and returns a PDF Uint8Array.

### Coordinate System
*   The PDF generation uses **Points** (1/72 inch).
*   Origin is **Bottom-Left** (standard PDF coordinate system).
*   You must implement a helper to convert "Top-Left" logic (common in UI) to "Bottom-Left" (PDF) if necessary, or stick to the provided coordinate maps.

## 5. Implementation Steps

1.  **Define Interfaces:** Create the `Navmc10274Data` interface matching the 13 fields of the form.
2.  **Asset Setup:** Assume standard static files are located at `/public/templates/navmc10274/`.
3.  **Service Layer (`navmc10274Generator.ts`):**
    *   Implement the `BoxBoundary` interface.
    *   Define the constant `PAGE2_BOXES` coordinate map (I will provide the JSON/Coordinates).
    *   Implement `drawTextWithHighlights` to handle the yellow background logic.
    *   Implement `drawMultilineText` with overflow logic to handle Page 3.
4.  **State Layer (`formStore.ts`):**
    *   Create a Zustand store with `formData` and `setField` actions.
    *   Include a `DEFAULT_DATA` constant for easy testing.
5.  **UI Layer (`AAFormEditor.tsx`):**
    *   Build a responsive form using React.
    *   Connect fields to the Zustand store.
    *   Add a "Generate PDF" button that triggers the service and downloads the file.

## 6. Constraints and Considerations

*   **Accuracy:** The text *must* align perfectly with the boxes on the background PDF. Use the provided coordinate constants exactly.
*   **Performance:** Loading PDF templates every time can be slow. Ensure the `loadTemplates` function caches the ArrayBuffers if possible, or is efficient.
*   **Fonts:** Use `StandardFonts.TimesRoman` to match the official look.
*   **Overflow Logic:** This is the hardest part. The generator must calculate how many lines fit in the "Supplemental Info" box on Page 2. Any remaining lines must be pushed to Page 3.

## 7. Deliverables

Please provide the following files:

1.  `src/types/navmc.ts` (Interfaces)
2.  `src/services/pdf/navmc10274Generator.ts` (The core logic)
3.  `src/store/formStore.ts` (Zustand store)
4.  `src/components/AAFormEditor.tsx` (The React component)
5.  `README.md` snippet explaining where to place the `.pdf` template files in the public folder.

## 8. Example Code / Reference

Here is the "Smart Box" logic pattern we want to replicate:

```typescript
// Box definition pattern
const PAGE2_BOXES = {
  actionNo: { left: 406, top: 728, width: 79, height: 18 },
  from: { left: 29, top: 674, width: 276, height: 25 },
  // ...
};

// Drawing pattern
function drawText(page, text, box) {
  const x = box.left + PADDING;
  const y = box.top - PADDING - FONT_SIZE; // Adjust for baseline
  page.drawText(text, { x, y, ... });
}
```

## 9. Evaluation Criteria

*   **Compilation:** Code must compile with no TypeScript errors.
*   **Alignment:** Generated PDF text must sit inside the visual boxes, not on the lines.
*   **Overflow:** Entering 50 lines of text in "Supplemental Info" must successfully generate a 3-page PDF (Cover, Page 2, Page 3) with text continuing correctly.
*   **Highlights:** Typing `{{TEST}}` in a field must result in a yellow box behind "TEST" in the final PDF.
