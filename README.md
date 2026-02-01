# Naval Letter Generator

This is a Next.js application that helps users generate properly formatted Naval letters according to official standards (SECNAV M-5216.5).

To get started, run the development server:

```bash
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

## NAVMC 10274 (AA Form) Setup

To use the AA Form feature (`/aa-form`), you must provide the official PDF templates.

1.  Obtain the NAVMC 10274 PDF.
2.  Split it into three files (or create blank templates):
    *   `page1.pdf` (The cover/instruction sheet)
    *   `page2.pdf` (The main form page)
    *   `page3.pdf` (The continuation sheet)
3.  Place these files in the `public/templates/navmc10274/` directory.

The application expects these files to exist to generate the final PDF properly.
